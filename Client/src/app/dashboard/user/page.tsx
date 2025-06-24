"use client";

import { NextPage } from "next";
import { useDeleteUser, useUserQuery } from "@/hooks/UseUser";
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

import { MoreVertical, Pencil, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddUserDialog } from "@/components/AddUserDialog";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const Page: NextPage = () => {
  const companyId = useSelector((state: RootState) => state.auth.user?.companyId);

  const {
    data: users,
    isLoading,
    error,
  } = useUserQuery(companyId ?? "");

  const { mutate: deleteUserMutate, isPending: isDeleting } = useDeleteUser();

  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState<string>("");

  const [editUser, setEditUser] = useState<User | null>(null);

  const handleDelete = (userId: string) => {
    deleteUserMutate(userId, {
      onSuccess: () => {
        toast.success(`User "${deleteUserName}" deleted successfully.`);
        setDeleteUserId(null);
      },
      onError: (err) => {
        toast.error("Failed to delete user.");
        console.error(err);
      },
    });
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
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-semibold">Users</h1>
          <AddUserDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add User
              </Button>
            }
          />
        </div>
        <p className="text-muted-foreground">No users found.</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <AddUserDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          }
        />
      </div>
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="border-r text-center">Sr No.</TableHead>
              <TableHead className="border-r">Name</TableHead>
              <TableHead className="border-r">Email</TableHead>
              <TableHead className="border-r">Role</TableHead>
              <TableHead className="border-r">Created At</TableHead>
              <TableHead className="border-r">Updated At</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="border-r text-center">{index + 1}</TableCell>
                <TableCell className="border-r font-medium">{user.name}</TableCell>
                <TableCell className="border-r">{user.email}</TableCell>
                <TableCell className="border-r capitalize">{user.role}</TableCell>
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
                        onClick={() => setEditUser(user)}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteUserName}</strong>&apos;s account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteUserId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteUserId!)}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editUser && (
        <AddUserDialog
          mode="edit"
          open={true}
          initialData={editUser}
          onOpenChange={(open) => {
            if (!open) setEditUser(null);
          }}
          onSuccess={() => {
            setEditUser(null);
          }}
        />
      )}
    </main>
  );
};

export default Page;
