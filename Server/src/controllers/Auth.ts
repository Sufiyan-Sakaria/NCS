import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../generated/prisma";
import { AppError } from "../utils/AppError";

const prisma = new PrismaClient();

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
      },
    });

    if (!user || !user.isActive) {
      return next(new AppError("Invalid Credentials", 401));
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError("Invalid Credentials", 401));
    }

    let branches = [];

    if (user.role === "owner") {
      // Owners get all company branches
      branches = await prisma.branch.findMany({
        where: {
          companyId: user.companyId,
        },
        select: {
          id: true,
          name: true,
          address: true,
        },
      });
    } else {
      // Other roles get allowed branches only
      const access = await prisma.userBranchAccess.findMany({
        where: {
          userId: user.id,
          isActive: true,
        },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      });

      branches = access.map((a) => a.branch);
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // Set token as HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // send only over HTTPS in production
      sameSite: "strict",
    });

    // Send user data (no token here)
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
      gstPercent: user.company.gstPercent,
      branches,
    });
  } catch (error) {
    next(error);
  }
};

export const verify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    if (!user) {
      return next(new AppError("Unauthorized", 401));
    }

    let branches = [];

    if (user.role === "owner") {
      branches = await prisma.branch.findMany({
        where: { companyId: user.companyId },
        select: { id: true, name: true, address: true },
      });
    } else {
      const access = await prisma.userBranchAccess.findMany({
        where: { userId: user.id, isActive: true },
        include: {
          branch: {
            select: { id: true, name: true, address: true },
          },
        },
      });
      branches = access.map((a) => a.branch);
    }

    res.status(200).json({
      success: true,
      user,
      branches,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
