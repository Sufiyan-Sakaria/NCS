import express from "express";
const router = express.Router();

import Company from "./Company";
import User from "./User";
import Branch from "./Branch";

router.get("/", (req, res) => {
  res.send("working 😊");
});

// Company Routes
router.use("/company", Company);

// User Routes
router.use("/user", User);

// Branch Routes
router.use("/branch", Branch);

export default router;
