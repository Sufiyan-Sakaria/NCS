"use client";

import React, { useState } from "react";
import GodownTransferDialog from "@/components/GodownTransferDialog";
import { Button } from "@/components/ui/button";

const GodownTransferPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSuccess = () => {
    setSuccessMsg("Transfer successful!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Godown Stock Transfer</h1>
      <Button onClick={() => setOpen(true)}>New Transfer</Button>
      {successMsg && <div className="text-green-600 mt-4">{successMsg}</div>}
      <GodownTransferDialog open={open} onClose={() => setOpen(false)} onSuccess={handleSuccess} />
      {/* You can add a table/list of past transfers here if needed */}
    </div>
  );
};

export default GodownTransferPage;
