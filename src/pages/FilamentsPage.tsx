import {
  Button,
  Group,
  SegmentedControl,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { SpoolCard } from "../components/SpoolCard";
import { SpoolFormModal } from "../components/SpoolFormModal";
import { db } from "../db";
import { useInventoryData } from "../hooks/useInventoryData";
import { MATERIALS, type Spool } from "../types";
import { getMaterialName } from "../utils/filament";

export function FilamentsPage() {
  const { spools, balanceBySpool, loading } = useInventoryData();
  const [opened, modal] = useDisclosure(false);
  const [editing, setEditing] = useState<Spool>();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [material, setMaterial] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = spools.filter((spool) => {
    const matchesStatus =
      status === "all" || (status === "archived" ? spool.archivedAt : !spool.archivedAt);
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

  const openEdit = (spool: Spool) => {
    setEditing(spool);
    modal.open();
  };

  const toggleArchive = (spool: Spool) => {
    const restoring = Boolean(spool.archivedAt);
    modals.openConfirmModal({
      title: restoring ? "Restore this spool?" : "Archive this spool?",
      children: restoring
        ? `${spool.name} will be available when recording new prints.`
        : `${spool.name} will be hidden from new print forms, but its complete history stays intact.`,
      labels: { confirm: restoring ? "Restore spool" : "Archive spool", cancel: "Cancel" },
      onConfirm: async () => {
        await db.spools.update(spool.id, {
          archivedAt: restoring ? undefined : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        notifications.show({
          color: "teal",
          message: `${spool.name} ${restoring ? "restored" : "archived"}.`,
        });
      },
    });
  };

  return (
    <Stack gap="xl">
      <PageHeader
        title="Filament library"
        description="Every physical spool, its details, and its live balance."
        actions={
          <Button leftSection={<IconPlus size={17} />} onClick={openCreate}>
            Add spool
          </Button>
        }
      />
      <Group align="flex-end" gap="sm">
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
      </Group>
      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }}>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={190} radius="lg" />
          ))}
        </SimpleGrid>
      ) : filtered.length ? (
        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }}>
          {filtered.map((spool) => (
            <SpoolCard
              key={spool.id}
              spool={spool}
              balance={balanceBySpool.get(spool.id) ?? 0}
              onEdit={() => openEdit(spool)}
              onArchive={() => toggleArchive(spool)}
              onOpen={() => navigate(`/filaments/${spool.id}`)}
            />
          ))}
        </SimpleGrid>
      ) : (
        <EmptyState
          title={spools.length ? "No matching spools" : "Your shelf is empty"}
          description={
            spools.length
              ? "Try changing the search or filters."
              : "Add a physical spool to start tracking your filament."
          }
          actionLabel={!spools.length ? "Add filament spool" : undefined}
          onAction={!spools.length ? openCreate : undefined}
        />
      )}
      <SpoolFormModal opened={opened} onClose={modal.close} spool={editing} />
    </Stack>
  );
}
