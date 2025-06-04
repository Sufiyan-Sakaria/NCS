import express from "express";
import { login } from "../controllers/Auth";

const router = express.Router();

router.post("/login", login);

export default router;
