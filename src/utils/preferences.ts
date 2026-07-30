export const LAST_BACKUP_AT_KEY = "spoolbook.lastBackupAt";
export const INVENTORY_SEARCH_KEY = "spoolbook.inventory.search";
export const INVENTORY_MATERIAL_KEY = "spoolbook.inventory.material";
export const INVENTORY_STATUS_KEY = "spoolbook.inventory.status";
export const INVENTORY_VIEW_KEY = "spoolbook.inventory.view";

const BACKUP_REMINDER_DAYS = 30;

const getStorage = () => {
    try {
        return globalThis.localStorage;
    } catch {
        return undefined;
    }
};

export const getLastBackupAt = () => {
    const value = getStorage()?.getItem(LAST_BACKUP_AT_KEY) ?? undefined;
    return value && !Number.isNaN(Date.parse(value)) ? value : undefined;
};

export const setLastBackupAt = (value: string) => {
    getStorage()?.setItem(LAST_BACKUP_AT_KEY, value);
};

export const isBackupDue = (
    recordCount: number,
    lastBackupAt?: string,
    now = Date.now(),
) => {
    if (recordCount === 0) return false;
    if (!lastBackupAt) return true;
    return (
        now - Date.parse(lastBackupAt) >=
        BACKUP_REMINDER_DAYS * 24 * 60 * 60 * 1000
    );
};
