import { Request, Response, NextFunction, RequestHandler } from "express";
import { PrismaClient } from "../../generated/prisma";
import { AppError } from "../utils/AppError";

const prisma = new PrismaClient();

// GET all product ledgers by branch
export const getProductLedgersByBranch: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { branchId } = req.params;

  try {
    const ledgers = await prisma.productLedger.findMany({
      where: { branchId },
      include: {
        financialYear: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: ledgers });
  } catch (error) {
    next(error);
  }
};

// CREATE product ledger for financial year
export const createProductLedger: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { branchId } = req.params;
  const { financialYearId, yearLabel } = req.body;

  if (!branchId || !financialYearId || !yearLabel) {
    next(new AppError("Missing required fields", 400));
    return;
  }

  try {
    const exists = await prisma.productLedger.findFirst({
      where: { branchId, financialYearId },
    });

    if (exists) {
      next(new AppError("Ledger already exists for this financial year", 400));
      return;
    }

    const ledger = await prisma.productLedger.create({
      data: {
        branchId,
        financialYearId,
        yearLabel,
      },
    });

    res.status(201).json({ success: true, data: ledger });
  } catch (error) {
    next(error);
  }
};

// GET ledger entries with optional godown/date filters and group by godown
export const getFilteredLedgerEntries: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { ledgerId } = req.params;
  const { godownId, from, to, groupByGodown } = req.query;

  try {
    const filters: any = {
      productLedgerId: ledgerId,
    };

    if (godownId) {
      filters.godownId = godownId as string;
    }

    if (from || to) {
      filters.date = {};
      if (from) filters.date.gte = new Date(from as string);
      if (to) filters.date.lte = new Date(to as string);
    }

    const entries = await prisma.productLedgerEntry.findMany({
      where: filters,
      include: {
        product: true,
        godown: true,
        createdByUser: { select: { id: true, name: true } },
      },
      orderBy: { date: "asc" },
    });

    if (groupByGodown === "true") {
      const grouped = entries.reduce((acc, entry) => {
        const key = entry.godownId;
        if (!acc[key]) acc[key] = [];
        acc[key].push(entry);
        return acc;
      }, {} as Record<string, typeof entries>);

      res.status(200).json({ success: true, data: grouped });
      return;
    }

    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    next(error);
  }
};

// GET current stock summary for a product (total qty/thaan from ledger)
export const getProductStockSummary: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { productId } = req.params;

  try {
    const entries = await prisma.productLedgerEntry.findMany({
      where: { productId },
    });

    const stock = entries.reduce(
      (acc, entry) => {
        const factor = entry.type === "IN" ? 1 : -1;
        acc.qty += entry.qty * factor;
        acc.thaan += entry.thaan * factor;
        return acc;
      },
      { qty: 0, thaan: 0 }
    );

    res.status(200).json({ success: true, data: stock });
  } catch (error) {
    next(error);
  }
};

// GET product entries for a specific product with optional timestamp filters
export const getProductEntries: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { productId } = req.params;
  const { from, to, godownId, type } = req.query;

  try {
    const filters: any = {
      productId,
    };

    // Add timestamp filters
    if (from || to) {
      filters.date = {};
      if (from) {
        filters.date.gte = new Date(from as string);
      }
      if (to) {
        filters.date.lte = new Date(to as string);
      }
    }

    // Add optional godown filter
    if (godownId) {
      filters.godownId = godownId as string;
    }

    // Add optional type filter (IN/OUT)
    if (type && (type === "IN" || type === "OUT")) {
      filters.type = type;
    }

    const entries = await prisma.productLedgerEntry.findMany({
      where: filters,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            hsn: true,
          },
        },
        godown: {
          select: {
            id: true,
            name: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    // Calculate running totals
    let runningQty = 0;
    let runningThaan = 0;

    const entriesWithRunningTotals = entries
      .reverse()
      .map((entry) => {
        const factor = entry.type === "IN" ? 1 : -1;
        runningQty += entry.qty * factor;
        runningThaan += entry.thaan * factor;

        return {
          ...entry,
          runningQty,
          runningThaan,
        };
      })
      .reverse();

    res.status(200).json({
      success: true,
      data: {
        entries: entriesWithRunningTotals,
        totalEntries: entries.length,
        summary: {
          totalIn: entries
            .filter((e) => e.type === "IN")
            .reduce((sum, e) => sum + e.qty, 0),
          totalOut: entries
            .filter((e) => e.type === "OUT")
            .reduce((sum, e) => sum + e.qty, 0),
          currentStock: runningQty,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
