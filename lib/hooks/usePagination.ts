"use client";

import { useCallback, useState } from "react";
import type { DataTableSort } from "@/components/tables/data-table";

interface UsePaginationOptions {
  defaultPageSize?: number;
  defaultSort?: DataTableSort;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(options.defaultPageSize ?? 10);
  const [sort, setSort] = useState<DataTableSort | undefined>(options.defaultSort);

  const goToPage = useCallback((page: number) => setPageIndex(page), []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setPageIndex(0);
  }, []);

  const changeSort = useCallback((next?: DataTableSort) => {
    setSort(next);
    setPageIndex(0);
  }, []);

  const resetPage = useCallback(() => setPageIndex(0), []);

  return {
    pageIndex,
    pageSize,
    sort,
    goToPage,
    changePageSize,
    changeSort,
    resetPage,
  };
}