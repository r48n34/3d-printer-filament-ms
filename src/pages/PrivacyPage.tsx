import {
    Alert,
    Card,
    List,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import { IconDatabaseOff, IconLock } from "@tabler/icons-react";

import { PageHeader } from "../components/PageHeader";

export function PrivacyPage() {
    return (
        <Stack gap="xl">
            <PageHeader
                title="Privacy"
                description="How Spoolbook handles your information."
            />

            <Alert
                color="copper"
                icon={<IconLock size={20} />}
                title="Your data stays in your browser"
            >
                This website does not use an online database. Your filament
                records are stored locally in this browser and are not sent to a
                server by Spoolbook.
            </Alert>

            <Card withBorder radius="lg" p="xl">
                <Stack gap="md">
                    <ThemeIcon
                        size={44}
                        radius="md"
                        variant="light"
                        color="copper"
                    >
                        <IconDatabaseOff size={23} />
                    </ThemeIcon>
                    <div>
                        <Title order={2}>Local storage only</Title>
                        <Text c="dimmed" size="sm" mt={5}>
                            Spools, print records, and adjustments are kept in
                            this browser&apos;s IndexedDB storage. No account or
                            online database is required to use the site.
                        </Text>
                    </div>
                    <List size="sm" c="dimmed" spacing="xs">
                        <List.Item>
                            Your records remain on the device and browser where
                            you create them.
                        </List.Item>
                        <List.Item>
                            Clearing browser storage can permanently remove your
                            records.
                        </List.Item>
                        <List.Item>
                            Download backups from the Data &amp; backup page to
                            keep a copy of your records.
                        </List.Item>
                    </List>
                </Stack>
            </Card>
        </Stack>
    );
}
