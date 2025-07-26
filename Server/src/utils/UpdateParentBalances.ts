import { Prisma } from "../../generated/prisma";

// Helper: Recursively update parent group balances
export const updateParentBalances = async (
  tx: Prisma.TransactionClient,
  groupId: string,
  branchId: string
) => {
  if (!groupId) return;
  // Get all direct child ledgers and groups
  const [childGroups, childLedgers] = await Promise.all([
    tx.accountGroup.findMany({
      where: { parentId: groupId, branchId, isActive: true },
      select: { id: true, balance: true },
    }),
    tx.ledger.findMany({
      where: { accountGroupId: groupId, branchId, isActive: true },
      select: { balance: true },
    }),
  ]);
  // Sum balances
  let total = 0;
  for (const g of childGroups) total += Number(g.balance);
  for (const l of childLedgers) total += Number(l.balance);
  // Update this group
  await tx.accountGroup.update({
    where: { id: groupId },
    data: { balance: total },
  });
  // Get parent and recurse
  const parent = await tx.accountGroup.findUnique({
    where: { id: groupId },
    select: { parentId: true },
  });
  if (parent?.parentId) {
    await updateParentBalances(tx, parent.parentId, branchId);
  }
};
