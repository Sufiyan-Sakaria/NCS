import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma";
import { AppError } from "../utils/AppError";

const prisma = new PrismaClient();

// Helper function to normalize array input
const normalizeToArray = (value: any): string[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

// GET all branches
export const getAllBranches = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        company: true,
        UserBranchAccess: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            Brand: true,
            Category: true,
            Product: true,
            Godown: true,
            Unit: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
};

// GET branch by ID
export const getBranchById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        company: true,
        UserBranchAccess: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        Brand: true,
        Category: true,
        Unit: true,
        Godown: true,
        _count: {
          select: {
            Product: true,
            ProductLedger: true,
            Journal: true,
          },
        },
      },
    });

    if (!branch) {
      return next(new AppError("Branch not found", 404));
    }

    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

// GET branches by company ID
export const getBranchesByCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = req.params;

    const branches = await prisma.branch.findMany({
      where: { companyId },
      include: {
        company: true,
        UserBranchAccess: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            Brand: true,
            Category: true,
            Product: true,
            Godown: true,
            Unit: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
};

// GET branches accessible by user
export const getBranchesByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const userBranchAccess = await prisma.userBranchAccess.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        branch: {
          include: {
            company: true,
            _count: {
              select: {
                Brand: true,
                Category: true,
                Product: true,
                Godown: true,
                Unit: true,
              },
            },
          },
        },
      },
    });

    const branches = userBranchAccess.map((access) => access.branch);

    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    next(error);
  }
};

// CREATE branch
export const createBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, address, companyId } = req.body;

    if (!name || !address || !companyId) {
      return next(
        new AppError("Name, address, and companyId are required", 400)
      );
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        companyId,
      },
      include: {
        company: true,
        _count: {
          select: {
            Brand: true,
            Category: true,
            Product: true,
            Godown: true,
            Unit: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

// UPDATE branch
export const updateBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existing = await prisma.branch.findUnique({
      where: { id },
    });

    if (!existing) {
      return next(new AppError("Branch not found", 404));
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
        UserBranchAccess: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            Brand: true,
            Category: true,
            Product: true,
            Godown: true,
            Unit: true,
          },
        },
      },
    });

    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};

// DELETE branch
export const deleteBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const existing = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            Brand: true,
            Category: true,
            Product: true,
            Godown: true,
            Unit: true,
            ProductLedger: true,
            Journal: true,
          },
        },
      },
    });

    if (!existing) {
      return next(new AppError("Branch not found", 404));
    }

    // Check if branch has associated data
    const hasAssociatedData = Object.values(existing._count).some(
      (count) => count > 0
    );

    if (hasAssociatedData) {
      return next(
        new AppError(
          "Cannot delete branch with associated data (brands, categories, products, etc.)",
          400
        )
      );
    }

    await prisma.branch.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// ASSIGN users to branch
export const assignUsersToBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { userIds, createdBy } = req.body;

    // Normalize userIds to array (handles both single values and arrays)
    const normalizedUserIds = normalizeToArray(userIds);

    if (normalizedUserIds.length === 0) {
      return next(new AppError("At least one userId is required", 400));
    }

    const branch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      return next(new AppError("Branch not found", 404));
    }

    // Create user branch access entries
    const accessEntries = normalizedUserIds.map((userId: string) => ({
      userId,
      branchId: id,
      createdBy,
    }));

    await prisma.userBranchAccess.createMany({
      data: accessEntries,
      skipDuplicates: true,
    });

    // Return updated branch with user access
    const updatedBranch = await prisma.branch.findUnique({
      where: { id },
      include: {
        company: true,
        UserBranchAccess: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({ success: true, data: updatedBranch });
  } catch (error) {
    next(error);
  }
};

// REMOVE users from branch
export const removeUsersFromBranch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    // Normalize userIds to array (handles both single values and arrays)
    const normalizedUserIds = normalizeToArray(userIds);

    if (normalizedUserIds.length === 0) {
      return next(new AppError("At least one userId is required", 400));
    }

    const branch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      return next(new AppError("Branch not found", 404));
    }

    // Remove user branch access entries
    await prisma.userBranchAccess.deleteMany({
      where: {
        branchId: id,
        userId: {
          in: normalizedUserIds,
        },
      },
    });

    // Return updated branch with user access
    const updatedBranch = await prisma.branch.findUnique({
      where: { id },
      include: {
        company: true,
        UserBranchAccess: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({ success: true, data: updatedBranch });
  } catch (error) {
    next(error);
  }
};
