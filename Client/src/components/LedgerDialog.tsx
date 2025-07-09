"use client";

import { useMemo, useState } from "react";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAccountGroups, useCreateLedger, useUpdateLedger } from "@/hooks/UseAccount";
import { Ledger } from "@/types/Ledger";
import { AccountFormValues, accountFormSchema } from "@/validations/account";
import { Nature } from "@/types/AccountGroup";

interface AccountDialogProps {
  branchId: string;
  trigger?: React.ReactNode;
  mode?: "create" | "edit";
  initialData?: Partial<Ledger> | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

const ledgerTypeToNatureMap: Record<string, Nature> = {
  Cash: "Assets",
  Bank: "Assets",
  AccountsReceivable: "Assets",
  Inventory: "Assets",
  FixedAssets: "Assets",
  PrepaidExpenses: "Assets",
  AdvanceToSuppliers: "Assets",

  AccountsPayable: "Liabilities",
  AccruedExpenses: "Liabilities",
  LoansPayable: "Liabilities",
  GSTPayable: "Liabilities",
  TDSPayable: "Liabilities",
  AdvanceFromCustomers: "Liabilities",

  OwnerCapital: "Capital",
  RetainedEarnings: "Capital",
  Drawings: "Capital",
  Reserves: "Capital",

  Sales: "Income",
  InterestIncome: "Income",
  CommissionReceived: "Income",
  RentalIncome: "Income",
  OtherIncome: "Income",

  Purchase: "Expenses",
  Wages: "Expenses",
  Rent: "Expenses",
  Electricity: "Expenses",
  Telephone: "Expenses",
  Transportation: "Expenses",
  RepairsAndMaintenance: "Expenses",
  Depreciation: "Expenses",
  MiscellaneousExpenses: "Expenses",
};

const formatType = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2");

export function LedgerDialog({
  branchId,
  trigger,
  mode = "create",
  initialData,
  open,
  onOpenChange,
  onSuccess,
}: AccountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(false);
  const [openType, setOpenType] = useState(false);

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

  const selectedGroupId = form.watch("accountGroupId");
  const selectedGroup = accountGroups?.find((group) => group.id === selectedGroupId);

  const filteredTypes = useMemo(() => {
    if (!selectedGroup) return Object.keys(ledgerTypeToNatureMap);
    return Object.entries(ledgerTypeToNatureMap)
      .filter(([, nature]) => nature === selectedGroup.nature)
      .map(([type]) => type);
  }, [selectedGroup]);

  const onSubmit = (values: AccountFormValues) => {
    if (mode === "edit" && initialData?.id) {
      updateAccount(
        {
          id: initialData.id,
          ...values,
          updatedBy: "current-user-id",
        },
        {
          onSuccess: () => {
            toast.success("Account updated successfully");
            handleOpenChange(false);
            onSuccess?.();
          },
          onError: () => toast.error("Failed to update account"),
        },
      );
    } else {
      createAccount(
        {
          ...values,
          branchId,
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
              {mode === "edit" && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-generated or manual" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Account Group */}
              <FormField
                control={form.control}
                name="accountGroupId"
                render={({ field }) => {
                  const selected = accountGroups?.find((g) => g.id === field.value);
                  return (
                    <FormItem>
                      <FormLabel>Account Group</FormLabel>
                      <Popover open={openGroup} onOpenChange={setOpenGroup}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {selected?.name
                              ? `${selected.name} (${selected.nature})`
                              : "Select group"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[350px] p-0">
                          <Command>
                            <CommandInput placeholder="Search group..." />
                            <CommandList className="max-h-48 overflow-auto">
                              <CommandEmpty>No group found</CommandEmpty>
                              <CommandGroup>
                                {accountGroups?.map((group) => (
                                  <CommandItem
                                    key={group.id}
                                    value={group.name}
                                    onSelect={() => {
                                      form.setValue("accountGroupId", group.id);
                                      setOpenGroup(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === group.id ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    {group.name} ({group.nature})
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Account Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Popover open={openType} onOpenChange={setOpenType}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? formatType(field.value) : "Select type"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0">
                        <Command>
                          <CommandInput placeholder="Search type..." />
                          <CommandList className="max-h-48 overflow-auto">
                            <CommandEmpty>No type found</CommandEmpty>
                            <CommandGroup>
                              {filteredTypes.map((type) => (
                                <CommandItem
                                  key={type}
                                  value={type}
                                  onSelect={() => {
                                    form.setValue("type", type);
                                    setOpenType(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === type ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  {formatType(type)}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                      <Input
                        placeholder="0300-1234567"
                        value={field.value}
                        onChange={(e) => {
                          let raw = e.target.value.replace(/[^0-9]/g, ""); // remove non-numeric
                          if (raw.length > 4) {
                            raw = raw.slice(0, 4) + "-" + raw.slice(4, 11); // insert hyphen
                          }
                          field.onChange(raw);
                        }}
                        maxLength={12}
                      />
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
                      <Input
                        placeholder="0300-1234567"
                        value={field.value}
                        onChange={(e) => {
                          let raw = e.target.value.replace(/[^0-9]/g, "");
                          if (raw.length > 4) {
                            raw = raw.slice(0, 4) + "-" + raw.slice(4, 11);
                          }
                          field.onChange(raw);
                        }}
                        maxLength={12}
                      />
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
                      type="text"
                      placeholder="Enter opening balance"
                      value={field.value?.toLocaleString("en-US") || ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/,/g, "");
                        const parsed = parseFloat(raw);
                        if (!isNaN(parsed)) {
                          field.onChange(parsed);
                        } else {
                          field.onChange(0);
                        }
                      }}
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
