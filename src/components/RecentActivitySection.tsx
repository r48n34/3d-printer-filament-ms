import {
    Badge,
    Button,
    Card,
    Group,
    Stack,
    Text,
    ThemeIcon,
    Title,
    Tooltip,
} from "@mantine/core";
import {
    IconAdjustmentsHorizontal,
    IconHistory,
    IconPrinter,
    IconRepeat,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";

import type { LedgerEntry, PrintRecord, Spool } from "../types";
import { getPrintTotal } from "../utils/filament";
import { formatDateTime, formatGrams } from "../utils/format";

interface RecentActivitySectionProps {
    entries: LedgerEntry[];
    spools: Spool[];
    onRepeatPrint: (record: PrintRecord) => void;
}

export function RecentActivitySection({
    entries,
    spools,
    onRepeatPrint,
}: RecentActivitySectionProps) {
    const spoolsById = new Map(spools.map((spool) => [spool.id, spool]));

    return (
        <Card radius="lg" p="lg">
            <Stack gap="md">
                <Group justify="space-between">
                    <div>
                        <Title order={2} fz="lg">
                            Recent activity
                        </Title>
                        <Text size="sm" c="dimmed">
                            Your five latest ledger entries
                        </Text>
                    </div>
                    <Button
                        component={Link}
                        to="/history"
                        variant="subtle"
                        rightSection={<IconHistory size={16} />}
                    >
                        View history
                    </Button>
                </Group>

                <Stack gap={0}>
                    {entries.map((entry) => {
                        const spool = spoolsById.get(entry.record.spoolId);
                        const isPrint = entry.type === "print";
                        return (
                            <Group
                                key={`${entry.type}-${entry.record.id}`}
                                justify="space-between"
                                gap="md"
                                wrap="nowrap"
                                className="activity-row"
                            >
                                <Group
                                    gap="sm"
                                    wrap="nowrap"
                                    className="activity-main"
                                >
                                    <ThemeIcon
                                        variant="light"
                                        color={isPrint ? "orange" : "blue"}
                                        radius="xl"
                                    >
                                        {isPrint ? (
                                            <IconPrinter size={17} />
                                        ) : (
                                            <IconAdjustmentsHorizontal
                                                size={17}
                                            />
                                        )}
                                    </ThemeIcon>
                                    <div className="activity-copy">
                                        <Group gap="xs">
                                            <Text
                                                size="sm"
                                                fw={600}
                                                lineClamp={1}
                                            >
                                                {isPrint
                                                    ? entry.record.projectName
                                                    : entry.record.reason}
                                            </Text>
                                            <Badge
                                                size="xs"
                                                variant="light"
                                                color={
                                                    isPrint ? "orange" : "blue"
                                                }
                                            >
                                                {isPrint
                                                    ? `−${formatGrams(
                                                          getPrintTotal(
                                                              entry.record,
                                                          ),
                                                      )}`
                                                    : "Adjustment"}
                                            </Badge>
                                        </Group>
                                        <Text size="xs" c="dimmed">
                                            {spool?.name ?? "Missing spool"} ·{" "}
                                            {formatDateTime(entry.occurredAt)}
                                        </Text>
                                    </div>
                                </Group>

                                {isPrint && spool ? (
                                    spool.archivedAt ? (
                                        <Tooltip label="Restore this spool before logging another print">
                                            <Button
                                                component={Link}
                                                to={`/filaments/${spool.id}`}
                                                size="xs"
                                                variant="subtle"
                                                color="gray"
                                            >
                                                Restore spool
                                            </Button>
                                        </Tooltip>
                                    ) : (
                                        <Button
                                            size="xs"
                                            variant="light"
                                            leftSection={
                                                <IconRepeat size={15} />
                                            }
                                            onClick={() =>
                                                onRepeatPrint(entry.record)
                                            }
                                        >
                                            Log again
                                        </Button>
                                    )
                                ) : null}
                            </Group>
                        );
                    })}
                </Stack>
            </Stack>
        </Card>
    );
}
