import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma";
import { AppError } from "../utils/AppError";

const prisma = new PrismaClient();

// GET all brands for a branch (with optional isActive filter)
export const getBrandsByBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { branchId } = req.params;

    const brands = await prisma.brand.findMany({
      where: {
        branchId,
        isActive: true,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ success: true, data: brands });
  } catch (error) {
    next(error);
  }
};

// CREATE brand
export const createBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, abb, createdBy } = req.body;
    const { branchId } = req.params;

    if (!name || !abb || !branchId) {
      return next(
        new AppError(
          "Name, abb, and branchId are required ok" + name + abb + branchId,
          400
        )
      );
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!branch) {
      return next(new AppError("Branch not found", 404));
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        abb,
        branchId,
        createdBy,
      },
    });

    res.status(201).json({ success: true, data: brand });
  } catch (error: any) {
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("name_branchId")
    ) {
      return next(
        new AppError("Brand name already exists in this branch", 400)
      );
    }
    next(error);
  }
};

// UPDATE brand
export const updateBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, abb, updatedBy } = req.body;

    const brand = await prisma.brand.findUnique({ where: { id } });

    if (!brand || !brand.isActive) {
      return next(new AppError("Brand not found", 404));
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: {
        name,
        abb,
        updatedBy,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("name_branchId")
    ) {
      return next(
        new AppError("Brand name already exists in this branch", 400)
      );
    }
    next(error);
  }
};

// TOGGLE active/inactive status
export const toggleBrandStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { updatedBy } = req.body;

    const brand = await prisma.brand.findUnique({ where: { id } });

    if (!brand) {
      return next(new AppError("Brand not found", 404));
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: {
        isActive: !brand.isActive,
        updatedBy,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// HARD DELETE brand
export const deleteBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({ where: { id } });

    if (!brand) {
      return next(new AppError("Brand not found", 404));
    }

    await prisma.brand.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
