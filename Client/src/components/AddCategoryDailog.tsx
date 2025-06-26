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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useCreateCategory, useUpdateCategory } from "@/hooks/UseCategory";

interface Category {
  id: string;
  name: string;
  abb: string;
}

interface AddCategoryDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  mode?: "add" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: Category | null;
  branchId: string;
}

export function AddCategoryDialog({
  trigger,
  onSuccess,
  mode = "add",
  open,
  onOpenChange,
  initialData,
  branchId,
}: AddCategoryDialogProps) {
  const isEditMode = mode === "edit";
  const { user } = useSelector((state: RootState) => state.auth);
  const [category, setCategory] = useState({ name: "", abb: "" });

  const { mutate: createCategory, isPending: isCreating } = useCreateCategory(branchId);
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory(branchId);

  useEffect(() => {
    if (isEditMode && initialData) {
      setCategory({ name: initialData.name, abb: initialData.abb });
    }
  }, [initialData, isEditMode]);

  const handleSubmit = () => {
    const { name, abb } = category;
    if (!name.trim() || !abb.trim()) {
      toast.error("Name and Abbreviation are required.");
      return;
    }

    if (isEditMode && initialData) {
      updateCategory(
        {
          id: initialData.id,
          name: name.trim(),
          abb: abb.trim(),
          updatedBy: user?.id,
        },
        {
          onSuccess: () => {
            toast.success("Category updated");
            onOpenChange?.(false);
            onSuccess?.();
          },
          onError: () => toast.error("Failed to update category"),
        }
      );
    } else {
      createCategory(
        {
          name: name.trim(),
          abb: abb.trim(),
          branchId,
          createdBy: user?.id ?? "",
        },
        {
          onSuccess: () => {
            toast.success("Category added");
            setCategory({ name: "", abb: "" });
            onOpenChange?.(false);
            onSuccess?.();
          },
          onError: () => toast.error("Failed to add category"),
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Category" : "Add New Category"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Name</Label>
            <Input
              value={category.name}
              onChange={(e) => setCategory({ ...category, name: e.target.value })}
              className="col-span-3"
              placeholder="Category name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Abbreviation</Label>
            <Input
              value={category.abb}
              onChange={(e) => {
                const upper = e.target.value.toUpperCase().slice(0, 3);
                setCategory({ ...category, abb: upper });
              }}
              className="col-span-3"
              placeholder="e.g. CTN"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
            {isEditMode
              ? isUpdating
                ? "Saving..."
                : "Save Changes"
              : isCreating
                ? "Adding..."
                : "Add Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
