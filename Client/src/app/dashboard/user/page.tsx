"use client";

import { NextPage } from "next";
import { useUserQuery } from "@/hooks/UseUser";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@/types/User";

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

import { MoreVertical, Pencil, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Page: NextPage = () => {
  const { data: users, isLoading, error } = useUserQuery();

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState<string>("");

  const handleEdit = (userId: string) => {
    console.log("Edit user:", userId);
  };

  const handleDelete = (userId: string) => {

    toast.success("User Deleted Successfully of Id : " + userId)

    setDeleteUserId(null); // Close dialog
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
    return (
      <main className="p-6">
        <p className="text-destructive">Failed to load users.</p>
      </main>
    );
  }

  if (!users || users.length === 0) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground">No users found.</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Users</h1>
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="border-r text-center">Sr No.</TableHead>
              <TableHead className="border-r">Name</TableHead>
              <TableHead className="border-r">Email</TableHead>
              <TableHead className="border-r">Role</TableHead>
              <TableHead className="border-r">CreatedAt</TableHead>
              <TableHead className="border-r">UpdatedAt</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: User, index: number) => (
              <TableRow
                key={user.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell className="border-r font-medium text-center">
                  {index + 1}
                </TableCell>
                <TableCell className="border-r font-medium">
                  {user.name}
                </TableCell>
                <TableCell className="border-r">{user.email}</TableCell>
                <TableCell className="border-r">
                  {user.role.charAt(0).toUpperCase() +
                    user.role.slice(1).toLowerCase()}
                </TableCell>
                <TableCell className="border-r">
                  {new Date(user.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </TableCell>
                <TableCell className="border-r">
                  {new Date(user.updatedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none hover:bg-muted p-1 rounded-md cursor-pointer">
                      <MoreVertical className="w-5 h-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEdit(user.id)}
                        className="cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:bg-red-600"
                        onClick={() => {
                          setDeleteUserId(user.id);
                          setDeleteUserName(user.name);
                        }}
                      >
                        <Trash className="w-4 h-4 mr-2 focus:text-white" />
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

      {/* Alert Dialog OUTSIDE Dropdown */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteUserName}</strong>&apos;s
              account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteUserId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteUserId!)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default Page;
