"use client";

import { useState } from "react";
import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Armchair, GripVertical, Users } from "lucide-react";
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
  dragHandle?: React.ReactNode;
}

export function TableCard({
  table,
  statuses,
  viewOnly,
  dragHandle,
}: TableCardProps) {
  const statusColors = usePreferencesStore((s) => s.statusColors);
  const [seatsOpen, setSeatsOpen] = useState(false);

  const seatsQuery = useTableSeats(stringOrEmpty(table.id));
  const updateSeat = useUpdateSeat(stringOrEmpty(table.id));

  const ui = resolveTableStatus(table.status, statuses, statusColors);
  const showSeats = !viewOnly && !!table.id;
  const seats = seatsQuery.data ?? [];

  function submitSeat(seatId: string, occupied: boolean) {
    updateSeat.mutate({ seatId, occupied });
  }

  return (
    <Card
      className="gap-0 rounded-xl py-0 shadow-sm"
      style={{ borderLeftColor: ui.color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center gap-1.5 p-2">
        {dragHandle}
        <Link
          href={`/mesas/${table.id}`}
          className="group flex min-w-0 flex-1 items-center justify-between gap-2"
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
        <CardContent className="border-t px-2.5 py-2">
          {seatsQuery.isFetching && seats.length === 0 ? (
            <p className="py-1 text-xs text-muted-foreground">Cargando sillas...</p>
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
                    onClick={() => submitSeat(seat.id ?? "", !occupied)}
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

function stringOrEmpty(id: string | undefined): string {
  return id ?? "";
}

export function DraggableTableCard(props: TableCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } =
    useDraggable({
      id: props.table.id ?? props.table.number?.toString() ?? "table",
    });

  const handle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      aria-label="Arrastrar mesa a otro estado"
      {...attributes}
      {...listeners}
      className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
    >
      <GripVertical className="size-4" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className={cn(isDragging && "cursor-grabbing")}
    >
      <TableCard {...props} dragHandle={handle} />
    </div>
  );
}