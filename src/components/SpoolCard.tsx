import {
    ActionIcon,
    Badge,
    Card,
    ColorSwatch,
    Group,
    Menu,
    Progress,
    Stack,
    Text,
} from "@mantine/core";
import {
    IconAdjustmentsHorizontal,
    IconArchive,
    IconDotsVertical,
    IconEdit,
    IconPrinter,
    IconRestore,
} from "@tabler/icons-react";
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";

import type { Spool } from "../types";
import {
    getAvailabilityLabel,
    getMaterialName,
    getProgressValue,
    getSpoolAvailability,
} from "../utils/filament";
import { formatDate, formatGrams } from "../utils/format";

interface SpoolCardProps {
    spool: Spool;
    balance: number;
    onOpen?: () => void;
    onPrint?: () => void;
    onAdjust?: () => void;
    onEdit?: () => void;
    onArchive?: () => void;
}

export function SpoolCard({
    spool,
    balance,
    onOpen,
    onPrint,
    onAdjust,
    onEdit,
    onArchive,
}: SpoolCardProps) {
    const progress = getProgressValue(balance, spool.initialWeightG);
    const availability = getSpoolAvailability(spool, balance);
    const statusColor =
        availability === "depleted"
            ? "red"
            : availability === "low"
              ? "orange"
              : "copper";
    const hasActions = onPrint || onAdjust || onEdit || onArchive;

    return (
        <Card
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
                        <ColorSwatch
                            size={34}
                            color={
                                spool.color ?? "var(--mantine-color-copper-6)"
                            }
                            aria-label={
                                spool.color
                                    ? `${spool.name} filament color`
                                    : `${spool.name} color not set`
                            }
                        />
                        <div>
                            <Text fw={600} lineClamp={1}>
                                {spool.name}
                            </Text>
                            <Group gap={6} mt={4}>
                                <Badge size="sm" variant="light" color="gray">
                                    {getMaterialName(spool)}
                                </Badge>
                                <Badge
                                    size="sm"
                                    variant="light"
                                    color={
                                        spool.archivedAt ? "gray" : statusColor
                                    }
                                >
                                    {spool.archivedAt
                                        ? "Archived"
                                        : getAvailabilityLabel(availability)}
                                </Badge>
                            </Group>
                        </div>
                    </Group>

                    {hasActions ? (
                        <Menu
                            position="bottom-end"
                            withinPortal
                            transitionProps={{ duration: 0 }}
                        >
                            <Menu.Target>
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    aria-label={`Actions for ${spool.name}`}
                                    title={`Actions for ${spool.name}`}
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <IconDotsVertical size={18} />
                                </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                                {onPrint ? (
                                    <Menu.Item
                                        leftSection={<IconPrinter size={16} />}
                                        disabled={Boolean(spool.archivedAt)}
                                        title={
                                            spool.archivedAt
                                                ? "Restore this spool before logging a print"
                                                : undefined
                                        }
                                        onClick={onPrint}
                                    >
                                        Log print
                                    </Menu.Item>
                                ) : null}
                                {onAdjust ? (
                                    <Menu.Item
                                        leftSection={
                                            <IconAdjustmentsHorizontal
                                                size={16}
                                            />
                                        }
                                        disabled={Boolean(spool.archivedAt)}
                                        title={
                                            spool.archivedAt
                                                ? "Restore this spool before adjusting stock"
                                                : undefined
                                        }
                                        onClick={onAdjust}
                                    >
                                        Adjust stock
                                    </Menu.Item>
                                ) : null}
                                {onEdit ? (
                                    <Menu.Item
                                        leftSection={<IconEdit size={16} />}
                                        onClick={onEdit}
                                    >
                                        Edit
                                    </Menu.Item>
                                ) : null}
                                {onArchive ? (
                                    <Menu.Item
                                        color={
                                            spool.archivedAt ? undefined : "red"
                                        }
                                        leftSection={
                                            spool.archivedAt ? (
                                                <IconRestore size={16} />
                                            ) : (
                                                <IconArchive size={16} />
                                            )
                                        }
                                        onClick={onArchive}
                                    >
                                        {spool.archivedAt
                                            ? "Restore"
                                            : "Archive"}
                                    </Menu.Item>
                                ) : null}
                            </Menu.Dropdown>
                        </Menu>
                    ) : null}
                </Group>

                <div>
                    <Group justify="space-between" gap="xs" mb={6}>
                        <Text size="xs" c="dimmed">
                            Remaining
                        </Text>
                        <Text size="sm" fw={600} c={`${statusColor}.8`}>
                            {formatGrams(balance)} /{" "}
                            {formatGrams(spool.initialWeightG)}
                        </Text>
                    </Group>
                    <Progress
                        value={progress}
                        color={statusColor}
                        radius="xl"
                        aria-label={`${spool.name} remaining filament`}
                    />
                </div>

                {spool.purchaseDate ? (
                    <Text size="xs" c="dimmed">
                        Purchased {formatDate(spool.purchaseDate)}
                    </Text>
                ) : null}
            </Stack>
        </Card>
    );
}
