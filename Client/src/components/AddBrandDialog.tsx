"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { useActiveBranchId } from "@/hooks/UseActiveBranch";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useCreateBrand } from "@/hooks/UseBrand";

interface AddBrandDialogProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function AddBrandDialog({ trigger, onSuccess }: AddBrandDialogProps) {
  const branchId = useActiveBranchId();
  const userId = useSelector((state: RootState) => state.auth.user?.id);

  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState({ name: "", abb: "" });

  const { mutate, isPending } = useCreateBrand(branchId || "");

  const handleAdd = () => {
    if (!brand.name.trim() || !brand.abb.trim()) {
      toast.error("Please fill in both name and abbreviation.");
      return;
    }

    if (!branchId || !userId) {
      toast.error("Missing branch or user info.");
      return;
    }

    mutate(
      {
        name: brand.name.trim(),
        abb: brand.abb.trim(),
        branchId,
      },
      {
        onSuccess: () => {
          toast.success("Brand added successfully");
          setBrand({ name: "", abb: "" });
          setOpen(false);
          onSuccess?.();
        },
        onError: () => {
          toast.error("Failed to add brand");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Brand</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={brand.name}
              onChange={(e) => setBrand((b) => ({ ...b, name: e.target.value }))}
              className="col-span-3"
              placeholder="Brand name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="abb" className="text-right">
              Abbreviation
            </Label>
            <Input
              id="abb"
              value={brand.abb}
              onChange={(e) => {
                const upper = e.target.value.toUpperCase().slice(0, 3);
                setBrand({ ...brand, abb: upper });
              }}
              className="col-span-3"
              placeholder="e.g., NIKE"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={isPending}>
            {isPending ? "Adding..." : "Add Brand"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
