import { Request, Response, NextFunction } from "express";
import { Prisma } from "../../generated/prisma";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        const fields = Array.isArray(err.meta?.target)
          ? err.meta?.target.join(", ")
          : "unknown";
        message = `Unique constraint failed on field(s): ${fields}`;
        statusCode = 409;
        break;
      case "P2025":
        message = `Record not found.`;
        statusCode = 404;
        break;
      case "P2003":
        message = `Foreign key constraint failed.`;
        statusCode = 409;
        break;
      default:
        message = `Database error: ${err.message}`;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    message = "Validation failed: " + err.message;
    statusCode = 400;
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    message = "Failed to initialize database connection.";
    statusCode = 500;
  } else if (err instanceof Prisma.PrismaClientRustPanicError) {
    message = "Unexpected Prisma error (Rust panic).";
    statusCode = 500;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
