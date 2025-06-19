import { Router } from "express";
import {
  createBrand,
  getBrandsByBranch,
  updateBrand,
  toggleBrandStatus,
  deleteBrand,
} from "../controllers/Brand";

const router = Router();

router.get("/:branchId", getBrandsByBranch);
router.post("/:branchId", createBrand);
router.put("/:id", updateBrand);
router.patch("/toggle/:id", toggleBrandStatus);
router.delete("/:id", deleteBrand); // hard delete

export default router;
