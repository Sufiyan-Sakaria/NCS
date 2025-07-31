"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useInvoiceById } from "@/hooks/useInvoice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, Phone, MapPin, Calendar, User, Hash, Building2 } from "lucide-react";

export default function PrintInvoicePage() {
  const { id } = useParams();
  const { data: invoice, isLoading, error } = useInvoiceById(id as string);
  const [isPrinting, setIsPrinting] = useState(false);

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
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getInvoiceTypeDisplay = (type: string) => {
    switch (type) {
      case "SALE": return "Sales Invoice";
      case "PURCHASE": return "Purchase Invoice";
      case "SALE_RETURN": return "Sales Return";
      case "PURCHASE_RETURN": return "Purchase Return";
      default: return type;
    }
  };

  const getInvoiceTypeVariant = (type: string) => {
    switch (type) {
      case "SALE": return "default";
      case "PURCHASE": return "secondary";
      case "SALE_RETURN": return "destructive";
      case "PURCHASE_RETURN": return "outline";
      default: return "default";
    }
  };

  return (
    <>
      {/* Screen-only print button */}
      <div className="print:hidden fixed top-4 right-4 z-10">
        <Button
          onClick={() => window.print()}
          className="shadow-lg"
          size="sm"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Again
        </Button>
      </div>

      <div className="max-w-5xl mx-auto p-6 print:p-0 print:max-w-none bg-background">
        {/* Header Section */}
        <Card className="mb-6 print:shadow-none print:border-2 print:border-black">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold">
                  {getInvoiceTypeDisplay(invoice.type)}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant={getInvoiceTypeVariant(invoice.type)} className="text-sm">
                    {invoice.type}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Hash className="w-4 h-4" />
                    <span className="font-mono text-lg">{invoice.invoiceNumber}</span>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                  <Calendar className="w-4 h-4" />
                  Date
                </div>
                <div className="text-lg font-semibold">
                  {new Date(invoice.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Party Information */}
          <Card className="print:shadow-none print:border print:border-black">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {invoice.type === 'SALE' || invoice.type === 'SALE_RETURN' ? 'Bill To' : 'Bill From'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
          <Card className="print:shadow-none print:border print:border-black">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-medium">{getInvoiceTypeDisplay(invoice.type)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Book ID</span>
                  <p className="font-mono text-xs">{invoice.invoiceBookId}</p>
                </div>
              </div>
              
              {invoice.invoiceLedger && (
                <div>
                  <span className="text-muted-foreground text-sm">Invoice Ledger</span>
                  <p className="font-medium">{invoice.invoiceLedger.name}</p>
                </div>
              )}
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Created
                  </span>
                  <p className="font-medium">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {invoice.updatedAt !== invoice.createdAt && (
                  <div>
                    <span className="text-muted-foreground">Updated</span>
                    <p className="font-medium">
                      {new Date(invoice.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Created By
                </span>
                <p className="font-medium">{invoice.createdByUser?.name || invoice.createdBy}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <Card className="mb-6 print:shadow-none print:border print:border-black">
          <CardHeader>
            <CardTitle className="text-center">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Grand Total Section */}
        <div className="flex justify-end mb-6">
          <Card className="w-full max-w-sm print:shadow-none print:border-2 print:border-black">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-destructive print:text-black">
                      -{formatCurrency(invoice.discount)}
                    </span>
                  </div>
                )}
                {invoice.cartage > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Cartage</span>
                    <span className="font-medium text-green-600 print:text-black">
                      +{formatCurrency(invoice.cartage)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between py-2">
                  <span className="text-xl font-bold">Grand Total</span>
                  <span className="text-xl font-bold text-primary print:text-black">
                    {formatCurrency(invoice.grandTotal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Narration Section */}
        {invoice.narration && (
          <Card className="mb-6 print:shadow-none print:border print:border-black">
            <CardHeader>
              <CardTitle className="text-base">Narration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{invoice.narration}</p>
            </CardContent>
          </Card>
        )}

        {/* Status and Meta Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="print:shadow-none print:border print:border-black">
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={invoice.isActive ? "default" : "destructive"}>
                  {invoice.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card className="print:shadow-none print:border print:border-black">
            <CardHeader>
              <CardTitle className="text-base">Document References</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Invoice ID:</span>
                <span className="font-mono ml-2">{invoice.id}</span>
              </div>
              <div>
                <span className="font-medium">Ledger ID:</span>
                <span className="font-mono ml-2">{invoice.ledgerId}</span>
              </div>
              {invoice.invoiceLedgerId && (
                <div>
                  <span className="font-medium">Invoice Ledger ID:</span>
                  <span className="font-mono ml-2">{invoice.invoiceLedgerId}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <Card className="print:shadow-none print:border-t print:border-black print:rounded-none">
          <CardContent className="text-center py-6">
            <p className="text-muted-foreground">Thank you for your business!</p>
            <p className="text-sm text-muted-foreground mt-1">This is a computer-generated invoice.</p>
            <p className="text-xs text-muted-foreground mt-2">
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
            @top-left { content: ""; }
            @top-right { content: ""; }
            @top-center { content: ""; }
            @bottom-left { content: ""; }
            @bottom-right { content: ""; }
            @bottom-center { content: ""; }
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
          header, nav, .no-print {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}