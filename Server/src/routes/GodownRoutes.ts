import { Router } from "express";
import {
  CreateGodown,
  DeleteGodown,
  GetAllGodown,
  GetSingleGodown,
  UpdateGodown,
} from "../controllers/GodownController";

const router = Router();

// Get all Godowns
router.get("/all", GetAllGodown);

// Create a new Godown
router.post("/add", CreateGodown);

// Delete a Godown
router.delete("/delete", DeleteGodown);

// Update a Godown
router.patch("/update/:id", UpdateGodown);

// Get Single Godown
router.get("/:id", GetSingleGodown);

export default router;
