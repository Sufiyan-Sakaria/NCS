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

    // Calculate totals
    const totalDebitBalance = trialBalance?.ledgers
        .filter((ledger) => ledger.balanceType === "DEBIT")
        .reduce((sum, ledger) => sum + ledger.balanceAmount, 0) || 0;

    const totalCreditBalance = trialBalance?.ledgers
        .filter((ledger) => ledger.balanceType === "CREDIT")
        .reduce((sum, ledger) => sum + ledger.balanceAmount, 0) || 0;

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
                            <TableRow className="border-t-2 border-gray-800">
                                <TableCell className="text-center border-r" colSpan={2}>
                                    <strong>TOTAL</strong>
                                </TableCell>
                                <TableCell className="text-center border-r">
                                    <strong>{formatAmount(totalDebitBalance)}</strong>
                                </TableCell>
                                <TableCell className="text-center">
                                    <strong>{formatAmount(totalCreditBalance)}</strong>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </main>
    );
};

export default Page;