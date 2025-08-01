"use client";

import React, { useState, useMemo, JSX } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Folder,
  Building,
  Filter,
  Search,
  RotateCcw,
  Loader2,
  AlertCircle,
  Users,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { useHierarchicalAccounts, useCreateDefaultAccounts } from "@/hooks/UseAccount";
import { useActiveBranchId } from "@/hooks/UseActive";
import { AccountGroupDialog } from "@/components/AccountGroupDialog";
import { NextPage } from "next";
import { AccountGroup, Nature, EditableAccountGroup } from "@/types/AccountGroup";
import { Ledger } from "@/types/Ledger";
import { LedgerDialog } from "@/components/LedgerDialog";

const AccountTreePage: NextPage = () => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["1", "2", "3"]));
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterNature, setFilterNature] = useState<Nature | "All">("All");
  const [selectedGroup, setSelectedGroup] = useState<EditableAccountGroup | null>(null);
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);

  // Get branchId from Redux store
  const activeBranchId = useActiveBranchId();
  const branchId = activeBranchId || "";

  // React Query hooks
  const { data: accountData, isLoading, error, refetch } = useHierarchicalAccounts(branchId);

  // Fix: Only create mutation if branchId is available
  const createDefaultAccountsMutation = useCreateDefaultAccounts(branchId || "");

  // Check if accounts exist
  const hasAccounts = accountData && accountData.length > 0;

  // Debug logging
  console.log("Debug Info:", {
    activeBranchId,
    finalBranchId: branchId,
    isLoading,
    error,
    accountData,
    accountDataLength: accountData?.length,
    accountDataType: typeof accountData,
    hasAccounts,
  });

  // Toggle node expansion
  const toggleNode = (nodeId: string): void => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Recursively filter account groups and their children/ledgers
  const filteredAccounts = useMemo((): AccountGroup[] => {
    if (!accountData || searchTerm === "") {
      return accountData || [];
    }

    const expanded = new Set<string>();

    const filterTree = (group: AccountGroup): AccountGroup | null => {
      const matchesGroup =
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchedLedgers =
        group.ledgers?.filter(
          (ledger) =>
            ledger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ledger.code.toLowerCase().includes(searchTerm.toLowerCase()),
        ) || [];

      const matchedChildren =
        group.children?.map(filterTree).filter((g): g is AccountGroup => g !== null) || [];

      // If current group or any of its children or ledgers matched
      if (matchesGroup || matchedLedgers.length > 0 || matchedChildren.length > 0) {
        expanded.add(group.id);
        return {
          ...group,
          children: matchedChildren,
          ledgers: matchedLedgers,
        };
      }

      return null;
    };

    const result = accountData.map(filterTree).filter((g): g is AccountGroup => g !== null);

    setExpandedNodes(expanded);
    return result;
  }, [accountData, searchTerm]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get nature color variant
  const getNatureVariant = (
    nature: Nature,
  ): "default" | "destructive" | "secondary" | "outline" => {
    const variants: Record<Nature, "default" | "destructive" | "secondary" | "outline"> = {
      Assets: "default",
      Liabilities: "destructive",
      Capital: "secondary",
      Income: "outline",
      Expenses: "outline",
    };
    return variants[nature] || "default";
  };

  // Handle create default accounts
  const handleCreateDefaultAccounts = async () => {
    // Fix: Check if branchId is available before mutation
    if (!branchId) {
      console.error("No branch ID available");
      return;
    }

    try {
      await createDefaultAccountsMutation.mutateAsync({ branchId });
    } catch (error) {
      console.error("Failed to create default accounts:", error);
    }
  };

  // Render ledger item
  const renderLedger = (
    ledger: Ledger,
    level: number = 0,
    parentName: string = "",
  ): JSX.Element => (
    <div key={ledger.id} style={{ marginLeft: `${(level + 1) * 15}px` }}>
      <Card className="p-0 hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{ledger.name}</span>
                  <span className="text-sm text-muted-foreground">({ledger.code})</span>
                  <Badge variant="secondary">{parentName}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-semibold">{formatCurrency(ledger.balance)}</span>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Updated renderAccountGroup function with sorting logic
  const renderAccountGroup = (
    group: AccountGroup,
    level: number = 0,
    parentName: string = "",
  ): JSX.Element => {
    const isExpanded = expandedNodes.has(group.id);
    const hasChildren = group.children && group.children.length > 0;
    const hasLedgers = group.ledgers && group.ledgers.length > 0;

    return (
      <div key={group.id} className="mb-2" style={{ marginLeft: `${level * 15}px` }}>
        <Card
          className={`hover:shadow-md transition-shadow duration-200 py-1 ${
            level === 0 ? "shadow-sm" : ""
          }`}
        >
          <CardContent className="p-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {(hasChildren || hasLedgers) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleNode(group.id)}
                  className="p-1 h-7 w-7 cursor-pointer"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              )}

              <Users
                className={`w-5 h-5 text-amber-500 ${!(hasChildren || hasLedgers) && "ml-2"}`}
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{group.name}</span>
                  <span className="text-sm text-muted-foreground">({group.code})</span>
                  <Badge variant={getNatureVariant(group.nature)}>
                    {parentName || group.nature}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-bold">{formatCurrency(group.balance)}</span>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer w-7 h-7"
                  onClick={() => {
                    setSelectedGroup({
                      id: group.id,
                      name: group.name,
                      code: group.code,
                      nature: group.nature,
                      type: group.type,
                      parentId: group.parentId,
                      branchId: branchId,
                    });
                    setEditGroupDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer w-7 h-7 text-red-500 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isExpanded && (
          <div className="mt-2 space-y-2">
            {(() => {
              const childrenWithType = (group.children || []).map((child) => ({
                ...child,
                kind: "group" as const,
                sortCode: child.code,
              }));
              const ledgersWithType = (group.ledgers || []).map((ledger) => ({
                ...ledger,
                kind: "ledger" as const,
                sortCode: ledger.code,
              }));
              const allItems = [...childrenWithType, ...ledgersWithType].sort((a, b) => {
                const aCode = a.sortCode.split(".").map(Number);
                const bCode = b.sortCode.split(".").map(Number);
                for (let i = 0; i < Math.max(aCode.length, bCode.length); i++) {
                  const aNum = aCode[i] || 0;
                  const bNum = bCode[i] || 0;
                  if (aNum !== bNum) return aNum - bNum;
                }
                return 0;
              });

              return allItems.map((item) => {
                if (item.kind === "group") {
                  return renderAccountGroup(item, level + 1, group.name);
                } else {
                  return renderLedger(item, level, group.name);
                }
              });
            })()}
          </div>
        )}
      </div>
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value === "") {
      setExpandedNodes(new Set());
    }
  };

  const handleFilterChange = (value: string): void => {
    setFilterNature(value as Nature | "All");
  };

  const handleReset = (): void => {
    setSearchTerm("");
    setFilterNature("All");
  };

  const handleRefresh = (): void => {
    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading chart of accounts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <AlertDialog>
            <AlertCircle className="h-4 w-4" />
            <AlertDialogDescription>
              Failed to load chart of accounts.
              {/* Fix: Safe error message handling */}
              {error instanceof Error ? ` Error: ${error.message}` : " Please try again."}
            </AlertDialogDescription>
          </AlertDialog>
          <div className="text-center">
            <Button onClick={handleRefresh} className="mb-4">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Chart of Accounts</h1>
              <p className="mt-2 text-muted-foreground">
                Manage your account structure and ledgers
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <AccountGroupDialog
                branchId={branchId}
                trigger={
                  <Button>
                    <Plus className="w-4 h-4" />
                    Add Group
                  </Button>
                }
              />
              <LedgerDialog
                branchId={branchId}
                trigger={
                  <Button>
                    <Plus className="w-4 h-4" />
                    Add Ledger
                  </Button>
                }
              />
              {/* Only show Create Default Structure button if no accounts exist */}
              {!hasAccounts && (
                <Button
                  variant="outline"
                  onClick={handleCreateDefaultAccounts}
                  disabled={createDefaultAccountsMutation.isPending || !branchId}
                >
                  {createDefaultAccountsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Building className="w-4 h-4 mr-2" />
                  )}
                  Create Default Structure
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-3 py-1">
          <CardContent className="p-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 pr-8"
                  />
                  {searchTerm && (
                    <Button
                      variant={"ghost"}
                      onClick={() => {
                        setSearchTerm("");
                        setExpandedNodes(new Set());
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
                    >
                      <XCircle className="w-6 h-6" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterNature} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by nature" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    <SelectItem value="Assets">Assets</SelectItem>
                    <SelectItem value="Liabilities">Liabilities</SelectItem>
                    <SelectItem value="Capital">Capital</SelectItem>
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="Expenses">Expenses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="ghost" onClick={handleRefresh}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Tree */}
        <div className="space-y-4">
          {filteredAccounts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Folder className="w-8 h-8 text-muted-foreground" />
                </div>
                <CardTitle className="mb-2">No accounts found</CardTitle>
                <p className="text-muted-foreground mb-4">
                  {!hasAccounts
                    ? "No accounts have been created yet"
                    : "Try adjusting your search or filters"}
                </p>
                {!hasAccounts && (
                  <Button
                    onClick={handleCreateDefaultAccounts}
                    disabled={createDefaultAccountsMutation.isPending || !branchId}
                  >
                    {createDefaultAccountsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Building className="w-4 h-4 mr-2" />
                    )}
                    Create Default Structure
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredAccounts.map((account) => renderAccountGroup(account))
          )}
        </div>

        <Separator className="my-4" />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {(["Assets", "Liabilities", "Capital", "Income", "Expenses"] as const).map((nature) => {
            const accounts = accountData?.filter((acc) => acc.nature === nature) || [];
            const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);

            return (
              <Card key={nature} className="py-1">
                <CardContent className="py-2 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{nature}</p>
                      <p className="text-2xl font-bold">{formatCurrency(total)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Folder className="w-6 h-6 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <AccountGroupDialog
        mode="edit"
        branchId={branchId}
        initialData={selectedGroup}
        open={editGroupDialogOpen}
        onOpenChange={setEditGroupDialogOpen}
        onSuccess={() => {
          refetch();
          setEditGroupDialogOpen(false);
          setSelectedGroup(null);
        }}
      />
    </div>
  );
};

export default AccountTreePage;
