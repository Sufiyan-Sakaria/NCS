import { Router } from "express";
import UserRoutes from "./UserRoutes";
import AuthRoutes from "./AuthRoutes";
import CategoryRoutes from "./CategoryRoutes";
import BrandRoutes from "./BrandRoutes";
import AccountRoutes from "./AccountRoutes";
import VoucherRoutes from "./VoucherRoutes";
import LedgerRoutes from "./LedgerRoutes";
import GodownRoutes from "./GodownRoutes";
import ProductRoutes from "./ProductRoutes";
import InvoiceRoutes from "./InvoiceRoutes";
import { authenticate } from "../middlewares/Authentication";

const router = Router();

// Auth Routes
router.use("/auth", AuthRoutes);

// User Routes
router.use("/users", authenticate, UserRoutes);

// Category Routes
router.use("/categories", authenticate, CategoryRoutes);

// Brand Routes
router.use("/brands", authenticate, BrandRoutes);

// Account Routes
router.use("/account", authenticate, AccountRoutes);

// Voucher Routes
router.use("/voucher", authenticate, VoucherRoutes);

// Ledger Routes
router.use("/ledger", authenticate, LedgerRoutes);

// Godown Routes
router.use("/godown", authenticate, GodownRoutes);

// Product Routes
router.use("/product", authenticate, ProductRoutes);

// Invoice Routes
router.use("/invoice", authenticate, InvoiceRoutes);

export default router;
