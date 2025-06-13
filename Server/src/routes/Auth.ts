import express from "express";
import { login, logout, verify } from "../controllers/Auth";
import { protect } from "../middlewares/authentication";

const router = express.Router();

router.post("/login", login);

router.get("/verify", protect, verify);

router.post("logout", logout);

export default router;
