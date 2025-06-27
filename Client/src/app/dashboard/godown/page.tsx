"use client";

import { NextPage } from "next";
import { useState } from "react";
import { toast } from "sonner";
import { useActiveBranchId } from "@/hooks/UseActiveBranch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Pencil, Trash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGodowns, useDeleteGodown } from "@/hooks/UseGodown";
import { GodownDialog } from "@/components/GodownDialog";

const Page: NextPage = () => {
  const branchId = useActiveBranchId();
  const { data: godowns, isLoading, error, refetch } = useGodowns(branchId!);
  const { mutate: deleteGodown, isPending: isDeleting } = useDeleteGodown(branchId!);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editGodownData, setEditGodownData] = useState<{
    id: string;
    name: string;
    address: string;
  } | null>(null);

  const handleDelete = (id: string) => {
    deleteGodown(
      { id },
      {
        onSuccess: () => {
          toast.success("Godown deleted successfully");
          setDeleteId(null);
        },
        onError: () => toast.error("Failed to delete godown"),
      }
    );
  };

  if (isLoading) {
    return (
      <main className="p-6 space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </main>
    );
  }

  if (error) {
    return <main className="p-6 text-destructive">Failed to load godowns.</main>;
  }

  if (!godowns || godowns.length === 0) {
    return (
      <main className="p-6 text-center space-y-4">
        <p className="text-muted-foreground">No godowns found.</p>
        <GodownDialog
          branchId={branchId!}
          trigger={<p className="hover:underline cursor-pointer text-blue-600">Add One</p>}
          onSuccess={() => refetch()}
        />
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Godowns</h1>
        <GodownDialog
          branchId={branchId!}
          trigger={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Godown
            </Button>
          }
          onSuccess={() => refetch()}
        />
      </div>

      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-center w-14 border-r">#</TableHead>
              <TableHead className="border-r">Name</TableHead>
              <TableHead className="border-r">Address</TableHead>
              <TableHead className="border-r">Status</TableHead>
              <TableHead className="border-r">Created By</TableHead>
              <TableHead className="border-r">Created At</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {godowns.map((godown, index) => (
              <TableRow key={godown.id}>
                <TableCell className="text-center border-r">{index + 1}</TableCell>
                <TableCell className="border-r font-medium">{godown.name}</TableCell>
                <TableCell className="border-r">{godown.address}</TableCell>
                <TableCell className="border-r">{godown.isActive ? "Active" : "Inactive"}</TableCell>
                <TableCell className="border-r">{godown.createdByUser?.name}</TableCell>
                <TableCell className="border-r">
                  {new Date(godown.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none hover:bg-muted p-1 rounded-md">
                      <MoreVertical className="w-5 h-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          setEditGodownData({
                            id: godown.id,
                            name: godown.name,
                            address: godown.address,
                          });
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:bg-red-600"
                        onClick={() => {
                          setDeleteId(godown.id);
                          setDeleteName(godown.name);
                        }}
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <GodownDialog
        mode="edit"
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        branchId={branchId!}
        initialData={editGodownData}
        onSuccess={() => {
          setEditDialogOpen(false);
          refetch();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteId!)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default Page;
