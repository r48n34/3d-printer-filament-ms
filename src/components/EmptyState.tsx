import { Button, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconDisc } from "@tabler/icons-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Paper className="empty-state" p="xl" radius="lg" withBorder>
      <Stack align="center" gap="sm">
        <ThemeIcon size={48} radius="xl" variant="light" color="copper">
          <IconDisc size={26} />
        </ThemeIcon>
        <Title order={3}>{title}</Title>
        <Text c="dimmed" maw={420} ta="center">
          {description}
        </Text>
        {actionLabel && onAction ? (
          <Button mt="xs" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
