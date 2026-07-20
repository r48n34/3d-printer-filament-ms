import {
    Button,
    Card,
    Group,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
    IconDisc,
    IconPlus,
    IconScale,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

import { AdjustmentFormModal } from "../components/AdjustmentFormModal";
import { PageHeader } from "../components/PageHeader";
import { SpoolCard } from "../components/SpoolCard";
import { SpoolFormModal } from "../components/SpoolFormModal";
import { useInventoryData } from "../hooks/useInventoryData";
import { formatGrams } from "../utils/format";

export function DashboardPage() {
    const { spools, prints, adjustments, balanceBySpool, loading } =
        useInventoryData();
    const activeSpools = spools.filter((spool) => !spool.archivedAt);
    const totalRemaining = activeSpools.reduce(
        (sum, spool) => sum + (balanceBySpool.get(spool.id) ?? 0),
        0,
    );

    const [spoolOpened, spoolModal] = useDisclosure(false);
    const [adjustmentOpened, adjustmentModal] = useDisclosure(false);
    const navigate = useNavigate();

    return (
        <Stack gap="xl">
            <PageHeader
                title="Workshop overview"
                description="A live view of every gram on your shelf."
                actions={
                    <Group gap="sm">
                        <Button
                            variant="filled"
                            leftSection={<IconPlus size={17} />}
                            onClick={spoolModal.open}
                        >
                            Add spool
                        </Button>
                    </Group>
                }
            />

            <SimpleGrid cols={{ base: 2, xs: 2 }} spacing="md">
                {loading ? (
                    Array.from({ length: 3 }, (_, index) => (
                        <Skeleton key={index} height={116} radius="lg" />
                    ))
                ) : (
                    <>
                        <MetricCard
                            icon={<IconDisc size={21} />}
                            label="Active spools"
                            value={String(activeSpools.length)}
                            detail={`${spools.length - activeSpools.length} archived`}
                        />
                        <MetricCard
                            icon={<IconScale size={21} />}
                            label="Filament remaining"
                            value={formatGrams(totalRemaining)}
                            detail="Across active spools"
                        />
                    </>
                )}
            </SimpleGrid>

            {activeSpools.length > 0 ? (
                <section>
                    <Group justify="space-between" mb="md">
                        <div>
                            <Title order={2}>Filament at a glance</Title>
                            <Text size="sm" c="dimmed">
                                Active spools and their current balance
                            </Text>
                        </div>
                        <Button
                            variant="subtle"
                            onClick={() => navigate("/filaments")}
                        >
                            View all
                        </Button>
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }}>
                        {activeSpools.slice(0, 6).map((spool) => (
                            <div key={spool.id}>
                                <SpoolCard
                                    spool={spool}
                                    balance={balanceBySpool.get(spool.id) ?? 0}
                                    onEdit={() => navigate("/filaments")}
                                    onArchive={() => navigate("/filaments")}
                                    onOpen={() =>
                                        navigate(`/filaments/${spool.id}`)
                                    }
                                />
                            </div>
                        ))}
                    </SimpleGrid>
                </section>
            ) : null}

            <SpoolFormModal opened={spoolOpened} onClose={spoolModal.close} />
            <AdjustmentFormModal
                opened={adjustmentOpened}
                onClose={adjustmentModal.close}
                spools={spools}
                prints={prints}
                adjustments={adjustments}
            />
        </Stack>
    );
}

function MetricCard({
    icon,
    label,
    value,
    detail,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <Card withBorder radius="lg" p="lg" className="metric-card">
            <Group justify="space-between" align="flex-start">
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
                    <Text fz={26} fw={800} mt={6}>
                        {value}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                        {detail}
                    </Text>
                </div>
                <ThemeIcon variant="light" color="copper" size={40} radius="md">
                    {icon}
                </ThemeIcon>
            </Group>
        </Card>
    );
}
