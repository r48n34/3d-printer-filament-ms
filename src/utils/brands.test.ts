import { describe, expect, it } from "vitest";

import type { Spool } from "../types";
import { getBrandSuggestions } from "./brands";

const createSpool = (brand?: string): Spool => ({
    id: crypto.randomUUID(),
    name: "Test spool",
    initialWeightG: 1000,
    brand,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("getBrandSuggestions", () => {
    it("returns sorted, unique non-empty brands", () => {
        expect(
            getBrandSuggestions([
                createSpool("  Bambu Lab  "),
                createSpool("Polymaker"),
                createSpool("bambu lab"),
                createSpool(),
                createSpool("   "),
            ]),
        ).toEqual(["Bambu Lab", "Polymaker"]);
    });
});
