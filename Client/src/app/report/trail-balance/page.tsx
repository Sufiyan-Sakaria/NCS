"use client";

import CompanyHeader from "@/components/reports/CompanyHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useActiveBranchId } from "@/hooks/UseActive";
import { useTrailBalance } from "@/hooks/UseReport";
import { NextPage } from "next";

const Page: NextPage = () => {
  const branchId = useActiveBranchId();
  const financialYearId = "8c5ccbae-2c5d-4050-9f6f-331f28c9e99b";
  const { data: trialBalance } = useTrailBalance(branchId, financialYearId);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">Trial Balance</h1>
      <h2>Balance As On </h2>
      <CompanyHeader />

      <div className="mt-8 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center border-r">Code</TableHead>
              <TableHead className="text-center border-r">Account Name</TableHead>
              <TableHead className="text-center border-r">Dr (Debit)</TableHead>
              <TableHead className="text-center">Cr (Credit)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trialBalance?.ledgers.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-center border-r">{l.code}</TableCell>
                <TableCell className="text-center border-r">{l.name}</TableCell>
                <TableCell className="text-center border-r">
                  {l.balanceType === "DEBIT" ? formatAmount(l.balanceAmount) : ""}
                </TableCell>
                <TableCell className="text-center">
                  {l.balanceType === "CREDIT" ? formatAmount(l.balanceAmount) : ""}
                </TableCell>
              </TableRow>
            ))}

            {/* Totals Row */}
            {trialBalance && (
              <TableRow>
                <TableCell className="text-center border-r" colSpan={2}>
                  <strong>TOTAL</strong>
                </TableCell>
                <TableCell className="text-center border-r">
                  <strong>{formatAmount(trialBalance.totals.totalDebitBalance)}</strong>
                </TableCell>
                <TableCell className="text-center">
                  <strong>{formatAmount(trialBalance.totals.totalCreditBalance)}</strong>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Balance difference warning */}
        {trialBalance && trialBalance.totals.difference !== 0 && (
          <div className="mt-4 p-4 border rounded">
            <p className="font-semibold">
              ⚠️ Trial Balance is not balanced! Difference:{" "}
              {formatAmount(Math.abs(trialBalance.totals.difference))}
            </p>
          </div>
        )}

        {/* Balance validation errors */}
        {trialBalance?.balanceValidation.hasBalanceMismatches && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-red-600 mb-3">Balance Mismatches</h3>
            <div className="bg-red-50 border border-red-200 rounded p-4">
              {trialBalance.balanceValidation.mismatchedLedgers.map((mismatch) => (
                <div key={mismatch.id} className="mb-2 text-sm">
                  <strong>{mismatch.name}:</strong>
                  <span className="ml-2">
                    Calculated: {formatAmount(Math.abs(mismatch.calculated))}, Stored:{" "}
                    {formatAmount(mismatch.stored)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Page;
