import {
    Badge,
    Button,
    Group,
    SegmentedControl,
    Select,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import {
    MantineReactTable,
    useMantineReactTable,
    type MRT_ColumnDef,
} from "mantine-react-table-open";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "mantine-react-table/styles.css";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { SpoolCard } from "../components/SpoolCard";
import { SpoolFormModal } from "../components/SpoolFormModal";
import { useInventoryData } from "../hooks/useInventoryData";
import { MATERIALS, type Spool } from "../types";
import { getMaterialName, getProgressValue } from "../utils/filament";
import { formatDate, formatGrams } from "../utils/format";

export function FilamentsPage() {
    const { spools, balanceBySpool, loading } = useInventoryData();
    const [opened, modal] = useDisclosure(false);
    const [editing, setEditing] = useState<Spool>();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("active");
    const [material, setMaterial] = useState<string | null>(null);
    const [view, setView] = useState<"cards" | "table">("cards");
    const navigate = useNavigate();

    const filtered = spools.filter((spool) => {
        const matchesStatus =
            status === "all" ||
            (status === "archived" ? spool.archivedAt : !spool.archivedAt);
        const term = search.trim().toLowerCase();
        const matchesSearch =
            !term ||
            [spool.name, spool.brand, getMaterialName(spool)].some((value) =>
                value?.toLowerCase().includes(term),
            );
        const matchesMaterial = !material || spool.material === material;
        return matchesStatus && matchesSearch && matchesMaterial;
    });

    const openCreate = () => {
        setEditing(undefined);
        modal.open();
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
                    >
                        Add spool
                    </Button>
                }
            />
            <Group className="catalog-filters" align="flex-end" gap="sm">
                <TextInput
                    className="filter-search"
                    label="Search"
                    placeholder="Name, brand, or material"
                    leftSection={<IconSearch size={16} />}
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                />
                <Select
                    label="Material"
                    placeholder="All materials"
                    clearable
                    data={[...MATERIALS]}
                    value={material}
                    onChange={setMaterial}
                />
                <SegmentedControl
                    value={status}
                    onChange={setStatus}
                    data={[
                        { label: "Active", value: "active" },
                        { label: "Archived", value: "archived" },
                        { label: "All", value: "all" },
                    ]}
                />
                <SegmentedControl
                    aria-label="Filament view"
                    value={view}
                    onChange={(value) => setView(value as "cards" | "table")}
                    data={[
                        { label: "Cards", value: "cards" },
                        { label: "Table", value: "table" },
                    ]}
                />
            </Group>
            {loading ? (
                <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }}>
                    {Array.from({ length: 6 }, (_, index) => (
                        <Skeleton key={index} height={190} radius="lg" />
                    ))}
                </SimpleGrid>
            ) : filtered.length && view === "cards" ? (
                <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }}>
                    {filtered.map((spool) => (
                        <SpoolCard
                            key={spool.id}
                            spool={spool}
                            balance={balanceBySpool.get(spool.id) ?? 0}
                            // onEdit={() => openEdit(spool)}
                            // onArchive={() => toggleArchive(spool)}
                            onOpen={() => navigate(`/filaments/${spool.id}`)}
                        />
                    ))}
                </SimpleGrid>
            ) : filtered.length ? (
                <FilamentTable
                    spools={filtered}
                    balanceBySpool={balanceBySpool}
                    onOpen={(spool) => navigate(`/filaments/${spool.id}`)}
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
                        !spools.length ? "Add filament spool" : undefined
                    }
                    onAction={!spools.length ? openCreate : undefined}
                />
            )}
            <SpoolFormModal
                opened={opened}
                onClose={modal.close}
                spool={editing}
            />
        </Stack>
    );
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
                filterFn: "includesString",
                size: 220,
                Cell: ({ row }) => (
                    <Text fw={500} size="sm">
                        {row.original.name}
                    </Text>
                ),
            },
            {
                accessorKey: "brand",
                header: "Brand",
                filterFn: "includesString",
                size: 160,
                Cell: ({ cell }) => cell.getValue<string>() || "—",
            },
            {
                id: "material",
                accessorFn: getMaterialName,
                header: "Material",
                filterFn: "includesString",
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
                filterFn: "includesString",
                size: 140,
                Cell: ({ row }) => {
                    const spool = row.original;
                    const balance = balanceBySpool.get(spool.id) ?? 0;
                    const progress = getProgressValue(
                        balance,
                        spool.initialWeightG,
                    );

                    return (
                        <Text
                            size="sm"
                            fw={500}
                            c={
                                balance < 0
                                    ? "red"
                                    : progress < 20
                                        ? "orange.8"
                                        : undefined
                            }
                        >
                            {formatGrams(balance)}
                        </Text>
                    );
                },
            },
            {
                accessorKey: "initialWeightG",
                header: "Starting weight",
                filterFn: "includesString",
                size: 150,
                Cell: ({ cell }) => formatGrams(cell.getValue<number>()),
            },
            {
                accessorKey: "purchaseDate",
                header: "Purchased",
                filterFn: "includesString",
                size: 140,
                Cell: ({ cell }) => formatDate(cell.getValue<string>()),
            },
            {
                id: "status",
                accessorFn: (spool) =>
                    spool.archivedAt ? "Archived" : "Active",
                header: "Status",
                filterFn: "includesString",
                size: 110,
                Cell: ({ row }) => (
                    <Badge
                        size="sm"
                        variant="light"
                        color={row.original.archivedAt ? "gray" : "teal"}
                    >
                        {row.original.archivedAt ? "Archived" : "Active"}
                    </Badge>
                ),
            },
        ],
        [balanceBySpool],
    );

    const table = useMantineReactTable({
        columns,
        data: spools,
        getRowId: (spool) => spool.id,
        // mantinePaperProps: { shadow: "none", withBorder: false },
        mantineTableBodyRowProps: ({ row }) => ({
            onClick: () => onOpen(row.original),
            style: { cursor: "pointer" },
        }),

        mantineTableProps: {
            striped: "odd",
            withColumnBorders: true,
            withRowBorders: true,
            withTableBorder: true,
            stickyHeader: true,
        },
        initialState: {
            density: "xs",
            showColumnFilters: true,
            pagination: {
                pageIndex: 0,
                pageSize: 10,
            },
        },
    });

    return <MantineReactTable table={table} />;
}
