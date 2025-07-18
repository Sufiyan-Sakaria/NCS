import { RequestHandler, Router } from "express";
import {
  getAccountGroupsByBranch,
  getAccountGroupById,
  createAccountGroup,
  updateAccountGroup,
  deleteAccountGroup,
  getLedgersByBranch,
  getLedgerById,
  createLedger,
  updateLedger,
  deleteLedger,
  createDefaultAccounts,
  getTrialBalance,
  getLedgerBookByLedgerId,
  getHierarchicalAccountsByBranch,
} from "../controllers/Account";

const router = Router();

// Default Account Structure
router.post("/structure/default", createDefaultAccounts);

// Account Group Routes
router.get("/groups/branch/:branchId", getAccountGroupsByBranch);
router.get("/groups/:id", getAccountGroupById);
router.post("/groups", createAccountGroup);
router.put("/groups/:id", updateAccountGroup);
router.delete("/groups/:id", deleteAccountGroup);

// Ledger Routes
router.get("/ledgers/branch/:branchId", getLedgersByBranch);
router.get("/ledgers/:id", getLedgerById);
router.post("/ledgers", createLedger);
router.put("/ledgers/:id", updateLedger);
router.delete("/ledgers/:id", deleteLedger);

// Trial Balance & Ledger Book
router.get("/trial-balance/:branchId/:financialYearId", getTrialBalance);
router.get("/ledger-book/:ledgerId", getLedgerBookByLedgerId);

router.get("/hierarchy/:branchId", getHierarchicalAccountsByBranch);

export default router;
