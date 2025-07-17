import { Request, Response, NextFunction } from "express";
import { InvoiceType, PrismaClient, VoucherType } from "../../generated/prisma";
import { AppError } from "../utils/AppError";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// GET all companies
export const getAllCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const companies = await prisma.company.findMany();
    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    next(error);
  }
};

// GET company by ID
export const getCompanyById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// CREATE company
export const createCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      email,
      financialYearStart,
      financialYearEnd,
      branchName,
      branchAddress,
      userName,
      userEmail,
      userPassword,
    } = req.body;

    // Basic validation
    if (
      !name ||
      !email ||
      !financialYearStart ||
      !financialYearEnd ||
      !branchName ||
      !userName ||
      !userEmail ||
      !userPassword
    ) {
      return next(new AppError("Missing required fields", 400));
    }

    const hashedPassword = await bcrypt.hash(userPassword, 12);

    const start = new Date(financialYearStart);
    const end = new Date(financialYearEnd);
    const yearLabel = `${start.getFullYear()}-${String(end.getFullYear()).slice(
      -2
    )}`;

    // Transactional creation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: { name, email },
      });

      // 2. Create Financial Year
      const financialYear = await tx.financialYear.create({
        data: {
          startDate: start,
          endDate: end,
          companyId: company.id,
        },
      });

      // 3. Create Branch
      const branch = await tx.branch.create({
        data: {
          name: branchName,
          address: branchAddress,
          companyId: company.id,
        },
      });

      // 4. Create Owner User
      const user = await tx.user.create({
        data: {
          name: userName,
          email: userEmail,
          password: hashedPassword,
          role: "owner",
          companyId: company.id,
        },
      });

      // 5. Create Journal Book
      const journalBook = await tx.journalBook.create({
        data: {
          yearLabel,
          financialYearId: financialYear.id,
          branchId: branch.id,
        },
      });

      // 6. Create Product Book
      const productBook = await tx.productBook.create({
        data: {
          yearLabel,
          financialYearId: financialYear.id,
          branchId: branch.id,
        },
      });

      // 7. Create Invoice Books by Type
      await Promise.all(
        Object.values(InvoiceType).map((type) =>
          tx.invoiceBook.create({
            data: {
              type,
              yearLabel,
              financialYearId: financialYear.id,
              branchId: branch.id,
            },
          })
        )
      );

      // 8. Create Voucher Books by Type
      await Promise.all(
        Object.values(VoucherType).map((type) =>
          tx.voucherBook.create({
            data: {
              type,
              yearLabel,
              financialYearId: financialYear.id,
              branchId: branch.id,
            },
          })
        )
      );

      return {
        company,
        financialYear,
        branch,
        user,
        journalBook,
        productBook,
      };
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// UPDATE company
export const updateCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existing = await prisma.company.findUnique({
      where: { id },
    });

    if (!existing) return next(new AppError("Company not found", 404));

    const company = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// DELETE company
export const deleteCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const existing = await prisma.company.findUnique({
      where: { id },
    });
    if (!existing) return next(new AppError("Company not found", 404));

    await prisma.company.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
