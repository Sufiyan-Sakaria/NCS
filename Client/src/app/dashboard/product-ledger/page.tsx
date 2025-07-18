"use client";

import { NextPage } from "next";
import { useState } from "react";
import { useActiveBranchId } from "@/hooks/UseActiveBranch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Package,
} from "lucide-react";
import { useProductEntries } from "@/hooks/UseProductEntries";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProductSelectWithDialog } from "@/components/ProductSelectWithDIalog";

const ProductEntriesPage: NextPage = () => {
  const branchId = useActiveBranchId();

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [entryType, setEntryType] = useState<"all" | "IN" | "OUT">("all");

  const {
    data: entriesData,
    isLoading: entriesLoading,
    error: entriesError,
    refetch,
  } = useProductEntries({
    productId: selectedProductId,
    from: fromDate,
    to: toDate,
    type: entryType === "all" ? undefined : entryType,
  });

  const handleClearFilters = () => {
    setSelectedProductId("");
    setFromDate("");
    setToDate("");
    setEntryType("all");
  };

  const entries = entriesData?.entries || [];
  const summary = entriesData?.summary;
  const totalEntries = entriesData?.totalEntries || 0;

  return (
    <main className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Product Ledger</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="w-4 h-4" />
          Total Entries: {totalEntries}
        </div>
      </div>

      {/* Filters */}
      <Card className="pb-3 py-1">
        <CardContent className="py-2 px-3">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Product */}
            <div className="space-y-1 col-span-2">
              <label className="text-sm font-medium">Product</label>
              <ProductSelectWithDialog
                value={selectedProductId}
                onChange={(id) => setSelectedProductId(id)}
                branchId={branchId!}
              />
            </div>


            {/* From Date */}
            <div className="space-y-1">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(parseISO(fromDate), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate ? parseISO(fromDate) : undefined}
                    onSelect={(date) =>
                      setFromDate(date ? date.toISOString().split("T")[0] : "")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date */}
            <div className="space-y-1">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(parseISO(toDate), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate ? parseISO(toDate) : undefined}
                    onSelect={(date) =>
                      setToDate(date ? date.toISOString().split("T")[0] : "")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Entry Type */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Entry Type</label>
              <Select
                value={entryType}
                onValueChange={(value) => setEntryType(value as "all" | "IN" | "OUT")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Entry Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="IN">Stock In</SelectItem>
                  <SelectItem value="OUT">Stock Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 items-end">
              <Button variant="outline" onClick={handleClearFilters} className="flex-1">
                Clear
              </Button>
              <Button onClick={() => refetch()} className="flex-1">
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && selectedProductId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total In</p>
                  <p className="text-2xl font-bold text-green-600">{summary.totalIn}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Out</p>
                  <p className="text-2xl font-bold text-red-600">{summary.totalOut}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Qty</p>
                  <p className="text-2xl font-bold">
                    {summary.currentQty} {" "}
                    {entries[0]?.product?.unit.abb ?? ""}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="p-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Thaan</p>
                  <p className="text-2xl font-bold">{summary.currentThaan}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Entries Table */}
      {entriesLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : entriesError ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Failed to load entries.</p>
            <Button onClick={() => refetch()} className="mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : !selectedProductId ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Select a product to view entries</p>
            <p className="text-sm text-muted-foreground">
              Choose a product from the dropdown above to see its stock movements
            </p>
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No entries found</p>
            <p className="text-sm text-muted-foreground">
              No stock movements match your current filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="border-r text-center">Date</TableHead>
                    <TableHead className="border-r text-center">Type</TableHead>
                    <TableHead className="border-r text-center">Godown</TableHead>
                    <TableHead className="border-r text-center">Qty</TableHead>
                    <TableHead className="border-r text-center">Thaan</TableHead>
                    <TableHead className="border-r text-center">Unit</TableHead>
                    <TableHead className="border-r text-center">Running Qty</TableHead>
                    <TableHead className="border-r text-center">Running Thaan</TableHead>
                    <TableHead className="text-center">Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="border-r">
                        <div className="flex items-center justify-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(entry.date), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="border-r text-center">
                        <Badge
                          variant={entry.type === "IN" ? "default" : "destructive"}
                          className={
                            entry.type === "IN"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {entry.type === "IN" ? "Stock In" : "Stock Out"}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r font-medium text-center">
                        {entry.godown?.name || "N/A"}
                      </TableCell>
                      <TableCell className="border-r text-center font-mono">
                        {entry.qty.toLocaleString()}
                      </TableCell>
                      <TableCell className="border-r text-center font-mono">
                        {entry.thaan.toLocaleString()}
                      </TableCell>
                      <TableCell className="border-r font-medium text-center">
                        {entry.product.unit.abb || "N/A"}
                      </TableCell>
                      <TableCell className="border-r text-center font-mono font-bold">
                        {entry.runningQty.toLocaleString()}
                      </TableCell>
                      <TableCell className="border-r text-center font-mono font-bold">
                        {entry.runningThaan.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.createdByUser?.name || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
};

export default ProductEntriesPage;
