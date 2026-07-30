import {
    Badge,
    Button,
    Card,
    Group,
    Select,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import {
    MantineReactTable,
    useMantineReactTable,
    type MRT_ColumnDef,
} from "mantine-react-table-open";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "mantine-react-table/styles.css";
import { EmptyState } from "../components/EmptyState";
import { InventoryErrorAlert } from "../components/InventoryErrorAlert";
import {
    LazyAdjustmentFormModal,
    LazyPrintFormModal,
    LazySpoolFormModal,
} from "../components/LazyInventoryModals";
import { PageHeader } from "../components/PageHeader";
import { SpoolCard } from "../components/SpoolCard";
import { useInventoryData } from "../hooks/useInventoryData";
import { setSpoolArchived } from "../services/spools";
import { MATERIALS, type Spool } from "../types";
import {
    getAvailabilityLabel,
    getMaterialName,
    getSpoolAvailability,
    type SpoolAvailability,
} from "../utils/filament";
import { formatDate, formatGrams } from "../utils/format";
import {
    INVENTORY_MATERIAL_KEY,
    INVENTORY_SEARCH_KEY,
    INVENTORY_STATUS_KEY,
    INVENTORY_VIEW_KEY,
} from "../utils/preferences";

type InventoryStatus = "active" | "low" | "depleted" | "archived" | "all";
type InventoryView = "cards" | "table";

const STATUS_OPTIONS: Array<{ label: string; value: InventoryStatus }> = [
    { label: "Active", value: "active" },
    { label: "Low stock", value: "low" },
    { label: "Depleted", value: "depleted" },
    { label: "Archived", value: "archived" },
    { label: "All", value: "all" },
];

const isInventoryStatus = (value: string | null): value is InventoryStatus =>
    STATUS_OPTIONS.some((option) => option.value === value);

export function FilamentsPage() {
    const { spools, prints, adjustments, balanceBySpool, error, loading } =
        useInventoryData();
    const [spoolOpened, spoolModal] = useDisclosure(false);
    const [printOpened, printModal] = useDisclosure(false);
    const [adjustmentOpened, adjustmentModal] = useDisclosure(false);
    const [editing, setEditing] = useState<Spool>();
    const [actionSpool, setActionSpool] = useState<Spool>();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryStatus = searchParams.get("status");
    const [search, setSearch] = useLocalStorage({
        key: INVENTORY_SEARCH_KEY,
        defaultValue: "",
    });
    const [status, setStoredStatus] = useLocalStorage<InventoryStatus>({
        key: INVENTORY_STATUS_KEY,
        defaultValue: isInventoryStatus(queryStatus) ? queryStatus : "active",
    });
    const [material, setMaterial] = useLocalStorage({
        key: INVENTORY_MATERIAL_KEY,
        defaultValue: "",
    });
    const [view, setView] = useLocalStorage<InventoryView>({
        key: INVENTORY_VIEW_KEY,
        defaultValue: "cards",
    });
    const navigate = useNavigate();

    useEffect(() => {
        const nextStatus = searchParams.get("status");
        if (isInventoryStatus(nextStatus)) {
            setStoredStatus(nextStatus);
        }
    }, [searchParams, setStoredStatus]);

    const changeStatus = (value: string | null) => {
        if (!isInventoryStatus(value)) return;
        setStoredStatus(value);
        const nextParams = new URLSearchParams(searchParams);
        if (value === "active") nextParams.delete("status");
        else nextParams.set("status", value);
        setSearchParams(nextParams, { replace: true });
    };

    const filtered = spools.filter((spool) => {
        const balance = balanceBySpool.get(spool.id) ?? 0;
        const availability = getSpoolAvailability(spool, balance);
        const matchesStatus =
            status === "all" ||
            (status === "archived" && Boolean(spool.archivedAt)) ||
            (status === "active" && !spool.archivedAt) ||
            (status === "low" && !spool.archivedAt && availability === "low") ||
            (status === "depleted" &&
                !spool.archivedAt &&
                availability === "depleted");
        const term = search.trim().toLowerCase();
        const matchesSearch =
            !term ||
            [
                spool.name,
                spool.brand,
                spool.color,
                spool.notes,
                getMaterialName(spool),
            ].some((value) => value?.toLowerCase().includes(term));
        const matchesMaterial = !material || spool.material === material;
        return matchesStatus && matchesSearch && matchesMaterial;
    });

    const openCreate = () => {
        setEditing(undefined);
        spoolModal.open();
    };

    const openEdit = (spool: Spool) => {
        setEditing(spool);
        spoolModal.open();
    };

    const openPrint = (spool: Spool) => {
        setActionSpool(spool);
        printModal.open();
    };

    const openAdjustment = (spool: Spool) => {
        setActionSpool(spool);
        adjustmentModal.open();
    };

    const updateArchiveState = async (spool: Spool, archived: boolean) => {
        await setSpoolArchived(spool, archived);
        notifications.show({
            color: "teal",
            title: archived ? "Spool archived" : "Spool restored",
            message: `${spool.name} ${archived ? "was archived" : "can be used for prints again"}.`,
        });
    };

    const toggleArchive = (spool: Spool) => {
        if (spool.archivedAt) {
            void updateArchiveState(spool, false);
            return;
        }
        modals.openConfirmModal({
            title: `Archive ${spool.name}?`,
            children: (
                <Text size="sm">
                    New prints will be disabled. Its details and complete
                    history will remain available.
                </Text>
            ),
            labels: { confirm: "Archive", cancel: "Cancel" },
            confirmProps: { color: "red" },
            onConfirm: () => void updateArchiveState(spool, true),
        });
    };

    const clearFilters = () => {
        setSearch("");
        setMaterial("");
        changeStatus("active");
    };

    return (
        <Stack gap="xl">
            <PageHeader
                title="Filament library"
                description="Every physical spool, its details, and its live balance."
                actions={
                    <Button
                        leftSection={<IconPlus size={17} />}
                        onClick={openCreate}
                        disabled={Boolean(error)}
                    >
                        Add spool
                    </Button>
                }
            />

            {error ? (
                <InventoryErrorAlert message={error} />
            ) : (
                <>
                    <Card radius="lg" p="md">
                        <Group
                            className="catalog-filters"
                            align="flex-end"
                            gap="sm"
                        >
                            <TextInput
                                className="filter-search"
                                label="Search"
                                placeholder="Name, brand, material, or notes"
                                leftSection={<IconSearch size={16} />}
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.currentTarget.value)
                                }
                            />
                            <Select
                                label="Material"
                                placeholder="All materials"
                                clearable
                                data={[...MATERIALS]}
                                value={material || null}
                                onChange={(value) => setMaterial(value ?? "")}
                            />
                            <Select
                                label="Status"
                                data={STATUS_OPTIONS}
                                value={status}
                                onChange={changeStatus}
                                allowDeselect={false}
                            />
                            <Select
                                label="View"
                                aria-label="Filament view"
                                data={[
                                    { label: "Cards", value: "cards" },
                                    { label: "Table", value: "table" },
                                ]}
                                value={view}
                                onChange={(value) =>
                                    setView(
                                        (value as InventoryView | null) ??
                                            "cards",
                                    )
                                }
                                allowDeselect={false}
                            />
                            {search || material || status !== "active" ? (
                                <Button
                                    variant="subtle"
                                    color="gray"
                                    onClick={clearFilters}
                                >
                                    Clear filters
                                </Button>
                            ) : null}
                        </Group>
                    </Card>

                    {loading ? (
                        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }}>
                            {Array.from({ length: 6 }, (_, index) => (
                                <Skeleton
                                    key={index}
                                    height={190}
                                    radius="lg"
                                />
                            ))}
                        </SimpleGrid>
                    ) : filtered.length && view === "cards" ? (
                        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }}>
                            {filtered.map((spool) => (
                                <SpoolCard
                                    key={spool.id}
                                    spool={spool}
                                    balance={balanceBySpool.get(spool.id) ?? 0}
                                    onOpen={() =>
                                        navigate(`/filaments/${spool.id}`)
                                    }
                                    onPrint={() => openPrint(spool)}
                                    onAdjust={() => openAdjustment(spool)}
                                    onEdit={() => openEdit(spool)}
                                    onArchive={() => toggleArchive(spool)}
                                />
                            ))}
                        </SimpleGrid>
                    ) : filtered.length ? (
                        <FilamentTable
                            spools={filtered}
                            balanceBySpool={balanceBySpool}
                            onOpen={(spool) =>
                                navigate(`/filaments/${spool.id}`)
                            }
                        />
                    ) : (
                        <EmptyState
                            title={
                                spools.length
                                    ? "No matching spools"
                                    : "Your shelf is empty"
                            }
                            description={
                                spools.length
                                    ? "Try changing the search or filters."
                                    : "Add a physical spool to start tracking your filament."
                            }
                            actionLabel={
                                !spools.length
                                    ? "Add filament spool"
                                    : undefined
                            }
                            onAction={!spools.length ? openCreate : undefined}
                        />
                    )}
                </>
            )}

            <LazySpoolFormModal
                opened={spoolOpened}
                onClose={() => {
                    spoolModal.close();
                    setEditing(undefined);
                }}
                spool={editing}
            />
            <LazyPrintFormModal
                opened={printOpened}
                onClose={() => {
                    printModal.close();
                    setActionSpool(undefined);
                }}
                spools={spools}
                prints={prints}
                adjustments={adjustments}
                initialSpoolId={actionSpool?.id}
                lockSpool
            />
            <LazyAdjustmentFormModal
                opened={adjustmentOpened}
                onClose={() => {
                    adjustmentModal.close();
                    setActionSpool(undefined);
                }}
                spools={spools}
                prints={prints}
                adjustments={adjustments}
                initialSpoolId={actionSpool?.id}
                lockSpool
            />
        </Stack>
    );
}

