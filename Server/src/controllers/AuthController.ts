import { NextFunction, Request, Response } from "express";
import { db } from "../db/index";
import { usersTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { AppError } from "../utils/AppError";
import { comparePassword } from "../utils/Bcrypt";
import { generateToken } from "../utils/JWT";

export const Login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    // Find user in the database
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .then((rows) => rows[0]);

    // Check if user exists
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Verify the password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate a JWT token
    const token = generateToken(user.id, user.email, user.role);

    // Send response
    res.status(200).json({
      status: "success",
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError("Login failed", 500));
  }
};
