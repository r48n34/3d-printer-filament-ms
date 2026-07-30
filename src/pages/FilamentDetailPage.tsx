import {
    ActionIcon,
    Accordion,
    Alert,
    Badge,
    Box,
    Button,
    Card,
    ColorSwatch,
    Divider,
    Flex,
    Grid,
    Group,
    Menu,
    RingProgress,
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
    IconEdit,
    // IconHistory,
    IconPalette,
    IconPrinter,
    IconRepeat,
    IconRestore,
    IconScale,
    IconTrash,
} from "@tabler/icons-react";
import {
    MantineReactTable,
    type MRT_ColumnDef,
} from "mantine-react-table-open";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import "mantine-react-table/styles.css";

import { AdjustmentFormModal } from "../components/AdjustmentFormModal";
import { InventoryErrorAlert } from "../components/InventoryErrorAlert";
import {
    PrintFormModal,
    type PrintFormPreset,
} from "../components/PrintFormModal";
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

function PageHeader({
    title,
    description,
    actions,
}: {
    title: React.ReactNode;
    description: string;
    actions?: React.ReactNode;
}) {
    return (
        <Flex
            justify="space-between"
            align={{ base: "stretch", sm: "flex-end" }}
            direction={{ base: "column", sm: "row" }}
            gap="md"
        >
            <Stack gap={3}>
                <Title className="page-title" order={1}>
                    {title}
                </Title>
                <Text c="dimmed" size="sm">
                    {description}
                </Text>
            </Stack>
            {actions ? (
                <Box className="page-header-actions">{actions}</Box>
            ) : null}
        </Flex>
    );
}

