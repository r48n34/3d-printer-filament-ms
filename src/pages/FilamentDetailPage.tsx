import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Card,
    ColorSwatch,
    Divider,
    Grid,
    Group,
    Menu,
    Paper,
    Progress,
    ScrollArea,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    ThemeIcon,
    Title,
    Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
    IconAdjustmentsHorizontal,
    IconArchive,
    IconArrowLeft,
    IconCalendar,
    IconCoin,
    IconDisc,
    IconDots,
    IconEdit,
    IconHistory,
    IconPalette,
    IconPrinter,
    IconRestore,
    IconScale,
    IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AdjustmentFormModal } from "../components/AdjustmentFormModal";
import { PageHeader } from "../components/PageHeader";
import { PrintFormModal } from "../components/PrintFormModal";
import { SpoolFormModal } from "../components/SpoolFormModal";
import { db } from "../db";
import { useInventoryData } from "../hooks/useInventoryData";
import type {
    AdjustmentRecord,
    LedgerEntry,
    PrintRecord,
    Spool,
} from "../types";
import {
    getEstimatedPrintCost,
    getLedgerEntries,
    getMaterialName,
    getPrintTotal,
    getProgressValue,
} from "../utils/filament";
import {
    formatDate,
    formatDateTime,
    formatGrams,
    formatMoney,
} from "../utils/format";

