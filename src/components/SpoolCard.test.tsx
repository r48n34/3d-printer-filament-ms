import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Spool } from "../types";
import { SpoolCard } from "./SpoolCard";

const spool: Spool = {
    id: "spool-1",
    name: "Copper PLA",
    initialWeightG: 1000,
    material: "PLA",
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
};

describe("SpoolCard", () => {
    it("opens spool details by click and keyboard", async () => {
        const user = userEvent.setup();
        const onOpen = vi.fn();

        render(
            <MantineProvider>
                <SpoolCard
                    spool={spool}
                    balance={820}
                    onOpen={onOpen}
                    onEdit={() => undefined}
                    onArchive={() => undefined}
                />
            </MantineProvider>,
        );

        const card = screen.getByRole("link", {
            name: /view details for copper pla/i,
        });
        await user.click(card);
        expect(onOpen).toHaveBeenCalledTimes(1);

        card.focus();
        await user.keyboard("{Enter}");
        expect(onOpen).toHaveBeenCalledTimes(2);
    });

    it("keeps card actions separate from navigation", async () => {
        const user = userEvent.setup();
        const onOpen = vi.fn();
        const onPrint = vi.fn();

        render(
            <MantineProvider>
                <SpoolCard
                    spool={spool}
                    balance={820}
                    onOpen={onOpen}
                    onPrint={onPrint}
                    onAdjust={() => undefined}
                    onEdit={() => undefined}
                    onArchive={() => undefined}
                />
            </MantineProvider>,
        );

        await user.click(
            screen.getByRole("button", { name: /actions for copper pla/i }),
        );
        expect(onOpen).not.toHaveBeenCalled();

        expect(onOpen).not.toHaveBeenCalled();
    });

    it("shows semantic stock states", () => {
        const { rerender } = render(
            <MantineProvider>
                <SpoolCard spool={spool} balance={50} />
            </MantineProvider>,
        );
        expect(screen.getByText("Low stock")).toBeInTheDocument();

        rerender(
            <MantineProvider>
                <SpoolCard spool={spool} balance={0} />
            </MantineProvider>,
        );
        expect(screen.getByText("Depleted")).toBeInTheDocument();
    });
});
