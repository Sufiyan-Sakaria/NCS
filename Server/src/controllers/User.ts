import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma";
import { AppError } from "../utils/AppError";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Helper function to normalize array input
const normalizeToArray = (value: any): string[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

// GET all users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        company: true,
        access: {
          include: {
            branch: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Remove password from response
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    res.status(200).json({ success: true, data: usersWithoutPassword });
  } catch (error) {
    next(error);
  }
};

// GET user by ID
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
        access: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

// GET users by company ID
export const getUsersByCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = req.params;

    const users = await prisma.user.findMany({
      where: { companyId },
      include: {
        company: true,
        access: {
          include: {
            branch: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Remove password from response
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    res.status(200).json({ success: true, data: usersWithoutPassword });
  } catch (error) {
    next(error);
  }
};

// CREATE user
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      email,
      password,
      role,
      companyId,
      createdBy,
      branchIds = [],
    } = req.body;

    if (!name || !email || !password || !role || !companyId) {
      return next(
        new AppError(
          "Name, email, password, role, and companyId are required",
          400
        )
      );
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Normalize branchIds to array (handles both single values and arrays)
    const normalizedBranchIds = normalizeToArray(branchIds);

    // Create user with branch access
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        companyId,
        createdBy,
        access: {
          create: normalizedBranchIds.map((branchId: string) => ({
            branchId,
            createdBy,
          })),
        },
      },
      include: {
        company: true,
        access: {
          include: {
            branch: true,
          },
        },
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

// UPDATE user
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { password, branchIds, updatedBy, ...updateData } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return next(new AppError("User not found", 404));
    }

    // Prepare update data
    const userData: any = { ...updateData, updatedBy };

    // Hash password if provided
    if (password) {
      userData.password = await bcrypt.hash(password, 12);
    }

    // Update user and branch access
    const user = await prisma.user.update({
      where: { id },
      data: userData,
      include: {
        company: true,
        access: {
          include: {
            branch: true,
          },
        },
      },
    });

    // Update branch access if provided
    if (branchIds !== undefined) {
      // Normalize branchIds to array (handles both single values and arrays)
      const normalizedBranchIds = normalizeToArray(branchIds);

      // Delete existing access
      await prisma.userBranchAccess.deleteMany({
        where: { userId: id },
      });

      // Create new access
      if (normalizedBranchIds.length > 0) {
        await prisma.userBranchAccess.createMany({
          data: normalizedBranchIds.map((branchId: string) => ({
            userId: id,
            branchId,
            createdBy: updatedBy,
          })),
        });
      }
    }

    // Fetch updated user with relations
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
        access: {
          include: {
            branch: true,
          },
        },
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser!;

    res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

// TOGGLE user active status
export const toggleUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { updatedBy } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return next(new AppError("User not found", 404));
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
        updatedBy,
      },
      include: {
        company: true,
        access: {
          include: {
            branch: true,
          },
        },
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.status(200).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

// DELETE user (soft delete by setting isActive to false)
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { updatedBy } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return next(new AppError("User not found", 404));
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy,
      },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// HARD DELETE user (permanent deletion)
export const hardDeleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return next(new AppError("User not found", 404));
    }

    // Delete user branch access first
    await prisma.userBranchAccess.deleteMany({
      where: { userId: id },
    });

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
