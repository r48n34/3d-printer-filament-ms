import {
    Badge,
    Button,
    Group,
    Menu,
    Paper,
    Select,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
    IconAdjustmentsHorizontal,
    IconEdit,
    IconPrinter,
    IconSearch,
    IconTrash,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { MantineReactTable, type MRT_ColumnDef } from "mantine-react-table-open";
import { useMemo, useState } from "react";

import "mantine-react-table/styles.css";
import { useSearchParams } from "react-router-dom";

import { AdjustmentFormModal } from "../components/AdjustmentFormModal";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { PrintFormModal } from "../components/PrintFormModal";
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
    getPrintTotal,
} from "../utils/filament";
import { formatDateTime, formatGrams, formatMoney } from "../utils/format";

export function HistoryPage() {
    const { spools, prints, adjustments } = useInventoryData();
    const [printOpened, printModal] = useDisclosure(false);
    const [adjustmentOpened, adjustmentModal] = useDisclosure(false);
    const [editingPrint, setEditingPrint] = useState<PrintRecord>();
    const [editingAdjustment, setEditingAdjustment] =
        useState<AdjustmentRecord>();
    const [searchParams] = useSearchParams();
    const [type, setType] = useState<string | null>(null);
    const [spoolId, setSpoolId] = useState<string | null>(
        searchParams.get("spool"),
    );
    const [search, setSearch] = useState("");
    const [dateRange, setDateRange] = useState<[string | null, string | null]>([
        null,
        null,
    ]);

    const entries = getLedgerEntries(prints, adjustments)
        .reverse()
        .filter((entry) => {
            if (type && entry.type !== type) return false;
            if (spoolId && entry.record.spoolId !== spoolId) return false;
            if (
                dateRange[0] &&
                dayjs(entry.occurredAt).isBefore(
                    dayjs(dateRange[0]).startOf("day"),
                )
            )
                return false;
            if (
                dateRange[1] &&
                dayjs(entry.occurredAt).isAfter(
                    dayjs(dateRange[1]).endOf("day"),
                )
            )
                return false;
            const term = search.trim().toLowerCase();
            if (!term) return true;
            const text =
                entry.type === "print"
                    ? entry.record.projectName
                    : entry.record.reason;
            return text.toLowerCase().includes(term);
        });

    const openPrint = (record?: PrintRecord) => {
        setEditingPrint(record);
        printModal.open();
    };

    const openAdjustment = (record?: AdjustmentRecord) => {
        setEditingAdjustment(record);
        adjustmentModal.open();
    };

    const remove = (entry: LedgerEntry) => {
        const label =
            entry.type === "print"
                ? entry.record.projectName
                : entry.record.reason;
        modals.openConfirmModal({
            title: "Delete this history entry?",
            children: `“${label}” will be permanently removed and the spool balance will be recalculated.`,
            labels: { confirm: "Delete entry", cancel: "Cancel" },
            confirmProps: { color: "red" },
            onConfirm: async () => {
                if (entry.type === "print")
                    await db.prints.delete(entry.record.id);
                else await db.adjustments.delete(entry.record.id);
                notifications.show({
                    color: "teal",
                    message: "History entry deleted.",
                });
            },
        });
    };

    return (
        <Stack gap="xl">
            <PageHeader
                title="Printing history"
                description="Add, review, and correct every filament usage record."
                actions={
                    <Group gap="sm">
                        <Button
                            variant="default"
                            leftSection={
                                <IconAdjustmentsHorizontal size={17} />
                            }
                            onClick={() => openAdjustment()}
                            disabled={
                                !spools.some(({ archivedAt }) => !archivedAt)
                            }
                        >
                            Adjust stock
                        </Button>
                        <Button
                            leftSection={<IconPrinter size={17} />}
                            onClick={() => openPrint()}
                            disabled={
                                !spools.some(({ archivedAt }) => !archivedAt)
                            }
                        >
                            Add print history
                        </Button>
                    </Group>
                }
            />

            <Paper withBorder radius="lg" p="md">
                <Group className="history-filters" align="flex-end" gap="sm">
                    <TextInput
                        className="filter-search"
                        label="Search history"
                        placeholder="Project or adjustment reason"
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(event) =>
                            setSearch(event.currentTarget.value)
                        }
                    />
                    <Select
                        label="Entry type"
                        placeholder="All activity"
                        clearable
                        data={[
                            { value: "print", label: "Prints" },
                            { value: "adjustment", label: "Adjustments" },
                        ]}
                        value={type}
                        onChange={setType}
                    />
                    <Select
                        label="Spool"
                        placeholder="All spools"
                        clearable
                        searchable
                        data={spools.map((spool) => ({
                            value: spool.id,
                            label: spool.name,
                        }))}
                        value={spoolId}
                        onChange={setSpoolId}
                    />
                    <DatePickerInput
                        type="range"
                        label="Date range"
                        placeholder="Any date"
                        clearable
                        value={dateRange}
                        onChange={setDateRange}
                    />
                    {search ||
                    type ||
                    spoolId ||
                    dateRange[0] ||
                    dateRange[1] ? (
                        <Button
                            variant="subtle"
                            color="gray"
                            onClick={() => {
                                setSearch("");
                                setType(null);
                                setSpoolId(null);
                                setDateRange([null, null]);
                            }}
                        >
                            Clear filters
                        </Button>
                    ) : null}
                </Group>
            </Paper>

            {entries.length ? (
                <HistoryActivityTable
                    entries={entries}
                    spools={spools}
                    onEdit={(entry) =>
                        entry.type === "print"
                            ? openPrint(entry.record)
                            : openAdjustment(entry.record)
                    }
                    onDelete={remove}
                />
            ) : (
                <EmptyState
                    title={
                        prints.length || adjustments.length
                            ? "No matching activity"
                            : "No history yet"
                    }
                    description={
                        prints.length || adjustments.length
                            ? "Try changing the filters."
                            : spools.length
                              ? "Record a print or stock adjustment to begin your ledger."
                              : "Add a filament spool before recording prints."
                    }
                />
            )}

            <PrintFormModal
                opened={printOpened}
                onClose={printModal.close}
                spools={spools}
                prints={prints}
                adjustments={adjustments}
                record={editingPrint}
            />
            <AdjustmentFormModal
                opened={adjustmentOpened}
                onClose={adjustmentModal.close}
                spools={spools}
                prints={prints}
                adjustments={adjustments}
                record={editingAdjustment}
            />
        </Stack>
    );
}

