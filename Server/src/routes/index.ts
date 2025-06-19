import express from "express";
const router = express.Router();

import Company from "./Company";
import User from "./User";
import Branch from "./Branch";
import Auth from "./Auth";
import Brand from "./Brand";

router.get("/", (req, res) => {
  res.send("working 😊");
});

// Company Routes
router.use("/company", Company);

// User Routes
router.use("/user", User);

// Branch Routes
router.use("/branch", Branch);

// Auth Routes
router.use("/auth", Auth);

// Brand Routes
router.use("/brand", Brand);

export default router;
