"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  createDataColumnHelper,
  DataTable,
  type DataTableSort,
} from "@/components/tables/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { ordersApi, type OrdersListParams } from "@/lib/api/orders";
import { orderQueryKeys } from "@/lib/hooks/useOrders";
import { usePagination } from "@/lib/hooks/usePagination";
import { formatDateTime } from "@/lib/utils/dates";
import { formatAmount } from "@/lib/utils/money";
import {
  ORDER_STATUS_NAMES,
  orderStatusLabel,
  type OrderStatusName,
} from "@/lib/utils/order-status";
import type { components } from "@/types/api";

type OrderResponse = components["schemas"]["OrderResponse"];

const columnHelper = createDataColumnHelper<OrderResponse>();

const columns = [
  columnHelper.accessor("tableNumber", {
    id: "table.number",
    header: "Mesa",
    cell: (info) => (info.getValue() ? `Mesa ${info.getValue()}` : "—"),
  }),
  columnHelper.accessor("dateTime", {
    id: "dateTime",
    header: "Fecha",
    cell: (info) => formatDateTime(info.getValue()),
  }),
  columnHelper.accessor("waiterName", {
    header: "Mozo",
    cell: (info) => info.getValue() ?? "—",
    meta: { sortable: false },
  }),
  columnHelper.accessor("orderStatusName", {
    header: "Estado",
    cell: (info) => (
      <OrderStatusBadge
        name={info.getValue()}
        colorHex={info.row.original.colorHex}
      />
    ),
    meta: { sortable: false },
  }),
  columnHelper.accessor("total", {
    header: "Total",
    cell: (info) => formatAmount(info.getValue()),
    meta: { sortable: false, align: "right" },
  }),
  columnHelper.display({
    id: "acciones",
    header: "",
    cell: (info) => (
      <Link
        href={`/pedidos/${info.row.original.id}`}
        className="text-sm font-medium text-primary hover:underline"
      >
        Ver
      </Link>
    ),
    meta: { sortable: false },
  }),
];

interface OrdersTableProps {
  variant?: "all" | "my";
  tableId?: string;
}

export function OrdersTable({ variant = "all", tableId }: OrdersTableProps) {
  const { pageIndex, pageSize, sort, goToPage, changePageSize, changeSort, resetPage } =
    usePagination({ defaultSort: { id: "dateTime", desc: true } });

  const [statusFilter, setStatusFilter] = useState<OrderStatusName | "ALL">("ALL");
  const [wasTableId, setWasTableId] = useState(tableId);

  if (tableId !== wasTableId) {
    setWasTableId(tableId);
    resetPage();
  }

  const allParams: OrdersListParams = {
    tableId,
    page: pageIndex,
    size: pageSize,
    sort: sort ? [`${sort.id},${sort.desc ? "desc" : "asc"}`] : undefined,
  };
  const myParams: Omit<OrdersListParams, "tableId"> = {
    page: pageIndex,
    size: pageSize,
    sort: allParams.sort,
  };

  const query = useQuery({
    queryKey:
      variant === "all"
        ? orderQueryKeys.list(allParams)
        : orderQueryKeys.my(myParams),
    queryFn: () =>
      variant === "all" ? ordersApi.list(allParams) : ordersApi.my(myParams),
    placeholderData: (previous) => previous,
  });

  const allRows = query.data?.content ?? [];
  const filteredRows =
    statusFilter === "ALL"
      ? allRows
      : allRows.filter((order) => order.orderStatusName === statusFilter);

  const pageCount = query.data?.totalPages ?? 0;
  const totalElements = query.data?.totalElements ?? 0;

  const onSortChange = (next: DataTableSort | undefined) => changeSort(next);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Filtro por estado
        </label>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter((value ?? "ALL") as OrderStatusName | "ALL")}
        >
          <SelectTrigger className="w-52" aria-label="Filtrar por estado">
            <SelectValue placeholder="Todos los estados">
              {(value: string | null) =>
                value && value !== "ALL" ? orderStatusLabel(value as OrderStatusName) : null
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            {ORDER_STATUS_NAMES.map((name) => (
              <SelectItem key={name} value={name}>
                {orderStatusLabel(name as OrderStatusName)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          El filtro por estado se aplica sobre la página actual
        </p>
      </div>

      <DataTable
        columns={columns}
        data={filteredRows}
        getRowId={(row) => row.id ?? String(row.tableNumber)}
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        totalElements={totalElements}
        sort={sort}
        onSortChange={onSortChange}
        onPageChange={goToPage}
        onPageSizeChange={changePageSize}
        loading={query.isLoading}
        emptyLabel="No hay pedidos"
      />
    </div>
  );
}