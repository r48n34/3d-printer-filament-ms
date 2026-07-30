import { Alert } from "@mantine/core";
import { IconDatabaseOff } from "@tabler/icons-react";

export function InventoryErrorAlert({ message }: { message: string }) {
    return (
        <Alert
            color="red"
            icon={<IconDatabaseOff size={18} />}
            title="Local data is unavailable"
        >
            {message} Reload the page or check that browser storage is enabled.
        </Alert>
    );
}
