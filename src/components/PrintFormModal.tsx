import {
    Alert,
    Button,
    ColorSwatch,
    Grid,
    Group,
    Modal,
    NumberInput,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect } from "react";

import "@mantine/dates/styles.css";

import { savePrintRecord } from "../services/printRecords";
import type { AdjustmentRecord, PrintRecord, Spool } from "../types";
import {
    calculateBalance,
    getEstimatedPrintCost,
    getPrintTotal,
} from "../utils/filament";
import { dateTimeInputValue, formatGrams, formatMoney } from "../utils/format";

interface PrintFormValues {
    spoolId: string;
    projectName: string;
    quantity: number | string;
    gramsPerItem: number | string;
    printedAt: string;
    notes: string;
}

export interface PrintFormPreset {
    spoolId: string;
    projectName: string;
    quantity: number;
    gramsPerItem: number;
}

export interface PrintFormModalProps {
    opened: boolean;
    onClose: () => void;
    spools: Spool[];
    prints: PrintRecord[];
    adjustments: AdjustmentRecord[];
    record?: PrintRecord;
    preset?: PrintFormPreset;
    initialSpoolId?: string;
    lockSpool?: boolean;
}

export function PrintFormModal({
    opened,
    onClose,
    spools,
    prints,
    adjustments,
    record,
    preset,
    initialSpoolId,
    lockSpool = false,
}: PrintFormModalProps) {
    const activeSpools = spools.filter(
        (spool) => !spool.archivedAt || spool.id === record?.spoolId,
    );
    const initialValues = (): PrintFormValues => ({
        spoolId:
            record?.spoolId ??
            preset?.spoolId ??
            initialSpoolId ??
            activeSpools[0]?.id ??
            "",
        projectName: record?.projectName ?? preset?.projectName ?? "",
        quantity: record?.quantity ?? preset?.quantity ?? 1,
        gramsPerItem: record?.gramsPerItem ?? preset?.gramsPerItem ?? "",
        printedAt: dateTimeInputValue(record?.printedAt),
        notes: record?.notes ?? "",
    });
    const form = useForm<PrintFormValues>({
        mode: "controlled",
        initialValues: initialValues(),
        validate: {
            spoolId: (value) => (value ? null : "Select a spool"),
            projectName: (value) =>
                value.trim() ? null : "Enter a project name",
            quantity: (value) =>
                typeof value === "number" &&
                Number.isInteger(value) &&
                value > 0
                    ? null
                    : "Quantity must be a positive whole number",
            gramsPerItem: (value) =>
                typeof value === "number" && value > 0
                    ? null
                    : "Enter grams used per item",
            printedAt: (value) =>
                dayjs(value).isValid() ? null : "Enter a valid date and time",
        },
    });

    useEffect(() => {
        if (opened) form.setValues(initialValues());
        // Reset only when the selected record or requested spool changes.
        // oxlint-disable-next-line react-hooks/exhaustive-deps
    }, [
        opened,
        record?.id,
        preset?.spoolId,
        preset?.projectName,
        preset?.quantity,
        preset?.gramsPerItem,
        initialSpoolId,
    ]);

    const selectedSpool = spools.find(({ id }) => id === form.values.spoolId);
    const candidate: PrintRecord | undefined = selectedSpool
        ? {
              id: record?.id ?? "preview",
              spoolId: selectedSpool.id,
              projectName: form.values.projectName,
              quantity: Number(form.values.quantity) || 0,
              gramsPerItem: Number(form.values.gramsPerItem) || 0,
              printedAt: dayjs(form.values.printedAt).toISOString(),
              createdAt: record?.createdAt ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
          }
        : undefined;
    const projectedBalance =
        selectedSpool && candidate
            ? calculateBalance(
                  selectedSpool,
                  [
                      ...prints.filter(
                          ({ id, spoolId }) =>
                              spoolId === selectedSpool.id &&
                              id !== record?.id &&
                              id !== candidate.id,
                      ),
                      candidate,
                  ],
                  adjustments.filter(
                      ({ spoolId }) => spoolId === selectedSpool.id,
                  ),
              )
            : 0;
    const total = getPrintTotal({
        quantity: Number(form.values.quantity) || 0,
        gramsPerItem: Number(form.values.gramsPerItem) || 0,
    });
    const estimatedCost =
        selectedSpool && candidate
            ? getEstimatedPrintCost(selectedSpool, candidate)
            : undefined;

    const persist = async (values: PrintFormValues) => {
        const next = await savePrintRecord(
            {
                spoolId: values.spoolId,
                projectName: values.projectName.trim(),
                quantity: Number(values.quantity),
                gramsPerItem: Number(values.gramsPerItem),
                printedAt: dayjs(values.printedAt).toISOString(),
                notes: values.notes,
            },
            record,
        );
        notifications.show({
            color: "teal",
            title: record ? "Print updated" : "Print recorded",
            message: `${formatGrams(getPrintTotal(next))} deducted from ${selectedSpool?.name}.`,
        });
        onClose();
    };

    const save = form.onSubmit((values) => {
        if (projectedBalance < 0) {
            modals.openConfirmModal({
                title: "This spool will go below zero",
                children: (
                    <Text size="sm">
                        The projected balance is {formatGrams(projectedBalance)}
                        . Save this record anyway?
                    </Text>
                ),
                labels: { confirm: "Save anyway", cancel: "Go back" },
                confirmProps: { color: "red" },
                onConfirm: () => void persist(values),
            });
            return;
        }
        void persist(values);
    });

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                record
                    ? "Edit print record"
                    : preset
                      ? "Log print again"
                      : "Record a print"
            }
            size="lg"
            centered
        >
            <form onSubmit={save}>
                <Stack gap="md">
                    <Select
                        label="Filament spool"
                        data={activeSpools.map((spool) => ({
                            value: spool.id,
                            label: `${spool.name}${spool.material ? ` · ${spool.material}` : ""}`,
                        }))}
                        searchable
                        disabled={lockSpool}
                        withAsterisk
                        leftSection={
                            selectedSpool ? (
                                <ColorSwatch
                                    size={18}
                                    color={
                                        selectedSpool.color ??
                                        "var(--mantine-color-copper-6)"
                                    }
                                    aria-label={
                                        selectedSpool.color
                                            ? `${selectedSpool.name} filament color`
                                            : `${selectedSpool.name} color not set`
                                    }
                                />
                            ) : undefined
                        }
                        {...form.getInputProps("spoolId")}
                    />
                    <TextInput
                        label="Project name"
                        placeholder="e.g. Apple model"
                        withAsterisk
                        {...form.getInputProps("projectName")}
                    />
                    <Grid>
                        <Grid.Col span={{ base: 12, sm: 3 }}>
                            <NumberInput
                                label="Quantity"
                                min={1}
                                step={1}
                                allowDecimal={false}
                                withAsterisk
                                {...form.getInputProps("quantity")}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 3 }}>
                            <NumberInput
                                label="Grams each"
                                suffix=" g"
                                min={0.01}
                                decimalScale={2}
                                withAsterisk
                                {...form.getInputProps("gramsPerItem")}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 6, sm: 3 }}>
                            <Text size="sm" fw={500} mb={7}>
                                Total used
                            </Text>
                            <Text>{formatGrams(total)}</Text>
                        </Grid.Col>
                        <Grid.Col span={{ base: 6, sm: 3 }}>
                            <Text size="sm" fw={500} mb={7}>
                                Est. material cost
                            </Text>
                            <Text>
                                {estimatedCost !== undefined
                                    ? formatMoney(
                                          estimatedCost,
                                          selectedSpool?.purchaseCurrency,
                                      )
                                    : "Not priced"}
                            </Text>
                        </Grid.Col>
                    </Grid>
                    <DateTimePicker
                        label="Printed at"
                        valueFormat="D MMM YYYY, h:mm A"
                        withAsterisk
                        {...form.getInputProps("printedAt")}
                    />
                    <Textarea
                        label="Notes"
                        placeholder="Optional print settings or outcome"
                        autosize
                        minRows={2}
                        {...form.getInputProps("notes")}
                    />
                    {projectedBalance < 0 ? (
                        <Alert
                            color="red"
                            icon={<IconAlertTriangle size={18} />}
                            title="Negative balance"
                        >
                            This record would leave {selectedSpool?.name} at{" "}
                            {formatGrams(projectedBalance)}. You can still save
                            it after confirmation.
                        </Alert>
                    ) : null}
                    <Group justify="flex-end">
                        <Button variant="default" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {record ? "Save changes" : "Record print"}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
