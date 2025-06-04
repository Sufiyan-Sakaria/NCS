import * as React from "react";
import { ChevronsUpDown, Plus, Building2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { GetAllCompanies } from "@/api/axios";
import type Company from "@/types/Company";

import { GetBranchesByUser } from "@/api/axios";

interface Branch {
  id: string;
  name: string;
  address: string;
  companyId: string;
  company?: Company;
}

export function BranchSwitcher() {
  const { isMobile } = useSidebar();
  const [activeBranch, setActiveBranch] = React.useState<Branch | null>(null);

  // Get companies data
  const { data: Companies, isLoading: companiesLoading } = useQuery({
    queryKey: ["Companies"],
    queryFn: GetAllCompanies,
  });

  // Get branches data
  const { data: Branches, isLoading: branchesLoading } = useQuery({
    queryKey: ["Branches"],
    queryFn: GetBranchesByUser,
  });

  // Set the first branch as active when branches are loaded
  React.useEffect(() => {
    if (Branches?.data && Branches.data.length > 0 && !activeBranch) {
      setActiveBranch(Branches.data[0]);
    }
  }, [Branches?.data, activeBranch]);

  // Loading state
  if (companiesLoading || branchesLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Error or no data state
  if (!Companies?.data || !Branches?.data) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">No data available</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Get the company for the active branch
  const activeCompany = activeBranch?.company || Companies.data[0];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight cursor-pointer">
                {activeBranch ? (
                  <>
                    <div className="truncate font-medium">
                      {activeBranch.name}
                    </div>
                    <span className="truncate text-xs">
                      {activeCompany?.name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="truncate font-medium">Select Branch</div>
                    <span className="truncate text-xs">No branch selected</span>
                  </>
                )}
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Available Branches
            </DropdownMenuLabel>
            {Branches.data.length > 0 ? (
              Branches.data.map((branch: Branch, index: number) => (
                <DropdownMenuItem
                  key={branch.id}
                  onClick={() => setActiveBranch(branch)}
                  className={`gap-2 p-2 ${
                    activeBranch?.id === branch.id ? "bg-sidebar-accent" : ""
                  }`}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Building2 className="size-3.5 shrink-0" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{branch.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {branch.company?.name || activeCompany?.name}
                    </span>
                  </div>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Building2 className="size-3.5 shrink-0 opacity-50" />
                </div>
                <span className="text-muted-foreground">
                  No branches available
                </span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Add branch
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
