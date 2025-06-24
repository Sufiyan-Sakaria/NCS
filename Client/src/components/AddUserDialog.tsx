"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCreateUser, useUpdateUser } from "@/hooks/UseUser";
import { useBranches } from "@/hooks/UseBranch";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Role, ROLE_OPTIONS } from "@/types/Role";
import { User } from "@/types/User";
import axios from "axios";

interface AddUserDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  mode?: "add" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: User | null;
}

export function AddUserDialog({
  trigger,
  onSuccess,
  mode = "add",
  open,
  onOpenChange,
  initialData,
}: AddUserDialogProps) {
  const isEditMode = mode === "edit";
  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer" as Role,
    branchIds: [] as string[],
  });

  const { data: branches = [] } = useBranches();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();

  useEffect(() => {
    if (isEditMode && initialData) {
      setUser({
        name: initialData.name,
        email: initialData.email,
        password: "",
        role: initialData.role,
        branchIds: initialData.branches?.map(branch => branch.id) || [],
      });
    }
  }, [isEditMode, initialData]);

  const toggleBranch = (branchId: string) => {
    setUser((u) => ({
      ...u,
      branchIds: u.branchIds.includes(branchId)
        ? u.branchIds.filter((id) => id !== branchId)
        : [...u.branchIds, branchId],
    }));
  };

  const handleSubmit = () => {
    const { name, email, password, role, branchIds } = user;
    if (!name.trim() || !email.trim() || (!isEditMode && !password.trim())) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const basePayload = {
      name: name.trim(),
      email: email.trim(),
      role,
    };

    if (isEditMode && initialData) {
      updateUser(
        {
          id: initialData.id,
          ...basePayload,
          updatedBy: currentUser?.id || "",
          ...(password.trim() && { password: password.trim() }),
          ...(role !== "owner" && { branchIds }),
        },
        {
          onSuccess: () => {
            toast.success("User updated successfully");
            onOpenChange?.(false);
            onSuccess?.();
          },
          onError: (err: unknown) => {
            if (axios.isAxiosError(err)) {
              const status = err.response?.status;

              if (status === 209) {
                toast.error("Email already exists");
              } else {
                toast.error("Failed to update user.");
              }
            } else {
              toast.error("An unknown error occurred.");
            }
          }
        }
      );
    } else {
      createUser(
        {
          ...basePayload,
          password: password.trim(),
          companyId: currentUser?.companyId || "",
          createdBy: currentUser?.id || "",
          ...(role !== "owner" && { branchIds }),
        },
        {
          onSuccess: () => {
            toast.success("User added successfully");
            setUser({
              name: "",
              email: "",
              password: "",
              role: "viewer",
              branchIds: [],
            });
            onOpenChange?.(false);
            onSuccess?.();
          },
          onError: () => toast.error("Failed to add user."),
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Name</Label>
            <Input
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className="col-span-3"
              placeholder="User name"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Email</Label>
            <Input
              type="email"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className="col-span-3"
              placeholder="user@example.com"
            />
          </div>

          {!isEditMode && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Password</Label>
              <Input
                type="password"
                value={user.password}
                onChange={(e) =>
                  setUser({ ...user, password: e.target.value })
                }
                className="col-span-3"
                placeholder="Enter password"
              />
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Role</Label>
            <Select
              value={user.role}
              onValueChange={(value: Role) =>
                setUser((u) => ({ ...u, role: value }))
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isEditMode && user.role !== "owner" && (
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
                        />
                        <Label>{branch.name}</Label>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
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
                : "Add User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
