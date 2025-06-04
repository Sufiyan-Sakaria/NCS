import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  getUsersByCompany,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  hardDeleteUser,
} from "../controllers/User";

const router = Router();

// GET /api/users - Get all users
router.get("/", getAllUsers);

// GET /api/users/:id - Get user by ID
router.get("/:id", getUserById);

// GET /api/users/company/:companyId - Get users by company
router.get("/company/:companyId", getUsersByCompany);

// POST /api/users - Create new user
router.post("/", createUser);

// PATCH /api/users/:id - Update user
router.patch("/:id", updateUser);

// PATCH /api/users/:id/toggle-status - Toggle user active status
router.patch("/:id/toggle-status", toggleUserStatus);

// DELETE /api/users/:id - Soft delete user (set isActive to false)
router.delete("/:id", deleteUser);

// DELETE /api/users/:id/hard - Hard delete user (permanent removal)
router.delete("/:id/hard", hardDeleteUser);

export default router;
