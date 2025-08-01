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
  Hash,
  Mail,
  Users,
  CalendarDays,
  MapIcon,
  Package,
} from "lucide-react";
import { useActiveCompanyId, useActiveUser } from "@/hooks/UseActive";
import { useCompany } from "@/hooks/useCompany";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PrintInvoicePage() {
  const { id } = useParams();
  const companyId = useActiveCompanyId();
  const user = useActiveUser();
  const { data: invoice, isLoading, error } = useInvoiceById(id as string);
  const { data: company } = useCompany(companyId);
  const [isPrinting, setIsPrinting] = useState(false);

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

      <div className="max-w-5xl space-y-2 mx-auto p-6 print:p-0 print:max-w-none bg-background">
        {/* Enhanced Company Details Section */}
        <Card className="print:shadow-none print:border-2 print:border-black py-2">
          <CardHeader className="flex items-center justify-center">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <div>
                  <CardTitle className="text-4xl font-bold text-primary print:text-black">
                    {company?.name || "Company Name"}
                  </CardTitle>
                  {company?.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="text-lg">{company.email}</span>
                    </div>
                  )}
                </div>

                {/* Company Timeline */}
                {company && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Since: {new Date(company.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Company Details Sections */}
          {(company?.branches?.length ||
            company?.financialYears?.length ||
            company?.users?.length) && (
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Branches Section */}
                {company?.branches && company.branches.length > 0 && (
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <MapIcon className="w-4 h-4" />
                      Branches ({company.branches.length})
                    </h4>
                    <div className="space-y-2">
                      {company.branches.slice(0, 3).map((branch) => (
                        <div key={branch.id} className="p-2 border rounded-md">
                          <p className="font-medium text-sm">{branch.name}</p>
                          {branch.address && (
                            <p className="text-xs text-muted-foreground">{branch.address}</p>
                          )}
                        </div>
                      ))}
                      {company.branches.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{company.branches.length - 3} more branches
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial Years Section */}
                {company?.financialYears && company.financialYears.length > 0 && (
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <CalendarDays className="w-4 h-4" />
                      Financial Years ({company.financialYears.length})
                    </h4>
                    <div className="space-y-2">
                      {company.financialYears.slice(0, 3).map((fy) => (
                        <div key={fy.id} className="p-2 border rounded-md">
                          <div className="text-xs text-muted-foreground">
                            {new Date(fy.startDate).toLocaleDateString()} -{" "}
                            {new Date(fy.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                      {company.financialYears.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{company.financialYears.length - 3} more years
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Users Section */}
                {company?.users && company.users.length > 0 && (
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4" />
                      Team Members ({company.users.length})
                    </h4>
                    <div className="space-y-2">
                      {company.users.slice(0, 3).map((user) => (
                        <div key={user.id} className="p-2 border rounded-md">
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          {user.role && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {user.role}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {company.users.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{company.users.length - 3} more users
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {/* Party Information */}
          <Card className="print:shadow-none print:border print:border-black py-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                {invoice.type === "SALE" || invoice.type === "SALE_RETURN"
                  ? "Customer Information"
                  : "Supplier Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <h3 className="font-semibold text-lg">{invoice.ledger.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Code: <span className="font-mono">{invoice.ledger.code}</span>
                </p>
              </div>

              {invoice.ledger.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span>{invoice.ledger.address}</span>
                </div>
              )}

              <div className="space-y-1">
                {invoice.ledger.phone1 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{invoice.ledger.phone1}</span>
                  </div>
                )}
                {invoice.ledger.phone2 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{invoice.ledger.phone2}</span>
                  </div>
                )}
              </div>

              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Balance</span>
                <Badge variant="outline" className="font-mono">
                  {formatCurrency(invoice.ledger.balance)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Information */}
          <Card className="print:shadow-none print:border print:border-black py-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center flex-col">
                  <span className="text-muted-foreground">Type</span>
                  <p>{getInvoiceTypeDisplay(invoice.type)}</p>
                </div>

                {invoice.invoiceLedger && (
                  <div className="flex items-center flex-col">
                    <span className="text-muted-foreground text-sm">Invoice Ledger</span>
                    <p>{invoice.invoiceLedger.name}</p>
                  </div>
                )}

                <div className="flex items-center flex-col">
                  <span className="text-muted-foreground text-sm">Invoice No.</span>
                  <p>{invoice.invoiceNumber}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center flex-col">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created Date
                  </span>
                  <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center flex-col">
                  <span className="text-muted-foreground text-sm flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Created By
                  </span>
                  <p className="font-medium">{invoice.createdByUser?.name || invoice.createdBy}</p>
                </div>
                <div className="flex items-center flex-col">
                  <span className="text-muted-foreground text-sm flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Printed By
                  </span>
                  <p className="font-medium">{user?.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items Section */}
        {invoiceItems && invoiceItems.length > 0 && (
          <Card className="print:shadow-none print:border print:border-black py-3 gap-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                Invoice Items ({invoiceItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center border-r">Sr No.</TableHead>
                      <TableHead className="text-center border-r">Product</TableHead>
                      <TableHead className="text-center border-r">Unit</TableHead>
                      <TableHead className="text-center border-r">Brand</TableHead>
                      <TableHead className="text-center border-r">Category</TableHead>
                      <TableHead className="text-center border-r">Qty</TableHead>
                      <TableHead className="text-center border-r">Thaan</TableHead>
                      <TableHead className="text-center border-r">Rate</TableHead>
                      <TableHead className="text-center border-r">Discount</TableHead>
                      <TableHead className="text-center border-r">Tax</TableHead>
                      <TableHead className="text-center">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((item, index) => (
                      <TableRow key={item.id} className="border-b hover:bg-muted/50">
                        <TableCell className="text-center border-r">{index + 1}</TableCell>
                        <TableCell className="text-center border-r">{item.product.name}</TableCell>
                        <TableCell className="text-center border-r">
                          {item.product.unit.name}
                        </TableCell>
                        <TableCell className="text-center border-r">
                          {item.product.brand.name}
                        </TableCell>
                        <TableCell className="text-center border-r">
                          {item.product.category.name}
                        </TableCell>
                        <TableCell className="text-center border-r">
                          {item.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center border-r">
                          {item.thaan.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center border-r">
                          {formatCurrency(item.rate)}
                        </TableCell>
                        <TableCell className="text-center border-r">
                          {formatCurrency(item.discount)}
                        </TableCell>
                        <TableCell className="text-center border-r">
                          {formatCurrency(item.taxAmount)}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="font-bold">
                      <TableCell colSpan={5} className="text-left px-5">
                        Total:
                      </TableCell>
                      <TableCell className="text-md text-center">
                        {invoiceItems.reduce((sum, item) => sum + item.quantity, 0)}
                      </TableCell>
                      <TableCell className="text-md text-center">
                        {invoiceItems.reduce((sum, item) => sum + item.thaan, 0)}
                      </TableCell>
                      <TableCell className="text-md text-center">
                        {formatCurrency(
                          invoiceItems.reduce((sum, item) => sum + item.rate, 0) /
                            invoiceItems.length,
                        )}
                      </TableCell>
                      <TableCell className="text-md text-center">
                        {formatCurrency(invoiceItems.reduce((sum, item) => sum + item.discount, 0))}
                      </TableCell>
                      <TableCell className="text-md text-center">
                        {formatCurrency(
                          invoiceItems.reduce((sum, item) => sum + item.taxAmount, 0),
                        )}
                      </TableCell>
                      <TableCell className="text-md text-center">
                        {formatCurrency(invoiceItems.reduce((sum, item) => sum + item.amount, 0))}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Summary */}
        <Card className="print:shadow-none print:border print:border-black py-2">
          <CardHeader>
            <CardTitle className="text-center">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">Total Amount</div>
                <div className="text-2xl font-bold text-primary print:text-black">
                  {formatCurrency(invoice.totalAmount)}
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">Discount</div>
                <div className="text-2xl font-bold text-destructive print:text-black">
                  -{formatCurrency(invoice.discount)}
                </div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">Cartage</div>
                <div className="text-2xl font-bold text-green-600 print:text-black">
                  +{formatCurrency(invoice.cartage)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Footer */}
        <Card className="print:shadow-none print:border-t print:border-black print:rounded-none py-2">
          <CardContent className="text-center p-0">
            <p className="text-muted-foreground">Thank you for your business!</p>
            <p className="text-sm text-muted-foreground">This is a computer-generated invoice.</p>
            <p className="text-xs text-muted-foreground">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Print Styles */}
      <style jsx>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body {
            font-size: 12px !important;
            line-height: 1.4 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          @page {
            margin: 0.5in !important;
            size: A4 !important;

            /* Hide browser header/footer */
            @top-left {
              content: "";
            }
            @top-right {
              content: "";
            }
            @top-center {
              content: "";
            }
            @bottom-left {
              content: "";
            }
            @bottom-right {
              content: "";
            }
            @bottom-center {
              content: "";
            }
          }

          /* Hide all browser UI elements */
          body::before,
          body::after {
            display: none !important;
          }

          /* Ensure clean page breaks */
          .page-break {
            page-break-before: always;
          }

          /* Hide any potential browser additions */
          header,
          nav,
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
