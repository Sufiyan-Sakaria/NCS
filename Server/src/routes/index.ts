import express from "express";
const router = express.Router();
import { protect } from "../middlewares/authentication";

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
import Account from "./Account";
import Invoice from "./Invoice";
import Voucher from "./Voucher";

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
router.use("/brand", protect, Brand);

// Category Routes
router.use("/category", protect, Category);

// Unit Routes
router.use("/unit", protect, Unit);

// Godown Routes
router.use("/godown", protect, Godown);

// Product Routes
router.use("/product", protect, Product);

// Product Ledger Routes
router.use("/product-ledger", protect, ProductLedger);

// Account & Ledger Routes
router.use("/account", protect, Account);

// Invoice Routes
router.use("/invoice", protect, Invoice);

// Voucher Routes
router.use("/voucher", protect, Voucher);

export default router;
