import express from "express";
const router = express.Router();

import Company from "./Company";
import User from "./User";
import Branch from "./Branch";
import Auth from "./Auth";
import Brand from "./Brand";
import Category from "./Category";
import Unit from "./Unit";
import Godown from "./Godown";
import Product from "./Product";
import ProductLedger from "./ProductLedger";

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

// Category Routes
router.use("/category", Category);

// Unit Routes
router.use("/unit", Unit);

// Godown Routes
router.use("/godown", Godown);

// Product Routes
router.use("/product", Product);

// Product Ledger Routes
router.use("/product-ledger", ProductLedger);

export default router;
