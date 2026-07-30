import {
    Badge,
    Button,
    Card,
    Group,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import { IconAlertTriangle, IconScale } from "@tabler/icons-react";
import { Link } from "react-router-dom";

import type { Spool } from "../types";
import { getAvailabilityLabel, getSpoolAvailability } from "../utils/filament";
import { formatGrams } from "../utils/format";

export interface AttentionSpool {
    spool: Spool;
    balance: number;
}

interface LowStockSectionProps {
    items: AttentionSpool[];
    lowCount: number;
    depletedCount: number;
    onAdjust: (spool: Spool) => void;
}

export function LowStockSection({
    items,
    lowCount,
    depletedCount,
    onAdjust,
}: LowStockSectionProps) {
    return (
        <Card radius="lg" p="lg">
            <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                    <Group gap="sm">
                        <ThemeIcon color="orange" variant="light" radius="md">
                            <IconAlertTriangle size={18} />
                        </ThemeIcon>
                        <div>
                            <Title order={2} fz="lg">
                                Needs attention
                            </Title>
                            <Text size="sm" c="dimmed">
                                {lowCount} low stock · {depletedCount} depleted
                            </Text>
                        </div>
                    </Group>
                    <Group gap={6}>
                        {lowCount > 0 ? (
                            <Button
                                component={Link}
                                to="/filaments?status=low"
                                variant="subtle"
                                size="xs"
                            >
                                Low stock
                            </Button>
                        ) : null}
                        {depletedCount > 0 ? (
                            <Button
                                component={Link}
                                to="/filaments?status=depleted"
                                variant="subtle"
                                color="red"
                                size="xs"
                            >
                                Depleted
                            </Button>
                        ) : null}
                    </Group>
                </Group>

                <Stack gap="xs">
                    {items.map(({ spool, balance }) => {
                        const availability = getSpoolAvailability(
                            spool,
                            balance,
                        );
                        const color =
                            availability === "depleted" ? "red" : "orange";
                        return (
                            <Group
                                key={spool.id}
                                justify="space-between"
                                gap="md"
                                wrap="nowrap"
                                className="attention-row"
                            >
                                <Group gap="sm" wrap="nowrap">
                                    <ThemeIcon
                                        color={color}
                                        variant="light"
                                        radius="xl"
                                    >
                                        <IconScale size={17} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="sm" fw={600}>
                                            {spool.name}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {formatGrams(balance)} remaining
                                        </Text>
                                    </div>
                                </Group>
                                <Group gap="xs" wrap="nowrap">
                                    <Badge
                                        variant="light"
                                        color={color}
                                        visibleFrom="xs"
                                    >
                                        {getAvailabilityLabel(availability)}
                                    </Badge>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        onClick={() => onAdjust(spool)}
                                    >
                                        Adjust
                                    </Button>
                                    <Button
                                        component={Link}
                                        to={`/filaments/${spool.id}`}
                                        size="xs"
                                        variant="subtle"
                                        color="gray"
                                    >
                                        View
                                    </Button>
                                </Group>
                            </Group>
                        );
                    })}
                </Stack>
            </Stack>
        </Card>
    );
}
