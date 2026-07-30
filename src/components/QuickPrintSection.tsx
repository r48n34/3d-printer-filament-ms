import {
    Alert,
    Button,
    Card,
    Grid,
    Group,
    NumberInput,
    Select,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle, IconPlus, IconPrinter } from "@tabler/icons-react";
import { useEffect } from "react";

import { savePrintRecord } from "../services/printRecords";
import type { AdjustmentRecord, PrintRecord, Spool } from "../types";
import {
    calculateBalance,
    getEstimatedPrintCost,
    getPrintTotal,
} from "../utils/filament";
import { formatGrams, formatMoney } from "../utils/format";

interface QuickPrintValues {
    spoolId: string;
    projectName: string;
    quantity: number | string;
    gramsPerItem: number | string;
}

interface QuickPrintSectionProps {
    spools: Spool[];
    prints: PrintRecord[];
    adjustments: AdjustmentRecord[];
    onAddSpool: () => void;
}

export function QuickPrintSection({
    spools,
    prints,
    adjustments,
    onAddSpool,
}: QuickPrintSectionProps) {
    const activeSpools = spools.filter((spool) => !spool.archivedAt);
    const form = useForm<QuickPrintValues>({
        mode: "controlled",
        initialValues: {
            spoolId: activeSpools[0]?.id ?? "",
            projectName: "",
            quantity: 1,
            gramsPerItem: "",
        },
        validate: {
            spoolId: (value) => (value ? null : "Choose a spool"),
            projectName: (value) =>
                value.trim() ? null : "Enter what you printed",
            quantity: (value) =>
                typeof value === "number" &&
                Number.isInteger(value) &&
                value > 0
                    ? null
                    : "Use a whole number",
            gramsPerItem: (value) =>
                typeof value === "number" && value > 0
                    ? null
                    : "Enter grams per item",
        },
    });

    useEffect(() => {
        if (!form.values.spoolId && activeSpools[0]) {
            form.setFieldValue("spoolId", activeSpools[0].id);
        }
        // Select the first available spool only when the inventory changes.
        // oxlint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSpools[0]?.id]);

    const total = getPrintTotal({
        quantity: Number(form.values.quantity) || 0,
        gramsPerItem: Number(form.values.gramsPerItem) || 0,
    });
    const selectedSpool = activeSpools.find(
        ({ id }) => id === form.values.spoolId,
    );
    const candidate: PrintRecord | undefined = selectedSpool
        ? {
              id: "quick-preview",
              spoolId: selectedSpool.id,
              projectName: form.values.projectName,
              quantity: Number(form.values.quantity) || 0,
              gramsPerItem: Number(form.values.gramsPerItem) || 0,
              printedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
          }
        : undefined;
    const projectedBalance =
        selectedSpool && candidate
            ? calculateBalance(
                  selectedSpool,
                  [
                      ...prints.filter(
                          ({ spoolId }) => spoolId === selectedSpool.id,
                      ),
                      candidate,
                  ],
                  adjustments.filter(
                      ({ spoolId }) => spoolId === selectedSpool.id,
                  ),
              )
            : 0;
    const estimatedCost =
        selectedSpool && candidate
            ? getEstimatedPrintCost(selectedSpool, candidate)
            : undefined;

    const persist = async (values: QuickPrintValues) => {
        const record = await savePrintRecord({
            spoolId: values.spoolId,
            projectName: values.projectName,
            quantity: Number(values.quantity),
            gramsPerItem: Number(values.gramsPerItem),
            printedAt: new Date().toISOString(),
        });
        notifications.show({
            color: "teal",
            title: "Print added to history",
            message: `${formatGrams(getPrintTotal(record))} deducted from ${selectedSpool?.name}.`,
        });
        form.setValues({
            spoolId: values.spoolId,
            projectName: "",
            quantity: 1,
            gramsPerItem: "",
        });
        form.resetDirty();
    };

    const submit = form.onSubmit((values) => {
        if (projectedBalance < 0) {
            modals.openConfirmModal({
                title: "This spool will go below zero",
                children: (
                    <Text size="sm">
                        The new balance will be {formatGrams(projectedBalance)}.
                        Add this print anyway?
                    </Text>
                ),
                labels: { confirm: "Add print", cancel: "Go back" },
                confirmProps: { color: "red" },
                onConfirm: () => void persist(values),
            });
            return;
        }
        void persist(values);
    });

    return (
        <Card
            className="quick-print-section"
            radius="xl"
            p={{ base: "lg", sm: "xl" }}
        >
            <Stack gap="lg">
                <Group
                    className="quick-print-heading"
                    justify="space-between"
                    align="flex-start"
                >
                    <Group gap="md" wrap="nowrap">
                        <ThemeIcon size={44} radius="lg" color="copper">
                            <IconPrinter size={23} />
                        </ThemeIcon>
                        <div className="quick-print-copy">
                            <Title order={2}>Log a print</Title>
                            <Text size="sm" c="dimmed" mt={3}>
                                Log a completed print and update the spool
                                balance instantly.
                            </Text>
                        </div>
                    </Group>
                    {total > 0 ? (
                        <div className="quick-total">
                            <Text size="xs" c="dimmed" fw={500} tt="uppercase">
                                Total used
                            </Text>
                            <Text fw={600} fz="lg">
                                {formatGrams(total)}
                            </Text>
                            <Text
                                size="xs"
                                c="dimmed"
                                fw={500}
                                tt="uppercase"
                                mt={6}
                            >
                                Est. material cost
                            </Text>
                            <Text fw={600} fz="lg">
                                {estimatedCost !== undefined
                                    ? formatMoney(
                                          estimatedCost,
                                          selectedSpool?.purchaseCurrency,
                                      )
                                    : "Not priced"}
                            </Text>
                        </div>
                    ) : null}
                </Group>

                {activeSpools.length ? (
                    <form onSubmit={submit}>
                        <Grid align="flex-end" gap="sm">
                            <Grid.Col span={{ base: 12, md: 3 }}>
                                <Select
                                    label="Filament spool"
                                    placeholder="Choose a spool"
                                    data={activeSpools.map((spool) => ({
                                        value: spool.id,
                                        label: spool.name,
                                    }))}
                                    searchable
                                    withAsterisk
                                    {...form.getInputProps("spoolId")}
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                                <TextInput
                                    label="What did you print?"
                                    placeholder="e.g. Apple model"
                                    withAsterisk
                                    {...form.getInputProps("projectName")}
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 6, sm: 3, md: 1.5 }}>
                                <NumberInput
                                    label="Quantity"
                                    min={1}
                                    step={1}
                                    allowDecimal={false}
                                    withAsterisk
                                    {...form.getInputProps("quantity")}
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 6, sm: 3, md: 1.5 }}>
                                <NumberInput
                                    label="Grams each"
                                    suffix=" g"
                                    min={0.01}
                                    decimalScale={2}
                                    withAsterisk
                                    {...form.getInputProps("gramsPerItem")}
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 2 }}>
                                <Button
                                    type="submit"
                                    fullWidth
                                    leftSection={<IconPlus size={17} />}
                                >
                                    Add history
                                </Button>
                            </Grid.Col>
                        </Grid>
                        {projectedBalance < 0 && total > 0 ? (
                            <Alert
                                color="red"
                                variant="light"
                                mt="md"
                                icon={<IconAlertTriangle size={17} />}
                            >
                                This would leave {selectedSpool?.name} at{" "}
                                {formatGrams(projectedBalance)}.
                            </Alert>
                        ) : null}
                        <Text size="xs" c="dimmed" mt="sm">
                            {selectedSpool?.purchasePrice === undefined
                                ? `Add a purchase price to ${selectedSpool?.name ?? "this spool"} to estimate material cost. `
                                : "Cost is estimated from the spool purchase price and starting weight. "}
                            Saved with the current date and time; you can add
                            notes or correct it from History.
                        </Text>
                    </form>
                ) : (
                    <Alert
                        color="copper"
                        variant="white"
                        title="Add a spool first"
                    >
                        <Group justify="space-between" gap="md">
                            <Text size="sm">
                                Add your first spool, then log completed prints
                                here to keep its balance current.
                            </Text>
                            <Button
                                size="xs"
                                variant="light"
                                onClick={onAddSpool}
                            >
                                Add your first spool
                            </Button>
                        </Group>
                    </Alert>
                )}
            </Stack>
        </Card>
    );
}
