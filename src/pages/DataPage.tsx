import {
  Alert,
  Badge,
  Button,
  Card,
  FileButton,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconDatabase,
  IconDownload,
  IconFileCheck,
  IconInfoCircle,
  IconLock,
  IconUpload,
} from "@tabler/icons-react";
import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { useInventoryData } from "../hooks/useInventoryData";
import type { FilamentBackup } from "../types";
import { downloadBackup, parseBackup, replaceWithBackup } from "../utils/backup";
import { formatDateTime } from "../utils/format";

export function DataPage() {
  const { spools, prints, adjustments } = useInventoryData();
  const [preview, setPreview] = useState<FilamentBackup>();
  const [fileName, setFileName] = useState("");

  const exportData = async () => {
    await downloadBackup();
    notifications.show({
      color: "teal",
      title: "Backup downloaded",
      message: "Keep this JSON file somewhere safe.",
    });
  };

  const selectFile = async (file: File | null) => {
    if (!file) return;
    setFileName(file.name);
    try {
      setPreview(parseBackup(await file.text()));
    } catch (error) {
      setPreview(undefined);
      notifications.show({
        color: "red",
        title: "Could not read backup",
        message: error instanceof Error ? error.message : "The backup is invalid.",
      });
    }
  };

  const restore = () => {
    if (!preview) return;
    modals.openConfirmModal({
      title: "Replace all local data?",
      children: (
        <Stack gap="xs">
          <Text size="sm">
            This will replace the current {spools.length} spools and all related history with the
            contents of <strong>{fileName}</strong>.
          </Text>
          <Alert color="orange" icon={<IconInfoCircle size={17} />}>
            Download a backup first if you may need the current data again.
          </Alert>
        </Stack>
      ),
      labels: { confirm: "Replace and restore", cancel: "Cancel" },
      confirmProps: { color: "orange" },
      onConfirm: async () => {
        try {
          await replaceWithBackup(preview);
          setPreview(undefined);
          setFileName("");
          notifications.show({
            color: "teal",
            title: "Backup restored",
            message: "Your local filament library has been replaced.",
          });
        } catch {
          notifications.show({
            color: "red",
            title: "Restore failed",
            message: "Your existing data was not changed.",
          });
        }
      },
    });
  };

  return (
    <Stack gap="xl">
      <PageHeader
        title="Your local data"
        description="Back up or restore the complete workshop ledger."
      />

      <Alert variant="light" color="copper" icon={<IconLock size={20} />} title="Private by design">
        Spoolbook stores its data in IndexedDB inside this browser. Nothing is uploaded, but
        clearing browser storage can remove it—download backups regularly.
      </Alert>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <CountCard label="Spools" value={spools.length} />
        <CountCard label="Print records" value={prints.length} />
        <CountCard label="Adjustments" value={adjustments.length} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Card withBorder radius="lg" p="xl">
          <Stack gap="md" h="100%">
            <ThemeIcon size={44} radius="md" variant="light" color="copper">
              <IconDownload size={23} />
            </ThemeIcon>
            <div>
              <Title order={2}>Download a backup</Title>
              <Text c="dimmed" size="sm" mt={5}>
                Exports spools, prints, and adjustments as one versioned JSON file.
              </Text>
            </div>
            <List size="sm" c="dimmed" spacing="xs">
              <List.Item>Includes archived spools and full history</List.Item>
              <List.Item>Readable only after explicit restore confirmation</List.Item>
            </List>
            <Button
              mt="auto"
              leftSection={<IconDownload size={17} />}
              onClick={() => void exportData()}
            >
              Download JSON backup
            </Button>
          </Stack>
        </Card>

        <Card withBorder radius="lg" p="xl">
          <Stack gap="md">
            <ThemeIcon size={44} radius="md" variant="light" color="blue">
              <IconUpload size={23} />
            </ThemeIcon>
            <div>
              <Title order={2}>Restore from backup</Title>
              <Text c="dimmed" size="sm" mt={5}>
                Select a Spoolbook JSON file. It is validated before anything changes.
              </Text>
            </div>
            <FileButton onChange={(file) => void selectFile(file)} accept="application/json,.json">
              {(props) => (
                <Button variant="default" leftSection={<IconUpload size={17} />} {...props}>
                  Choose backup file
                </Button>
              )}
            </FileButton>
            {preview ? (
              <Paper withBorder radius="md" p="md" bg="var(--mantine-color-blue-light)">
                <Group wrap="nowrap" align="flex-start">
                  <IconFileCheck size={22} color="var(--mantine-color-blue-7)" />
                  <div>
                    <Text fw={700} size="sm">
                      {fileName}
                    </Text>
                    <Text size="xs" c="dimmed" mt={3}>
                      {preview.spools.length} spools · {preview.prints.length} prints ·{" "}
                      {preview.adjustments.length} adjustments
                    </Text>
                    <Text size="xs" c="dimmed">
                      Exported {formatDateTime(preview.exportedAt)}
                    </Text>
                  </div>
                </Group>
              </Paper>
            ) : null}
            <Button color="orange" disabled={!preview} onClick={restore}>
              Preview complete — restore data
            </Button>
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <Paper withBorder radius="lg" p="lg">
      <Group justify="space-between">
        <div>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts={0.7}>
            {label}
          </Text>
          <Text fz={28} fw={800}>
            {value}
          </Text>
        </div>
        <Badge variant="light" color="gray" size="lg">
          <IconDatabase size={15} />
        </Badge>
      </Group>
    </Paper>
  );
}
