import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Edit, LoaderCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { GetVoucherNo, GetAllAccounts, CreateVoucher } from "@/api/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

// Type Definitions
interface Account {
  id: string;
  name: string;
  code: string;
  account_type:
    | "Bank"
    | "Cash"
    | "Receivable"
    | "Payable"
    | "Expense"
    | "Income"
    | "Capital";
}

interface VoucherEntry {
  accountId: string;
  accountCode: string;
  amount: number;
  description: string;
  transactionType: "Debit" | "Credit";
  voucherAccountId: string;
}

interface VoucherData {
  voucherType: "Payment" | "Receipt" | "Journal" | "Contra";
  description: string;
  totalAmount: number;
  voucherAccId: string;
  ledgerEntries: {
    accountId: string;
    transactionType: "Debit" | "Credit";
    amount: number;
    description?: string;
  }[];
  date: string;
}

const ReceiptVoucherPage = () => {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [voucherAccountId, setVoucherAccountId] = useState<string>("");
  const [voucherAccountCode, setVoucherAccountCode] = useState<string>("");
  const [entries, setEntries] = useState<VoucherEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState({
    accountId: "",
    accountCode: "",
    amount: "",
    description: "",
  });

  const voucherSelectTriggerRef = useRef<HTMLButtonElement>(null);
  const mainSelectTriggerRef = useRef<HTMLButtonElement>(null);
  const voucherCodeInputRef = useRef<HTMLInputElement>(null);
  const mainCodeInputRef = useRef<HTMLInputElement>(null);

  // Fetch voucher number
  const {
    data: voucherNo,
    isLoading: isVoucherLoading,
    isError: isVoucherError,
  } = useQuery({
    queryKey: ["voucherNo", "Receipt"],
    queryFn: () => GetVoucherNo("Receipt"),
  });

  // Fetch accounts list
  const {
    data: accounts,
    isLoading: isAccountsLoading,
    isError: isAccountsError,
    isSuccess,
  } = useQuery<{ accounts: Account[] }>({
    queryKey: ["accounts"],
    queryFn: () => GetAllAccounts(),
  });

  // Filter accounts for voucher selection (only Cash or Bank)
  const cashAndBankAccounts =
    accounts?.accounts?.filter(
      (acc) => acc.account_type === "Cash" || acc.account_type === "Bank"
    ) || [];

  // UseEffect to select first account by default when accounts are loaded
  useEffect(() => {
    if (isSuccess && cashAndBankAccounts.length > 0) {
      setVoucherAccountId(cashAndBankAccounts[0].id);
      setVoucherAccountCode(cashAndBankAccounts[0].code);
    }
  }, [isSuccess, accounts]);

  // Handle F4 key press for voucher account
  const handleVoucherKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "F4") {
      e.preventDefault();
      voucherSelectTriggerRef.current?.click();
    }
  };

  // Handle F4 key press for main account
  const handleMainKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "F4") {
      e.preventDefault();
      mainSelectTriggerRef.current?.click();
    }
  };

  // Handle Voucher Account selection via code input
  const handleVoucherCodeChange = (code: string) => {
    setVoucherAccountCode(code);

    // Find account by code
    const matchingAccount = cashAndBankAccounts.find(
      (acc) => acc.code === code
    );
    setVoucherAccountId(matchingAccount?.id || "");
  };

  // Handle Main Account selection via code input
  const handleMainCodeChange = (code: string) => {
    setCurrentEntry((prev) => ({ ...prev, accountCode: code }));

    // Find account by code
    const matchingAccount = accounts?.accounts.find((acc) => acc.code === code);

    setCurrentEntry((prev) => ({
      ...prev,
      accountId: matchingAccount?.id || "",
      accountCode: matchingAccount?.code || code,
    }));
  };

  // Handle Main Account selection via dropdown
  const handleMainAccountSelect = (accountId: string) => {
    const selectedAccount = accounts?.accounts.find(
      (acc) => acc.id === accountId
    );

    if (selectedAccount) {
      setCurrentEntry((prev) => ({
        ...prev,
        accountId: selectedAccount.id,
        accountCode: selectedAccount.code,
      }));
    }
  };

  // Handle form submission for adding an entry
  const handleAddEntry = () => {
    const amount = parseFloat(currentEntry.amount);

    // Add CREDIT entry for the main account (RECEIPT)
    const creditEntry: VoucherEntry = {
      accountId: currentEntry.accountId,
      accountCode: currentEntry.accountCode,
      amount: amount,
      description: currentEntry.description,
      transactionType: "Credit",
      voucherAccountId: voucherAccountId,
    };

    // Add DEBIT entry for the voucher account (Cash/Bank)
    const debitEntry: VoucherEntry = {
      accountId: voucherAccountId,
      accountCode: voucherAccountCode,
      amount: amount,
      description: currentEntry.description,
      transactionType: "Debit",
      voucherAccountId: voucherAccountId,
    };

    setEntries([...entries, creditEntry, debitEntry]);
    setCurrentEntry({
      accountId: "",
      accountCode: "",
      amount: "",
      description: "",
    });
  };

  // Mutation to create voucher
  const createVoucherMutation = useMutation({
    mutationFn: CreateVoucher,
    onSuccess: () => {
      setEntries([]);
      setCurrentEntry({
        accountId: "",
        accountCode: "",
        amount: "",
        description: "",
      });
    },
  });

  // Handle final submission
  const handleSubmit = () => {
    const submitErrors: string[] = [];

    if (entries.length < 2) {
      submitErrors.push("Minimum 2 ledger entries are required.");
    }

    const totalAmount = entries
      .filter((entry) => entry.transactionType === "Credit")
      .reduce((sum, entry) => sum + entry.amount, 0);

    if (totalAmount <= 0) {
      submitErrors.push("Total amount must be greater than zero.");
    }

    const ledgerEntries = entries.map((entry) => ({
      accountId: entry.accountId,
      transactionType: entry.transactionType,
      amount: entry.amount,
      description: entry.description,
    }));

    const voucherData: VoucherData = {
      voucherType: "Receipt",
      description: "Receipt Voucher",
      totalAmount,
      voucherAccId: voucherAccountId,
      ledgerEntries,
      date: format(date || new Date(), "dd-MM-yyyy"),
    };

    createVoucherMutation.mutate(voucherData);
  };

  // Filter entries to show only Credit entries (main account)
  const mainAccountEntries = entries.filter(
    (entry) => entry.transactionType === "Credit"
  );

  // Handle Edit Entry
  const handleEditEntry = (index: number) => {
    const entry = entries[index];
    setCurrentEntry({
      accountId: entry.accountId,
      accountCode: entry.accountCode,
      amount: entry.amount.toString(),
      description: entry.description,
    });
    setEditIndex(index);
  };

  // Handle Delete Entry
  const handleDeleteEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index && i !== index + 1));
  };

  // Handle Update Entry
  const handleUpdateEntry = () => {
    if (editIndex === null) return;

    const amount = parseFloat(currentEntry.amount);
    const updatedCreditEntry: VoucherEntry = {
      accountId: currentEntry.accountId,
      accountCode: currentEntry.accountCode,
      amount: amount,
      description: currentEntry.description,
      transactionType: "Credit",
      voucherAccountId: voucherAccountId,
    };

    const updatedDebitEntry: VoucherEntry = {
      accountId: voucherAccountId,
      accountCode: voucherAccountCode,
      amount: amount,
      description: currentEntry.description,
      transactionType: "Debit",
      voucherAccountId: voucherAccountId,
    };

    setEntries((prev) => {
      const newEntries = [...prev];
      newEntries[editIndex] = updatedCreditEntry;
      newEntries[editIndex + 1] = updatedDebitEntry;
      return newEntries;
    });

    setEditIndex(null);
    setCurrentEntry({
      accountId: "",
      accountCode: "",
      amount: "",
      description: "",
    });
  };

  return (
    <main className="flex justify-center min-h-screen p-2">
      <Card className="w-full mx-8">
        <CardHeader>
          <CardTitle>Cash Receipt Voucher</CardTitle>
          <CardDescription>
            Enter the details for the cash receipt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Voucher Number & Date */}
          <main className="flex gap-6 justify-between">
            <div className="w-[43%]">
              <div className="flex flex-col gap-2 justify-between">
                <div className="flex gap-2">
                  <div className="space-y-2 flex justify-end flex-col w-1/4">
                    <Label htmlFor="voucherno">Voucher No.</Label>
                    <Input
                      id="voucherno"
                      type="text"
                      value={
                        isVoucherLoading
                          ? "Loading..."
                          : isVoucherError
                          ? "Error!"
                          : voucherNo?.data.voucherNo || ""
                      }
                      readOnly
                      className="text-center"
                    />
                  </div>
                  <div className="space-y-2 flex justify-end flex-col w-3/4">
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start font-normal text-center",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-1" />
                          {date ? format(date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              {/* Voucher Account Section */}
              <div className="space-y-2">
                <Label>Voucher Account (Cash/Bank)</Label>
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <Input
                      ref={voucherCodeInputRef}
                      id="voucherAccountCode"
                      type="text"
                      placeholder="Enter code"
                      value={voucherAccountCode}
                      onChange={(e) => handleVoucherCodeChange(e.target.value)}
                      onKeyDown={handleVoucherKeyDown}
                    />
                  </div>
                  <Select
                    value={voucherAccountId}
                    onValueChange={(value) => {
                      setVoucherAccountId(value);
                      const selectedAccount = cashAndBankAccounts?.find(
                        (acc: any) => acc.id === value
                      );
                      if (selectedAccount) {
                        setVoucherAccountCode(selectedAccount.code);
                      }
                    }}
                    disabled={isAccountsLoading || isAccountsError}
                  >
                    <SelectTrigger ref={voucherSelectTriggerRef}>
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {isAccountsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : isAccountsError ? (
                        <SelectItem value="error" disabled>
                          Error fetching accounts
                        </SelectItem>
                      ) : (
                        cashAndBankAccounts?.map((account: any) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Main Account Section */}
              <div className="space-y-2">
                <Label>Main Account</Label>
                <div className="flex gap-2">
                  <div className="w-1/3">
                    <Input
                      ref={mainCodeInputRef}
                      id="mainAccountCode"
                      type="text"
                      placeholder="Enter code"
                      value={currentEntry.accountCode}
                      onChange={(e) => handleMainCodeChange(e.target.value)}
                      onKeyDown={handleMainKeyDown}
                    />
                  </div>
                  <Select
                    value={currentEntry.accountId}
                    onValueChange={handleMainAccountSelect}
                    disabled={isAccountsLoading || isAccountsError}
                  >
                    <SelectTrigger ref={mainSelectTriggerRef}>
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {isAccountsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : isAccountsError ? (
                        <SelectItem value="error" disabled>
                          Error fetching accounts
                        </SelectItem>
                      ) : (
                        accounts?.accounts?.map((account: any) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Credit Amount</Label>
                <Input
                  id="amount"
                  type="text"
                  placeholder="Enter amount"
                  value={currentEntry.amount.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    ","
                  )}
                  onChange={(e) =>
                    setCurrentEntry((prev) => ({
                      ...prev,
                      amount: e.target.value.replace(/[^0-9]/g, ""),
                    }))
                  }
                  autoComplete="off"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter a description (optional)"
                  value={currentEntry.description}
                  onChange={(e) =>
                    setCurrentEntry((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  autoComplete="off"
                />
              </div>
              {/* Buttons */}
              <div className="m-2 text-center">
                {editIndex !== null ? (
                  <Button onClick={handleUpdateEntry}>Update Entry</Button>
                ) : (
                  <Button onClick={handleAddEntry}>Add Entry</Button>
                )}
              </div>
            </div>
            <Separator orientation="vertical" className="h-96" />

            {/* Table of Entries */}
            <div className="rounded-md border select-none w-[57%]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Code</TableHead>
                    <TableHead className="text-center">Account</TableHead>
                    <TableHead className="text-center">
                      Voucher Account
                    </TableHead>
                    <TableHead className="text-center">Amount</TableHead>
                    <TableHead className="text-center">Description</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mainAccountEntries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center">
                        {entry.accountCode}
                      </TableCell>
                      <TableCell className="text-center">
                        {
                          accounts?.accounts?.find(
                            (acc: any) => acc.id === entry.accountId
                          )?.name
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        {
                          cashAndBankAccounts?.find(
                            (acc: any) => acc.id === entry.voucherAccountId
                          )?.name
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.description}
                      </TableCell>
                      <TableCell className="flex gap-1 items-center justify-center">
                        <Edit
                          onClick={() => handleEditEntry(index)}
                          className="text-green-500 cursor-pointer"
                        />
                        <Trash2
                          onClick={() => handleDeleteEntry(index)}
                          className="text-red-500 cursor-pointer"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </main>
          {/* Submit Button */}
          <div className="mt-4 text-center">
            <Button
              onClick={handleSubmit}
              disabled={createVoucherMutation.isPending}
            >
              {createVoucherMutation.isPending ? (
                <>
                  <LoaderCircle className="animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Voucher"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default ReceiptVoucherPage;
