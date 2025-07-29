"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { LedgerDialog } from "./LedgerDialog";
import { useLedgers } from "@/hooks/UseAccount";
import { LedgerType } from "@/types/Ledger";

interface Props {
  value: string;
  onChange: (ledgerId: string) => void;
  branchId: string;
  filterType?: LedgerType[];
  className?: string;
  buttonClassName?: string;
  popoverWidth?: string;
}

export const LedgerSelectWithDialog = ({
  value,
  onChange,
  branchId,
  filterType,
  className,
  buttonClassName,
  popoverWidth,
}: Props) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: ledgers, refetch } = useLedgers(branchId);

  const selectedLedger = ledgers?.find((l) => l.id === value);

  useEffect(() => {
    if (!dialogOpen) {
      refetch(); // Refresh after dialog closes
    }
  }, [dialogOpen, refetch]);

  const filteredLedgers = filterType
    ? ledgers?.filter((l) => filterType.includes(l.type as LedgerType))
    : ledgers;

  return (
    <div className={cn("relative", className)}>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full h-8 justify-between text-sm",
              !value && "text-muted-foreground",
              buttonClassName
            )}
          >
            {selectedLedger ? selectedLedger.name : "Select Ledger"}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("p-0", popoverWidth ?? "w-[300px]")}>
          <Command>
            <CommandInput placeholder="Search ledger..." />
            <CommandList>
              <CommandEmpty>No ledger found.</CommandEmpty>
              <CommandGroup heading="Ledgers">
                {filteredLedgers?.map((ledger) => (
                  <CommandItem
                    key={ledger.id}
                    value={ledger.name}
                    onSelect={() => {
                      onChange(ledger.id);
                      setPopoverOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === ledger.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex justify-between"><span>{ledger.name}</span><span className="text-muted-foreground">{ledger.balance}</span></div>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setPopoverOpen(false);
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Ledger
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <LedgerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        branchId={branchId}
        onSuccess={() => setDialogOpen(false)}
      />
    </div>
  );
};
