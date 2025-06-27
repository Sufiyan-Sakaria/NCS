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
import { useCreateGodown, useUpdateGodown } from "@/hooks/UseGodown";

interface Godown {
  id: string;
  name: string;
  address: string;
}

interface GodownDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  mode?: "add" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: Godown | null;
  branchId: string;
}

export function GodownDialog({
  trigger,
  onSuccess,
  mode = "add",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialData,
  branchId,
}: GodownDialogProps) {
  const isEditMode = mode === "edit";
  const { user } = useSelector((state: RootState) => state.auth);
  const [godown, setGodown] = useState({ name: "", address: "" });

  const { mutate: createGodown, isPending: isCreating } = useCreateGodown(branchId);
  const { mutate: updateGodown, isPending: isUpdating } = useUpdateGodown(branchId);

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;

  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange! : setInternalOpen;

  useEffect(() => {
    if (isEditMode && initialData) {
      setGodown({ name: initialData.name, address: initialData.address });
    } else {
      setGodown({ name: "", address: "" });
    }
  }, [initialData, isEditMode, open]);

  const handleSubmit = () => {
    const { name, address } = godown;
    if (!name.trim() || !address.trim()) {
      toast.error("Name and Address are required.");
      return;
    }

    if (isEditMode && initialData) {
      updateGodown(
        {
          id: initialData.id,
          name: name.trim(),
          address: address.trim(),
          updatedBy: user?.id,
        },
        {
          onSuccess: () => {
            toast.success("Godown updated");
            onOpenChange(false);
            onSuccess?.();
          },
          onError: () => toast.error("Failed to update godown"),
        }
      );
    } else {
      createGodown(
        {
          name: name.trim(),
          address: address.trim(),
          branchId,
          createdBy: user?.id ?? "",
        },
        {
          onSuccess: () => {
            toast.success("Godown added");
            setGodown({ name: "", address: "" });
            onOpenChange(false);
            onSuccess?.();
          },
          onError: (err) => toast.error("Failed to add godown" + err),
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Godown" : "Add New Godown"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Name</Label>
            <Input
              value={godown.name}
              onChange={(e) => setGodown({ ...godown, name: e.target.value })}
              className="col-span-3"
              placeholder="Godown name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Address</Label>
            <Input
              value={godown.address}
              onChange={(e) => setGodown({ ...godown, address: e.target.value })}
              className="col-span-3"
              placeholder="e.g. Building #12, Street, City"
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
                : "Add Godown"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