export function FilamentDetailPage() {
    const { spoolId } = useParams();
    const navigate = useNavigate();
    const { spools, prints, adjustments, balanceBySpool, loading } =
        useInventoryData();
    const spool = spools.find(({ id }) => id === spoolId);
    const [editOpened, editModal] = useDisclosure(false);
    const [printOpened, printModal] = useDisclosure(false);
    const [adjustmentOpened, adjustmentModal] = useDisclosure(false);
    const [editingPrint, setEditingPrint] = useState<PrintRecord>();
    const [editingAdjustment, setEditingAdjustment] =
        useState<AdjustmentRecord>();

    if (loading) {
        return (
            <Stack gap="xl">
                <Skeleton height={28} width={140} />
                <Skeleton height={72} radius="lg" />
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                    {Array.from({ length: 4 }, (_, index) => (
                        <Skeleton key={index} height={120} radius="lg" />
                    ))}
                </SimpleGrid>
                <Skeleton height={360} radius="lg" />
            </Stack>
        );
    }

    if (!spool) {
        return (
            <Stack gap="lg">
                <Button
                    component={Link}
                    to="/filaments"
                    variant="subtle"
                    leftSection={<IconArrowLeft size={17} />}
                    w="fit-content"
                >
                    Back to filaments
                </Button>
                <Alert color="orange" title="Filament not found">
                    This spool may have been removed or the link is no longer
                    valid.
                </Alert>
            </Stack>
        );
    }

    const spoolPrints = prints.filter((record) => record.spoolId === spool.id);
    const spoolAdjustments = adjustments.filter(
        (record) => record.spoolId === spool.id,
    );
    const entries = getLedgerEntries(spoolPrints, spoolAdjustments).reverse();
    const balance = balanceBySpool.get(spool.id) ?? spool.initialWeightG;
    const printedWeight = spoolPrints.reduce(
        (sum, record) => sum + getPrintTotal(record),
        0,
    );
    const estimatedCost =
        spool.purchasePrice === undefined
            ? undefined
            : spoolPrints.reduce(
                  (sum, record) =>
                      sum + (getEstimatedPrintCost(spool, record) ?? 0),
                  0,
              );
    const progress = getProgressValue(balance, spool.initialWeightG);

    const openPrint = (record?: PrintRecord) => {
        setEditingPrint(record);
        printModal.open();
    };

    const openAdjustment = (record?: AdjustmentRecord) => {
        setEditingAdjustment(record);
        adjustmentModal.open();
    };

    const toggleArchive = () => {
        const restoring = Boolean(spool.archivedAt);
        modals.openConfirmModal({
            title: restoring ? "Restore this spool?" : "Archive this spool?",
            children: restoring
                ? `${spool.name} will be available for new print records again.`
                : `New prints will be disabled, but all data and history for ${spool.name} will remain available.`,
            labels: {
                confirm: restoring ? "Restore spool" : "Archive spool",
                cancel: "Cancel",
            },
            onConfirm: async () => {
                await db.spools.update(spool.id, {
                    archivedAt: restoring
                        ? undefined
                        : new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
                notifications.show({
                    color: "teal",
                    message: `${spool.name} ${restoring ? "restored" : "archived"}.`,
                });
            },
        });
    };

    const removeEntry = (entry: LedgerEntry) => {
        const label =
            entry.type === "print"
                ? entry.record.projectName
                : entry.record.reason;
        modals.openConfirmModal({
            title: "Delete this activity?",
            children: `“${label}” will be removed and this spool's balance will be recalculated.`,
            labels: { confirm: "Delete activity", cancel: "Cancel" },
            confirmProps: { color: "red" },
            onConfirm: async () => {
                if (entry.type === "print")
                    await db.prints.delete(entry.record.id);
                else await db.adjustments.delete(entry.record.id);
                notifications.show({
                    color: "teal",
                    message: "Activity deleted.",
                });
            },
        });
    };

    return (
        <Stack gap="xl">
            <Button
                component={Link}
                to="/filaments"
                variant="subtle"
                color="gray"
                leftSection={<IconArrowLeft size={17} />}
                w="fit-content"
                px={0}
            >
                Filament library
            </Button>

            <PageHeader
                title={spool.name}
                description={`${getMaterialName(spool)}${spool.brand ? ` · ${spool.brand}` : ""} · Added ${formatDate(spool.createdAt)}`}
                actions={
                    <Group gap="sm">
                        <Button
                            variant="default"
                            leftSection={<IconEdit size={17} />}
                            onClick={editModal.open}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="default"
                            leftSection={
                                <IconAdjustmentsHorizontal size={17} />
                            }
                            onClick={() => openAdjustment()}
                            disabled={Boolean(spool.archivedAt)}
                        >
                            Adjust stock
                        </Button>
                        <Button
                            leftSection={<IconPrinter size={17} />}
                            onClick={() => openPrint()}
                            disabled={Boolean(spool.archivedAt)}
                        >
                            Add print
                        </Button>
                    </Group>
                }
            />

            {spool.archivedAt ? (
                <Alert color="gray" title="This spool is archived">
                    <Group justify="space-between" gap="md">
                        <Text size="sm">
                            Restore it before adding prints or stock
                            adjustments.
                        </Text>
                        <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconRestore size={15} />}
                            onClick={toggleArchive}
                        >
                            Restore spool
                        </Button>
                    </Group>
                </Alert>
            ) : null}

            <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
                <SummaryCard
                    icon={<IconScale size={21} />}
                    label="Remaining"
                    value={formatGrams(balance)}
                    detail={`${Math.round(progress)}% of starting weight`}
                    color={balance < 0 ? "red" : "copper"}
                />
                <SummaryCard
                    icon={<IconPrinter size={21} />}
                    label="Printed usage"
                    value={formatGrams(printedWeight)}
                    detail={`${spoolPrints.length} print ${spoolPrints.length === 1 ? "record" : "records"}`}
                />
                <SummaryCard
                    icon={<IconCoin size={21} />}
                    label="Est. material cost"
                    value={
                        estimatedCost !== undefined
                            ? formatMoney(estimatedCost, spool.purchaseCurrency)
                            : "Not priced"
                    }
                    detail="Based on recorded prints"
                />
                <SummaryCard
                    icon={<IconHistory size={21} />}
                    label="Related activity"
                    value={String(entries.length)}
                    detail={`${spoolAdjustments.length} stock adjustments`}
                />
            </SimpleGrid>

            <Paper withBorder radius="lg" p="lg">
                <Group justify="space-between" mb="sm">
                    <div>
                        <Text fw={700}>Spool balance</Text>
                        <Text size="xs" c="dimmed">
                            {formatGrams(balance)} remaining from{" "}
                            {formatGrams(spool.initialWeightG)} starting weight
                        </Text>
                    </div>
                    <Badge
                        variant="light"
                        color={
                            balance < 0
                                ? "red"
                                : progress < 20
                                  ? "orange"
                                  : "copper"
                        }
                    >
                        {balance < 0
                            ? "Below zero"
                            : `${Math.round(progress)}% left`}
                    </Badge>
                </Group>
                <Progress
                    value={progress}
                    size="lg"
                    radius="xl"
                    color={
                        balance < 0
                            ? "red"
                            : progress < 20
                              ? "orange"
                              : "copper"
                    }
                    aria-label={`${spool.name} remaining filament`}
                />
            </Paper>

            <Grid>
                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Card withBorder radius="lg" p="xl" h="100%">
                        <Group justify="space-between" mb="lg">
                            <div>
                                <Title order={2}>Filament data</Title>
                                <Text size="sm" c="dimmed">
                                    Details and pricing for this spool
                                </Text>
                            </div>
                            <Tooltip
                                label={
                                    spool.archivedAt
                                        ? "Restore spool"
                                        : "Archive spool"
                                }
                            >
                                <ActionIcon
                                    variant="light"
                                    color="gray"
                                    onClick={toggleArchive}
                                    aria-label={
                                        spool.archivedAt
                                            ? "Restore spool"
                                            : "Archive spool"
                                    }
                                >
                                    {spool.archivedAt ? (
                                        <IconRestore size={18} />
                                    ) : (
                                        <IconArchive size={18} />
                                    )}
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                        <Stack gap="md">
                            <DetailItem
                                icon={<IconDisc size={17} />}
                                label="Material"
                                value={getMaterialName(spool)}
                            />
                            <DetailItem
                                icon={<IconScale size={17} />}
                                label="Starting weight"
                                value={formatGrams(spool.initialWeightG)}
                            />
                            <DetailItem
                                icon={<IconCoin size={17} />}
                                label="Purchase price"
                                value={
                                    spool.purchasePrice !== undefined
                                        ? formatMoney(
                                              spool.purchasePrice,
                                              spool.purchaseCurrency,
                                          )
                                        : "Not provided"
                                }
                                note={
                                    spool.purchasePrice !== undefined
                                        ? `${formatMoney(spool.purchasePrice / spool.initialWeightG, spool.purchaseCurrency)} per gram`
                                        : "Add a price to calculate print costs"
                                }
                            />
                            <DetailItem
                                icon={<IconCalendar size={17} />}
                                label="Purchase date"
                                value={formatDate(spool.purchaseDate)}
                            />
                            <DetailItem
                                icon={<IconPalette size={17} />}
                                label="Color"
                                value={spool.color || "Not provided"}
                                swatch={spool.color}
                            />
                            {spool.notes ? (
                                <>
                                    <Divider />
                                    <div>
                                        <Text
                                            size="xs"
                                            fw={700}
                                            tt="uppercase"
                                            c="dimmed"
                                            mb={5}
                                        >
                                            Notes
                                        </Text>
                                        <Text
                                            size="sm"
                                            style={{ whiteSpace: "pre-wrap" }}
                                        >
                                            {spool.notes}
                                        </Text>
                                    </div>
                                </>
                            ) : null}
                        </Stack>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Card withBorder radius="lg" p="xl" h="100%">
                        <Group justify="space-between" mb="lg">
                            <div>
                                <Title order={2}>
                                    History & related activity
                                </Title>
                                <Text size="sm" c="dimmed">
                                    Prints, waste, measurements, and stock
                                    changes
                                </Text>
                            </div>
                            <Button
                                variant="subtle"
                                onClick={() =>
                                    navigate(`/history?spool=${spool.id}`)
                                }
                            >
                                View in full history
                            </Button>
                        </Group>

                        {entries.length ? (
                            <ScrollArea.Autosize mah={560} offsetScrollbars>
                                <Stack gap={0} pr="sm">
                                    {entries.map((entry) => (
                                        <ActivityRow
                                            key={`${entry.type}-${entry.record.id}`}
                                            entry={entry}
                                            spool={spool}
                                            onEdit={() =>
                                                entry.type === "print"
                                                    ? openPrint(entry.record)
                                                    : openAdjustment(
                                                          entry.record,
                                                      )
                                            }
                                            onDelete={() => removeEntry(entry)}
                                        />
                                    ))}
                                </Stack>
                            </ScrollArea.Autosize>
                        ) : (
                            <Paper className="detail-empty" radius="lg" p="xl">
                                <ThemeIcon
                                    variant="light"
                                    color="copper"
                                    radius="xl"
                                    size={42}
                                >
                                    <IconPrinter size={21} />
                                </ThemeIcon>
                                <Text fw={700} mt="sm">
                                    No activity for this spool yet
                                </Text>
                                <Text size="sm" c="dimmed" mt={3}>
                                    Add a print to start its usage history.
                                </Text>
                                <Button
                                    mt="md"
                                    size="sm"
                                    onClick={() => openPrint()}
                                    disabled={Boolean(spool.archivedAt)}
                                >
                                    Add first print
                                </Button>
                            </Paper>
                        )}
                    </Card>
                </Grid.Col>
            </Grid>

            <SpoolFormModal
                opened={editOpened}
                onClose={editModal.close}
                spool={spool}
            />
            <PrintFormModal
                opened={printOpened}
                onClose={printModal.close}
                spools={spools}
                prints={prints}
                adjustments={adjustments}
                record={editingPrint}
                initialSpoolId={spool.id}
                lockSpool
            />
            <AdjustmentFormModal
                opened={adjustmentOpened}
                onClose={adjustmentModal.close}
                spools={spools}
                prints={prints}
                adjustments={adjustments}
                record={editingAdjustment}
                initialSpoolId={spool.id}
                lockSpool
            />
        </Stack>
    );
}

function SummaryCard({
    icon,
    label,
    value,
    detail,
    color = "copper",
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    detail: string;
    color?: string;
}) {
    return (
        <Paper withBorder radius="lg" p="lg">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div>
                    <Text
                        size="xs"
                        tt="uppercase"
                        fw={700}
                        c="dimmed"
                        lts={0.7}
                    >
                        {label}
                    </Text>
                    <Text
                        fz={24}
                        fw={800}
                        mt={5}
                        c={color === "red" ? "red" : undefined}
                    >
                        {value}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                        {detail}
                    </Text>
                </div>
                <ThemeIcon variant="light" color={color} size={40} radius="md">
                    {icon}
                </ThemeIcon>
            </Group>
        </Paper>
    );
}

function DetailItem({
    icon,
    label,
    value,
    note,
    swatch,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    note?: string;
    swatch?: string;
}) {
    return (
        <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Group gap="xs" c="dimmed" wrap="nowrap">
                {icon}
                <Text size="sm">{label}</Text>
            </Group>
            <div style={{ textAlign: "right" }}>
                <Group gap={6} justify="flex-end" wrap="nowrap">
                    {swatch ? <ColorSwatch color={swatch} size={16} /> : null}
                    <Text size="sm" fw={600}>
                        {value}
                    </Text>
                </Group>
                {note ? (
                    <Text size="xs" c="dimmed" mt={2}>
                        {note}
                    </Text>
                ) : null}
            </div>
        </Group>
    );
}

function ActivityRow({
    entry,
    spool,
    onEdit,
    onDelete,
}: {
    entry: LedgerEntry;
    spool: Spool;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const isPrint = entry.type === "print";
    const printCost = isPrint
        ? getEstimatedPrintCost(spool, entry.record)
        : undefined;
    const change = isPrint
        ? `-${formatGrams(getPrintTotal(entry.record))}`
        : entry.record.kind === "set"
          ? `Set to ${formatGrams(entry.record.amountG)}`
          : `${entry.record.kind === "add" ? "+" : "-"}${formatGrams(entry.record.amountG)}`;

    return (
        <Group
            className="detail-activity-row"
            justify="space-between"
            wrap="nowrap"
        >
            <Group gap="sm" wrap="nowrap" className="detail-activity-main">
                <ThemeIcon
                    variant="light"
                    color={isPrint ? "copper" : "blue"}
                    radius="xl"
                >
                    {isPrint ? (
                        <IconPrinter size={17} />
                    ) : (
                        <IconAdjustmentsHorizontal size={17} />
                    )}
                </ThemeIcon>
                <div className="detail-activity-copy">
                    <Group gap="xs">
                        <Text fw={650} size="sm">
                            {isPrint
                                ? entry.record.projectName
                                : entry.record.reason}
                        </Text>
                        <Badge
                            size="xs"
                            variant="light"
                            color={isPrint ? "orange" : "blue"}
                        >
                            {isPrint ? "Print" : "Adjustment"}
                        </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mt={3}>
                        {isPrint
                            ? `${entry.record.quantity} × ${formatGrams(entry.record.gramsPerItem)}`
                            : entry.record.kind === "set"
                              ? "Measured remaining weight"
                              : `${entry.record.kind === "add" ? "Added to" : "Removed from"} stock`}
                        {isPrint
                            ? ` · Est. ${printCost !== undefined ? formatMoney(printCost, spool.purchaseCurrency) : "not priced"}`
                            : ""}
                        {` · ${formatDateTime(entry.occurredAt)}`}
                    </Text>
                </div>
            </Group>
            <Group gap="xs" wrap="nowrap">
                <Text size="sm" fw={700} c={isPrint ? "orange.8" : undefined}>
                    {change}
                </Text>
                <Menu position="bottom-end" shadow="md">
                    <Menu.Target>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            aria-label="Activity actions"
                        >
                            <IconDots size={18} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item
                            leftSection={<IconEdit size={15} />}
                            onClick={onEdit}
                        >
                            Edit
                        </Menu.Item>
                        <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={15} />}
                            onClick={onDelete}
                        >
                            Delete
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>
        </Group>
    );
}
