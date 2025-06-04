import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma";
import { AppError } from "../utils/AppError";

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
    const { name, email } = req.body;

    if (!name || !email) {
      return next(new AppError("Name and email is required", 400));
    }

    const company = await prisma.company.create({
      data: { name, email },
    });

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// UPDATE company
// PATCH company
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
