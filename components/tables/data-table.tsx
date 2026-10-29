"use client";

import {
  coreRowModelsFeature,
  createTableHook,
  tableFeatures,
  type CellData,
  type ColumnDef,
  type RowData,
  type TableFeatures,
} from "@tanstack/react-table";
import { cn } from "cn";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* eslint-disable @typescript-eslint/no-unused-vars */
declare module "@tanstack/react-table" {
  interface ColumnMeta<
    in out TFeatures extends TableFeatures,
    in out TData extends RowData,
    TValue extends CellData = CellData,
  > {
    align?: "left" | "right";
    sortable?: boolean;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

const features = tableFeatures({ coreRowModelsFeature });

const { useAppTable, createAppColumnHelper } = createTableHook({ features });

export { createAppColumnHelper as createDataColumnHelper };

export interface DataTableSort {
  id: string;
  desc: boolean;
}

export interface DataTableProps<TData extends RowData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<any, TData, any>[];
  data: TData[];
  getRowId?: (row: TData) => string;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalElements?: number;
  sort?: DataTableSort;
  onSortChange?: (sort: DataTableSort | undefined) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  emptyLabel?: string;
  sortable?: boolean;
  loading?: boolean;
  containerClassName?: string;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  pageIndex,
  pageSize,
  pageCount,
  totalElements,
  sort,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  emptyLabel = "Sin registros",
  sortable = true,
  loading = false,
  containerClassName,
}: DataTableProps<TData>) {
  const table = useAppTable<TData>({
    data,
    columns,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  });

  const firstPage = 0;
  const lastPage = Math.max(pageCount - 1, 0);

  const toggleSort = (headerId: string) => {
    if (!onSortChange) return;
    if (sort && sort.id === headerId && sort.desc) {
      onSortChange(undefined);
    } else if (sort && sort.id === headerId) {
      onSortChange({ id: headerId, desc: true });
    } else {
      onSortChange({ id: headerId, desc: false });
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border">
        <Table containerClassName={containerClassName}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isPlaceholder = header.isPlaceholder;
                  const canSort =
                    sortable &&
                    onSortChange &&
                    header.column.columnDef.meta?.sortable !== false &&
                    !isPlaceholder;
                  const isActiveSort = sort?.id === header.id;
                  return (
                    <TableHead key={header.id}>
                      {canSort ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(header.id)}
                          className="inline-flex items-center gap-1.5 text-left font-medium uppercase tracking-wide hover:text-foreground"
                        >
                          <table.FlexRender header={header} />
                          {isActiveSort ? (
                            sort.desc ? (
                              <ArrowDown className="size-3.5" />
                            ) : (
                              <ArrowUp className="size-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Cargando...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.columnDef.meta?.align === "right" &&
                          "text-right tabular-nums"
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {typeof totalElements === "number"
            ? `${totalElements} ${totalElements === 1 ? "registro" : "registros"}`
            : ""}
        </p>
        <div className="flex items-center gap-3">
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filas</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger size="sm" aria-label="Filas por página">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {onPageChange && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pageIndex <= firstPage}
                onClick={() => onPageChange(pageIndex - 1)}
                className="inline-flex h-8 items-center rounded-md border px-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="px-1 text-sm text-muted-foreground">
                {pageCount > 0 ? pageIndex + 1 : 0} de {pageCount}
              </span>
              <button
                type="button"
                disabled={pageIndex >= lastPage}
                onClick={() => onPageChange(pageIndex + 1)}
                className="inline-flex h-8 items-center rounded-md border px-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}