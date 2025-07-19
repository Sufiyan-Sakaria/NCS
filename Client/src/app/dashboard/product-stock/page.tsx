"use client";

import { GodownSelectWithDialog } from "@/components/GodownSelectWithDialog";
import { ProductSelectWithDialog } from "@/components/ProductSelectWithDIalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useActiveBranchId } from "@/hooks/UseActiveBranch";
import { Package, Layers, Hash, Boxes } from "lucide-react";
import { NextPage } from "next";
import { useState } from "react";
import { useProductStock } from "@/hooks/UseProduct";
import type { ProductStockEntry, ProductStockSummary } from "@/services/product";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Props {}

const Page: NextPage<Props> = ({}) => {
  const branchId = useActiveBranchId();

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedGodownId, setSelectedGodownId] = useState<string>("");
  const [filters, setFilters] = useState<{ productId: string; godownId: string }>({
    productId: "",
    godownId: "",
  });

  const handleClearFilters = () => {
    setSelectedProductId("");
    setSelectedGodownId("");
    setFilters({ productId: "", godownId: "" });
  };

  const handleApplyFilters = () => {
    setFilters({ productId: selectedProductId, godownId: selectedGodownId });
  };

  const { data: stockData, isLoading } = useProductStock(
    branchId,
    filters.productId || undefined,
    filters.godownId || undefined,
  );

  // Extract entries, summary, totalEntries from API response with correct types
  const entries: ProductStockEntry[] = stockData?.entries || [];
  const summary: ProductStockSummary = stockData?.summary || {
    totalQty: 0,
    totalThaan: 0,
    currentQty: 0,
    currentThaan: 0,
  };
  const totalEntries: number = stockData?.totalEntries || 0;

  return (
    <main className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Product Stock</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="w-4 h-4" />
          Total Entries: {totalEntries}
        </div>
      </div>
      {/* Filters */}
      <Card className="pb-3 py-1">
        <CardContent className="py-2 px-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Product */}
            <div className="space-y-1 col-span-2">
              <label className="text-sm font-medium">Product</label>
              <ProductSelectWithDialog
                value={selectedProductId}
                onChange={(id) => setSelectedProductId(id)}
                branchId={branchId!}
              />
            </div>

            {/* Warehouse Select */}
            <div className="space-y-1 col-span-2">
              <label className="text-sm font-medium">Godown</label>
              <GodownSelectWithDialog
                value={selectedGodownId}
                onChange={(id) => setSelectedGodownId(id)}
                branchId={branchId!}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 items-end">
              <Button variant="outline" onClick={handleClearFilters} className="flex-1">
                Clear
              </Button>
              <Button className="flex-1" onClick={handleApplyFilters}>
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-4">
          <Card className="p-0 shadow-md border-blue-200 border-2">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Boxes className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Total Qty</div>
                <div className="text-xl font-bold text-blue-700">{summary.totalQty}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0 shadow-md border-green-200 border-2">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <Layers className="h-7 w-7 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Total Thaan</div>
                <div className="text-xl font-bold text-green-700">{summary.totalThaan}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0 shadow-md border-orange-200 border-2">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-full bg-orange-100 p-3">
                <Hash className="h-7 w-7 text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Total Brands</div>
                <div className="text-xl font-bold text-orange-700">
                  {
                    Array.from(new Set(entries.map((e) => e.product?.brand?.name).filter(Boolean)))
                      .length
                  }
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="p-0 shadow-md border-purple-200 border-2">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <Package className="h-7 w-7 text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Total Categories</div>
                <div className="text-xl font-bold text-purple-700">
                  {
                    Array.from(
                      new Set(entries.map((e) => e.product?.category?.name).filter(Boolean)),
                    ).length
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="border-r text-center">#</TableHead>
                  <TableHead className="border-r text-center">Product</TableHead>
                  <TableHead className="border-r text-center">Brand</TableHead>
                  <TableHead className="border-r text-center">Category</TableHead>
                  <TableHead className="border-r text-center">Godown</TableHead>
                  <TableHead className="border-r text-center">Qty</TableHead>
                  <TableHead className="border-r text-center">Thaan</TableHead>
                  <TableHead className="border-r text-center">Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((row: any, idx: number) => (
                    <TableRow key={row._key || idx}>
                      <TableCell className="border-r text-center">{idx + 1}</TableCell>
                      <TableCell className="border-r font-medium text-center">
                        {row.product?.name}
                      </TableCell>
                      <TableCell className="border-r text-center">
                        {row.product?.brand?.name || <Badge variant="secondary">N/A</Badge>}
                      </TableCell>
                      <TableCell className="border-r text-center">
                        {row.product?.category?.name || <Badge variant="secondary">N/A</Badge>}
                      </TableCell>
                      <TableCell className="border-r text-center">{row.godown?.name}</TableCell>
                      <TableCell className="border-r text-center font-mono">{row.qty}</TableCell>
                      <TableCell className="border-r text-center font-mono">{row.thaan}</TableCell>
                      <TableCell className="text-center font-medium">
                        {row.product?.unit?.name}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default Page;
