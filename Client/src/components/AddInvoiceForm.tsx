"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { InvoiceType } from "@/types/Invoice";
import { Table, TableHead, TableHeader, TableRow, TableBody, TableCell } from "./ui/table";
import { ProductSelectWithDialog } from "./ProductSelectWithDIalog";
import { GodownSelectWithDialog } from "./GodownSelectWithDialog";
import { useProducts } from "@/hooks/UseProduct";
import { useGodowns } from "@/hooks/UseGodown";
import { Product } from "@/types/Product";
import { Godown } from "@/types/Godown";
import { Label } from "./ui/label";
import { LedgerSelectWithDialog } from "./LedgerSelectWithDialog";
import { LedgerType } from "@/types/Ledger";
import { useLedgers } from "@/hooks/UseAccount";
import { InvoiceTypeSelect } from "./InvoiceTypeSelect";

// Item Type
interface Item {
  product: Product;
  godown: Godown;
  quantity: number;
  thaan: number;
  rate: number;
}

interface InvoiceFormData {
  invoiceNumber: number;
  date: Date;
  type: InvoiceType;
  ledgerId: string;
  invoiceLedgerId: string;
  narration: string;
  discount: number;
  cartage: number;
  grandTotal: number;
}

export default function AddInvoiceForm({ branchId }: { branchId: string }) {
  const form = useForm<InvoiceFormData>({
    defaultValues: {
      invoiceNumber: 1,
      date: new Date(),
      ledgerId: "",
      invoiceLedgerId: "",
      narration: "",
      discount: 0,
      cartage: 0,
      grandTotal: 0,
    },
  });

  const itemForm = useForm({
    defaultValues: {
      productId: "",
      godownId: "",
      quantity: 0,
      thaan: 0,
      rate: 0,
      amount: 0,
    },
  });

  const [items, setItems] = useState<Item[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: products = [] } = useProducts(branchId);
  const { data: godowns = [] } = useGodowns(branchId);
  const { data: ledgers = [] } = useLedgers(branchId);

  const productRef = useRef<HTMLButtonElement>(null);

  const totalAmount = items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
  const grandTotal =
    totalAmount - Number(form.watch("discount") || 0) + Number(form.watch("cartage") || 0);

  const onAddItem = () => {
    productRef.current?.focus();
    const values = itemForm.getValues();
    const product = products.find((p) => p.id === values.productId);
    const godown = godowns.find((g) => g.id === values.godownId);
    if (!product || !godown) return;

    setItems((prev) => [
      ...prev,
      {
        product,
        godown,
        quantity: values.quantity,
        thaan: values.thaan,
        rate: values.rate,
      },
    ]);
    itemForm.reset();
  };

  const handleSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      await axios.post(`/api/invoice/${branchId}`, {
        ...data,
        date: data.date.toISOString(),
        totalAmount,
        grandTotal,
        items,
      });
      alert("Invoice created!");
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data
        ?.message;
      console.error(err);
      alert(errorMessage ?? "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4 space-y-2 gap-1">
      <CardHeader>
        <CardTitle>Create New Invoice</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice No.</FormLabel>
                    <FormControl>
                      <Input className="h-8" type="number" {...field} required />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full text-left h-8",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <InvoiceTypeSelect value={field.value} onChange={field.onChange} />
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="invoiceLedgerId"
                render={({ field }) => {
                  const invoiceType = form.watch("type");

                  // Map invoice type to ledger filter type
                  const ledgerFilterType: LedgerType[] = (() => {
                    switch (invoiceType) {
                      case "SALE":
                        return ["Sales"];
                      case "SALE_RETURN":
                        return ["SalesReturns"];
                      case "PURCHASE":
                        return ["Purchase"];
                      case "PURCHASE_RETURN":
                        return ["PurchaseReturns"];
                      default:
                        return [];
                    }
                  })();

                  return (
                    <FormItem>
                      <FormLabel>Invoice Ledger ID</FormLabel>
                      <FormControl>
                        <LedgerSelectWithDialog
                          value={field.value}
                          onChange={field.onChange}
                          branchId={branchId}
                          filterType={ledgerFilterType}
                          popoverWidth="w-96"
                        />
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <div className="border rounded-md overflow-hidden">
                <div className="h-[230px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow className="bg-muted">
                        <TableHead className="text-center">Product ID</TableHead>
                        <TableHead className="text-center">Product Name</TableHead>
                        <TableHead className="text-center">Godown</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-center">Thaan</TableHead>
                        <TableHead className="text-center">Rate</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-center p-0">{item.product.hsn}</TableCell>
                          <TableCell className="text-center p-0">{item.product.name}</TableCell>
                          <TableCell className="text-center p-0">{item.godown.name}</TableCell>
                          <TableCell className="text-center p-0">{item.quantity}</TableCell>
                          <TableCell className="text-center p-0">{item.thaan}</TableCell>
                          <TableCell className="text-center p-0">{item.rate}</TableCell>
                          <TableCell className="text-center p-0 font-mono text-sm">
                            {(item.quantity * item.rate).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center p-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setItems(items.filter((_, i) => i !== idx))}
                            >
                              <span className="sr-only">Remove Item</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Add Item Form */}
              <Form {...itemForm}>
                <div className="grid grid-cols-[4fr_3fr_1fr_1fr_1fr_1.5fr_1.5fr] gap-2 items-end mt-2">
                  <FormField
                    control={itemForm.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <FormControl className="w-full">
                          <ProductSelectWithDialog
                            value={field.value}
                            onChange={(id) => {
                              field.onChange(id);
                              const selected = products.find((p) => p.id === id);
                              itemForm.setValue("rate", selected?.saleRate ?? 0);
                            }}
                            branchId={branchId}
                            ref={productRef}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={itemForm.control}
                    name="godownId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Godown</FormLabel>
                        <FormControl className="w-full">
                          <GodownSelectWithDialog
                            value={field.value}
                            onChange={field.onChange}
                            branchId={branchId}
                            showAllOption={false}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={itemForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qty</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="h-8"
                            min={0}
                            {...field}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val >= 0) {
                                field.onChange(val);
                              } else {
                                field.onChange(0); // Reset to 0 if negative
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={itemForm.control}
                    name="thaan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thaan</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="h-8"
                            min={0}
                            {...field}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val >= 0) {
                                field.onChange(val);
                              } else {
                                field.onChange(0); // Reset to 0 if negative
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={itemForm.control}
                    name="rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="h-8"
                            min={0}
                            {...field}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val >= 0) {
                                field.onChange(val);
                              } else {
                                field.onChange(0); // Reset to 0 if negative
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label className="text-sm font-medium leading-none">Amount</Label>
                    <Input
                      type="text"
                      readOnly
                      value={(
                        (itemForm.watch("quantity") || 0) * (itemForm.watch("rate") || 0)
                      ).toLocaleString()}
                      className="h-8"
                    />
                  </div>

                  <div>
                    <FormLabel className="opacity-0">Add</FormLabel>
                    <Button type="button" onClick={onAddItem} className="w-full h-8">
                      <Plus />
                      Add Item
                    </Button>
                  </div>
                </div>
              </Form>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="col-span-2 space-y-2">
                <FormField
                  control={form.control}
                  name="ledgerId"
                  render={({ field }) => {
                    const invoiceType = form.watch("type");

                    const ledgerFilterType: LedgerType[] = (() => {
                      switch (invoiceType) {
                        case "SALE":
                        case "SALE_RETURN":
                          return ["AccountsReceivable"];
                        case "PURCHASE":
                        case "PURCHASE_RETURN":
                          return ["AccountsPayable"];
                        default:
                          return [];
                      }
                    })();

                    const selectedLedger = ledgers.find((l) => l.id === field.value);

                    return (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="whitespace-nowrap">Ledger ID</FormLabel>
                        <FormControl>
                          <LedgerSelectWithDialog
                            value={field.value}
                            onChange={field.onChange}
                            branchId={branchId}
                            filterType={ledgerFilterType}
                            buttonClassName="w-108 h-8 text-sm"
                            popoverWidth="w-96"
                          />
                        </FormControl>
                        {selectedLedger && (
                          <span className="text-muted-foreground ml-2 whitespace-nowrap">
                            Balance: {selectedLedger.balance.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            {["AccountsReceivable"].includes(selectedLedger.type)
                              ? "Dr"
                              : "Cr"}
                          </span>
                        )}
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="narration"
                  render={({ field }) => (
                    <FormItem className="flex">
                      <FormLabel>Narration</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Optional invoice note" className="w-[82%]" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2 text-right">
                <div className="flex justify-end gap-2">
                  <Label className="text-sm font-medium leading-none">Net Total</Label>
                  <Input
                    type="text"
                    className="h-8 w-42"
                    readOnly
                    value={totalAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    disabled
                  />
                </div>
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem className="flex justify-end">
                      <FormLabel>Discount</FormLabel>
                      <FormControl>
                        <Input type="number" className="h-8 w-42" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cartage"
                  render={({ field }) => (
                    <FormItem className="flex justify-end">
                      <FormLabel>Cartage</FormLabel>
                      <FormControl>
                        <Input type="number" className="h-8 w-42" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grandTotal"
                  render={() => (
                    <FormItem className="flex justify-end">
                      <FormLabel>Grand Total</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          className="h-8 w-42"
                          disabled
                          readOnly
                          value={grandTotal.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? "Creating..." : "Save Invoice"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
