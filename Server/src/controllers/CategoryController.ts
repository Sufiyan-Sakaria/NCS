import { NextFunction, Request, Response } from "express";
import { db } from "../db/index";
import { categoriesTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { AppError } from "../utils/AppError";

// Fetch all categories
export const GetAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await db.select().from(categoriesTable);
    if (!categories.length) {
      return next(new AppError("No categories found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Categories fetched successfully",
      categories,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Fetch single category by id
export const GetSingleCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, parseInt(req.params.id)))
      .then((rows) => rows[0]);

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Category fetched successfully",
      category,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Create a new category
export const CreateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return next(new AppError("Category name is required", 400));
    }

    const [newCategory] = await db
      .insert(categoriesTable)
      .values({ name, description })
      .returning();

    res.status(201).json({
      status: "success",
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Update an existing category
export const UpdateCategory = async (
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

    const [updatedCategory] = await db
      .update(categoriesTable)
      .set({ ...(name && { name }), ...(description && { description }) })
      .where(eq(categoriesTable.id, Number(id)))
      .returning();

    if (!updatedCategory) {
      return next(new AppError("Category not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Delete a category
export const DeleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deletedCategory = await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, Number(id)))
      .returning();

    if (!deletedCategory.length) {
      return next(new AppError("Category not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};
