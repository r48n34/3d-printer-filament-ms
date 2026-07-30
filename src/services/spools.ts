import { db } from "../db";
import type { Spool } from "../types";

export const setSpoolArchived = async (spool: Spool, archived: boolean) => {
    const now = new Date().toISOString();
    await db.spools.update(spool.id, {
        archivedAt: archived ? (spool.archivedAt ?? now) : undefined,
        updatedAt: now,
    });
};
