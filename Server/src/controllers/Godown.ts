import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma";
import { AppError } from "../utils/AppError";

const prisma = new PrismaClient();

// GET all godowns by branch
export const getGodownsByBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { branchId } = req.params;

    const godowns = await prisma.godown.findMany({
      where: { branchId, isActive: true },
      include: {
        createdByUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: godowns });
  } catch (error) {
    next(error);
  }
};

// CREATE godown
export const createGodown = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, address } = req.body;
    const { branchId } = req.params;
    const { id: userId } = req.user!;

    if (!name || !address || !branchId) {
      return next(
        new AppError("Name, address, and branchId are required", 400)
      );
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) return next(new AppError("Branch not found", 404));

    const godown = await prisma.godown.create({
      data: {
        name,
        address,
        branchId,
        createdBy: userId,
      },
    });

    res.status(201).json({ success: true, data: godown });
  } catch (error: any) {
    if (
      error.code === "P2002" &&
      error.meta?.target?.some((t: string) => ["name", "address"].includes(t))
    ) {
      return next(new AppError("Godown name or address already exists", 400));
    }
    next(error);
  }
};

// UPDATE godown
export const updateGodown = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;
    const { id: userId } = req.user!;

    const godown = await prisma.godown.findUnique({ where: { id } });
    if (!godown || !godown.isActive)
      return next(new AppError("Godown not found", 404));

    const updated = await prisma.godown.update({
      where: { id },
      data: {
        name,
        address,
        updatedBy: userId,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    if (
      error.code === "P2002" &&
      error.meta?.target?.some((t: string) => ["name", "address"].includes(t))
    ) {
      return next(new AppError("Godown name or address already exists", 400));
    }
    next(error);
  }
};

// TOGGLE godown status
export const toggleGodownStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { updatedBy } = req.body;

    const godown = await prisma.godown.findUnique({ where: { id } });
    if (!godown) return next(new AppError("Godown not found", 404));

    const updated = await prisma.godown.update({
      where: { id },
      data: {
        isActive: !godown.isActive,
        updatedBy,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE godown
export const deleteGodown = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const godown = await prisma.godown.findUnique({ where: { id } });
    if (!godown) return next(new AppError("Godown not found", 404));

    await prisma.godown.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
