"use client";

import { NextPage } from "next";
import { useState } from "react";
import { toast } from "sonner";
import { useActiveBranchId } from "@/hooks/UseActive";
import { useBrands, useDeleteBrand } from "@/hooks/UseBrand";
import { AddBrandDialog } from "@/components/AddBrandDialog";

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

import { MoreVertical, Pencil, Trash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EditBrandDialog } from "@/components/EditBrandDialog";

const Page: NextPage = () => {
    const branchId = useActiveBranchId();
    const { data: brands, isLoading, error, refetch } = useBrands(branchId!);
    console.log(brands)
    const { mutate: deleteBrandMutate, isPending: isDeleting } = useDeleteBrand(branchId!);

    const [deleteBrandId, setDeleteBrandId] = useState<string | null>(null);
    const [deleteBrandName, setDeleteBrandName] = useState<string>("");

    const handleDelete = (id: string) => {
        deleteBrandMutate({ id }, {
            onSuccess: () => {
                toast.success("Brand deleted successfully");
                setDeleteBrandId(null);
            },
            onError: () => {
                toast.error("Failed to delete brand");
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
                <p className="text-destructive">Failed to load brands.</p>
            </main>
        );
    }

    if (!brands || brands.length === 0) {
        return (
            <main className="p-6 text-center space-y-4">
                <p className="text-muted-foreground">No brands found.</p>
                <AddBrandDialog
                    trigger={
                        <p className="hover:underline cursor-pointer text-blue-600">Add One</p>
                    }
                    onSuccess={() => refetch()}
                />
            </main>
        );
    }

    return (
        <main className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Brands</h1>
                <AddBrandDialog
                    trigger={
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Brand
                        </Button>
                    }
                    onSuccess={() => refetch()}
                />
            </div>

            <div className="rounded-md border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="border-r text-center w-14">#</TableHead>
                            <TableHead className="border-r">Name</TableHead>
                            <TableHead className="border-r">Abbreviation</TableHead>
                            <TableHead className="border-r">Status</TableHead>
                            <TableHead className="border-r">Created By</TableHead>
                            <TableHead className="border-r">Created At</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {brands.map((brand, index) => (
                            <TableRow key={brand.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="border-r text-center">{index + 1}</TableCell>
                                <TableCell className="border-r font-medium">{brand.name}</TableCell>
                                <TableCell className="border-r">{brand.abb}</TableCell>
                                <TableCell className="border-r">{brand.isActive ? "Active" : "Inactive"}</TableCell>
                                <TableCell className="border-r">{brand.createdByUser?.name}</TableCell>
                                <TableCell className="border-r">
                                    {new Date(brand.createdAt).toLocaleString(undefined, {
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
                                            <EditBrandDialog
                                                brand={{ id: brand.id, name: brand.name, abb: brand.abb }}
                                                trigger={
                                                    <Button variant="ghost" className="flex gap-2 w-full justify-start">
                                                        <Pencil className="w-4 h-4" />
                                                        Edit
                                                    </Button>
                                                }
                                                onSuccess={() => refetch()}
                                            />
                                            <DropdownMenuItem
                                                className="cursor-pointer text-red-600 focus:bg-red-600"
                                                onClick={() => {
                                                    setDeleteBrandId(brand.id);
                                                    setDeleteBrandName(brand.name);
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteBrandId} onOpenChange={(open) => !open && setDeleteBrandId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <strong>{deleteBrandName}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteBrandId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDelete(deleteBrandId!)}
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
