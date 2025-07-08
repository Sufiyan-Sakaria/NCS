import { z } from "zod";

export const accountGroupFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  nature: z.enum(["Assets", "Liabilities", "Capital", "Income", "Expenses"]),
  parentId: z.union([z.string(), z.literal("none")]).optional(), // ✅ allow "none"
});

export type AccountGroupFormValues = z.infer<typeof accountGroupFormSchema>;
