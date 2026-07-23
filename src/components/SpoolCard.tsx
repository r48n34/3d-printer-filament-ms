import {
    Badge,
    Card,
    Group,
    Progress,
    Stack,
    Text,
    ThemeIcon,
} from "@mantine/core";
import {
    IconDisc,
} from "@tabler/icons-react";
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";

import type { Spool } from "../types";
import { getMaterialName, getProgressValue } from "../utils/filament";
import { formatGrams } from "../utils/format";

interface SpoolCardProps {
    spool: Spool;
    balance: number;
    // onEdit: () => void;
    // onArchive: () => void;
    onOpen?: () => void;
}

export function SpoolCard({
    spool,
    balance,
    // onEdit,
    // onArchive,
    onOpen,
}: SpoolCardProps) {
    const progress = getProgressValue(balance, spool.initialWeightG);
    const color = balance < 0 ? "red" : progress < 20 ? "orange" : "copper";

    return (
        <Card
            withBorder
            radius="lg"
            padding="lg"
            className={`spool-card${onOpen ? " spool-card-clickable" : ""}`}
            role={onOpen ? "link" : undefined}
            tabIndex={onOpen ? 0 : undefined}
            aria-label={onOpen ? `View details for ${spool.name}` : undefined}
            onClick={(event: ReactMouseEvent<HTMLDivElement>) => {
                if (!onOpen) return;
                if (
                    (event.target as HTMLElement).closest(
                        "button, a, [role='menuitem']",
                    )
                ) {
                    return;
                }
                onOpen();
            }}
            onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                if (!onOpen || event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen();
                }
            }}
        >
            <Stack gap="md">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                        <ThemeIcon
                            size={42}
                            radius="md"
                            variant="light"
                            color={ spool.color || "copper"}
                            style={
                                spool.color ? { color: spool.color } : undefined
                            }
                        >
                            <IconDisc size={23} />
                        </ThemeIcon>
                        <div>
                            <Text fw={500} lineClamp={1}>
                                {spool.name}
                            </Text>
                            <Group gap={6} mt={3}>
                                <Badge size="sm" variant="light" color="gray">
                                    {getMaterialName(spool)}
                                </Badge>
                                {spool.archivedAt ? (
                                    <Badge
                                        size="sm"
                                        variant="light"
                                        color="gray"
                                    >
                                        Archived
                                    </Badge>
                                ) : null}
                            </Group>
                        </div>
                    </Group>

                    {spool.purchaseDate && (
                        <Badge color={ spool.color || "copper"} radius={"md"}>
                            {spool.purchaseDate}
                        </Badge>
                    )}
                </Group>

                <div>
                    <Progress.Root size="xl" radius="xl">
                        <Progress.Section value={progress} color={spool.color || color}>
                            <Progress.Label>
                                <Text fz={12}>
                                    {formatGrams(balance)} {"/"}{" "}
                                    {formatGrams(spool.initialWeightG)} (
                                    {Math.round(progress)}%)
                                </Text>
                            </Progress.Label>
                        </Progress.Section>
                    </Progress.Root>
                </div>
                {/* {onOpen ? (
                    <Group justify="space-between" className="spool-card-link">
                        <Text size="xs" fw={500} c="copper.8">
                            View spool details
                        </Text>
                        <IconChevronRight size={16} />
                    </Group>
                ) : null} */}
            </Stack>
        </Card>
    );
}
