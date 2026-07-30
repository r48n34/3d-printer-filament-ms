import { afterEach, describe, expect, it } from "vitest";

import {
    getLastBackupAt,
    isBackupDue,
    LAST_BACKUP_AT_KEY,
    setLastBackupAt,
} from "./preferences";

afterEach(() => {
    localStorage.clear();
});

describe("backup preferences", () => {
    it("stores only a valid backup timestamp", () => {
        const value = "2026-07-20T10:00:00.000Z";
        setLastBackupAt(value);
        expect(localStorage.getItem(LAST_BACKUP_AT_KEY)).toBe(value);
        expect(getLastBackupAt()).toBe(value);

        localStorage.setItem(LAST_BACKUP_AT_KEY, "not-a-date");
        expect(getLastBackupAt()).toBeUndefined();
    });

    it("reminds only when records exist and the backup is stale", () => {
        const now = Date.parse("2026-07-30T00:00:00.000Z");
        expect(isBackupDue(0, undefined, now)).toBe(false);
        expect(isBackupDue(1, undefined, now)).toBe(true);
        expect(isBackupDue(1, "2026-07-01T00:00:00.000Z", now)).toBe(false);
        expect(isBackupDue(1, "2026-06-30T00:00:00.000Z", now)).toBe(true);
    });
});
