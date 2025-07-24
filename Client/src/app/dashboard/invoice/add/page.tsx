"use client";

import AddInvoiceForm from "@/components/AddInvoiceForm";
import { useActiveBranchId } from "@/hooks/UseActiveBranch";

export default function AddInvoicePage() {
  const branchId = useActiveBranchId();
  return (
    <div className="p-3">
      <AddInvoiceForm branchId={branchId!} />
    </div>
  );
}
