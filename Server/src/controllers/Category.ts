import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma";
import { AppError } from "../utils/AppError";

const prisma = new PrismaClient();

// GET all categories for a branch
export const getCategoriesByBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { branchId } = req.params;

    const categories = await prisma.category.findMany({
      where: {
        branchId,
        isActive: true,
      },
      include: {
        createdByUser: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// CREATE category
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, abb } = req.body;
    const { branchId } = req.params;
    const { id: userId } = req.user!;

    if (!name || !abb || !branchId) {
      return next(new AppError("Name, abb, and branchId are required", 400));
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      return next(new AppError("Branch not found", 404));
    }

    const category = await prisma.category.create({
      data: {
        name,
        abb,
        branchId,
        createdBy: userId,
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("name_branchId")
    ) {
      return next(
        new AppError("Category name already exists in this branch", 400)
      );
    }
    next(error);
  }
};

// UPDATE category
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, abb } = req.body;
    const { id: userId } = req.user!;

    const category = await prisma.category.findUnique({ where: { id } });

    if (!category || !category.isActive) {
      return next(new AppError("Category not found", 404));
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        abb,
        updatedBy: userId,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("name_branchId")
    ) {
      return next(
        new AppError("Category name already exists in this branch", 400)
      );
    }
    next(error);
  }
};

// TOGGLE category status
export const toggleCategoryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { updatedBy } = req.body;

    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        isActive: !category.isActive,
        updatedBy,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE category
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    await prisma.category.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
