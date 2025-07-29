"use client";

import VoucherForm from "@/components/VoucherForm";
import { useActiveBranchId } from "@/hooks/UseActiveBranch";

const Page = () => {
  const branchId = useActiveBranchId();
  return (
    <div className="p-3">
      <VoucherForm branchId={branchId!} />
    </div>
  );
};

export default Page;
