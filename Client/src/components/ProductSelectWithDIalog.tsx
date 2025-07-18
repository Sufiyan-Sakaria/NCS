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
import { ProductDialog } from "./ProductDialog";
import { useProducts } from "@/hooks/UseProduct";

interface Props {
  value: string;
  onChange: (productId: string) => void;
  branchId: string;
}

export const ProductSelectWithDialog = ({ value, onChange, branchId }: Props) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: products, refetch } = useProducts(branchId);

  const selectedProduct = products?.find((p) => p.id === value);

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
            className={cn("w-full h-10 justify-between", !value && "text-muted-foreground")}
          >
            {selectedProduct?.name || "Select Product"}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search product..." />
            <CommandList>
              <CommandEmpty>No product found.</CommandEmpty>
              <CommandGroup heading="Products">
                {products?.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.name.toLowerCase()}
                    onSelect={() => {
                      onChange(product.id);
                      setPopoverOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === product.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {product.name}
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
                  Add New Product
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <ProductDialog
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
