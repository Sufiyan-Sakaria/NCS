import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../../generated/prisma";
import { AppError } from "../utils/AppError";

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  companyId: string;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return next(new AppError("Unauthorized - No token", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      return next(new AppError("Unauthorized - User not found", 401));
    }

    (req as any).user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    next();
  } catch (error) {
    next(new AppError("Unauthorized - Invalid token", 401));
  }
};
