import { Box, Flex, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description: string;
    actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <Flex
            justify="space-between"
            align={{ base: "stretch", sm: "flex-end" }}
            direction={{ base: "column", sm: "row" }}
            gap="md"
        >
            <Stack gap={3}>
                <Title className="page-title" order={1}>
                    {title}
                </Title>
                <Text c="dimmed" size="sm">
                    {description}
                </Text>
            </Stack>
            {actions ? (
                <Box className="page-header-actions">{actions}</Box>
            ) : null}
        </Flex>
    );
}
