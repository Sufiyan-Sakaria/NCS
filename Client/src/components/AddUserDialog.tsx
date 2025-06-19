"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateUser } from "@/hooks/UseUser";
import { useBranches } from "@/hooks/UseBranch";
import { RootState } from "@/redux/store";
import { useSelector } from "react-redux";
import { Role, ROLE_OPTIONS } from "@/types/Role";

interface AddUserDialogProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function AddUserDialog({ trigger, onSuccess }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: Role;
    branchIds: string[];
  }>({
    name: "",
    email: "",
    role: "viewer",
    branchIds: [],
  });

  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { data: branches = [] } = useBranches();
  const { mutate, isPending } = useCreateUser();

  const toggleBranch = (branchId: string) => {
    setUser((u) => ({
      ...u,
      branchIds: u.branchIds.includes(branchId)
        ? u.branchIds.filter((id) => id !== branchId)
        : [...u.branchIds, branchId],
    }));
  };

  const handleAdd = () => {
    if (!user.name.trim() || !user.email.trim() || !user.role.trim()) {
      toast.error("Please fill in name, email, and role.");
      return;
    }

    if (user.role !== "owner" && user.branchIds.length === 0) {
      toast.error("Please select at least one branch.");
      return;
    }

    mutate(
      {
        name: user.name.trim(),
        email: user.email.trim(),
        role: user.role,
        branchIds: user.role === "owner" ? [] : user.branchIds,
        createdBy: currentUser?.id || "",
      },
      {
        onSuccess: () => {
          toast.success("User added successfully");
          setUser({ name: "", email: "", role: "viewer", branchIds: [] });
          setOpen(false);
          onSuccess?.();
        },
        onError: (err) => {
          toast.error("Failed to add user" + err,);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={user.name}
              onChange={(e) => setUser((u) => ({ ...u, name: e.target.value }))}
              className="col-span-3"
              placeholder="User name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              onChange={(e) => setUser((u) => ({ ...u, email: e.target.value }))}
              className="col-span-3"
              placeholder="user@example.com"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select
              value={user.role}
              onValueChange={(role: Role) => setUser((u) => ({ ...u, role }))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role: Role) => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {user.role !== "owner" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Branches</Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      {user.branchIds.length > 0
                        ? branches
                          .filter((b) => user.branchIds.includes(b.id))
                          .map((b) => b.name)
                          .join(", ")
                        : "Select branches"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px]">
                    {branches.map((branch) => (
                      <div
                        key={branch.id}
                        className="flex items-center space-x-2 py-1"
                      >
                        <Checkbox
                          checked={user.branchIds.includes(branch.id)}
                          onCheckedChange={() => toggleBranch(branch.id)}
                          id={branch.id}
                        />
                        <Label htmlFor={branch.id}>{branch.name}</Label>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={isPending}>
            {isPending ? "Adding..." : "Add User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
