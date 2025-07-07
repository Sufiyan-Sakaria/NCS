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
import { useActiveBranchId } from "@/hooks/UseActiveBranch";

// Type definitions
interface Ledger {
  id: string;
  name: string;
  code: string;
  balance: number;
  type: string;
}

interface AccountGroup {
  id: string;
  name: string;
  code: string;
  nature: AccountNature;
  balance: number;
  children: AccountGroup[];
  ledgers: Ledger[];
}

type AccountNature = "Assets" | "Liabilities" | "Capital" | "Income" | "Expenses";

interface AccountTreePageProps {
  // branchId is now optional since we'll get it from the hook
  branchId?: string;
}

const AccountTreePage: React.FC<AccountTreePageProps> = ({ branchId: propBranchId }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["1", "2", "3"]));
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterNature, setFilterNature] = useState<AccountNature | "All">("All");

  // Get branchId from Redux store
  const activeBranchId = useActiveBranchId();
  const branchId = propBranchId || activeBranchId;

  // React Query hooks
  const { data: accountData, isLoading, error, refetch } = useHierarchicalAccounts(branchId);

  // Fix: Only create mutation if branchId is available
  const createDefaultAccountsMutation = useCreateDefaultAccounts(branchId || "");

  // Check if accounts exist
  const hasAccounts = accountData && accountData.length > 0;

  // Debug logging
  console.log("Debug Info:", {
    propBranchId,
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

  // Filter accounts based on search and nature filter
  const filteredAccounts = useMemo((): AccountGroup[] => {
    if (!accountData) return [];

    return accountData.filter((account) => {
      const matchesSearch =
        searchTerm === "" ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesNature = filterNature === "All" || account.nature === filterNature;

      return matchesSearch && matchesNature;
    });
  }, [accountData, searchTerm, filterNature]);

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
    nature: AccountNature,
  ): "default" | "destructive" | "secondary" | "outline" => {
    const variants: Record<AccountNature, "default" | "destructive" | "secondary" | "outline"> = {
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
  const renderLedger = (ledger: Ledger): JSX.Element => (
    <Card key={ledger.id} className="ml-8 p-0 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{ledger.name}</span>
                <span className="text-sm text-muted-foreground">({ledger.code})</span>
                <Badge>{ledger.type}</Badge>
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
  );

  // Render account group
  const renderAccountGroup = (group: AccountGroup, level: number = 0): JSX.Element => {
    const isExpanded = expandedNodes.has(group.id);
    const hasChildren = group.children && group.children.length > 0;
    const hasLedgers = group.ledgers && group.ledgers.length > 0;

    return (
      <div key={group.id} className="mb-2">
        <Card
          className={`hover:shadow-md transition-shadow duration-200 py-1 ${level === 0 ? "shadow-sm" : ""
            }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <CardContent className="p-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleNode(group.id)}
                className="p-1 h-7 w-7 cursor-pointer"
              >
                {hasChildren || hasLedgers ? (
                  isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )
                ) : (
                  <div className="w-4 h-4" />
                )}
              </Button>
              <Users className="w-5 h-5 text-amber-500" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{group.name}</span>
                  <span className="text-sm text-muted-foreground">({group.code})</span>
                  <Badge variant={getNatureVariant(group.nature)}>{group.nature}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-bold">{formatCurrency(group.balance)}</span>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="cursor-pointer w-7 h-7">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="cursor-pointer w-7 h-7">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="cursor-pointer w-7 h-7 text-red-500 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {isExpanded && (
          <div className="mt-2 space-y-2">
            {/* Render child groups */}
            {group.children && group.children.map((child) => renderAccountGroup(child, level + 1))}

            {/* Render ledgers */}
            {group.ledgers && group.ledgers.map((ledger) => renderLedger(ledger))}
          </div>
        )}
      </div>
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (value: string): void => {
    setFilterNature(value as AccountNature | "All");
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
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Account Group
              </Button>
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
                    className="pl-10"
                  />
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
    </div>
  );
};

export default AccountTreePage;
