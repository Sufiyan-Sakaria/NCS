import { z } from "zod";

export const accountFormSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  code: z.string().optional(),
  type: z.string().min(1, "Account type is required"),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  openingBalance: z.number(),
  accountGroupId: z.string().min(1, "Account group is required"),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;
