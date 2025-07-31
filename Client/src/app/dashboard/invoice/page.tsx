"use client";

import { useInvoices } from "@/hooks/useInvoice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, Printer } from "lucide-react";
import { useActiveBranchId } from "@/hooks/UseActiveBranch";
import { Invoice, InvoiceType } from "@/types/Invoice";

export default function InvoicesPage() {
  const branchId = useActiveBranchId();
  const { data: invoices = [], isLoading } = useInvoices(branchId);

  const getTypeLabel = (type: InvoiceType) => {
    switch (type) {
      case "SALE":
        return <Badge className="bg-green-200 text-green-800">Sale</Badge>;
      case "PURCHASE":
        return <Badge className="bg-blue-200 text-blue-800">Purchase</Badge>;
      case "SALE_RETURN":
        return <Badge className="bg-yellow-200 text-yellow-800">Sale Return</Badge>;
      case "PURCHASE_RETURN":
        return <Badge className="bg-red-200 text-red-800">Purchase Return</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const handlePrint = (invoiceId: string) => {
    window.open(`/print/invoice/${invoiceId}`, "_blank");
  };

  const renderTable = (data: Invoice[]) => (
    <div className="rounded-md border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="text-center border-r">Date</TableHead>
            <TableHead className="text-center border-r">Invoice No.</TableHead>
            <TableHead className="text-center border-r">Invoice Type</TableHead>
            <TableHead className="text-center border-r">Particulars</TableHead>
            <TableHead className="text-center border-r">Total Amount</TableHead>
            <TableHead className="text-center border-r">Description</TableHead>
            <TableHead className="text-center">Created By</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="flex items-center justify-center gap-2 border-r">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                {format(new Date(invoice.date), "PPP")}
              </TableCell>
              <TableCell className="text-center border-r">{invoice.invoiceNumber}</TableCell>
              <TableCell className="text-center border-r">{getTypeLabel(invoice.type)}</TableCell>
              <TableCell className="text-center border-r">{invoice.ledger.name}</TableCell>
              <TableCell className="text-center border-r">
                {invoice.grandTotal.toLocaleString()}
              </TableCell>
              <TableCell className="text-center border-r">{invoice.narration || "—"}</TableCell>
              <TableCell className="text-center border-r">
                {invoice.createdByUser?.name ?? "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center">
                  <Printer
                    className="cursor-pointer text-blue-500 hover:text-blue-700"
                    onClick={() => handlePrint(invoice.id)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <main className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>{isLoading ? <p>Loading...</p> : renderTable(invoices)}</CardContent>
      </Card>
    </main>
  );
}
