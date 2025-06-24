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

// GET /api/user - Get all users
router.get("/", getAllUsers);

// GET /api/user/:id - Get user by ID
router.get("/:id", getUserById);

// GET /api/user/company/:companyId - Get users by company
router.get("/company/:companyId", getUsersByCompany);

// POST /api/user - Create new user
router.post("/", createUser);

// PATCH /api/users:id - Update user
router.patch("/:id", updateUser);

// PATCH /api/user/:id/toggle-status - Toggle user active status
router.patch("/:id/toggle-status", toggleUserStatus);

// DELETE /api/user/:id - Soft delete user (set isActive to false)
router.delete("/:id", deleteUser);

// DELETE /api/user/:id/hard - Hard delete user (permanent removal)
router.delete("/:id/hard", hardDeleteUser);

export default router;
