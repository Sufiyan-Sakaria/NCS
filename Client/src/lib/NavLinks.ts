import { Navlink } from "@/types/NavLink";
import { BadgeCheck, LayoutGrid, Package, PieChart, Scale, User, Warehouse } from "lucide-react";

export const navLinks: Navlink[] = [
  {
    label: "Dashboard",
    icon: PieChart,
    url: "/dashboard",
  },
  {
    label: "Users",
    icon: User,
    url: "/dashboard/user",
  },
  {
    label: "Brands",
    icon: BadgeCheck,
    url: "/dashboard/brand",
  },
  {
    label: "Categories",
    icon: LayoutGrid,
    url: "/dashboard/category",
  },
  {
    label: "Units",
    icon: Scale,
    url: "/dashboard/unit",
  },
  {
    label: "Godowns",
    icon: Warehouse,
    url: "/dashboard/godown",
  },
  {
    label: "Products",
    icon: Package,
    url: "/dashboard/product",
  },
];
