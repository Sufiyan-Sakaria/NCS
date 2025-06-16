"use client";

import * as React from "react";
import {
  BookOpen,
  Bot,
  Frame,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import { Navlinks } from "@/components/NavLinks";
import { NavUser } from "@/components/NavUser";
import { BranchSwitcher } from "@/components/BranchSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { navLinks } from "@/lib/NavLinks";
import { Role } from "@/types/Role";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useSelector((state: RootState) => state.auth.user);

  if (!user?.role) return null;

  const filteredLinks = navLinks.filter(
    (link) => !link.roles || link.roles.includes(user.role as Role)
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <BranchSwitcher branches={user.branches ?? []} />
      </SidebarHeader>
      <SidebarContent>
        <Navlinks links={filteredLinks} />
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
