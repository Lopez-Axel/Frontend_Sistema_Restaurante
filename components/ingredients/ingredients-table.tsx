"use client";

import { useEffect, useMemo } from "react";
import {
  CircleCheckBig,
  CircleHelp,
  Loader2,
  Pencil,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  createDataColumnHelper,
  DataTable,
  type DataTableSort,
} from "@/components/tables/data-table";
import { usePagination } from "@/lib/hooks/usePagination";
import {
  formatStock,
  ingredientUnitLabel,
  sortIngredients,
  type Ingredient,
  type InventoryFilter,
} from "@/lib/utils/ingredients";

const columnHelper = createDataColumnHelper<Ingredient>();

type LowStockState = "loading" | "error" | "ready";

interface InventoryStatusBadgeProps {
  ingredientId?: string;
  lowStockIds: Set<string>;
  lowStockState: LowStockState;
}

function InventoryStatusBadge({
  ingredientId,
  lowStockIds,
  lowStockState,
}: InventoryStatusBadgeProps) {
  if (lowStockState === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Verificando
      </span>
    );
  }

  if (lowStockState === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <CircleHelp className="size-3" />
        Sin verificar
      </span>
    );
  }

  const isLow = !!ingredientId && lowStockIds.has(ingredientId);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
        isLow
          ? "bg-hub-neon-red/15 text-hub-neon-red"
          : "bg-hub-neon-green/15 text-hub-neon-green"
      )}
    >
      {isLow ? (
        <TriangleAlert className="size-3" />
      ) : (
        <CircleCheckBig className="size-3" />
      )}
      {isLow ? "Stock bajo" : "Suficiente"}
    </span>
  );
}

interface IngredientsTableProps {
  ingredients: Ingredient[];
  filter: InventoryFilter;
  lowStockIds: Set<string>;
  lowStockState: LowStockState;
  loading: boolean;
  emptyLabel: string;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (ingredient: Ingredient) => void;
}

export function IngredientsTable({
  ingredients,
  filter,
  lowStockIds,
  lowStockState,
  loading,
  emptyLabel,
  onEdit,
  onDelete,
}: IngredientsTableProps) {
  const {
    pageIndex,
    pageSize,
    sort,
    goToPage,
    changePageSize,
    changeSort,
    resetPage,
  } = usePagination({ defaultSort: { id: "name", desc: false } });

  useEffect(() => {
    resetPage();
  }, [filter, resetPage]);

  const sortedIngredients = useMemo(
    () => sortIngredients(ingredients, sort),
    [ingredients, sort]
  );

  const pageCount = Math.max(
    Math.ceil(sortedIngredients.length / pageSize),
    0
  );
  const safePageIndex = Math.min(pageIndex, Math.max(pageCount - 1, 0));
  const pageRows = sortedIngredients.slice(
    safePageIndex * pageSize,
    safePageIndex * pageSize + pageSize
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Ingrediente",
        cell: (info) => (
          <span className="font-medium text-foreground">
            {info.getValue() ?? "Sin nombre"}
          </span>
        ),
      }),
      columnHelper.accessor("unitAbbreviation", {
        header: "Unidad",
        cell: (info) => {
          const ingredient = info.row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {ingredientUnitLabel(ingredient)}
              </span>
              <span className="text-xs text-muted-foreground">
                {ingredient.unitName ?? "Sin unidad"}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("currentStock", {
        header: "Stock actual",
        cell: (info) => {
          const ingredient = info.row.original;
          const isLow =
            lowStockState === "ready" &&
            !!ingredient.id &&
            lowStockIds.has(ingredient.id);

          return (
            <span
              className={cn(
                "font-medium tabular-nums",
                isLow ? "text-hub-neon-red" : "text-foreground"
              )}
            >
              {formatStock(info.getValue(), ingredient.unitAbbreviation)}
            </span>
          );
        },
        meta: { align: "right" },
      }),
      columnHelper.accessor("minimumStock", {
        header: "Stock mínimo",
        cell: (info) => {
          const ingredient = info.row.original;
          return (
            <span className="text-muted-foreground tabular-nums">
              {formatStock(info.getValue(), ingredient.unitAbbreviation)}
            </span>
          );
        },
        meta: { align: "right" },
      }),
      columnHelper.display({
        id: "status",
        header: "Estado",
        cell: (info) => (
          <InventoryStatusBadge
            ingredientId={info.row.original.id}
            lowStockIds={lowStockIds}
            lowStockState={lowStockState}
          />
        ),
        meta: { sortable: false },
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        cell: (info) => {
          const ingredient = info.row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Editar ${ingredient.name ?? "ingrediente"}`}
                onClick={() => onEdit(ingredient)}
                className="text-hub-electric-soft hover:bg-primary/15 hover:text-hub-electric-soft"
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Eliminar ${ingredient.name ?? "ingrediente"}`}
                onClick={() => onDelete(ingredient)}
                className="text-hub-neon-red hover:bg-hub-neon-red/10 hover:text-hub-neon-red"
              >
                <Trash2 />
              </Button>
            </div>
          );
        },
        meta: { sortable: false, align: "right" },
      }),
    ],
    [lowStockIds, lowStockState, onDelete, onEdit]
  );

  const onSortChange = (next: DataTableSort | undefined) => changeSort(next);

  return (
    <DataTable
      columns={columns}
      data={pageRows}
      getRowId={(row) => row.id ?? row.name ?? "ingrediente"}
      pageIndex={safePageIndex}
      pageSize={pageSize}
      pageCount={pageCount}
      totalElements={sortedIngredients.length}
      sort={sort}
      onSortChange={onSortChange}
      onPageChange={goToPage}
      onPageSizeChange={changePageSize}
      loading={loading}
      emptyLabel={emptyLabel}
      containerClassName="scrollbar-hub"
    />
  );
}
