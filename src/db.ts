import Dexie, { type EntityTable } from "dexie";

import type { AdjustmentRecord, PrintRecord, Spool } from "./types";

export class FilamentDatabase extends Dexie {
    spools!: EntityTable<Spool, "id">;
    prints!: EntityTable<PrintRecord, "id">;
    adjustments!: EntityTable<AdjustmentRecord, "id">;

    constructor(name = "spoolbook") {
        super(name);
        this.version(1).stores({
            spools: "id, name, material, archivedAt, createdAt, updatedAt",
            prints: "id, spoolId, printedAt, createdAt, updatedAt",
            adjustments: "id, spoolId, kind, adjustedAt, createdAt, updatedAt",
        });
    }
}

export const db = new FilamentDatabase();

export const createId = () => crypto.randomUUID();
