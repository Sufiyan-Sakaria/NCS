import { Navlink } from "@/types/NavLink";
import { PieChart, BookOpen, Bot, Settings2, User } from "lucide-react";

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
];
