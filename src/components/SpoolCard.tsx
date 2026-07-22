import {
    ActionIcon,
    Badge,
    Card,
    Group,
    Menu,
    Progress,
    Stack,
    Text,
    ThemeIcon,
    Tooltip,
} from "@mantine/core";
import {
    IconArchive,
    IconDisc,
    IconDots,
    IconEdit,
    IconRestore,
} from "@tabler/icons-react";
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";

import type { Spool } from "../types";
import { getMaterialName, getProgressValue } from "../utils/filament";
import { formatGrams } from "../utils/format";

interface SpoolCardProps {
    spool: Spool;
    balance: number;
    onEdit: () => void;
    onArchive: () => void;
    onOpen?: () => void;
}

export function SpoolCard({
    spool,
    balance,
    onEdit,
    onArchive,
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
                            color="copper"
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
                    <Menu position="bottom-end" shadow="md">
                        <Menu.Target>
                            <Tooltip label="Spool actions">
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    aria-label={`Actions for ${spool.name}`}
                                >
                                    <IconDots size={19} />
                                </ActionIcon>
                            </Tooltip>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item
                                leftSection={<IconEdit size={16} />}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onEdit();
                                }}
                            >
                                Edit spool
                            </Menu.Item>
                            <Menu.Item
                                leftSection={
                                    spool.archivedAt ? (
                                        <IconRestore size={16} />
                                    ) : (
                                        <IconArchive size={16} />
                                    )
                                }
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onArchive();
                                }}
                            >
                                {spool.archivedAt
                                    ? "Restore spool"
                                    : "Archive spool"}
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>

                <div>
                    <Progress.Root size="xl" radius="xl">
                        <Progress.Section value={progress} color={color}>
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
