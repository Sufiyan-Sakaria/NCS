import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma";
import { AppError } from "../utils/AppError";

const prisma = new PrismaClient();

// GET all units for a branch
export const getUnitsByBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { branchId } = req.params;

    const units = await prisma.unit.findMany({
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

    res.status(200).json({ success: true, data: units });
  } catch (error) {
    next(error);
  }
};

// CREATE unit
export const createUnit = async (
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

    const unit = await prisma.unit.create({
      data: {
        name,
        abb,
        branchId,
        createdBy: userId,
      },
    });

    res.status(201).json({ success: true, data: unit });
  } catch (error: any) {
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("name_branchId")
    ) {
      return next(new AppError("Unit name already exists in this branch", 400));
    }
    next(error);
  }
};

// UPDATE unit
export const updateUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, abb } = req.body;
    const { id: userId } = req.user!;

    const unit = await prisma.unit.findUnique({ where: { id } });

    if (!unit || !unit.isActive) {
      return next(new AppError("Unit not found", 404));
    }

    const updated = await prisma.unit.update({
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
      return next(new AppError("Unit name already exists in this branch", 400));
    }
    next(error);
  }
};

// TOGGLE unit status
export const toggleUnitStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { updatedBy } = req.body;

    const unit = await prisma.unit.findUnique({ where: { id } });

    if (!unit) {
      return next(new AppError("Unit not found", 404));
    }

    const updated = await prisma.unit.update({
      where: { id },
      data: {
        isActive: !unit.isActive,
        updatedBy,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE unit
export const deleteUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const unit = await prisma.unit.findUnique({ where: { id } });

    if (!unit) {
      return next(new AppError("Unit not found", 404));
    }

    await prisma.unit.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
