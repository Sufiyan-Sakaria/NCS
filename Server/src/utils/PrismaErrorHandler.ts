import { Prisma } from "../../generated/prisma";
import { AppError } from "./AppError";

export function handlePrismaError(error: any): AppError | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const fields = (error.meta?.target as string[]) || ["field"];
        return new AppError(
          `A record with this ${fields.join(", ")} already exists.`,
          409
        );
      }
      case "P2025":
        return new AppError("Record not found.", 404);
      case "P2003":
        return new AppError("Foreign key constraint failed.", 400);
      case "P2014":
        return new AppError("Invalid relation between records.", 400);
      default:
        return new AppError("Database error occurred.", 500);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new AppError("Invalid data format sent to database.", 400);
  }

  return null;
}
