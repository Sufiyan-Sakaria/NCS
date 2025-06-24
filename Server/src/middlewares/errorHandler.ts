import { Request, Response, NextFunction } from "express";
import { handlePrismaError } from "../utils/PrismaErrorHandler";
import { AppError } from "../utils/AppError";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prisma-specific errors
  const prismaError = handlePrismaError(err);
  if (prismaError) {
    res.status(prismaError.statusCode).json({
      success: false,
      message: prismaError.message,
    });
    return;
  }

  // Custom application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unhandled error
  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong.",
  });
};
