"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccountGroups, useCreateLedger, useUpdateLedger } from "@/hooks/UseAccount";
import { Account } from "@/types/Ledger";
import { accountFormSchema, AccountFormValues } from "@/validations/account";
import { Loader2 } from "lucide-react";

interface AccountDialogProps {
  branchId: string;
  trigger?: React.ReactNode;
  mode?: "create" | "edit";
  initialData?: Account | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AccountDialog({
  branchId,
  trigger,
  mode = "create",
  initialData,
  open,
  onOpenChange,
  onSuccess,
}: AccountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: accountGroups } = useAccountGroups(branchId);
  const { mutate: createAccount, isPending: isCreating } = useCreateLedger(branchId);
  const { mutate: updateAccount, isPending: isUpdating } = useUpdateLedger(branchId);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      type: initialData?.type || "",
      phone1: initialData?.phone1 || "",
      phone2: initialData?.phone2 || "",
      openingBalance: initialData?.openingBalance || 0,
      accountGroupId: initialData?.accountGroupId || "",
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setIsOpen(open);
    }
    if (!open) {
      form.reset();
    }
  };

  const onSubmit = (values: AccountFormValues) => {
    if (mode === "edit" && initialData) {
      updateAccount(
        {
          id: initialData.id,
          ...values,
          updatedBy: "current-user-id", // Replace with actual user ID
        },
        {
          onSuccess: () => {
            toast.success("Account updated successfully");
            handleOpenChange(false);
            onSuccess?.();
          },
          onError: () => toast.error("Failed to update account"),
        }
      );
    } else {
      createAccount(
        {
          ...values,
          branchId,
          createdBy: "current-user-id", // Replace with actual user ID
        },
        {
          onSuccess: () => {
            toast.success("Account created successfully");
            handleOpenChange(false);
            onSuccess?.();
          },
          onError: () => toast.error("Failed to create account"),
        },
      );
    }
  };

  return (
    <Dialog open={open !== undefined ? open : isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Account" : "Create New Account"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank">Bank</SelectItem>
                        <SelectItem value="AccountsReceivable">Accounts Receivable</SelectItem>
                        <SelectItem value="AccountsPayable">Accounts Payable</SelectItem>
                        <SelectItem value="Expense">Expense</SelectItem>
                        <SelectItem value="Income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountGroupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Group</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountGroups?.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone 1</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter alternate phone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="openingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening Balance</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter opening balance"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "edit" ? "Update Account" : "Create Account"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
