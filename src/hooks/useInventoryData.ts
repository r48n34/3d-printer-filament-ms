import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../db";
import { getSpoolBalance } from "../utils/filament";

export const useInventoryData = () => {
    const data = useLiveQuery(async () => {
        const [spools, prints, adjustments] = await Promise.all([
            db.spools.toArray(),
            db.prints.toArray(),
            db.adjustments.toArray(),
        ]);
        spools.sort((a, b) => a.name.localeCompare(b.name));
        return { spools, prints, adjustments };
    }, []);

    const spools = data?.spools ?? [];
    const prints = data?.prints ?? [];
    const adjustments = data?.adjustments ?? [];
    const balanceBySpool = new Map(
        spools.map((spool) => [
            spool.id,
            getSpoolBalance(spool, prints, adjustments),
        ]),
    );

    return {
        spools,
        prints,
        adjustments,
        balanceBySpool,
        loading: data === undefined,
    };
};
