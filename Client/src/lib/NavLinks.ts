import { Navlink } from "@/types/NavLink";
import {
  BadgeCheck,
  LayoutGrid,
  Package,
  PieChart,
  Receipt,
  Scale,
  ScrollText,
  User,
  UsersRound,
  Warehouse,
} from "lucide-react";

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
  {
    label: "Product Ledger",
    icon: ScrollText,
    url: "/dashboard/product-ledger",
  },
  {
    label: "Product Stock",
    icon: Package,
    url: "/dashboard/product-stock",
  },
  {
    label: "Accounts",
    icon: UsersRound,
    url: "/dashboard/account",
  },
  {
    label: "Invoices",
    icon: Receipt,
    url: "/dashboard/invoice",
  },
];
