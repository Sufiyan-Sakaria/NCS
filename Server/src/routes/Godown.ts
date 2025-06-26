import { Router } from "express";
import {
  createGodown,
  deleteGodown,
  getGodownsByBranch,
  toggleGodownStatus,
  updateGodown,
} from "../controllers/Godown";

const router = Router();

// GET all godowns by branch
router.get("/:branchId", getGodownsByBranch);

// CREATE a godown
router.post("/:branchId", createGodown);

// UPDATE a godown
router.put("/:id", updateGodown);

// TOGGLE active status
router.patch("/:id/toggle", toggleGodownStatus);

// DELETE a godown
router.delete("/:id", deleteGodown);

export default router;
