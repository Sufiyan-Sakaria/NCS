import { Router } from "express";
import {
  getUnitsByBranch,
  createUnit,
  updateUnit,
  toggleUnitStatus,
  deleteUnit,
} from "../controllers/Unit";

const router = Router();

// GET all units by branch
router.get("/:branchId", getUnitsByBranch);

// CREATE a unit
router.post("/:branchId", createUnit);

// UPDATE a unit
router.put("/:id", updateUnit);

// TOGGLE active status
router.patch("/:id/toggle", toggleUnitStatus);

// DELETE a unit
router.delete("/:id", deleteUnit);

export default router;
