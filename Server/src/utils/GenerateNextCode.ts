export const generateNextCode = async (
    tx: any,
    parentCode: string,
    branchId: string
): Promise<string> => {
    // Find all existing ledgers and subgroups under this parent
    const [existingLedgers, existingSubGroups] = await Promise.all([
        tx.ledger.findMany({
            where: {
                branchId,
                accountGroup: {
                    code: { startsWith: parentCode },
                },
            },
            select: { code: true },
        }),
        tx.accountGroup.findMany({
            where: {
                branchId,
                code: { startsWith: parentCode },
                NOT: { code: parentCode },
            },
            select: { code: true },
        }),
    ]);

    // Combine all codes and extract the numeric suffixes
    const allCodes = [
        ...existingLedgers.map((l: { code: string }) => l.code), // Fixed: Added type annotation
        ...existingSubGroups.map((g: { code: string }) => g.code), // Fixed: Added type annotation
    ];

    // Filter codes that match the pattern (parentCode.X)
    const directChildCodes = allCodes.filter((code) => {
        const parts = code.split(".");
        const parentParts = parentCode.split(".");
        return (
            parts.length === parentParts.length + 1 &&
            code.startsWith(parentCode + ".")
        );
    });

    // Extract numeric suffixes and find the next available number
    const usedNumbers = directChildCodes
        .map((code) => {
            const lastPart = code.split(".").pop();
            return parseInt(lastPart || "0", 10);
        })
        .filter((num) => !isNaN(num))
        .sort((a, b) => a - b);

    // Find the next available number
    let nextNumber = 1;
    for (const num of usedNumbers) {
        if (num === nextNumber) {
            nextNumber++;
        } else {
            break;
        }
    }

    return `${parentCode}.${nextNumber}`;
};