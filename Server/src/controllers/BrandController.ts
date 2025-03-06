import { NextFunction, Request, Response } from "express";
import { db } from "../db/index";
import { brandsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { AppError } from "../utils/AppError";

// Fetch all brands
export const GetAllBrands = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const allBrands = await db.select().from(brandsTable);
    if (!allBrands.length) {
      return next(new AppError("No brands found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Brands fetched successfully",
      brands: allBrands,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Fetch single brand by id
export const GetSingleBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const brand = await db
      .select()
      .from(brandsTable)
      .where(eq(brandsTable.id, Number(req.params.id)));
    if (!brand.length) {
      return next(new AppError("Brand not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Brand fetched successfully",
      brand: brand[0],
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Create a new brand
export const CreateBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return next(new AppError("Brand name is required", 400));
    }

    const newBrand = await db
      .insert(brandsTable)
      .values({ name, description })
      .returning();

    res.status(201).json({
      status: "success",
      message: "Brand created successfully",
      brand: newBrand[0],
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Update an existing brand
export const UpdateBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name && !description) {
      return next(
        new AppError("At least one of name or description is required", 400)
      );
    }

    const updatedBrand = await db
      .update(brandsTable)
      .set({ ...(name && { name }), ...(description && { description }) })
      .where(eq(brandsTable.id, Number(id)))
      .returning();

    if (!updatedBrand.length) {
      return next(new AppError("Brand not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Brand updated successfully",
      brand: updatedBrand[0],
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Delete a brand
export const DeleteBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const deletedBrand = await db
      .delete(brandsTable)
      .where(eq(brandsTable.id, Number(id)))
      .returning();
    if (!deletedBrand.length) {
      return next(new AppError("Brand not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Brand deleted successfully",
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};
