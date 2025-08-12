"use client";

import React from "react";
import CompanyHeader from "@/components/reports/CompanyHeader";
import { useActiveBranchId } from "@/hooks/UseActive";
import { useTradingAc } from "@/hooks/UseReport";
import { NextPage } from "next";
import { Loader2 } from "lucide-react";

const Page: NextPage = () => {
  const branchId = useActiveBranchId();
  const financialYearId = "8c5ccbae-2c5d-4050-9f6f-331f28c9e99b";
  const { data: tradingAc, isLoading, error } = useTradingAc(branchId, financialYearId);

  if (isLoading) {
    return (
      <main className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading Trading Account...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 max-w-6xl mx-auto">
        <div className="text-center text-red-500 min-h-[400px] flex items-center justify-center">
          <div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Trading Account</h2>
          </div>
        </div>
      </main>
    );
  }

  if (!tradingAc) {
    return (
      <main className="p-6 max-w-6xl mx-auto">
        <div className="text-center text-gray-500 min-h-[400px] flex items-center justify-center">
          No trading account data available
        </div>
      </main>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const { tradingAccount } = tradingAc;

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">Trading A/c</h1>
      <CompanyHeader />

      {/* Trading Account Table */}
      <div className="rounded-md border mt-6 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left font-bold text-black border-r w-1/2">
                Dr. PARTICULARS
              </th>
              <th className="px-4 py-3 text-right font-bold text-black border-r w-1/6">AMOUNT</th>
              <th className="px-4 py-3 text-left font-bold text-black w-1/2">Cr. PARTICULARS</th>
              <th className="px-4 py-3 text-right font-bold text-black w-1/6">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {/* Opening Stock Row */}
            <tr className="border-b">
              <td className="px-4 py-3 border-r font-medium">
                {tradingAccount.debitSide.openingStock.label}
              </td>
              <td className="px-4 py-3 text-right border-r">
                {formatCurrency(tradingAccount.debitSide.openingStock.amount)}
              </td>
              <td className="px-4 py-3 font-medium">By Sales A/c</td>
              <td className="px-4 py-3 text-right">
                {formatCurrency(tradingAccount.creditSide.sales.total)}
              </td>
            </tr>

            {/* Purchases Row */}
            <tr className="border-b">
              <td className="px-4 py-3 border-r font-medium">To Purchases A/c</td>
              <td className="px-4 py-3 text-right border-r">
                {formatCurrency(tradingAccount.debitSide.purchases.total)}
              </td>
              <td className="px-4 py-3 font-medium">By Direct Incomes</td>
              <td className="px-4 py-3 text-right">
                {formatCurrency(tradingAccount.creditSide.directIncomes.total)}
              </td>
            </tr>

            {/* Direct Expenses vs Closing Stock */}
            <tr className="border-b">
              <td className="px-4 py-3 border-r font-medium">To Direct Expenses</td>
              <td className="px-4 py-3 text-right border-r">
                {formatCurrency(tradingAccount.debitSide.directExpenses.total)}
              </td>
              <td className="px-4 py-3 font-medium">
                {tradingAccount.creditSide.closingStock.label}
              </td>
              <td className="px-4 py-3 text-right">
                {formatCurrency(tradingAccount.creditSide.closingStock.amount)}
              </td>
            </tr>

            {/* Gross Profit/Loss Row */}
            <tr className="border-b">
              <td className="px-4 py-3 border-r font-medium">
                {tradingAccount.debitSide.grossProfit
                  ? tradingAccount.debitSide.grossProfit.label
                  : ""}
              </td>
              <td className="px-4 py-3 text-right border-r">
                {tradingAccount.debitSide.grossProfit
                  ? formatCurrency(tradingAccount.debitSide.grossProfit.amount)
                  : ""}
              </td>
              <td className="px-4 py-3 font-medium">
                {tradingAccount.creditSide.grossLoss
                  ? tradingAccount.creditSide.grossLoss.label
                  : ""}
              </td>
              <td className="px-4 py-3 text-right">
                {tradingAccount.creditSide.grossLoss
                  ? formatCurrency(tradingAccount.creditSide.grossLoss.amount)
                  : ""}
              </td>
            </tr>

            {/* Total Row */}
            <tr className="bg-gray-50 font-bold border-t-2">
              <td className="px-4 py-3 border-r">TOTAL</td>
              <td className="px-4 py-3 text-right border-r">
                {formatCurrency(tradingAccount.debitSide.total)}
              </td>
              <td className="px-4 py-3">TOTAL</td>
              <td className="px-4 py-3 text-right">
                {formatCurrency(tradingAccount.creditSide.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border">
          <h3 className="font-semibold text-blue-800 mb-2">Cost of Goods Sold</h3>
          <p className="text-xl font-bold text-blue-900">
            {formatCurrency(tradingAccount.summary.costOfGoodsSold)}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            tradingAccount.summary.isGrossProfit
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          <h3 className="font-semibold mb-2">
            {tradingAccount.summary.isGrossProfit ? "Gross Profit" : "Gross Loss"}
          </h3>
          <p
            className={`text-xl font-bold ${
              tradingAccount.summary.isGrossProfit ? "text-green-900" : "text-red-900"
            }`}
          >
            {formatCurrency(Math.abs(tradingAccount.summary.grossProfit))}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            tradingAccount.summary.isBalanced
              ? "bg-green-50 text-green-800"
              : "bg-yellow-50 text-yellow-800"
          }`}
        >
          <h3 className="font-semibold mb-2">Account Status</h3>
          <p
            className={`text-xl font-bold ${
              tradingAccount.summary.isBalanced ? "text-green-900" : "text-yellow-900"
            }`}
          >
            {tradingAccount.summary.isBalanced ? "Balanced" : "Unbalanced"}
          </p>
        </div>
      </div>

      {/* Detailed Ledgers Section */}
      {(tradingAccount.debitSide.purchases.ledgers.length > 0 ||
        tradingAccount.debitSide.directExpenses.ledgers.length > 0 ||
        tradingAccount.creditSide.sales.ledgers.length > 0 ||
        tradingAccount.creditSide.directIncomes.ledgers.length > 0) && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Detailed Breakdown</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Purchases Details */}
            {tradingAccount.debitSide.purchases.ledgers.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-blue-800">Purchase Accounts</h3>
                <div className="space-y-2">
                  {tradingAccount.debitSide.purchases.ledgers.map((ledger) => (
                    <div key={ledger.id} className="flex justify-between text-sm">
                      <span>{ledger.name}</span>
                      <span>{formatCurrency(ledger.balanceAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sales Details */}
            {tradingAccount.creditSide.sales.ledgers.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-green-800">Sales Accounts</h3>
                <div className="space-y-2">
                  {tradingAccount.creditSide.sales.ledgers.map((ledger) => (
                    <div key={ledger.id} className="flex justify-between text-sm">
                      <span>{ledger.name}</span>
                      <span>{formatCurrency(ledger.balanceAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Expenses Details */}
            {tradingAccount.debitSide.directExpenses.ledgers.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-red-800">Direct Expenses</h3>
                <div className="space-y-2">
                  {tradingAccount.debitSide.directExpenses.ledgers.map((ledger) => (
                    <div key={ledger.id} className="flex justify-between text-sm">
                      <span>{ledger.name}</span>
                      <span>{formatCurrency(ledger.balanceAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Incomes Details */}
            {tradingAccount.creditSide.directIncomes.ledgers.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-purple-800">Direct Incomes</h3>
                <div className="space-y-2">
                  {tradingAccount.creditSide.directIncomes.ledgers.map((ledger) => (
                    <div key={ledger.id} className="flex justify-between text-sm">
                      <span>{ledger.name}</span>
                      <span>{formatCurrency(ledger.balanceAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default Page;