function availabilityColor(availability: SpoolAvailability) {
    if (availability === "depleted") return "red";
    if (availability === "low") return "orange";
    return "teal";
}

function FilamentTable({
    spools,
    balanceBySpool,
    onOpen,
}: {
    spools: Spool[];
    balanceBySpool: Map<string, number>;
    onOpen: (spool: Spool) => void;
}) {
    const columns = useMemo<MRT_ColumnDef<Spool>[]>(
        () => [
            {
                accessorKey: "name",
                header: "Spool",
                size: 220,
                Cell: ({ row }) => (
                    <Text fw={600} size="sm">
                        {row.original.name}
                    </Text>
                ),
            },
            {
                accessorKey: "brand",
                header: "Brand",
                size: 160,
                Cell: ({ cell }) => cell.getValue<string>() || "—",
            },
            {
                id: "material",
                accessorFn: getMaterialName,
                header: "Material",
                size: 120,
                Cell: ({ row }) => (
                    <Badge size="sm" variant="light" color="gray">
                        {getMaterialName(row.original)}
                    </Badge>
                ),
            },
            {
                id: "remaining",
                accessorFn: (spool) => balanceBySpool.get(spool.id) ?? 0,
                header: "Remaining",
                size: 140,
                Cell: ({ row }) => {
                    const spool = row.original;
                    const balance = balanceBySpool.get(spool.id) ?? 0;
                    const availability = getSpoolAvailability(spool, balance);
                    return (
                        <Text
                            size="sm"
                            fw={600}
                            c={`${availabilityColor(availability)}.8`}
                        >
                            {formatGrams(balance)}
                        </Text>
                    );
                },
            },
            {
                accessorKey: "initialWeightG",
                header: "Starting weight",
                size: 150,
                Cell: ({ cell }) => formatGrams(cell.getValue<number>()),
            },
            {
                accessorKey: "purchaseDate",
                header: "Purchased",
                size: 140,
                Cell: ({ cell }) => formatDate(cell.getValue<string>()),
            },
            {
                id: "status",
                accessorFn: (spool) => {
                    if (spool.archivedAt) return "Archived";
                    return getAvailabilityLabel(
                        getSpoolAvailability(
                            spool,
                            balanceBySpool.get(spool.id) ?? 0,
                        ),
                    );
                },
                header: "Status",
                size: 120,
                Cell: ({ row }) => {
                    const spool = row.original;
                    const availability = getSpoolAvailability(
                        spool,
                        balanceBySpool.get(spool.id) ?? 0,
                    );
                    return (
                        <Badge
                            size="sm"
                            variant="light"
                            color={
                                spool.archivedAt
                                    ? "gray"
                                    : availabilityColor(availability)
                            }
                        >
                            {spool.archivedAt
                                ? "Archived"
                                : getAvailabilityLabel(availability)}
                        </Badge>
                    );
                },
            },
        ],
        [balanceBySpool],
    );

    const table = useMantineReactTable({
        columns,
        data: spools,
        getRowId: (spool) => spool.id,
        enableColumnActions: false,
        enableDensityToggle: false,
        enableFullScreenToggle: false,
        enableGlobalFilter: false,
        mantineTableBodyRowProps: ({ row }) => ({
            onClick: () => onOpen(row.original),
            style: { cursor: "pointer" },
        }),
        initialState: {
            density: "xs",
            pagination: {
                pageIndex: 0,
                pageSize: 10,
            },
        },
    });

    return <MantineReactTable table={table} />;
}
