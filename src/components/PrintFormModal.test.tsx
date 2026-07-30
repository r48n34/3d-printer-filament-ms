import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Spool } from "../types";
import { PrintFormModal } from "./PrintFormModal";

const spool: Spool = {
    id: "spool-1",
    name: "Copper PLA",
    initialWeightG: 1000,
    material: "PLA",
    color: "#b87333",
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
};

describe("PrintFormModal", () => {
    it("opens a repeated print as a new prefilled record", () => {
        render(
            <MantineProvider>
                <ModalsProvider>
                    <PrintFormModal
                        opened
                        onClose={() => undefined}
                        spools={[spool]}
                        prints={[]}
                        adjustments={[]}
                        preset={{
                            spoolId: spool.id,
                            projectName: "Calibration cube",
                            quantity: 2,
                            gramsPerItem: 12,
                        }}
                    />
                </ModalsProvider>
            </MantineProvider>,
        );

        expect(
            screen.getByRole("dialog", { name: /log print again/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("textbox", { name: /project name/i }),
        ).toHaveValue("Calibration cube");
        expect(screen.getByRole("textbox", { name: /quantity/i })).toHaveValue(
            "2",
        );
        expect(
            screen.getByRole("textbox", { name: /grams each/i }),
        ).toHaveValue("12 g");
        expect(screen.getByRole("textbox", { name: /notes/i })).toHaveValue("");
        expect(
            screen.getByLabelText("Copper PLA filament color"),
        ).toBeInTheDocument();
    });
});
