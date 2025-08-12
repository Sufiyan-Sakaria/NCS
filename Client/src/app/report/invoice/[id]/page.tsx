"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useInvoiceById } from "@/hooks/useInvoice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Printer,
  Phone,
  MapPin,
  Calendar,
  User,
  Package,
  Receipt,
} from "lucide-react";
import { useActiveUser } from "@/hooks/UseActive";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CompanyHeader from "@/components/reports/CompanyHeader";

export default function PrintInvoicePage() {
  const { id } = useParams();
  const user = useActiveUser();
  const { data: invoice, isLoading, error } = useInvoiceById(id as string);
  const [isPrinting, setIsPrinting] = useState(false);

  console.log(invoice);

  const invoiceItems = invoice?.items || [];

  useEffect(() => {
    if (invoice && !isPrinting) {
      setIsPrinting(true);
      // Reduced timeout for faster printing
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [invoice, isPrinting]);

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading invoice...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="text-destructive text-5xl mb-4">⚠️</div>
            <p className="text-muted-foreground text-center">Invoice not found or failed to load</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getInvoiceTypeDisplay = (type: string) => {
    switch (type) {
      case "SALE":
        return "Sales Invoice";
      case "PURCHASE":
        return "Purchase Invoice";
      case "SALE_RETURN":
        return "Sales Return";
      case "PURCHASE_RETURN":
        return "Purchase Return";
      default:
        return type;
    }
  };

  return (
    <>
      {/* Screen-only print button */}
      <div className="print:hidden fixed top-4 right-4 z-10">
        <Button onClick={() => window.print()} className="shadow-lg" size="sm">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      <div className="max-w-5xl space-y-2 mx-auto p-6 print:p-4 print:max-w-none bg-background print:space-y-4">
        {/* Enhanced Company Details Section */}
        <CompanyHeader />

        {/* Invoice Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 print:grid-cols-2 print:gap-3">
          {/* Party Information */}
          <Card className="print:shadow-none print:border print:border-black py-2 gap-2">
            <CardHeader className="print:pb-2">
              <CardTitle className="text-base flex items-center gap-2 print:text-sm">
                <User className="w-4 h-4 print:w-3 print:h-3" />
                {invoice.type === "SALE" || invoice.type === "SALE_RETURN"
                  ? "Customer Information"
                  : "Supplier Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 print:space-y-1">
              <div>
                <h3 className="font-semibold text-lg print:text-sm">{invoice.ledger.name}</h3>
                <p className="text-sm text-muted-foreground print:text-xs print:text-black">
                  Code: <span className="font-mono">{invoice.ledger.code}</span>
                </p>
              </div>

              {invoice.ledger.address && (
                <div className="flex items-start gap-2 text-sm print:text-xs">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0 print:w-3 print:h-3 print:text-black" />
                  <span className="print:text-black">{invoice.ledger.address}</span>
                </div>
              )}

              {(invoice.ledger.phone1 || invoice.ledger.phone2) && (
                <div className="flex items-center gap-4 text-sm print:text-xs">
                  {invoice.ledger.phone1 && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-muted-foreground print:w-3 print:h-3 print:text-black" />
                      <span className="print:text-black">{invoice.ledger.phone1}</span>
                    </div>
                  )}
                  {invoice.ledger.phone2 && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-muted-foreground print:w-3 print:h-3 print:text-black" />
                      <span className="print:text-black">{invoice.ledger.phone2}</span>
                    </div>
                  )}
                </div>
              )}
              <Separator className="print:border-black" />
              <div className="flex justify-between items-center print:text-xs">
                <span className="text-sm text-muted-foreground print:text-black print:text-xs">
                  Current Balance
                </span>
                <Badge variant="outline" className="font-mono print:border-black print:text-black">
                  {formatCurrency(invoice.ledger.balance)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Information */}
          <Card className="print:shadow-none print:border print:border-black py-2 gap-2">
            <CardHeader className="print:pb-2">
              <CardTitle className="text-base flex items-center gap-2 print:text-sm">
                <Receipt className="w-4 h-4 print:w-3 print:h-3" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 print:space-y-1">
              <div className="grid grid-cols-3 gap-3 text-sm print:text-xs print:gap-1">
                <div className="flex items-center flex-col">
                  <span className="text-muted-foreground print:text-black">Type</span>
                  <p className="print:text-black">{getInvoiceTypeDisplay(invoice.type)}</p>
                </div>

                {invoice.invoiceLedger && (
                  <div className="flex items-center flex-col">
                    <span className="text-muted-foreground text-sm print:text-black print:text-xs">
                      Invoice Ledger
                    </span>
                    <p className="print:text-black">{invoice.invoiceLedger.name}</p>
                  </div>
                )}

                <div className="flex items-center flex-col">
                  <span className="text-muted-foreground text-sm print:text-black print:text-xs">
                    Invoice No.
                  </span>
                  <p className="print:text-black">{invoice.invoiceNumber}</p>
                </div>
              </div>

              <Separator className="print:border-black" />

              <div className="grid grid-cols-3 gap-3 text-sm print:text-xs print:gap-1">
                <div className="flex items-center flex-col">
                  <span className="text-muted-foreground flex items-center gap-1 print:text-black">
                    <Calendar className="w-3 h-3" />
                    Created Date
                  </span>
                  <p className="font-medium print:text-black">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center flex-col">
                  <span className="text-muted-foreground text-sm flex items-center gap-1 print:text-black print:text-xs">
                    <User className="w-3 h-3" />
                    Created By
                  </span>
                  <p className="font-medium print:text-black">
                    {invoice.createdByUser?.name || invoice.createdBy}
                  </p>
                </div>
                <div className="flex items-center flex-col">
                  <span className="text-muted-foreground text-sm flex items-center gap-1 print:text-black print:text-xs">
                    <User className="w-3 h-3" />
                    Printed By
                  </span>
                  <p className="font-medium print:text-black">{user?.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items Section */}
        {invoiceItems && invoiceItems.length > 0 && (
          <Card className="print:shadow-none print:border print:border-black py-3 gap-2">
            <CardHeader className="print:pb-2">
              <CardTitle className="text-lg flex items-center gap-2 print:text-sm">
                <Package className="w-5 h-5 print:w-4 print:h-4" />
                Invoice Items ({invoiceItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="overflow-x-auto border rounded-md print:overflow-visible print:border-black">
                <Table className="print:text-xs">
                  <TableHeader>
                    <TableRow className="print:border-b print:border-black">
                      <TableHead className="text-center border-r print:border-black print:text-black print:p-1">
                        Sr No.
                      </TableHead>
                      <TableHead className="text-center border-r print:border-black print:text-black print:p-1">
                        Product
                      </TableHead>
                      <TableHead className="text-center border-r print:border-black print:text-black print:p-1">
                        Unit
                      </TableHead>
                      <TableHead className="text-center border-r print:border-black print:text-black print:p-1">
                        Brand
                      </TableHead>
                      <TableHead className="text-center border-r print:border-black print:text-black print:p-1">
                        Category
                      </TableHead>
                      <TableHead className="text-center border-r print:border-black print:text-black print:p-1">
                        Qty
                      </TableHead>
                      <TableHead className="text-center border-r print:border-black print:text-black print:p-1">
                        Thaan
                      </TableHead>
                      <TableHead className="text-center border-r print:border-black print:text-black print:p-1">
                        Rate
                      </TableHead>
                      <TableHead className="text-center border-r print:border-black print:text-black print:p-1">
                        Discount
                      </TableHead>
                      <TableHead className="text-center border-r print:border-black print:text-black print:p-1">
                        Tax
                      </TableHead>
                      <TableHead className="text-center print:border-black print:text-black print:p-1">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className="border-b hover:bg-muted/50 print:border-black"
                      >
                        <TableCell className="text-center border-r print:border-black print:text-black print:p-1">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-center border-r print:border-black print:text-black print:p-1">
                          {item.product.name}
                        </TableCell>
                        <TableCell className="text-center border-r print:border-black print:text-black print:p-1">
                          {item.product.unit.name}
                        </TableCell>
                        <TableCell className="text-center border-r print:border-black print:text-black print:p-1">
                          {item.product.brand.name}
                        </TableCell>
                        <TableCell className="text-center border-r print:border-black print:text-black print:p-1">
                          {item.product.category.name}
                        </TableCell>
                        <TableCell className="text-center border-r print:border-black print:text-black print:p-1">
                          {item.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center border-r print:border-black print:text-black print:p-1">
                          {item.thaan.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center border-r print:border-black print:text-black print:p-1">
                          {formatCurrency(item.rate)}
                        </TableCell>
                        <TableCell className="text-center border-r print:border-black print:text-black print:p-1">
                          {formatCurrency(item.discount)}
                        </TableCell>
                        <TableCell className="text-center border-r print:border-black print:text-black print:p-1">
                          {formatCurrency(item.taxAmount)}
                        </TableCell>
                        <TableCell className="text-center font-semibold print:border-black print:text-black print:p-1">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="font-bold print:border-black print:border-t">
                      <TableCell colSpan={5} className="text-left px-5 print:text-black print:p-1">
                        Total:
                      </TableCell>
                      <TableCell className="text-md text-center print:text-black print:p-1">
                        {invoiceItems.reduce((sum, item) => sum + item.quantity, 0)}
                      </TableCell>
                      <TableCell className="text-md text-center print:text-black print:p-1">
                        {invoiceItems.reduce((sum, item) => sum + item.thaan, 0)}
                      </TableCell>
                      <TableCell className="text-md text-center print:text-black print:p-1">
                        {formatCurrency(
                          invoiceItems.reduce((sum, item) => sum + item.rate, 0) /
                            invoiceItems.length,
                        )}
                      </TableCell>
                      <TableCell className="text-md text-center print:text-black print:p-1">
                        {formatCurrency(invoiceItems.reduce((sum, item) => sum + item.discount, 0))}
                      </TableCell>
                      <TableCell className="text-md text-center print:text-black print:p-1">
                        {formatCurrency(
                          invoiceItems.reduce((sum, item) => sum + item.taxAmount, 0),
                        )}
                      </TableCell>
                      <TableCell className="text-md text-center print:text-black print:p-1">
                        {formatCurrency(invoiceItems.reduce((sum, item) => sum + item.amount, 0))}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Summary - Horizontal Layout for Print */}
        <Card className="print:shadow-none print:border gap-0 print:border-black py-2">
          <CardContent className="print:p-3">
            <div className="flex justify-between gap-2 print:gap-1 print:text-xs">
              <div className="text-center space-y-1">
                <div className="text-sm text-muted-foreground print:text-black print:text-xs">
                  Net Amount
                </div>
                <div className="text-xl font-bold text-primary print:text-black print:text-sm">
                  {formatCurrency(invoice.totalAmount)}
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-sm text-muted-foreground print:text-black print:text-xs">
                  Discount
                </div>
                <div className="text-xl font-bold print:text-black print:text-sm">
                  {formatCurrency(invoice.discount)}
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-sm text-muted-foreground print:text-black print:text-xs">
                  Cartage
                </div>
                <div className="text-xl font-bold print:text-black print:text-sm">
                  {formatCurrency(invoice.cartage)}
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-sm text-muted-foreground print:text-black print:text-xs">
                  Tax
                </div>
                <div className="text-xl font-bold print:text-black print:text-sm">
                  {formatCurrency(invoice.taxAmount)}
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-sm text-muted-foreground print:text-black print:text-xs">
                  Total Amount
                </div>
                <div className="text-xl font-bold print:text-black print:text-sm">
                  {formatCurrency(invoice.grandTotal)}
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-sm text-muted-foreground print:text-black print:text-xs">
                  Previous Balance
                </div>
                <div className="text-xl font-bold print:text-black print:text-sm">
                  {formatCurrency(invoice.JournalEntry.preBalance)}
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-sm text-muted-foreground print:text-black print:text-xs">
                  Updated Balance
                </div>
                <div className="text-xl font-bold print:text-black print:text-sm">
                  {formatCurrency(invoice.JournalEntry.preBalance + invoice.grandTotal)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-14 mb-8 hidden print:flex print:justify-end">
          <div className="text-center">
            <Separator className="!w-48 mx-auto bg-black" />
            <p className="mt-2 text-sm text-muted-foreground">Signature</p>
          </div>
        </div>

        {/* Footer */}
        <Card className="print:shadow-none print:border-t print:border-black print:rounded-none py-2">
          <CardContent className="text-center p-0 print:text-xs">
            <p className="text-muted-foreground print:text-black">Thank you for your business!</p>
            <p className="text-sm text-muted-foreground print:text-black print:text-xs">
              This is a computer-generated invoice.
            </p>
            <p className="text-xs text-muted-foreground print:text-black">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Print Styles */}
      <style jsx>
        {`
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            body {
              font-size: 10px !important;
              line-height: 1.2 !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            @page {
              margin: 0.3in !important;
              size: A4 !important;
            }

            /* Ensure table fits on page */
            table {
              width: 100% !important;
              table-layout: fixed !important;
            }

            th,
            td {
              padding: 2px !important;
              font-size: 8px !important;
              word-wrap: break-word !important;
            }

            /* Company details section */
            .grid {
              display: grid !important;
            }

            /* Financial summary horizontal layout */
            .grid-cols-7 {
              grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
            }

            .grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            }

            .grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            /* Hide screen elements */
            .print\\:hidden {
              display: none !important;
            }

            /* Show all content on print */
            .overflow-x-auto {
              overflow: visible !important;
            }

            /* Ensure cards don't break */
            .card {
              break-inside: avoid !important;
            }

            /* Compact spacing */
            .space-y-4 > * + * {
              margin-top: 8px !important;
            }

            .space-y-2 > * + * {
              margin-top: 4px !important;
            }

            .space-y-1 > * + * {
              margin-top: 2px !important;
            }

            .gap-3 {
              gap: 6px !important;
            }

            .gap-1 {
              gap: 2px !important;
            }

            /* Text sizes */
            .print\\:text-xs {
              font-size: 8px !important;
              line-height: 10px !important;
            }

            .print\\:text-sm {
              font-size: 10px !important;
              line-height: 12px !important;
            }

            .print\\:text-2xl {
              font-size: 16px !important;
              line-height: 18px !important;
            }

            /* Padding adjustments */
            .print\\:p-1 {
              padding: 2px !important;
            }

            .print\\:p-4 {
              padding: 8px !important;
            }

            .print\\:pb-2 {
              padding-bottom: 4px !important;
            }

            .print\\:pt-0 {
              padding-top: 0 !important;
            }

            .print\\:mb-2 {
              margin-bottom: 4px !important;
            }

            /* Colors */
            .print\\:text-black {
              color: black !important;
            }

            .print\\:border-black {
              border-color: black !important;
            }

            /* Icon sizes */
            .print\\:w-3 {
              width: 10px !important;
            }

            .print\\:h-3 {
              height: 10px !important;
            }

            .print\\:w-4 {
              width: 12px !important;
            }

            .print\\:h-4 {
              height: 12px !important;
            }

            /* Overflow handling */
            .print\\:overflow-visible {
              overflow: visible !important;
            }

            /* Grid layout fixes */
            .print\\:grid-cols-7 {
              display: grid !important;
              grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
            }

            .print\\:grid-cols-3 {
              display: grid !important;
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            }

            .print\\:grid-cols-2 {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            /* Spacing adjustments */
            .print\\:gap-1 {
              gap: 2px !important;
            }

            .print\\:gap-3 {
              gap: 6px !important;
            }

            .print\\:space-y-1 > * + * {
              margin-top: 2px !important;
            }

            .print\\:space-y-4 > * + * {
              margin-top: 8px !important;
            }

            /* Ensure table headers and borders are visible */
            thead th {
              background-color: #f5f5f5 !important;
              border: 1px solid black !important;
            }

            tbody td {
              border: 1px solid black !important;
            }

            tfoot td {
              border: 1px solid black !important;
              background-color: #f9f9f9 !important;
            }

            /* Prevent page breaks in tables */
            tr {
              break-inside: avoid !important;
            }

            /* Hide browser elements */
            header,
            nav,
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
    </>
  );
}
