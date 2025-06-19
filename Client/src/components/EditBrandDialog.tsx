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
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { updateBrand } from "@/services/brand";
import { toast } from "sonner";

interface EditBrandDialogProps {
  trigger: React.ReactNode;
  brand: {
    id: string;
    name: string;
    abb: string;
  };
  onSuccess?: () => void;
}

export function EditBrandDialog({ trigger, brand, onSuccess }: EditBrandDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", abb: "" });

  useEffect(() => {
    if (open) {
      setFormData({ name: brand.name, abb: brand.abb });
    }
  }, [open, brand]);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      updateBrand({
        id: brand.id,
        name: formData.name,
        abb: formData.abb,
      }),
    onSuccess: () => {
      toast.success("Brand updated successfully");
      onSuccess?.();
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to update brand");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Brand</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="abb" className="text-right">Abbreviation</Label>
            <Input
              id="abb"
              value={formData.abb}
              onChange={(e) => setFormData((prev) => ({ ...prev, abb: e.target.value }))}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => mutate()} disabled={isPending}>
            {isPending ? "Updating..." : "Update Brand"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
