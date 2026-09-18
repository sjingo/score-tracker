"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";

const GAME_TYPE_PARAM = "type";
const OPPOSITION_PARAM = "opposition";

export function useMatchFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPathname = pathname ?? "/";
  const currentSearchParams = useMemo(
    () => searchParams ?? new URLSearchParams(),
    [searchParams],
  );

  const gameTypeId = currentSearchParams.get(GAME_TYPE_PARAM);
  const oppositionSearch = currentSearchParams.get(OPPOSITION_PARAM) ?? "";
  const [oppositionInput, setOppositionInput] = useState(oppositionSearch);
  const [debouncedOppositionInput] = useDebounce(oppositionInput, 100);
  const lastAppliedSearch = useRef(oppositionSearch);

  const updateSearchParams = useCallback(
    (updates: { gameTypeId?: string | null; oppositionSearch?: string }) => {
      const nextSearchParams = new URLSearchParams(
        currentSearchParams.toString(),
      );

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
      router.replace(query ? `${currentPathname}?${query}` : currentPathname, {
        scroll: false,
      });
    },
    [currentPathname, currentSearchParams, router],
  );

  useEffect(() => {
    if (lastAppliedSearch.current !== oppositionSearch) {
      setOppositionInput(oppositionSearch);
    }
    lastAppliedSearch.current = oppositionSearch;
  }, [oppositionSearch]);

  useEffect(() => {
    const trimmedInput = debouncedOppositionInput.trim();
    const nextSearch = trimmedInput.length >= 2 ? trimmedInput : "";

    if (nextSearch !== oppositionSearch) {
      lastAppliedSearch.current = nextSearch;
      updateSearchParams({ oppositionSearch: nextSearch });
    }
  }, [debouncedOppositionInput, oppositionSearch, updateSearchParams]);

  return {
    gameTypeId,
    oppositionSearch,
    oppositionInput,
    setGameTypeId: (value: string | null) =>
      updateSearchParams({ gameTypeId: value }),
    setOppositionSearch: setOppositionInput,
  };
}
