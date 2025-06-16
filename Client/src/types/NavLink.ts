import { LucideIcon } from "lucide-react";
import { Role } from "./Role";

export type Navlink = {
  label: string;
  icon: LucideIcon;
  url: string;
  roles?: Role[];
};
