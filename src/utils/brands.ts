import type { Spool } from "../types";

export const getBrandSuggestions = (spools: Spool[]) => {
    const brandsByName = new Map<string, string>();

    for (const { brand } of spools) {
        const trimmedBrand = brand?.trim();
        if (!trimmedBrand) continue;

        const normalizedBrand = trimmedBrand.toLocaleLowerCase();
        if (!brandsByName.has(normalizedBrand))
            brandsByName.set(normalizedBrand, trimmedBrand);
    }

    return [...brandsByName.values()].sort((left, right) =>
        left.localeCompare(right),
    );
};
