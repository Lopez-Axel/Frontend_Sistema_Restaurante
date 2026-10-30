"use client";

import { useState } from "react";
import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { Armchair, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusChip } from "@/components/tables/status-chip";
import { useTableSeats, useUpdateSeat } from "@/lib/hooks/useTables";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { resolveTableStatus } from "@/lib/utils/table-status";
import { cn } from "cn";
import type { components } from "@/types/api";

type RestaurantTableResponse = components["schemas"]["RestaurantTableResponse"];
type TableStatus = components["schemas"]["TableStatus"];

interface TableCardProps {
  table: RestaurantTableResponse;
  statuses: TableStatus[];
  viewOnly?: boolean;
}

export function TableCard({ table, statuses, viewOnly }: TableCardProps) {
  const statusColors = usePreferencesStore((s) => s.statusColors);
  const [seatsOpen, setSeatsOpen] = useState(false);

  const seatsQuery = useTableSeats(table.id ?? "");
  const updateSeat = useUpdateSeat(table.id ?? "");

  const ui = resolveTableStatus(table.status, statuses, statusColors);
  const showSeats = !viewOnly && !!table.id;
  const seats = seatsQuery.data ?? [];

  return (
    <Card
      className="gap-0 rounded-xl bg-background py-0 shadow-sm ring-1 ring-border transition-colors hover:ring-primary/50"
      style={{ borderLeftColor: ui.color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center gap-2 p-3">
        <Link
          href={`/mesas/${table.id}`}
          draggable={false}
          className="flex min-w-0 flex-1 items-center justify-between gap-2"
        >
          <span className="min-w-0">
            <span className="block truncate font-subtitle text-base leading-tight font-bold text-foreground">
              {table.number ? `Mesa ${table.number}` : "Mesa"}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3" />
              {table.capacity} asientos
            </span>
          </span>
          <StatusChip statusValue={table.status} statuses={statuses} />
        </Link>
        {showSeats && (
          <button
            type="button"
            aria-label={seatsOpen ? "Ocultar sillas" : "Editar sillas"}
            aria-expanded={seatsOpen}
            onClick={() => setSeatsOpen((open) => !open)}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg border transition-colors",
              seatsOpen
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            <Armchair className="size-4" />
          </button>
        )}
      </div>
      {seatsOpen && (
        <CardContent className="border-t px-3 py-2">
          {seatsQuery.isFetching && seats.length === 0 ? (
            <p className="py-1 text-xs text-muted-foreground">
              Cargando sillas...
            </p>
          ) : seats.length === 0 ? (
            <p className="py-1 text-xs text-muted-foreground">
              Sin sillas registradas.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {seats.map((seat) => {
                const occupied = !!seat.occupied;
                return (
                  <button
                    key={seat.id}
                    type="button"
                    aria-label={`Silla ${seat.number}${occupied ? " ocupada" : " libre"}`}
                    onClick={() =>
                      updateSeat.mutate({
                        seatId: seat.id ?? "",
                        occupied: !occupied,
                      })
                    }
                    disabled={!seat.id || updateSeat.isPending}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                      occupied
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary text-secondary-foreground hover:bg-muted"
                    )}
                  >
                    {seat.number}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function DraggableTableCard(props: TableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: props.table.id ?? props.table.number?.toString() ?? "table",
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab outline-none active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <TableCard {...props} />
    </div>
  );
}
