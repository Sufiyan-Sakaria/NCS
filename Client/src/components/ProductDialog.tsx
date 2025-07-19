"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useCreateProduct, useUpdateProduct } from "@/hooks/UseProduct";
import { useGodowns } from "@/hooks/UseGodown";
import { useBrands } from "@/hooks/UseBrand";
import { useCategories } from "@/hooks/UseCategory";
import { useUnits } from "@/hooks/UseUnit";
import { Product } from "@/types/Product";
import { X } from "lucide-react";
import { AxiosError } from "axios";

interface ProductDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  mode?: "add" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: Product | null;
  branchId: string;
}

export function ProductDialog({
  trigger,
  onSuccess,
  mode = "add",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialData,
  branchId,
}: ProductDialogProps) {
  const isEditMode = mode === "edit";
  const { user } = useSelector((state: RootState) => state.auth);

  const [product, setProduct] = useState({
    name: "",
    saleRate: 0,
    unitId: "",
    brandId: "",
    categoryId: "",
  });

  const [enableStock, setEnableStock] = useState(false);
  const [stockEntry, setStockEntry] = useState({ godownId: "", qty: 0, thaan: 0 });
  const [initialStocks, setInitialStocks] = useState<
    { godownId: string; qty: number; thaan: number }[]
  >([]);

  const { data: godowns } = useGodowns(branchId);
  const { data: brands } = useBrands(branchId);
  const { data: categories } = useCategories(branchId);
  const { data: units } = useUnits(branchId);

  const { mutate: createProduct, isPending: isCreating } = useCreateProduct(branchId);
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct(branchId);

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange! : setInternalOpen;

  useEffect(() => {
    if (isEditMode && initialData) {
      setProduct({
        name: initialData.name,
        saleRate: initialData.saleRate,
        unitId: initialData.unitId,
        brandId: initialData.brandId,
        categoryId: initialData.categoryId,
      });
    } else {
      setProduct({ name: "", saleRate: 0, unitId: "", brandId: "", categoryId: "" });
      setEnableStock(false);
      setInitialStocks([]);
    }
  }, [initialData, isEditMode, open]);

  const handleSubmit = () => {
    const { name, saleRate, unitId, brandId, categoryId } = product;
    if (!name.trim() || !saleRate || !unitId || !brandId || !categoryId) {
      toast.error("All fields are required.");
      return;
    }

    if (isEditMode && initialData) {
      updateProduct(
        {
          id: initialData.id,
          name: name.trim(),
          saleRate,
          unitId,
          brandId,
          categoryId,
          updatedBy: user?.id,
        },
        {
          onSuccess: () => {
            toast.success("Product updated");
            onOpenChange(false);
            onSuccess?.();
          },
          onError: () => toast.error("Failed to update product"),
        },
      );
    } else {
      if (enableStock && initialStocks.length === 0) {
        toast.error("Add at least one opening stock entry.");
        return;
      }

      createProduct(
        {
          name: name.trim(),
          saleRate,
          unitId,
          brandId,
          categoryId,
          branchId,
          createdBy: user?.id ?? "",
          initialStocks: enableStock ? initialStocks : [],
        },
        {
          onSuccess: () => {
            toast.success("Product added");
            setProduct({ name: "", saleRate: 0, unitId: "", brandId: "", categoryId: "" });
            setInitialStocks([]);
            setEnableStock(false);
            onOpenChange(false);
            onSuccess?.();
          },
          onError: (error: Error) => {
            const errorMessage = error.message || "Failed to add product";
            toast.error(errorMessage);
          },
        },
      );
    }
  };

  const addStockEntry = () => {
    const { godownId, qty, thaan } = stockEntry;
    if (!godownId || (qty <= 0 && thaan <= 0)) {
      toast.error("Valid godown, qty or thaan required.");
      return;
    }

    setInitialStocks((prev) => [...prev, stockEntry]);
    setStockEntry({ godownId: "", qty: 0, thaan: 0 });
  };

  const removeStockEntry = (index: number) => {
    setInitialStocks((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="Product name"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Sale Rate</Label>
            <Input
              type="number"
              placeholder="e.g. 500"
              value={product.saleRate}
              onChange={(e) => setProduct({ ...product, saleRate: parseFloat(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Unit</Label>
              <Select
                value={product.unitId}
                onValueChange={(value) => setProduct({ ...product, unitId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Brand</Label>
              <Select
                value={product.brandId}
                onValueChange={(value) => setProduct({ ...product, brandId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={product.categoryId}
                onValueChange={(value) => setProduct({ ...product, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isEditMode && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={enableStock}
                  onCheckedChange={(v) => setEnableStock(!!v)}
                  id="stock-enable"
                />
                <Label htmlFor="stock-enable" className="cursor-pointer">
                  Add Opening Stock
                </Label>
              </div>

              {enableStock && (
                <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                    <div className="sm:col-span-2 space-y-1">
                      <Label htmlFor="godown">Godown</Label>
                      <Select
                        value={stockEntry.godownId}
                        onValueChange={(val) => setStockEntry({ ...stockEntry, godownId: val })}
                      >
                        <SelectTrigger id="godown">
                          <SelectValue placeholder="Select godown" />
                        </SelectTrigger>
                        <SelectContent>
                          {godowns?.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="qty">Qty</Label>
                      <Input
                        id="qty"
                        type="number"
                        value={stockEntry.qty}
                        onChange={(e) =>
                          setStockEntry({ ...stockEntry, qty: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="thaan">Thaan</Label>
                      <Input
                        id="thaan"
                        type="number"
                        value={stockEntry.thaan}
                        onChange={(e) =>
                          setStockEntry({ ...stockEntry, thaan: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <Button type="button" className="w-full" onClick={addStockEntry}>
                    Add Stock Entry
                  </Button>

                  {initialStocks.length > 0 && (
                    <div className="space-y-2">
                      {initialStocks.map((entry, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-4 rounded-md bg-background border"
                        >
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">
                              {godowns?.find((g) => g.id === entry.godownId)?.name ||
                                "Unknown Godown"}
                            </span>{" "}
                            – Qty: {entry.qty}, Thaan: {entry.thaan}
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => removeStockEntry(idx)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
            {isEditMode
              ? isUpdating
                ? "Saving..."
                : "Save Changes"
              : isCreating
              ? "Adding..."
              : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
