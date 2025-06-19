"use client";

import * as React from "react";
import {
  Building,
  ChevronsUpDown,
  Plus,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { addBranch, setSelectedBranch } from "@/redux/slices/authSlice";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useMutation } from "@tanstack/react-query";
import { createBranch, CreateBranchPayload } from "@/services/branch";
import { Branch } from "@/types/Branch";

export function BranchSwitcher() {
  const { isMobile } = useSidebar();
  const dispatch = useDispatch();

  const branches = useSelector(
    (state: RootState) => state.auth.user?.branches || []
  );
  const companyId = useSelector(
    (state: RootState) => state.auth.user?.companyId
  );
  const selectedBranchId = useSelector(
    (state: RootState) => state.auth.selectedBranchId
  );

  const [activeBranch, setActiveBranch] = React.useState<Branch | null>(null);
  const [open, setOpen] = React.useState(false);
  const [newBranch, setNewBranch] = React.useState({ name: "", address: "" });

  React.useEffect(() => {
    const defaultBranch =
      branches.find((b) => b.id === selectedBranchId) || branches[0];
    if (defaultBranch) {
      setActiveBranch(defaultBranch);
    }
  }, [branches, selectedBranchId]);

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: CreateBranchPayload) => createBranch(payload),
    onSuccess: (data) => {
      dispatch(addBranch(data));
      dispatch(setSelectedBranch(data.id));
      setActiveBranch(data);
      toast.success("Branch added successfully");
      setOpen(false);
      setNewBranch({ name: "", address: "" });
    },
    onError: () => {
      toast.error("Failed to add branch");
    },
  });

  const handleAddBranch = () => {
    if (!companyId || !newBranch.name.trim()) {
      toast.warning("Branch name is required");
      return;
    }

    mutate({
      name: newBranch.name,
      address: newBranch.address,
      companyId,
    });
  };

  if (!activeBranch) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeBranch.name}</span>
                <span className="truncate text-xs">{activeBranch.address}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Branches
            </DropdownMenuLabel>

            {branches.map((branch: Branch, index: number) => (
              <DropdownMenuItem
                key={branch.id}
                onClick={() => {
                  setActiveBranch(branch);
                  dispatch(setSelectedBranch(branch.id));
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Building />
                </div>
                {branch.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onSelect={(e) => {
                    e.preventDefault(); // prevent dropdown from closing
                    setOpen(true);
                  }}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">Add branch</div>
                </DropdownMenuItem>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Branch</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newBranch.name}
                      onChange={(e) =>
                        setNewBranch((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                      Address
                    </Label>
                    <Input
                      id="address"
                      value={newBranch.address}
                      onChange={(e) =>
                        setNewBranch((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddBranch} disabled={isPending}>
                    {isPending ? "Adding..." : "Add Branch"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
