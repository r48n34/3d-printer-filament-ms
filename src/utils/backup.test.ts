import { afterEach, describe, expect, it } from "vitest";
import { db } from "../db";
import type { FilamentBackup } from "../types";
import { createBackup, parseBackup, replaceWithBackup } from "./backup";

const validBackup: FilamentBackup = {
  app: "spoolbook",
  version: 1,
  exportedAt: "2026-07-20T10:00:00.000Z",
  spools: [
    {
      id: "spool-1",
      name: "PETG Black",
      initialWeightG: 1000,
      material: "PETG",
      createdAt: "2026-07-20T10:00:00.000Z",
      updatedAt: "2026-07-20T10:00:00.000Z",
    },
  ],
  prints: [
    {
      id: "print-1",
      spoolId: "spool-1",
      projectName: "Bracket",
      quantity: 2,
      gramsPerItem: 13,
      printedAt: "2026-07-20T11:00:00.000Z",
      createdAt: "2026-07-20T11:00:00.000Z",
      updatedAt: "2026-07-20T11:00:00.000Z",
    },
  ],
  adjustments: [],
};

afterEach(async () => {
  await db.transaction("rw", db.spools, db.prints, db.adjustments, async () => {
    await Promise.all([db.spools.clear(), db.prints.clear(), db.adjustments.clear()]);
  });
});

describe("backup validation and persistence", () => {
  it("parses a valid versioned backup", () => {
    expect(parseBackup(JSON.stringify(validBackup))).toEqual(validBackup);
  });

  it("rejects malformed JSON and orphaned history", () => {
    expect(() => parseBackup("{")).toThrow("not valid JSON");
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...validBackup,
          prints: [{ ...validBackup.prints[0], spoolId: "missing-spool" }],
        }),
      ),
    ).toThrow("missing spool");
  });

  it("rejects duplicate record IDs", () => {
    expect(() =>
      parseBackup(
        JSON.stringify({
          ...validBackup,
          prints: [validBackup.prints[0], validBackup.prints[0]],
        }),
      ),
    ).toThrow("duplicate IDs");
  });

  it("atomically replaces and exports IndexedDB data", async () => {
    await replaceWithBackup(validBackup);
    const exported = await createBackup();
    expect(exported.spools).toEqual(validBackup.spools);
    expect(exported.prints).toEqual(validBackup.prints);
    expect(exported.adjustments).toEqual([]);
  });
});
