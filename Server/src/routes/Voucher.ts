import { Router } from "express";
import {
  createVoucher,
  deleteVoucher,
  getVouchersByBranch,
  updateVoucher,
} from "../controllers/Voucher";

const router = Router();

// GET all vouchers by branch
router.get("/:branchId", getVouchersByBranch);

// CREATE a voucher
router.post("/:branchId", createVoucher);

// UPDATE a voucher
router.put("/:id", updateVoucher);

// DELETE a voucher
router.delete("/:id", deleteVoucher);

export default router;
