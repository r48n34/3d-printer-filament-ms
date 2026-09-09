import {
    Autocomplete,
    Button,
    ColorInput,
    Grid,
    Group,
    Modal,
    NumberInput,
    Select,
    Stack,
    Switch,
    Textarea,
    TextInput,
    useMantineTheme,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";

import "@mantine/dates/styles.css";

import { createId, db } from "../db";
import { type Material, MATERIALS, type Spool } from "../types";
import { getBrandSuggestions } from "../utils/brands";

interface SpoolFormValues {
    name: string;
    initialWeightG: number | string;
    material: string;
    customMaterial: string;
    color: string;
    brand: string;
    purchaseDate: string | null;
    purchasePrice: number | string;
    purchaseCurrency: string;
    notes: string;
    archived: boolean;
}

export interface SpoolFormModalProps {
    opened: boolean;
    onClose: () => void;
    spool?: Spool;
}

const getInitialValues = (spool?: Spool): SpoolFormValues => ({
    name: spool?.name ?? "",
    initialWeightG: spool?.initialWeightG ?? 1000,
    material: spool?.material ?? "PETG",
    customMaterial: spool?.customMaterial ?? "",
    color: spool?.color ?? "",
    brand: spool?.brand ?? "",
    purchaseDate: spool?.purchaseDate ?? dayjs().format("YYYY-MM-DD"),
    purchasePrice: spool?.purchasePrice ?? "",
    purchaseCurrency: spool?.purchaseCurrency ?? "HKD",
    notes: spool?.notes ?? "",
    archived: Boolean(spool?.archivedAt),
});

const clean = (value: string) => value.trim() || undefined;

export function SpoolFormModal({
    opened,
    onClose,
    spool,
}: SpoolFormModalProps) {
    const theme = useMantineTheme();
    const brandSuggestions = useLiveQuery(
        async () => getBrandSuggestions(await db.spools.toArray()),
        [],
        [],
    );
    const form = useForm<SpoolFormValues>({
        mode: "controlled",
        initialValues: getInitialValues(spool),
        validate: {
            name: (value) => (value.trim() ? null : "Enter a spool name"),
            initialWeightG: (value) =>
                typeof value === "number" && value > 0
                    ? null
                    : "Starting weight must be greater than 0",
            customMaterial: (value, values) =>
                values.material === "Other" && !value.trim()
                    ? "Enter the material name"
                    : null,
            purchasePrice: (value) =>
                value === "" || (typeof value === "number" && value >= 0)
                    ? null
                    : "Price cannot be negative",
        },
    });

    useEffect(() => {
        if (opened) form.setValues(getInitialValues(spool));
        // Reset only when a different spool is selected or the modal opens.
        // oxlint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, spool?.id]);

    const saveSpool = async (values: SpoolFormValues) => {
        const now = new Date().toISOString();
        const next: Spool = {
            id: spool?.id ?? createId(),
            name: values.name.trim(),
            initialWeightG: Number(values.initialWeightG),
            lowStockThresholdG: spool?.lowStockThresholdG,
            material: values.material as Material,
            customMaterial:
                values.material === "Other"
                    ? clean(values.customMaterial)
                    : undefined,
            color: clean(values.color),
            brand: clean(values.brand),
            purchaseDate: values.purchaseDate ?? undefined,
            purchasePrice:
                values.purchasePrice === ""
                    ? undefined
                    : Number(values.purchasePrice),
            purchaseCurrency:
                values.purchasePrice === ""
                    ? undefined
                    : values.purchaseCurrency.trim(),
            notes: clean(values.notes),
            archivedAt: values.archived
                ? (spool?.archivedAt ?? now)
                : undefined,
            createdAt: spool?.createdAt ?? now,
            updatedAt: now,
        };

        await db.spools.put(next);
        notifications.show({
            color: "teal",
            title: spool ? "Spool updated" : "Spool added",
            message: `${next.name} is ready to track.`,
        });
        onClose();
    };

    const save = form.onSubmit((values) => {
        const spoolToArchive = spool;
        const isBeingArchived =
            spoolToArchive !== undefined &&
            values.archived &&
            !spoolToArchive.archivedAt;

        if (!isBeingArchived || !spoolToArchive) {
            void saveSpool(values);
            return;
        }

        modals.openConfirmModal({
            title: "Archive this spool?",
            children: `New prints will be disabled, but all data and history for ${spoolToArchive.name} will remain available.`,
            labels: { confirm: "Archive spool", cancel: "Cancel" },
            confirmProps: { color: "red" },
            onConfirm: () => void saveSpool(values),
        });
    });

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={spool ? "Edit spool" : "Add a filament spool"}
            size="lg"
            centered
        >
            <form onSubmit={save}>
                <Stack gap="md">
                    <Grid>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Autocomplete
                                label="Spool name"
                                placeholder="e.g. Copper PLA"
                                withAsterisk
                                data={['Home', 'Office', "Other"]}
                                {...form.getInputProps("name")}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <NumberInput
                                label="Starting weight"
                                suffix=" g"
                                min={1}
                                decimalScale={2}
                                step={1}
                                withAsterisk
                                {...form.getInputProps("initialWeightG")}
                            />
                        </Grid.Col>
                    </Grid>

                    <ColorInput
                        label="Filament color"
                        placeholder="Choose or enter a color"
                        format="hex"
                        swatches={[
                            theme.colors.dark[7],
                            theme.white,
                            theme.colors.red[6],
                            theme.colors.orange[6],
                            theme.colors.yellow[6],
                            theme.colors.green[6],
                            theme.colors.blue[6],
                            theme.colors.violet[6],
                        ]}
                        {...form.getInputProps("color")}
                    />

                    <Grid>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Select
                                label="Material"
                                data={[...MATERIALS]}
                                allowDeselect={false}
                                {...form.getInputProps("material")}
                            />
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            {form.values.material === "Other" ? (
                                <TextInput
                                    label="Custom material"
                                    placeholder="e.g. PCTG"
                                    withAsterisk
                                    {...form.getInputProps("customMaterial")}
                                />
                            ) : (
                                <Autocomplete
                                    label="Brand"
                                    placeholder="Type or select a brand"
                                    data={brandSuggestions}
                                    {...form.getInputProps("brand")}
                                />
                            )}
                        </Grid.Col>
                    </Grid>

                    {form.values.material === "Other" ? (
                        <Autocomplete
                            label="Brand"
                            placeholder="Type or select a brand"
                            data={brandSuggestions}
                            {...form.getInputProps("brand")}
                        />
                    ) : null}

                    <Grid>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <DateInput
                                label="Purchase date"
                                clearable
                                valueFormat="D MMM YYYY"
                                {...form.getInputProps("purchaseDate")}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 8, sm: 4 }}>
                            <NumberInput
                                label="Purchase price"
                                min={0}
                                decimalScale={2}
                                {...form.getInputProps("purchasePrice")}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 4, sm: 2 }}>
                            <TextInput
                                label="Currency"
                                maxLength={3}
                                {...form.getInputProps("purchaseCurrency")}
                            />
                        </Grid.Col>
                    </Grid>
                    <Textarea
                        label="Notes"
                        placeholder="Storage location, batch, or anything useful"
                        autosize
                        minRows={2}
                        {...form.getInputProps("notes")}
                    />
                    {spool ? (
                        <Switch
                            label="Archive spool"
                            description="Archived spools cannot be used for new prints."
                            checked={form.values.archived}
                            onChange={(event) =>
                                form.setFieldValue(
                                    "archived",
                                    event.currentTarget.checked,
                                )
                            }
                        />
                    ) : null}
                    <Group justify="flex-end" mt="xs">
                        <Button variant="default" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {spool ? "Save changes" : "Add spool"}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
