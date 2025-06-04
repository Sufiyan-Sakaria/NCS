import { Router } from "express";
import {
  getAllBranches,
  getBranchById,
  getBranchesByCompany,
  getBranchesByUser,
  createBranch,
  updateBranch,
  deleteBranch,
  assignUsersToBranch,
  removeUsersFromBranch,
} from "../controllers/Branch";

const router = Router();

// GET /api/branches - Get all branches
router.get("/", getAllBranches);

// GET /api/branches/:id - Get branch by ID
router.get("/:id", getBranchById);

// GET /api/branches/company/:companyId - Get branches by company
router.get("/company/:companyId", getBranchesByCompany);

// GET /api/branches/user/:userId - Get branches accessible by user
router.get("/user/:userId", getBranchesByUser);

// POST /api/branches - Create new branch
router.post("/", createBranch);

// PATCH /api/branches/:id - Update branch
router.patch("/:id", updateBranch);

// DELETE /api/branches/:id - Delete branch
router.delete("/:id", deleteBranch);

// POST /api/branches/:id/users - Assign users to branch
router.post("/:id/users", assignUsersToBranch);

// DELETE /api/branches/:id/users - Remove users from branch
router.delete("/:id/users", removeUsersFromBranch);

export default router;
