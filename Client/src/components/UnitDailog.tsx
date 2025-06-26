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
import { useCreateUnits, useUpdateUnits } from "@/hooks/UseUnit";

interface Unit {
  id: string;
  name: string;
  abb: string;
}

interface UnitDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  mode?: "add" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: Unit | null;
  branchId: string;
}

export function UnitDialog({
  trigger,
  onSuccess,
  mode = "add",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialData,
  branchId,
}: UnitDialogProps) {
  const isEditMode = mode === "edit";
  const { user } = useSelector((state: RootState) => state.auth);
  const [unit, setUnit] = useState({ name: "", abb: "" });

  const { mutate: createUnit, isPending: isCreating } = useCreateUnits(branchId);
  const { mutate: updateUnit, isPending: isUpdating } = useUpdateUnits(branchId);

  // Internal open state for uncontrolled mode (add)
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;

  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange! : setInternalOpen;

  useEffect(() => {
    if (isEditMode && initialData) {
      setUnit({ name: initialData.name, abb: initialData.abb });
    } else {
      setUnit({ name: "", abb: "" }); // Reset in add mode when dialog opens
    }
  }, [initialData, isEditMode, open]);

  const handleSubmit = () => {
    const { name, abb } = unit;
    if (!name.trim() || !abb.trim()) {
      toast.error("Name and Abbreviation are required.");
      return;
    }

    if (isEditMode && initialData) {
      updateUnit(
        {
          id: initialData.id,
          name: name.trim(),
          abb: abb.trim(),
          updatedBy: user?.id,
        },
        {
          onSuccess: () => {
            toast.success("Unit updated");
            onOpenChange(false);
            onSuccess?.();
          },
          onError: () => toast.error("Failed to update unit"),
        }
      );
    } else {
      createUnit(
        {
          name: name.trim(),
          abb: abb.trim(),
          branchId,
          createdBy: user?.id ?? "",
        },
        {
          onSuccess: () => {
            toast.success("Unit added");
            setUnit({ name: "", abb: "" });
            onOpenChange(false); // ✅ This works in add mode now
            onSuccess?.();
          },
          onError: () => toast.error("Failed to add unit"),
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Unit" : "Add New Unit"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Name</Label>
            <Input
              value={unit.name}
              onChange={(e) => setUnit({ ...unit, name: e.target.value })}
              className="col-span-3"
              placeholder="Unit name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Abbreviation</Label>
            <Input
              value={unit.abb}
              onChange={(e) => {
                const upper = e.target.value.toUpperCase().slice(0, 3);
                setUnit({ ...unit, abb: upper });
              }}
              className="col-span-3"
              placeholder="e.g. PCS"
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
                : "Add Unit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
