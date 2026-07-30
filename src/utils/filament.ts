import type {
    AdjustmentRecord,
    LedgerEntry,
    PrintRecord,
    Spool,
} from "../types";

export const DEFAULT_LOW_STOCK_THRESHOLD_G = 100;

export type SpoolAvailability = "available" | "low" | "depleted";

export const getPrintTotal = (
    record: Pick<PrintRecord, "quantity" | "gramsPerItem">,
) => Math.round(record.quantity * record.gramsPerItem * 100) / 100;

export const getEstimatedPrintCost = (
    spool: Pick<Spool, "initialWeightG" | "purchasePrice">,
    record: Pick<PrintRecord, "quantity" | "gramsPerItem">,
) => {
    if (spool.purchasePrice === undefined || spool.initialWeightG <= 0)
        return undefined;
    return (
        Math.round(
            ((spool.purchasePrice * getPrintTotal(record)) /
                spool.initialWeightG) *
                10000,
        ) / 10000
    );
};

export const getLedgerEntries = (
    prints: PrintRecord[],
    adjustments: AdjustmentRecord[],
): LedgerEntry[] =>
    [
        ...prints.map((record) => ({
            type: "print" as const,
            occurredAt: record.printedAt,
            record,
        })),
        ...adjustments.map((record) => ({
            type: "adjustment" as const,
            occurredAt: record.adjustedAt,
            record,
        })),
    ].sort((left, right) => {
        const byOccurrence = left.occurredAt.localeCompare(right.occurredAt);
        if (byOccurrence !== 0) return byOccurrence;
        const byCreation = left.record.createdAt.localeCompare(
            right.record.createdAt,
        );
        if (byCreation !== 0) return byCreation;
        return left.record.id.localeCompare(right.record.id);
    });

export const calculateBalance = (
    spool: Pick<Spool, "initialWeightG">,
    prints: PrintRecord[],
    adjustments: AdjustmentRecord[],
) => {
    let balance = spool.initialWeightG;

    for (const entry of getLedgerEntries(prints, adjustments)) {
        if (entry.type === "print") {
            balance -= getPrintTotal(entry.record);
            continue;
        }

        const { kind, amountG } = entry.record;
        if (kind === "set") balance = amountG;
        if (kind === "add") balance += amountG;
        if (kind === "remove") balance -= amountG;
    }

    return Math.round(balance * 100) / 100;
};

export const getSpoolBalance = (
    spool: Spool,
    prints: PrintRecord[],
    adjustments: AdjustmentRecord[],
) =>
    calculateBalance(
        spool,
        prints.filter((record) => record.spoolId === spool.id),
        adjustments.filter((record) => record.spoolId === spool.id),
    );

export const getProgressValue = (balance: number, initialWeight: number) => {
    if (initialWeight <= 0) return 0;
    return Math.min(100, Math.max(0, (balance / initialWeight) * 100));
};

export const getLowStockThreshold = (
    spool: Pick<Spool, "lowStockThresholdG">,
) => spool.lowStockThresholdG ?? DEFAULT_LOW_STOCK_THRESHOLD_G;

export const getSpoolAvailability = (
    spool: Pick<Spool, "lowStockThresholdG">,
    balance: number,
): SpoolAvailability => {
    if (balance <= 0) return "depleted";
    if (balance <= getLowStockThreshold(spool)) return "low";
    return "available";
};

export const getAvailabilityLabel = (availability: SpoolAvailability) => {
    if (availability === "low") return "Low stock";
    if (availability === "depleted") return "Depleted";
    return "Available";
};

export const getMaterialName = (spool: Spool) =>
    spool.material === "Other"
        ? spool.customMaterial || "Other"
        : spool.material || "Unspecified";