export function FilamentDetailPage() {
    const { spoolId } = useParams();
    const navigate = useNavigate();
    const { spools, prints, adjustments, balanceBySpool, error, loading } =
        useInventoryData();
    const spool = spools.find(({ id }) => id === spoolId);
    const [editOpened, editModal] = useDisclosure(false);
    const [printOpened, printModal] = useDisclosure(false);
    const [adjustmentOpened, adjustmentModal] = useDisclosure(false);
    const [editingPrint, setEditingPrint] = useState<PrintRecord>();
    const [printPreset, setPrintPreset] = useState<PrintFormPreset>();
    const [editingAdjustment, setEditingAdjustment] =
        useState<AdjustmentRecord>();

    useEffect(() => {
        if (!spool?.color) return;

        const root = document.documentElement;
        const previousGlow = root.style.getPropertyValue("--app-main-glow");

        root.style.setProperty("--app-main-glow", spool.color);

        return () => {
            if (previousGlow) {
                root.style.setProperty("--app-main-glow", previousGlow);
            } else {
                root.style.removeProperty("--app-main-glow");
            }
        };
    }, [spool?.color]);

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

    if (error) {
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
                <InventoryErrorAlert message={error} />
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
        setPrintPreset(undefined);
        printModal.open();
    };

    const repeatPrint = (record: PrintRecord) => {
        if (spool.archivedAt) return;
        setEditingPrint(undefined);
        setPrintPreset({
            spoolId: record.spoolId,
            projectName: record.projectName,
            quantity: record.quantity,
            gramsPerItem: record.gramsPerItem,
        });
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
            confirmProps: { color: restoring ? "teal" : "red" },
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
                title={
                    <span
                        style={{
                            alignItems: "center",
                            display: "inline-flex",
                            gap: "var(--mantine-spacing-sm)",
                        }}
                    >
                        <ThemeIcon
                            size="xl"
                            color={spool.color || "var(--mantine-color-gray-6)"}
                            variant="default"
                        >
                            <IconDisc
                                size={30}
                                color={
                                    spool.color || "var(--mantine-color-gray-6)"
                                }
                            />
                        </ThemeIcon>
                        <span>{spool.name}</span>
                    </span>
                }
                description={`${getMaterialName(spool)}${spool.brand ? ` · ${spool.brand}` : ""} · Added ${formatDate(spool.createdAt)}`}
                actions={
                    <Group gap="sm">
                        <Tooltip label="Edit spool">
                            <ActionIcon
                                variant="default"
                                size="lg"
                                onClick={editModal.open}
                                aria-label="Edit spool"
                            >
                                <IconEdit size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Adjust stock">
                            <ActionIcon
                                variant="default"
                                size="lg"
                                onClick={() => openAdjustment()}
                                disabled={Boolean(spool.archivedAt)}
                                aria-label="Adjust stock"
                            >
                                <IconAdjustmentsHorizontal size={18} />
                            </ActionIcon>
                        </Tooltip>
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

            <UsageBalanceCard
                balance={balance}
                printCount={spoolPrints.length}
                progress={progress}
                spoolName={spool.name}
            />

            <Grid>
                <Grid.Col span={12} order={2}>
                    <Accordion variant="contained" radius="lg">
                        <Accordion.Item value="filament-data">
                            <Accordion.Control icon={<IconDisc size={20} />}>
                                <Text fw={600}>Filament data</Text>
                                <Text size="sm" c="dimmed">
                                    Details and pricing for this spool
                                </Text>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <Stack gap="md">
                                    <Group justify="flex-end">
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
                                    <DetailItem
                                        icon={<IconDisc size={17} />}
                                        label="Material"
                                        value={getMaterialName(spool)}
                                    />
                                    <DetailItem
                                        icon={<IconScale size={17} />}
                                        label="Starting weight"
                                        value={formatGrams(
                                            spool.initialWeightG,
                                        )}
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
                                        icon={<IconCoin size={17} />}
                                        label="Est. material cost"
                                        value={
                                            estimatedCost !== undefined
                                                ? formatMoney(
                                                      estimatedCost,
                                                      spool.purchaseCurrency,
                                                  )
                                                : "Not priced"
                                        }
                                        note="Based on recorded prints"
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
                                                    fw={500}
                                                    tt="uppercase"
                                                    c="dimmed"
                                                    mb={5}
                                                >
                                                    Notes
                                                </Text>
                                                <Text
                                                    size="sm"
                                                    style={{
                                                        whiteSpace: "pre-wrap",
                                                    }}
                                                >
                                                    {spool.notes}
                                                </Text>
                                            </div>
                                        </>
                                    ) : null}
                                </Stack>
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                </Grid.Col>

                <Grid.Col span={12} order={1}>
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
                            <HistoryActivityTable
                                entries={entries}
                                spool={spool}
                                onEdit={(entry) =>
                                    entry.type === "print"
                                        ? openPrint(entry.record)
                                        : openAdjustment(entry.record)
                                }
                                onDelete={removeEntry}
                                onRepeat={repeatPrint}
                            />
                        ) : (
                            <Card className="detail-empty" radius="lg" p="xl">
                                <ThemeIcon
                                    variant="light"
                                    color="copper"
                                    radius="xl"
                                    size={42}
                                >
                                    <IconPrinter size={21} />
                                </ThemeIcon>
                                <Text fw={500} mt="sm">
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
                            </Card>
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
                preset={printPreset}
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

function UsageBalanceCard({
    balance,
    printCount,
    progress,
    spoolName,
}: {
    balance: number;
    printCount: number;
    progress: number;
    spoolName: string;
}) {
    const color = balance < 0 ? "red" : progress < 20 ? "orange" : "copper";

    return (
        <Card radius="lg" p="lg">
            <Group justify="space-between" align="center" wrap="nowrap">
                <div>
                    <Text
                        size="xs"
                        tt="uppercase"
                        fw={500}
                        c="dimmed"
                        lts={0.7}
                    >
                        Remaining
                    </Text>
                    <Text fz={24} fw={600} mt={5}>
                        {formatGrams(balance)}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                        {printCount} print{" "}
                        {printCount === 1 ? "record" : "records"}
                    </Text>
                    {/* <Text size="xs" c="dimmed" mt="sm">
                        {formatGrams(balance)} remaining from{" "}
                        {formatGrams(initialWeight)}
                    </Text> */}
                </div>
                <RingProgress
                    aria-label={`${spoolName} remaining filament`}
                    roundCaps
                    size={88}
                    thickness={8}
                    sections={[{ value: progress, color }]}
                    label={
                        <Text ta="center" size="sm" fw={600}>
                            {Math.round(progress)}%
                        </Text>
                    }
                />
            </Group>
        </Card>
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

function HistoryActivityTable({
    entries,
    spool,
    onEdit,
    onDelete,
    onRepeat,
}: {
    entries: LedgerEntry[];
    spool: Spool;
    onEdit: (entry: LedgerEntry) => void;
    onDelete: (entry: LedgerEntry) => void;
    onRepeat: (record: PrintRecord) => void;
}) {
    const columns = useMemo<MRT_ColumnDef<LedgerEntry>[]>(
        () => [
            {
                accessorKey: "occurredAt",
                header: "Date",
                Cell: ({ cell }) => (
                    <Text size="sm">
                        {formatDateTime(cell.getValue<string>())}
                    </Text>
                ),
            },
            {
                id: "activity",
                accessorFn: getActivityLabel,
                header: "Activity",
                Cell: ({ row }) => {
                    const entry = row.original;
                    const isPrint = entry.type === "print";

                    return (
                        <Group gap="xs" wrap="nowrap">
                            <ThemeIcon
                                variant="light"
                                color={isPrint ? "copper" : "blue"}
                                radius="xl"
                                size="sm"
                            >
                                {isPrint ? (
                                    <IconPrinter size={14} />
                                ) : (
                                    <IconAdjustmentsHorizontal size={14} />
                                )}
                            </ThemeIcon>
                            <div>
                                <Text fw={600} size="sm">
                                    {getActivityLabel(entry)}
                                </Text>
                                <Badge
                                    size="xs"
                                    variant="light"
                                    color={isPrint ? "orange" : "blue"}
                                >
                                    {isPrint ? "Print" : "Adjustment"}
                                </Badge>
                            </div>
                        </Group>
                    );
                },
            },
            {
                id: "quantity",
                accessorFn: (entry) =>
                    entry.type === "print" ? entry.record.quantity : 0,
                header: "Quantity",
                Cell: ({ row }) => (
                    <Text size="sm">
                        {row.original.type === "print"
                            ? row.original.record.quantity
                            : "—"}
                    </Text>
                ),
            },
            {
                id: "weight-per-item",
                accessorFn: (entry) =>
                    entry.type === "print" ? entry.record.gramsPerItem : 0,
                header: "Weight / item",
                Cell: ({ row }) => (
                    <Text size="sm">
                        {row.original.type === "print"
                            ? formatGrams(row.original.record.gramsPerItem)
                            : "—"}
                    </Text>
                ),
            },
            {
                id: "estimated-cost",
                accessorFn: (entry) =>
                    entry.type === "print"
                        ? (getEstimatedPrintCost(spool, entry.record) ?? 0)
                        : 0,
                header: "Est. material cost",
                Cell: ({ row }) => {
                    const entry = row.original;
                    const printCost =
                        entry.type === "print"
                            ? getEstimatedPrintCost(spool, entry.record)
                            : undefined;

                    return (
                        <Text size="sm" c="dimmed">
                            {entry.type !== "print"
                                ? "—"
                                : printCost !== undefined
                                  ? formatMoney(
                                        printCost,
                                        spool.purchaseCurrency,
                                    )
                                  : "Not priced"}
                        </Text>
                    );
                },
            },
            {
                id: "change",
                accessorFn: getActivityChangeValue,
                header: "Change",
                Cell: ({ row }) => {
                    const entry = row.original;
                    const isPrint = entry.type === "print";

                    return (
                        <Text
                            size="sm"
                            fw={500}
                            c={isPrint ? "orange.8" : undefined}
                        >
                            {getActivityChange(entry)}
                        </Text>
                    );
                },
            },
        ],
        [spool],
    );

    return (
        <MantineReactTable
            columns={columns}
            data={entries}
            enableBottomToolbar={false}
            enableColumnActions={false}
            enableColumnFilters={false}
            enableDensityToggle={false}
            enableFullScreenToggle={false}
            enableGlobalFilter={false}
            enablePagination={false}
            enableTopToolbar={false}
            enableRowActions
            getRowId={(entry) => `${entry.type}-${entry.record.id}`}
            mantinePaperProps={{ shadow: "none", withBorder: false }}
            mantineTableContainerProps={{ mah: 560 }}
            positionActionsColumn="last"
            renderRowActionMenuItems={({ row }) => (
                <>
                    {row.original.type === "print" ? (
                        <Menu.Item
                            leftSection={<IconRepeat size={15} />}
                            disabled={Boolean(spool.archivedAt)}
                            onClick={() =>
                                onRepeat(row.original.record as PrintRecord)
                            }
                        >
                            {spool.archivedAt
                                ? "Restore spool to log again"
                                : "Log again"}
                        </Menu.Item>
                    ) : null}
                    <Menu.Item
                        leftSection={<IconEdit size={15} />}
                        onClick={() => onEdit(row.original)}
                    >
                        Edit
                    </Menu.Item>
                    <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={15} />}
                        onClick={() => onDelete(row.original)}
                    >
                        Delete
                    </Menu.Item>
                </>
            )}
        />
    );
}

function getActivityLabel(entry: LedgerEntry) {
    return entry.type === "print"
        ? entry.record.projectName
        : entry.record.reason;
}

function getActivityChangeValue(entry: LedgerEntry) {
    if (entry.type === "print") return -getPrintTotal(entry.record);
    if (entry.record.kind === "set" || entry.record.kind === "add")
        return entry.record.amountG;
    return -entry.record.amountG;
}

function getActivityChange(entry: LedgerEntry) {
    if (entry.type === "print")
        return `-${formatGrams(getPrintTotal(entry.record))}`;
    if (entry.record.kind === "set")
        return `Set to ${formatGrams(entry.record.amountG)}`;
    return `${entry.record.kind === "add" ? "+" : "-"}${formatGrams(entry.record.amountG)}`;
}
