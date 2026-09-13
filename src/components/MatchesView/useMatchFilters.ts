"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const GAME_TYPE_PARAM = "type";
const OPPOSITION_PARAM = "opposition";

export function useMatchFilters() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const gameTypeId = searchParams.get(GAME_TYPE_PARAM);
    const oppositionSearch = searchParams.get(OPPOSITION_PARAM) ?? "";

    const updateSearchParams = (updates: {
        gameTypeId?: string | null;
        oppositionSearch?: string;
    }) => {
        const nextSearchParams = new URLSearchParams(searchParams.toString());

        if ("gameTypeId" in updates) {
            if (updates.gameTypeId) {
                nextSearchParams.set(GAME_TYPE_PARAM, updates.gameTypeId);
            } else {
                nextSearchParams.delete(GAME_TYPE_PARAM);
            }
        }

        if ("oppositionSearch" in updates) {
            if (updates.oppositionSearch) {
                nextSearchParams.set(OPPOSITION_PARAM, updates.oppositionSearch);
            } else {
                nextSearchParams.delete(OPPOSITION_PARAM);
            }
        }

        const query = nextSearchParams.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    };

    return {
        gameTypeId,
        oppositionSearch,
        setGameTypeId: (value: string | null) => updateSearchParams({ gameTypeId: value }),
        setOppositionSearch: (value: string) => updateSearchParams({ oppositionSearch: value }),
    };
}