import { Prisma } from "../../generated/prisma";

export const getPreBalance = async (
  tx: Prisma.TransactionClient,
  ledgerId: string,
  date: Date
) => {
  const lastEntry = await tx.journalEntry.findFirst({
    where: {
      ledgerId,
      date: { lt: date },
      isActive: true,
    },
    orderBy: { date: "desc" },
    select: { preBalance: true, amount: true, type: true },
  });

  if (!lastEntry) {
    const ledgerData = await tx.ledger.findUnique({
      where: { id: ledgerId },
      select: { openingBalance: true },
    });
    return Number(ledgerData?.openingBalance || 0);
  }

  const adjustment =
    lastEntry.type === "CREDIT" ? lastEntry.amount : -lastEntry.amount;

  return Number(lastEntry.preBalance ?? 0) + adjustment;
};
