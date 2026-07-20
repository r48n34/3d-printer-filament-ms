import {
  Button,
  ColorInput,
  Grid,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";
import { createId, db } from "../db";
import { MATERIALS, type Material, type Spool } from "../types";

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
}

interface SpoolFormModalProps {
  opened: boolean;
  onClose: () => void;
  spool?: Spool;
}

const getInitialValues = (spool?: Spool): SpoolFormValues => ({
  name: spool?.name ?? "",
  initialWeightG: spool?.initialWeightG ?? 1000,
  material: spool?.material ?? "PLA",
  customMaterial: spool?.customMaterial ?? "",
  color: spool?.color ?? "",
  brand: spool?.brand ?? "",
  purchaseDate: spool?.purchaseDate ?? null,
  purchasePrice: spool?.purchasePrice ?? "",
  purchaseCurrency: spool?.purchaseCurrency ?? "HKD",
  notes: spool?.notes ?? "",
});

const clean = (value: string) => value.trim() || undefined;

export function SpoolFormModal({ opened, onClose, spool }: SpoolFormModalProps) {
  const form = useForm<SpoolFormValues>({
    mode: "controlled",
    initialValues: getInitialValues(spool),
    validate: {
      name: (value) => (value.trim() ? null : "Enter a spool name"),
      initialWeightG: (value) =>
        typeof value === "number" && value > 0 ? null : "Starting weight must be greater than 0",
      customMaterial: (value, values) =>
        values.material === "Other" && !value.trim() ? "Enter the material name" : null,
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

  const save = form.onSubmit(async (values) => {
    const now = new Date().toISOString();
    const next: Spool = {
      id: spool?.id ?? createId(),
      name: values.name.trim(),
      initialWeightG: Number(values.initialWeightG),
      material: values.material as Material,
      customMaterial: values.material === "Other" ? clean(values.customMaterial) : undefined,
      color: clean(values.color),
      brand: clean(values.brand),
      purchaseDate: values.purchaseDate ?? undefined,
      purchasePrice: values.purchasePrice === "" ? undefined : Number(values.purchasePrice),
      purchaseCurrency: values.purchasePrice === "" ? undefined : values.purchaseCurrency.trim(),
      notes: clean(values.notes),
      archivedAt: spool?.archivedAt,
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
            <Grid.Col span={{ base: 12, sm: 8 }}>
              <TextInput
                label="Spool name"
                placeholder="e.g. Copper PLA"
                withAsterisk
                {...form.getInputProps("name")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <NumberInput
                label="Starting weight"
                suffix=" g"
                min={0.01}
                decimalScale={2}
                withAsterisk
                {...form.getInputProps("initialWeightG")}
              />
            </Grid.Col>
          </Grid>
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
                <TextInput label="Brand" placeholder="Optional" {...form.getInputProps("brand")} />
              )}
            </Grid.Col>
          </Grid>
          {form.values.material === "Other" ? (
            <TextInput label="Brand" placeholder="Optional" {...form.getInputProps("brand")} />
          ) : null}
          <ColorInput
            label="Filament color"
            placeholder="Choose or enter a color"
            format="hex"
            swatches={[
              "#111827",
              "#f8fafc",
              "#dc2626",
              "#ea580c",
              "#eab308",
              "#16a34a",
              "#2563eb",
              "#7c3aed",
            ]}
            {...form.getInputProps("color")}
          />
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
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{spool ? "Save changes" : "Add spool"}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
