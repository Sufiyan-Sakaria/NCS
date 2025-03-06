import { Router } from "express";
import {
  GetAllUser,
  GetSingleUserByID,
  EditUser,
  DeleteUser,
  AddUser,
  LoginUser,
} from "../controllers/UserController";

const router = Router();

// Fetch Login User Details
router.get("/me", LoginUser);

// Fetch all users
router.get("/all", GetAllUser);

// Fetch a single user by ID
router.get("/:id", GetSingleUserByID);

// Add a user
router.post("/add", AddUser);

// Update a user by ID
router.patch("/update/:id", EditUser);

// Delete a user by ID
router.delete("/:id", DeleteUser);

export default router;
