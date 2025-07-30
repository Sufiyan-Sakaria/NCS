"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Ledger } from "@/types/Ledger";
import { useLedgers } from "@/hooks/UseAccount";
import { LedgerSelectWithDialog } from "./LedgerSelectWithDialog";
import { voucherTypeLedgerMap } from "@/lib/LedgerMap";
import { useCreateVoucher, useVoucherNumber } from "@/hooks/UseVoucher";
import { VoucherType } from "@/types/Voucher";
import { toast } from "sonner";
import { CreateVoucherPayload } from "@/services/voucher";

const voucherTypes = ["PAYMENT", "RECEIPT", "JOURNAL", "CONTRA"];

interface VoucherEntry {
  ledger: Ledger;
  voucherLedger: Ledger;
  amount: number;
  narration?: string;
}

interface VoucherFormData {
  voucherNumber: number;
  date: Date;
  type: VoucherType;
  reference?: string;
  narration?: string;
  totalAmount: number;
}

export default function VoucherForm({ branchId }: { branchId: string }) {
  const form = useForm<VoucherFormData>({
    defaultValues: {
      voucherNumber: 0,
      date: new Date(),
      type: VoucherType.PAYMENT,
      reference: "",
      narration: "",
      totalAmount: 0,
    },
  });

  const entryForm = useForm({
    defaultValues: {
      ledgerId: "",
      voucherLedgerId: "",
      amount: 0,
      narration: "",
    },
  });

  const [entries, setEntries] = useState<VoucherEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ledgerRef = useRef<HTMLButtonElement>(null);

  const totalAmount = entries.reduce((acc, entry) => acc + entry.amount, 0);

  const watchType = form.watch("type") as keyof typeof voucherTypeLedgerMap;

  const filteredLedgerTypes = voucherTypeLedgerMap[watchType]?.ledger ?? [];
  const filteredVoucherLedgerTypes = voucherTypeLedgerMap[watchType]?.voucherLedger ?? [];

  const { data: ledgers } = useLedgers(branchId);
  const { data: voucherNumberData, isSuccess } = useVoucherNumber(branchId, watchType);
  const createVoucherMutation = useCreateVoucher(branchId);
  
  useEffect(() => {
      if (isSuccess && voucherNumberData) {
        form.setValue("voucherNumber", parseInt(voucherNumberData));
      }
    }, [voucherNumberData, isSuccess, form]);

  const onAddEntry = () => {
    ledgerRef.current?.focus();
    const values = entryForm.getValues();
    const ledger = ledgers?.find((l) => l.id === values.ledgerId);
    const voucherLedger = ledgers?.find((l) => l.id === values.voucherLedgerId);

    if (!ledger || !voucherLedger || values.amount <= 0) return;

    setEntries((prev) => [
      ...prev,
      {
        ledger,
        voucherLedger,
        amount: values.amount,
        narration: values.narration || "",
      },
    ]);
    entryForm.reset();
  };

  const handleSubmit = async (data: VoucherFormData) => {
    if (entries.length === 0) {
      alert("At least one entry is required");
      return;
    }

    setIsSubmitting(true);

    const payload: Omit<CreateVoucherPayload, "voucherNumber"> = {
      ...data,
      date: data.date.toISOString(),
      totalAmount,
      entries: entries.map((entry) => ({
        ledgerId: entry.ledger.id,
        voucherLedgerId: entry.voucherLedger.id,
        amount: entry.amount,
        narration: entry.narration,
      })),
      branchId,
    };

    try {
      console.log("Voucher payload:", payload);
      await createVoucherMutation.mutateAsync(payload);
      toast.success("Voucher created successfully!");
      form.reset();
      setEntries([]);
    } catch (error) {
      console.error("Error creating voucher:", error);
      toast.error("Failed to create voucher. See console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4 space-y-2 gap-1">
      <CardHeader>
        <CardTitle>Create New Voucher</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            onKeyDown={(e) => {
              const tag = e.target as HTMLElement;
              const isInsideEntryForm = tag.closest("#add-entry-form");
              const isTextArea = tag.tagName === "TEXTAREA";
              const isComboOrBtn =
                tag.getAttribute("role") === "combobox" || tag.getAttribute("role") === "button";

              if (e.key === "Enter") {
                if (isTextArea || isComboOrBtn) return;
                if (isInsideEntryForm) {
                  e.preventDefault();
                  onAddEntry();
                }
              }
            }}
            className="space-y-2"
          >
            {/* Header Fields */}
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="voucherNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher No.</FormLabel>
                    <FormControl>
                      <Input className="h-8" type="number" {...field} required disabled readOnly />
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
                    <Select value={field.value} onValueChange={field.onChange} disabled={entries.length > 0}>
                      <FormControl>
                        <SelectTrigger className="h-8 w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {voucherTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference</FormLabel>
                    <FormControl>
                      <Input className="h-8" placeholder="Reference..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Entries Table */}
            <div className="space-y-2">
              <div className="border rounded-md overflow-hidden">
                <div className="h-[230px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow className="bg-muted">
                        <TableHead className="text-center">Sr No.</TableHead>
                        <TableHead className="text-center">Ledger</TableHead>
                        <TableHead className="text-center">Voucher Ledger</TableHead>
                        <TableHead className="text-center">Amount</TableHead>
                        <TableHead className="text-center">Narration</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-center p-2 border-r border-b">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="text-center p-2 border-r border-b">
                            <div>
                              <div className="font-medium">{entry.ledger.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {entry.ledger.type}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center p-2 border-r border-b">
                            <div>
                              <div className="font-medium">{entry.voucherLedger.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {entry.voucherLedger.type}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center p-2 font-mono text-sm border-b border-r">
                            {entry.amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-center p-2 border-r border-b text-xs">
                            {entry.narration || "-"}
                          </TableCell>
                          <TableCell className="text-center p-2 border-b">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEntries(entries.filter((_, i) => i !== idx))}
                            >
                              <span className="sr-only">Remove Entry</span>
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

              {/* Add Entry Form */}
              <Form {...entryForm}>
                <div
                  className="grid grid-cols-[3fr_3fr_2fr_3fr_1fr] gap-2 items-end mt-2"
                  id="add-entry-form"
                >
                  <FormField
                    control={entryForm.control}
                    name="ledgerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ledger</FormLabel>
                        <FormControl>
                          <LedgerSelectWithDialog
                            value={field.value}
                            onChange={field.onChange}
                            branchId={branchId}
                            buttonClassName="w-full h-8 text-sm"
                            filterType={filteredLedgerTypes}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={entryForm.control}
                    name="voucherLedgerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voucher Ledger</FormLabel>
                        <FormControl>
                          <LedgerSelectWithDialog
                            value={field.value}
                            onChange={field.onChange}
                            branchId={branchId}
                            buttonClassName="w-full h-8 text-sm"
                            filterType={filteredVoucherLedgerTypes}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={entryForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            className="h-8"
                            value={field.value?.toLocaleString("en-PK") ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/,/g, ""); // remove commas
                              const num = Number(raw);
                              if (!isNaN(num)) {
                                field.onChange(num);
                              } else {
                                field.onChange(0);
                              }
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={entryForm.control}
                    name="narration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Narration</FormLabel>
                        <FormControl>
                          <Input className="h-8" placeholder="Optional note..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel className="opacity-0">Add</FormLabel>
                    <Button type="button" onClick={onAddEntry} className="w-full h-8">
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </Form>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="narration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Narration</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Optional voucher note"
                          className="h-16 resize-none"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2 text-right">
                <div className="flex justify-end gap-2">
                  <Label className="text-sm font-medium leading-none mt-2">Total Amount</Label>
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
                <div className="text-sm text-muted-foreground">
                  {entries.length} entr{entries.length === 1 ? "y" : "ies"} added
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="mt-4">
              {isSubmitting ? "Creating..." : "Save Voucher"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
