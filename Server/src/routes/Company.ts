import express from "express";
import {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../controllers/Company";

const router = express.Router();

router.get("/", getAllCompanies);
router.get("/:id", getCompanyById);
router.post("/", createCompany);
router.patch("/:id", updateCompany);
router.delete("/:id", deleteCompany);

export default router;
