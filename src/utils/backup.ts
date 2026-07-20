import { z } from "zod";

import { db } from "../db";
import type { FilamentBackup } from "../types";

const optionalText = z.string().optional();

const spoolSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    initialWeightG: z.number().positive(),
    material: z.enum(["PLA", "PETG", "TPU", "ABS", "ASA", "Other"]).optional(),
    customMaterial: optionalText,
    color: optionalText,
    brand: optionalText,
    purchaseDate: optionalText,
    purchasePrice: z.number().nonnegative().optional(),
    purchaseCurrency: optionalText,
    notes: optionalText,
    archivedAt: optionalText,
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
});

const printSchema = z.object({
    id: z.string().min(1),
    spoolId: z.string().min(1),
    projectName: z.string().min(1),
    quantity: z.number().int().positive(),
    gramsPerItem: z.number().positive(),
    printedAt: z.string().min(1),
    notes: optionalText,
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
});

const adjustmentSchema = z.object({
    id: z.string().min(1),
    spoolId: z.string().min(1),
    kind: z.enum(["add", "remove", "set"]),
    amountG: z.number().nonnegative(),
    reason: z.string().min(1),
    adjustedAt: z.string().min(1),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
});

const backupSchema = z.object({
    app: z.literal("spoolbook"),
    version: z.literal(1),
    exportedAt: z.string().min(1),
    spools: z.array(spoolSchema),
    prints: z.array(printSchema),
    adjustments: z.array(adjustmentSchema),
});

const ensureUniqueIds = (items: Array<{ id: string }>, label: string) => {
    if (new Set(items.map(({ id }) => id)).size !== items.length) {
        throw new Error(`${label} contains duplicate IDs.`);
    }
};

export const parseBackup = (source: string): FilamentBackup => {
    let json: unknown;
    try {
        json = JSON.parse(source);
    } catch {
        throw new Error("This file is not valid JSON.");
    }

    const backup = backupSchema.parse(json) as FilamentBackup;
    ensureUniqueIds(backup.spools, "Spools");
    ensureUniqueIds(backup.prints, "Print history");
    ensureUniqueIds(backup.adjustments, "Adjustments");

    const spoolIds = new Set(backup.spools.map(({ id }) => id));
    const orphaned = [...backup.prints, ...backup.adjustments].find(
        ({ spoolId }) => !spoolIds.has(spoolId),
    );
    if (orphaned)
        throw new Error("The backup contains history for a missing spool.");

    return backup;
};

export const createBackup = async (): Promise<FilamentBackup> => ({
    app: "spoolbook",
    version: 1,
    exportedAt: new Date().toISOString(),
    spools: await db.spools.toArray(),
    prints: await db.prints.toArray(),
    adjustments: await db.adjustments.toArray(),
});

export const replaceWithBackup = async (backup: FilamentBackup) => {
    await db.transaction(
        "rw",
        db.spools,
        db.prints,
        db.adjustments,
        async () => {
            await Promise.all([
                db.spools.clear(),
                db.prints.clear(),
                db.adjustments.clear(),
            ]);
            await db.spools.bulkAdd(backup.spools);
            await db.prints.bulkAdd(backup.prints);
            await db.adjustments.bulkAdd(backup.adjustments);
        },
    );
};

export const downloadBackup = async () => {
    const backup = await createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `spoolbook-backup-${backup.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
};
