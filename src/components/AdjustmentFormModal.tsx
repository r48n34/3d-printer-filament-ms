import {
  Alert,
  Button,
  Grid,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect } from "react";
import { createId, db } from "../db";
import type { AdjustmentKind, AdjustmentRecord, PrintRecord, Spool } from "../types";
import { dateTimeInputValue, formatGrams } from "../utils/format";
import { calculateBalance } from "../utils/filament";

interface AdjustmentFormValues {
  spoolId: string;
  kind: AdjustmentKind;
  amountG: number | string;
  reason: string;
  adjustedAt: string;
}

interface AdjustmentFormModalProps {
  opened: boolean;
  onClose: () => void;
  spools: Spool[];
  prints: PrintRecord[];
  adjustments: AdjustmentRecord[];
  record?: AdjustmentRecord;
  initialSpoolId?: string;
  lockSpool?: boolean;
}

const KIND_OPTIONS = [
  { value: "add", label: "Add filament" },
  { value: "remove", label: "Remove / waste" },
  { value: "set", label: "Set actual remaining weight" },
];

export function AdjustmentFormModal({
  opened,
  onClose,
  spools,
  prints,
  adjustments,
  record,
  initialSpoolId,
  lockSpool = false,
}: AdjustmentFormModalProps) {
  const activeSpools = spools.filter((spool) => !spool.archivedAt || spool.id === record?.spoolId);
  const initialValues = (): AdjustmentFormValues => ({
    spoolId: record?.spoolId ?? initialSpoolId ?? activeSpools[0]?.id ?? "",
    kind: record?.kind ?? "remove",
    amountG: record?.amountG ?? "",
    reason: record?.reason ?? "",
    adjustedAt: dateTimeInputValue(record?.adjustedAt),
  });
  const form = useForm<AdjustmentFormValues>({
    mode: "controlled",
    initialValues: initialValues(),
    validate: {
      spoolId: (value) => (value ? null : "Select a spool"),
      amountG: (value, values) =>
        typeof value === "number" && (values.kind === "set" ? value >= 0 : value > 0)
          ? null
          : values.kind === "set"
            ? "Actual weight cannot be negative"
            : "Amount must be greater than 0",
      reason: (value) => (value.trim() ? null : "Add a reason for this adjustment"),
      adjustedAt: (value) => (dayjs(value).isValid() ? null : "Enter a valid date and time"),
    },
  });

  useEffect(() => {
    if (opened) form.setValues(initialValues());
    // Reset only when the selected record or requested spool changes.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, record?.id, initialSpoolId]);

  const selectedSpool = spools.find(({ id }) => id === form.values.spoolId);
  const candidate: AdjustmentRecord | undefined = selectedSpool
    ? {
        id: record?.id ?? "preview",
        spoolId: selectedSpool.id,
        kind: form.values.kind,
        amountG: Number(form.values.amountG) || 0,
        reason: form.values.reason,
        adjustedAt: dayjs(form.values.adjustedAt).toISOString(),
        createdAt: record?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    : undefined;
  const projectedBalance =
    selectedSpool && candidate
      ? calculateBalance(
          selectedSpool,
          prints.filter(({ spoolId }) => spoolId === selectedSpool.id),
          [
            ...adjustments.filter(
              ({ id, spoolId }) =>
                spoolId === selectedSpool.id && id !== record?.id && id !== candidate.id,
            ),
            candidate,
          ],
        )
      : 0;

  const persist = async (values: AdjustmentFormValues) => {
    const now = new Date().toISOString();
    const next: AdjustmentRecord = {
      id: record?.id ?? createId(),
      spoolId: values.spoolId,
      kind: values.kind,
      amountG: Number(values.amountG),
      reason: values.reason.trim(),
      adjustedAt: dayjs(values.adjustedAt).toISOString(),
      createdAt: record?.createdAt ?? now,
      updatedAt: now,
    };
    await db.adjustments.put(next);
    notifications.show({
      color: "teal",
      title: record ? "Adjustment updated" : "Stock adjusted",
      message: `${selectedSpool?.name} now has ${formatGrams(projectedBalance)} remaining.`,
    });
    onClose();
  };

  const save = form.onSubmit((values) => {
    if (projectedBalance < 0) {
      modals.openConfirmModal({
        title: "This spool will go below zero",
        children: (
          <Text size="sm">
            The projected balance is {formatGrams(projectedBalance)}. Save this adjustment anyway?
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
      title={record ? "Edit adjustment" : "Adjust stock"}
      size="lg"
      centered
    >
      <form onSubmit={save}>
        <Stack gap="md">
          <Select
            label="Filament spool"
            data={activeSpools.map((spool) => ({ value: spool.id, label: spool.name }))}
            searchable
            disabled={lockSpool}
            withAsterisk
            {...form.getInputProps("spoolId")}
          />
          <Grid>
            <Grid.Col span={{ base: 12, sm: 7 }}>
              <Select
                label="Adjustment type"
                data={KIND_OPTIONS}
                allowDeselect={false}
                withAsterisk
                {...form.getInputProps("kind")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 5 }}>
              <NumberInput
                label={form.values.kind === "set" ? "Actual remaining" : "Amount"}
                suffix=" g"
                min={form.values.kind === "set" ? 0 : 0.01}
                decimalScale={2}
                withAsterisk
                {...form.getInputProps("amountG")}
              />
            </Grid.Col>
          </Grid>
          <TextInput
            label="Reason"
            placeholder="e.g. Purge waste or scale reading"
            withAsterisk
            {...form.getInputProps("reason")}
          />
          <DateTimePicker
            label="Adjusted at"
            valueFormat="D MMM YYYY, h:mm A"
            withAsterisk
            {...form.getInputProps("adjustedAt")}
          />
          <Text size="sm" c="dimmed">
            Projected remaining:{" "}
            <Text span fw={700} c={projectedBalance < 0 ? "red" : undefined}>
              {formatGrams(projectedBalance)}
            </Text>
          </Text>
          {projectedBalance < 0 ? (
            <Alert color="red" icon={<IconAlertTriangle size={18} />} title="Negative balance">
              You can still save this adjustment after confirming.
            </Alert>
          ) : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{record ? "Save changes" : "Save adjustment"}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
