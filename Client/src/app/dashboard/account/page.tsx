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
import { MoreVertical, Pencil, Trash, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts, useDeleteAccount } from "@/hooks/UseAccount";
import { AccountDialog } from "@/components/AccountDialog";
import { Account } from "@/types/Account";

const Page: NextPage = () => {
  const branchId = useActiveBranchId();
  const { data: accounts, isLoading, error, refetch } = useAccounts(branchId!);
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount(branchId!);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAccountData, setEditAccountData] = useState<Account | null>(null);

  const handleDelete = (id: string) => {
    deleteAccount(
      { id },
      {
        onSuccess: () => {
          toast.success("Account deleted successfully");
          setDeleteId(null);
          refetch();
        },
        onError: () => toast.error("Failed to delete account"),
      },
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
    return <main className="p-6 text-destructive">Failed to load accounts.</main>;
  }

  if (!accounts || accounts.length === 0) {
    return (
      <main className="p-6 text-center space-y-4">
        <p className="text-muted-foreground">No accounts found.</p>
        <AccountDialog
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
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Accounts
        </h1>
        <AccountDialog
          branchId={branchId!}
          trigger={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          }
          onSuccess={() => refetch()}
        />
      </div>

      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="border-r">Code</TableHead>
              <TableHead className="border-r">Name</TableHead>
              <TableHead className="border-r">Type</TableHead>
              <TableHead className="border-r">Group</TableHead>
              <TableHead className="border-r">Balance</TableHead>
              <TableHead className="border-r">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="border-r font-mono">{account.code}</TableCell>
                <TableCell className="border-r font-medium">{account.name}</TableCell>
                <TableCell className="border-r capitalize">
                  {account.type.toLowerCase().replace(/([a-z])([A-Z])/g, "$1 $2")}
                </TableCell>
                <TableCell className="border-r">{account.accountGroup?.name}</TableCell>
                <TableCell className="border-r">{account.balance}</TableCell>
                <TableCell className="border-r">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      account.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {account.isActive ? "Active" : "Inactive"}
                  </span>
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
                          setEditAccountData(account);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:bg-red-600"
                        onClick={() => {
                          setDeleteId(account.id);
                          setDeleteName(account.name);
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
      <AccountDialog
        mode="edit"
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        branchId={branchId!}
        initialData={editAccountData}
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
              This will permanently delete the account <strong>{deleteName}</strong> and all its
              associated transactions.
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
