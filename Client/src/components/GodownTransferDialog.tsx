import { useActiveBranchId } from "../hooks/UseActiveBranch";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { ProductSelectWithDialog } from "./ProductSelectWithDIalog";
import { useGodowns } from "../hooks/UseGodown";
import { useProducts } from "../hooks/UseProduct";
import axios from "../lib/axios";

interface GodownTransferDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const GodownTransferDialog: React.FC<GodownTransferDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [productId, setProductId] = useState("");
  const [fromGodownId, setFromGodownId] = useState("");
  const [toGodownId, setToGodownId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [thaan, setThaan] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const branchId = useActiveBranchId();
  const godownQuery = useGodowns(branchId);
  const productQuery = useProducts(branchId);
  const godowns = godownQuery.data || [];
  const products = productQuery.data || [];
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await axios.post("/products/godown-transfer", {
        productId,
        fromGodownId,
        toGodownId,
        quantity,
        thaan: thaan ?? 0,
      });
      setLoading(false);
      onClose();
      onSuccess && onSuccess();
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.error || "Transfer failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Godown Stock Transfer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <ProductSelectWithDialog
            value={productId}
            onChange={setProductId}
            branchId={branchId || ""}
          />
          <div>
            <label className="block mb-1">From Godown</label>
            <select
              value={fromGodownId}
              onChange={(e) => setFromGodownId(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Select</option>
              {godowns.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">To Godown</label>
            <select
              value={toGodownId}
              onChange={(e) => setToGodownId(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">Select</option>
              {godowns.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full border rounded p-2"
              min={0}
            />
          </div>
          <div>
            <label className="block mb-1">Thaan (optional)</label>
            <input
              type="number"
              value={thaan ?? ""}
              onChange={(e) => setThaan(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full border rounded p-2"
              min={0}
            />
          </div>
          {error && <div className="text-red-500 mb-2">{error}</div>}
        </div>
        <DialogFooter>
          <Button onClick={onClose} disabled={loading} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !productId || !fromGodownId || !toGodownId || !quantity}
          >
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GodownTransferDialog;