function entryDetails(entry: LedgerEntry) {
    if (entry.type === "print") {
        return {
            title: entry.record.projectName,
            detail: `${entry.record.quantity} × ${formatGrams(entry.record.gramsPerItem)}`,
            change: `−${formatGrams(getPrintTotal(entry.record))}`,
            color: "orange",
            badge: "Print",
        };
    }
    const symbol =
        entry.record.kind === "add"
            ? "+"
            : entry.record.kind === "remove"
              ? "−"
              : "=";
    return {
        title: entry.record.reason,
        detail:
            entry.record.kind === "set"
                ? "Actual weight set"
                : `${entry.record.kind === "add" ? "Added to stock" : "Removed from stock"}`,
        change: `${symbol}${formatGrams(entry.record.amountG)}`,
        color: entry.record.kind === "add" ? "teal" : "blue",
        badge: "Adjustment",
    };
}

function HistoryActivityTable({
    entries,
    spools,
    onEdit,
    onDelete,
}: {
    entries: LedgerEntry[];
    spools: Spool[];
    onEdit: (entry: LedgerEntry) => void;
    onDelete: (entry: LedgerEntry) => void;
}) {
    const spoolsById = useMemo(
        () => new Map(spools.map((spool) => [spool.id, spool])),
        [spools],
    );
    const columns = useMemo<MRT_ColumnDef<LedgerEntry>[]>(
        () => [
            {
                id: "activity",
                accessorFn: (entry) => entryDetails(entry).title,
                header: "Activity",
                Cell: ({ row }) => {
                    const details = entryDetails(row.original);
                    return (
                        <Group gap="sm" wrap="nowrap">
                            <Badge variant="light" color={details.color}>
                                {details.badge}
                            </Badge>
                            <div>
                                <Text fw={600} size="sm">
                                    {details.title}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    {details.detail}
                                </Text>
                            </div>
                        </Group>
                    );
                },
            },
            {
                id: "spool",
                accessorFn: (entry) =>
                    spoolsById.get(entry.record.spoolId)?.name ??
                    "Missing spool",
                header: "Spool",
            },
            {
                accessorKey: "occurredAt",
                header: "Date",
                Cell: ({ cell }) => (
                    <Text size="sm" c="dimmed">
                        {formatDateTime(cell.getValue<string>())}
                    </Text>
                ),
            },
            {
                id: "change",
                accessorFn: entryChangeValue,
                header: "Change",
                Cell: ({ row }) => (
                    <Text
                        fw={500}
                        c={
                            row.original.type === "print"
                                ? "orange.8"
                                : undefined
                        }
                    >
                        {entryDetails(row.original).change}
                    </Text>
                ),
            },
            {
                id: "estimated-cost",
                accessorFn: (entry) => {
                    if (entry.type !== "print") return undefined;
                    const spool = spoolsById.get(entry.record.spoolId);
                    return spool
                        ? getEstimatedPrintCost(spool, entry.record)
                        : undefined;
                },
                header: "Est. material cost",
                Cell: ({ row }) => {
                    const entry = row.original;
                    const spool = spoolsById.get(entry.record.spoolId);
                    const estimatedCost =
                        entry.type === "print" && spool
                            ? getEstimatedPrintCost(spool, entry.record)
                            : undefined;
                    return (
                        <Text
                            size="sm"
                            fw={600}
                            c={
                                estimatedCost === undefined
                                    ? "dimmed"
                                    : undefined
                            }
                        >
                            {entry.type === "print"
                                ? estimatedCost !== undefined
                                    ? formatMoney(
                                          estimatedCost,
                                          spool?.purchaseCurrency,
                                      )
                                    : "Not priced"
                                : "—"}
                        </Text>
                    );
                },
            },
        ],
        [spoolsById],
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
            enableRowActions
            enableTopToolbar={false}
            getRowId={(entry) => `${entry.type}-${entry.record.id}`}
            mantineTableContainerProps={{ mah: 640 }}
            positionActionsColumn="last"
            renderRowActionMenuItems={({ row }) => (
                <>
                    <Menu.Item
                        leftSection={<IconEdit size={16} />}
                        onClick={() => onEdit(row.original)}
                    >
                        Edit
                    </Menu.Item>
                    <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={16} />}
                        onClick={() => onDelete(row.original)}
                    >
                        Delete
                    </Menu.Item>
                </>
            )}
        />
    );
}

function entryChangeValue(entry: LedgerEntry) {
    if (entry.type === "print") return -getPrintTotal(entry.record);
    if (entry.record.kind === "set" || entry.record.kind === "add")
        return entry.record.amountG;
    return -entry.record.amountG;
}
