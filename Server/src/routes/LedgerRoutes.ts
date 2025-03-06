import express from "express";
import {
  createLedgerEntry,
  deleteLedgerEntry,
  getAccountLedgerInDateRange,
  getAllLedgers,
  getSingleLedger,
} from "../controllers/LedgerController";

const router = express.Router();

router.post("/add", createLedgerEntry);

router.get("/all", getAllLedgers);

router.get("/date/:accountId", getAccountLedgerInDateRange);

router.get("/:accountId", getSingleLedger);

router.delete("/:id", deleteLedgerEntry);

export default router;
