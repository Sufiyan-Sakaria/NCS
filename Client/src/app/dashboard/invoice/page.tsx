"use client";

import { useInvoices } from "@/hooks/useInvoice";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useActiveBranchId } from "@/hooks/UseActiveBranch";

type Invoice = {
  id: string;
  invoiceNumber: string;
  date: string;
  type: "SALE" | "PURCHASE" | "SALE_RETURN" | "PURCHASE_RETURN";
  grandTotal: number;
  ledger: {
    name: string;
  };
  createdByUser: {
    name: string;
  };
};

export default function InvoicesPage() {
  const branchId = useActiveBranchId();
  const { data: invoices = [], isLoading } = useInvoices(branchId);

  console.log("Invoices:", invoices);

  const recentSales = invoices
    .filter((inv) => inv.type === "SALE" || inv.type === "PURCHASE")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  const recentReturns = invoices
    .filter((inv) => inv.type === "SALE_RETURN" || inv.type === "PURCHASE_RETURN")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const getTypeLabel = (type: Invoice["type"]) => {
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

  const renderTable = (data: Invoice[]) => (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead className="text-left">Date</TableHead>
          <TableHead>Invoice #</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Created By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              {format(new Date(invoice.date), "PPP")}
            </TableCell>
            <TableCell>{invoice.invoiceNumber}</TableCell>
            <TableCell>{getTypeLabel(invoice.type)}</TableCell>
            <TableCell className="text-right font-mono font-medium">
              {invoice.grandTotal.toLocaleString()}
            </TableCell>
            <TableCell>{invoice.createdByUser?.name ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <main className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Sale & Purchase Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading...</p> : renderTable(recentSales)}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Recent Returns (Sale & Purchase)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading...</p> : renderTable(recentReturns)}
        </CardContent>
      </Card>
    </main>
  );
}
