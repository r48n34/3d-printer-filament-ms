import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { db } from "../db";
import type { Spool } from "../types";
import { QuickPrintSection } from "./QuickPrintSection";

const spool: Spool = {
    id: "test-spool",
    name: "Copper PLA",
    initialWeightG: 1000,
    material: "PLA",
    purchasePrice: 200,
    purchaseCurrency: "HKD",
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
};

afterEach(async () => {
    await db.prints.clear();
});

describe("QuickPrintSection", () => {
    it("adds a completed print directly to history", async () => {
        const user = userEvent.setup();
        render(
            <MantineProvider>
                <ModalsProvider>
                    <QuickPrintSection
                        spools={[spool]}
                        prints={[]}
                        adjustments={[]}
                        onAddSpool={() => undefined}
                    />
                </ModalsProvider>
            </MantineProvider>,
        );

        await user.type(
            screen.getByRole("textbox", { name: /what did you print/i }),
            "Apple",
        );
        const quantity = screen.getByRole("textbox", { name: /quantity/i });
        await user.clear(quantity);
        await user.type(quantity, "2");
        await user.type(
            screen.getByRole("textbox", { name: /grams each/i }),
            "13",
        );
        expect(screen.getByText(/5\.20/)).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /add history/i }));

        await waitFor(async () => {
            const records = await db.prints.toArray();
            expect(records).toHaveLength(1);
            expect(records[0]).toMatchObject({
                spoolId: spool.id,
                projectName: "Apple",
                quantity: 2,
                gramsPerItem: 13,
            });
        });
    });
});
