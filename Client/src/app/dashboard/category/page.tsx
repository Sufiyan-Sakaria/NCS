"use client";

import { NextPage } from "next";
import { useState } from "react";
import { toast } from "sonner";
import { useActiveBranchId } from "@/hooks/UseActive";
import { useCategories, useDeleteCategory } from "@/hooks/UseCategory";
import { AddCategoryDialog } from "@/components/AddCategoryDailog";
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

const Page: NextPage = () => {
  const branchId = useActiveBranchId();
  const { data: categories, isLoading, error, refetch } = useCategories(branchId!);
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory(branchId!);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCategoryData, setEditCategoryData] = useState<{
    id: string;
    name: string;
    abb: string;
  } | null>(null);

  const handleDelete = (id: string) => {
    deleteCategory(
      { id },
      {
        onSuccess: () => {
          toast.success("Category deleted successfully");
          setDeleteId(null);
        },
        onError: () => toast.error("Failed to delete category"),
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
    return <main className="p-6 text-destructive">Failed to load categories.</main>;
  }

  if (!categories || categories.length === 0) {
    return (
      <main className="p-6 text-center space-y-4">
        <p className="text-muted-foreground">No categories found.</p>
        <AddCategoryDialog
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
        <h1 className="text-2xl font-semibold">Categories</h1>
        <AddCategoryDialog
          branchId={branchId!}
          trigger={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
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
              <TableHead className="border-r">Abbreviation</TableHead>
              <TableHead className="border-r">Status</TableHead>
              <TableHead className="border-r">Created By</TableHead>
              <TableHead className="border-r">Created At</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell className="text-center border-r">{index + 1}</TableCell>
                <TableCell className="border-r font-medium">{category.name}</TableCell>
                <TableCell className="border-r">{category.abb}</TableCell>
                <TableCell className="border-r">{category.isActive ? "Active" : "Inactive"}</TableCell>
                <TableCell className="border-r">{category.createdByUser?.name}</TableCell>
                <TableCell className="border-r">
                  {new Date(category.createdAt).toLocaleString(undefined, {
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
                          setEditCategoryData({
                            id: category.id,
                            name: category.name,
                            abb: category.abb,
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
                          setDeleteId(category.id);
                          setDeleteName(category.name);
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
      <AddCategoryDialog
        mode="edit"
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        branchId={branchId!}
        initialData={editCategoryData}
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
