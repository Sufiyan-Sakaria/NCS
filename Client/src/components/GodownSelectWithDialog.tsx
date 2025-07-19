"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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
import { useGodowns } from "@/hooks/UseGodown";
import { GodownDialog } from "./GodownDialog";

interface Props {
  value: string;
  onChange: (godownId: string) => void;
  branchId: string;
}

export const GodownSelectWithDialog = ({ value, onChange, branchId }: Props) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: godowns, refetch } = useGodowns(branchId);

  const selectedGodown = godowns?.find((p) => p.id === value);

  useEffect(() => {
    if (!dialogOpen) {
      refetch(); // Refresh after dialog closes
    }
  }, [dialogOpen, refetch]);

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full h-8 justify-between",
              value === "" ? "text-muted-foreground" : "",
            )}
          >
            {value === "" ? "All Godowns" : selectedGodown ? selectedGodown.name : "Select Godown"}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search godown..." />
            <CommandList>
              <CommandEmpty>No godown found.</CommandEmpty>
              <CommandGroup heading="Godowns">
                <CommandItem
                  key="all-godowns"
                  value="All Godowns"
                  onSelect={() => {
                    onChange("");
                    setPopoverOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")}
                  />
                  All Godowns
                </CommandItem>
                {godowns?.map((godown) => (
                  <CommandItem
                    key={godown.id}
                    value={godown.name}
                    onSelect={() => {
                      onChange(godown.id);
                      setPopoverOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === godown.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {godown.name}
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
                  Add New Godown
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <GodownDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        branchId={branchId}
        onSuccess={() => {
          setDialogOpen(false);
        }}
      />
    </>
  );
};
