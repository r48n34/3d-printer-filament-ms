import { describe, expect, it } from "vitest";

import type { AdjustmentRecord, PrintRecord, Spool } from "../types";
import {
    calculateBalance,
    getAvailabilityLabel,
    getEstimatedPrintCost,
    getLedgerEntries,
    getLowStockThreshold,
    getPrintTotal,
    getSpoolAvailability,
} from "./filament";

const spool: Spool = {
    id: "spool-1",
    name: "Copper PLA",
    initialWeightG: 100,
    material: "PLA",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
};

const makePrint = (overrides: Partial<PrintRecord> = {}): PrintRecord => ({
    id: "print-1",
    spoolId: spool.id,
    projectName: "Apple",
    quantity: 2,
    gramsPerItem: 13,
    printedAt: "2026-01-01T10:00:00.000Z",
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    ...overrides,
});

const makeAdjustment = (
    overrides: Partial<AdjustmentRecord> = {},
): AdjustmentRecord => ({
    id: "adjustment-1",
    spoolId: spool.id,
    kind: "add",
    amountG: 10,
    reason: "Sample refill",
    adjustedAt: "2026-01-01T11:00:00.000Z",
    createdAt: "2026-01-01T11:00:00.000Z",
    updatedAt: "2026-01-01T11:00:00.000Z",
    ...overrides,
});

describe("filament calculations", () => {
    it("deducts quantity multiplied by grams per item", () => {
        const print = makePrint();
        expect(getPrintTotal(print)).toBe(26);
        expect(calculateBalance(spool, [print], [])).toBe(74);
    });

    it("estimates material cost from spool price and starting weight", () => {
        const print = makePrint();
        expect(
            getEstimatedPrintCost(
                { initialWeightG: 1000, purchasePrice: 200 },
                print,
            ),
        ).toBe(5.2);
        expect(
            getEstimatedPrintCost({ initialWeightG: 1000 }, print),
        ).toBeUndefined();
    });

    it("applies add, remove, and set adjustments chronologically", () => {
        const prints = [
            makePrint({ id: "first", quantity: 1, gramsPerItem: 10 }),
            makePrint({
                id: "last",
                quantity: 1,
                gramsPerItem: 5,
                printedAt: "2026-01-03T10:00:00.000Z",
                createdAt: "2026-01-03T10:00:00.000Z",
            }),
        ];
        const adjustments = [
            makeAdjustment({
                id: "set",
                kind: "set",
                amountG: 50,
                adjustedAt: "2026-01-02T10:00:00.000Z",
                createdAt: "2026-01-02T10:00:00.000Z",
            }),
            makeAdjustment({
                id: "add",
                kind: "add",
                amountG: 2.5,
                adjustedAt: "2026-01-04T10:00:00.000Z",
                createdAt: "2026-01-04T10:00:00.000Z",
            }),
            makeAdjustment({
                id: "remove",
                kind: "remove",
                amountG: 1.25,
                adjustedAt: "2026-01-05T10:00:00.000Z",
                createdAt: "2026-01-05T10:00:00.000Z",
            }),
        ];
        expect(calculateBalance(spool, prints, adjustments)).toBe(46.25);
    });

    it("uses creation time and ID to order equal-time entries deterministically", () => {
        const entries = getLedgerEntries(
            [
                makePrint({
                    id: "z-print",
                    createdAt: "2026-01-01T12:00:00.000Z",
                }),
            ],
            [
                makeAdjustment({
                    id: "a-adjustment",
                    adjustedAt: "2026-01-01T10:00:00.000Z",
                    createdAt: "2026-01-01T12:00:00.000Z",
                }),
            ],
        );
        expect(entries.map(({ record }) => record.id)).toEqual([
            "a-adjustment",
            "z-print",
        ]);
    });

    it("allows a negative calculated balance", () => {
        expect(
            calculateBalance(
                spool,
                [makePrint({ quantity: 1, gramsPerItem: 120 })],
                [],
            ),
        ).toBe(-20);
    });

    it("classifies default and custom low-stock thresholds", () => {
        expect(getLowStockThreshold(spool)).toBe(100);
        expect(getSpoolAvailability(spool, 101)).toBe("available");
        expect(getSpoolAvailability(spool, 100)).toBe("low");
        expect(getSpoolAvailability(spool, 0)).toBe("depleted");
        expect(getSpoolAvailability(spool, -1)).toBe("depleted");

        const custom = { ...spool, lowStockThresholdG: 20 };
        expect(getLowStockThreshold(custom)).toBe(20);
        expect(getSpoolAvailability(custom, 21)).toBe("available");
        expect(getSpoolAvailability(custom, 20)).toBe("low");
        expect(getAvailabilityLabel("low")).toBe("Low stock");
    });
});
