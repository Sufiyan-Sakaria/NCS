import { NextFunction, Request, Response } from "express";
import { db } from "../db/index";
import { godownsTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { AppError } from "../utils/AppError";
import { randomUUID } from "crypto";

// Fetch all godowns
export const GetAllGodown = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const allGodowns = await db.select().from(godownsTable);
    if (!allGodowns.length) {
      return next(new AppError("No godown found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Godowns fetched successfully",
      godown: allGodowns,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Fetch single godown by id
export const GetSingleGodown = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const godown = await db
      .select()
      .from(godownsTable)
      .where(eq(godownsTable.id, Number(req.params.id)));
    if (!godown.length) {
      return next(new AppError("godown not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "godown fetched successfully",
      godown: godown[0],
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Create a new godown
export const CreateGodown = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, location } = req.body;
    if (!name) {
      return next(new AppError("Godown name is required", 400));
    }

    const newGodown = await db
      .insert(godownsTable)
      .values({ name, location })
      .returning();

    res.status(201).json({
      status: "success",
      message: "godown created successfully",
      godown: newGodown[0],
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Update an existing godown
export const UpdateGodown = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    if (!name && !location) {
      return next(
        new AppError("At least one of name or location is required", 400)
      );
    }

    const updatedGodown = await db
      .update(godownsTable)
      .set({ ...(name && { name }), ...(location && { location }) })
      .where(eq(godownsTable.id, Number(id)))
      .returning();

    if (!updatedGodown.length) {
      return next(new AppError("godown not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "godown updated successfully",
      godown: updatedGodown[0],
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

// Delete a godown
export const DeleteGodown = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const deletedGodown = await db
      .delete(godownsTable)
      .where(eq(godownsTable.id, Number(id)))
      .returning();
    if (!deletedGodown.length) {
      return next(new AppError("godown not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "godown deleted successfully",
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};
