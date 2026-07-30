import { Button, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconPrinter } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { AdjustmentFormModal } from "../components/AdjustmentFormModal";
import { EmptyState } from "../components/EmptyState";
import { InventoryErrorAlert } from "../components/InventoryErrorAlert";
import {
    LowStockSection,
    type AttentionSpool,
} from "../components/LowStockSection";
import { PageHeader } from "../components/PageHeader";
import {
    PrintFormModal,
    type PrintFormPreset,
} from "../components/PrintFormModal";
import { RecentActivitySection } from "../components/RecentActivitySection";
import { SpoolCard } from "../components/SpoolCard";
import { SpoolFormModal } from "../components/SpoolFormModal";
import { useInventoryData } from "../hooks/useInventoryData";
import { setSpoolArchived } from "../services/spools";
import type { PrintRecord, Spool } from "../types";
import {
    getLedgerEntries,
    getProgressValue,
    getSpoolAvailability,
} from "../utils/filament";

export function DashboardPage() {
    const { spools, prints, adjustments, balanceBySpool, error, loading } =
        useInventoryData();
    const [spoolOpened, spoolModal] = useDisclosure(false);
    const [printOpened, printModal] = useDisclosure(false);
    const [adjustmentOpened, adjustmentModal] = useDisclosure(false);
    const [editingSpool, setEditingSpool] = useState<Spool>();
    const [actionSpool, setActionSpool] = useState<Spool>();
    const [printPreset, setPrintPreset] = useState<PrintFormPreset>();
    const navigate = useNavigate();

    const activeSpools = spools.filter((spool) => !spool.archivedAt);
    const attentionSpools: AttentionSpool[] = activeSpools
        .map((spool) => ({
            spool,
            balance: balanceBySpool.get(spool.id) ?? 0,
        }))
        .filter(
            ({ spool, balance }) =>
                getSpoolAvailability(spool, balance) !== "available",
        )
        .sort(
            (left, right) =>
                getProgressValue(left.balance, left.spool.initialWeightG) -
                getProgressValue(right.balance, right.spool.initialWeightG),
        );
    const lowCount = attentionSpools.filter(
        ({ spool, balance }) => getSpoolAvailability(spool, balance) === "low",
    ).length;
    const depletedCount = attentionSpools.length - lowCount;
    const recentEntries = getLedgerEntries(prints, adjustments)
        .reverse()
        .slice(0, 5);

    const openCreate = () => {
        setEditingSpool(undefined);
        spoolModal.open();
    };

    const openEdit = (spool: Spool) => {
        setEditingSpool(spool);
        spoolModal.open();
    };

    const openPrint = (spool?: Spool, preset?: PrintFormPreset) => {
        setActionSpool(spool);
        setPrintPreset(preset);
        printModal.open();
    };

    const openAdjustment = (spool: Spool) => {
        setActionSpool(spool);
        adjustmentModal.open();
    };

    const repeatPrint = (record: PrintRecord) => {
        const spool = spools.find(({ id }) => id === record.spoolId);
        if (!spool || spool.archivedAt) return;
        openPrint(spool, {
            spoolId: record.spoolId,
            projectName: record.projectName,
            quantity: record.quantity,
            gramsPerItem: record.gramsPerItem,
        });
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

    return (
        <Stack gap="xl">
            <PageHeader
                title="Workshop overview"
                description="A live view of every gram on your shelf."
                actions={
                    <Group gap="sm">
                        <Button
                            variant="default"
                            leftSection={<IconPlus size={17} />}
                            onClick={openCreate}
                            disabled={Boolean(error)}
                        >
                            Add spool
                        </Button>
                        <Button
                            leftSection={<IconPrinter size={17} />}
                            onClick={() => openPrint()}
                            disabled={
                                Boolean(error) ||
                                loading ||
                                activeSpools.length === 0
                            }
                        >
                            Log a print
                        </Button>
                    </Group>
                }
            />

            {error ? (
                <InventoryErrorAlert message={error} />
            ) : (
                <>
                    {!loading && activeSpools.length === 0 ? (
                        <EmptyState
                            title={
                                spools.length
                                    ? "No active spools"
                                    : "Add your first spool"
                            }
                            description={
                                spools.length
                                    ? "Restore an archived spool before logging another print."
                                    : "Add a spool to start tracking filament and recording prints."
                            }
                            actionLabel={
                                spools.length
                                    ? "View archived spools"
                                    : "Add spool"
                            }
                            onAction={
                                spools.length
                                    ? () =>
                                          navigate("/filaments?status=archived")
                                    : openCreate
                            }
                        />
                    ) : null}

                    {attentionSpools.length ? (
                        <LowStockSection
                            items={attentionSpools.slice(0, 5)}
                            lowCount={lowCount}
                            depletedCount={depletedCount}
                            onAdjust={openAdjustment}
                        />
                    ) : null}

                    {activeSpools.length ? (
                        <section>
                            <Group justify="space-between" mb="md">
                                <div>
                                    <Title order={2}>Filaments</Title>
                                </div>
                                <Button
                                    variant="subtle"
                                    onClick={() => navigate("/filaments")}
                                >
                                    View all
                                </Button>
                            </Group>
                            <SimpleGrid
                                cols={{
                                    base: 1,
                                    md: 2,
                                    xl: 3,
                                }}
                            >
                                {activeSpools.slice(0, 6).map((spool) => (
                                    <SpoolCard
                                        key={spool.id}
                                        spool={spool}
                                        balance={
                                            balanceBySpool.get(spool.id) ?? 0
                                        }
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
                        </section>
                    ) : null}

                    {recentEntries.length ? (
                        <RecentActivitySection
                            entries={recentEntries}
                            spools={spools}
                            onRepeatPrint={repeatPrint}
                        />
                    ) : null}
                </>
            )}

            <SpoolFormModal
                opened={spoolOpened}
                onClose={() => {
                    spoolModal.close();
                    setEditingSpool(undefined);
                }}
                spool={editingSpool}
            />
            <PrintFormModal
                opened={printOpened}
                onClose={printModal.close}
                spools={spools}
                prints={prints}
                adjustments={adjustments}
                initialSpoolId={actionSpool?.id}
                lockSpool={Boolean(actionSpool)}
                preset={printPreset}
            />
            <AdjustmentFormModal
                opened={adjustmentOpened}
                onClose={() => {
                    adjustmentModal.close();
                    setActionSpool(undefined);
                }}
                spools={spools}
                prints={prints}
                adjustments={adjustments}
                initialSpoolId={actionSpool?.id}
                lockSpool={Boolean(actionSpool)}
            />
        </Stack>
    );
}
