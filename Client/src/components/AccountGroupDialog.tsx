"use client";

import { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

import {
  useCreateAccountGroup,
  useUpdateAccountGroup,
  useAccountGroups,
} from "@/hooks/UseAccount";
import { EditableAccountGroup } from "@/types/AccountGroup";
import {
  accountGroupFormSchema,
  AccountGroupFormValues,
} from "@/validations/accountGroup";

interface AccountGroupDialogProps {
  branchId: string;
  mode?: "create" | "edit";
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: EditableAccountGroup | null;
  onSuccess?: () => void;
}

export function AccountGroupDialog({
  branchId,
  trigger,
  mode = "create",
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: AccountGroupDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parentOpen, setParentOpen] = useState(false);

  const form = useForm<AccountGroupFormValues>({
    resolver: zodResolver(accountGroupFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      nature: initialData?.nature ?? "Assets",
      parentId: initialData?.parentId ?? undefined,
    },
  });

  useEffect(() => {
    if (open && mode === "edit" && initialData) {
      form.reset({
        name: initialData.name,
        nature: initialData.nature,
        parentId: initialData.parentId ?? undefined,
      });
    }
  }, [open, mode, initialData, form]);

  const { data: accountGroups } = useAccountGroups(branchId);
  const { mutate: createAccountGroup, isPending: isCreating } =
    useCreateAccountGroup(branchId);
  const { mutate: updateAccountGroup, isPending: isUpdating } =
    useUpdateAccountGroup(branchId);

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

  const onSubmit = (values: AccountGroupFormValues) => {
    const payload = {
      name: values.name,
      nature: values.nature,
      parentId: values.parentId === "none" ? undefined : values.parentId,
    };

    if (mode === "edit" && initialData?.id) {
      updateAccountGroup(
        {
          id: initialData.id,
          ...payload,
        },
        {
          onSuccess: () => {
            toast.success("Account group updated");
            handleOpenChange(false);
            onSuccess?.();
          },
          onError: () => toast.error("Update failed"),
        }
      );
    } else {
      createAccountGroup(
        {
          ...payload,
          branchId,
        },
        {
          onSuccess: () => {
            toast.success("Account group created");
            handleOpenChange(false);
            onSuccess?.();
          },
          onError: () => toast.error("Creation failed"),
        }
      );
    }
  };

  return (
    <Dialog open={open !== undefined ? open : isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Account Group" : "Create Account Group"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nature Field */}
            <FormField
              control={form.control}
              name="nature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nature</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select nature" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Assets">Assets</SelectItem>
                      <SelectItem value="Liabilities">Liabilities</SelectItem>
                      <SelectItem value="Capital">Capital</SelectItem>
                      <SelectItem value="Income">Income</SelectItem>
                      <SelectItem value="Expenses">Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent Group Field */}
            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => {
                const selected = accountGroups?.find((g) => g.id === field.value);
                return (
                  <FormItem>
                    <FormLabel>Parent Group</FormLabel>
                    <Popover open={parentOpen} onOpenChange={setParentOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          {selected
                            ? `${selected.name} (${selected.code})`
                            : "Select group"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0">
                        <Command>
                          <CommandInput placeholder="Search group..." />
                          <CommandList className="max-h-48 overflow-auto">
                            <CommandEmpty>No group found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="none"
                                onSelect={() => {
                                  field.onChange("none");
                                  setParentOpen(false);
                                }}
                              >
                                None
                              </CommandItem>
                              {accountGroups
                                ?.filter((g) => g.id !== initialData?.id)
                                .map((group) => (
                                  <CommandItem
                                    key={group.id}
                                    value={group.name}
                                    onSelect={() => {
                                      field.onChange(group.id);
                                      setParentOpen(false);
                                    }}
                                  >
                                    <div>
                                      <div className="text-sm font-medium">
                                        {group.name} ({group.code})
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {group.nature}
                                      </div>
                                    </div>
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

            {/* Submit Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {(isCreating || isUpdating) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "edit" ? "Update Group" : "Create Group"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
