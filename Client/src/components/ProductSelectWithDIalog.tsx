"use client";

import { forwardRef, useEffect, useState } from "react";
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
import { ProductDialog } from "./ProductDialog";
import { useProducts } from "@/hooks/UseProduct";

interface Props {
  value: string;
  onChange: (productId: string) => void;
  branchId: string;
}

export const ProductSelectWithDialog = forwardRef<HTMLButtonElement, Props>(
  ({ value, onChange, branchId }, ref) => {
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
              ref={ref}
              variant="outline"
              role="combobox"
              className={cn("w-full h-8 justify-between", !value && "text-muted-foreground")}
            >
              {selectedProduct ? (
                <>
                  {selectedProduct.name}
                  {selectedProduct.brand?.name && <> &middot; {selectedProduct.brand.name}</>}
                  {selectedProduct.category?.name && <> &middot; {selectedProduct.category.name}</>}
                </>
              ) : (
                "Select Product"
              )}
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
                      value={`${product.name} ${product.brand?.name ?? ""} ${product.category?.name ?? ""}`}
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
                      <div>
                        <div>{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.brand?.name} &middot; {product.category?.name}
                        </div>
                      </div>
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
  }
);

ProductSelectWithDialog.displayName = "ProductSelectWithDialog";
