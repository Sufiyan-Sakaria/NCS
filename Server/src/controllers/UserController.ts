import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { hashPassword } from "../utils/Bcrypt";
import { db } from "../db/index";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

// Get all users
export const GetAllUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.username,
        email: usersTable.email,
        role: usersTable.role,
        createdAt: usersTable.created_at,
        updatedAt: usersTable.updated_at,
      })
      .from(usersTable);

    if (!users.length) {
      return next(new AppError("No users found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

export const GetSingleUserByID = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, parseInt(id)))
      .then((rows) => rows[0]);

    if (!user) {
      return next(new AppError("User does not exist", 404));
    }

    res.status(200).json({
      status: "success",
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    next(new AppError("Internal server error", 500));
  }
};

export const AddUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return next(
        new AppError("Username, email, and password are required", 400)
      );
    }

    const validRoles = ["Admin", "User"];
    if (role && !validRoles.includes(role)) {
      return next(new AppError("Invalid role provided", 400));
    }

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .then((rows) => rows[0]);
    if (existingUser) {
      return next(new AppError("Email is already in use", 400));
    }

    const userRole = role || "User";
    const hashedPassword = await hashPassword(password);

    const [newUser] = await db
      .insert(usersTable)
      .values({
        username,
        email,
        password: hashedPassword,
        role: userRole,
      })
      .returning();

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      newUser,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return next(
        new AppError("Duplicate field value: email already exists", 400)
      );
    }
    next(new AppError("Internal server error", 500));
  }
};

export const EditUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { username, email, role } = req.body;

    const validRoles = ["Admin", "User"];
    if (role && !validRoles.includes(role)) {
      return next(new AppError("Invalid role provided", 400));
    }

    const [updatedUser] = await db
      .update(usersTable)
      .set({
        username,
        email,
        role,
      })
      .where(eq(usersTable.id, parseInt(id)))
      .returning();

    if (!updatedUser) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      updatedUser,
    });
  } catch (error: any) {
    next(new AppError("Internal server error", 500));
  }
};

export const DeleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deletedUser = await db
      .delete(usersTable)
      .where(eq(usersTable.id, parseInt(id)))
      .returning();

    if (!deletedUser.length) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error: any) {
    next(new AppError("Internal server error", 500));
  }
};

export const LoginUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return next(new AppError("Unauthorized access", 401));
    }

    res.status(200).json({
      status: "success",
      message: "User details fetched successfully",
      user,
    });
  } catch (error: any) {
    next(new AppError("Internal server error", 500));
  }
};
