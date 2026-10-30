"use client";

import { useMemo, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import robotOcupado from "@/public/robot_ocupado.png";
import robotReserva from "@/public/robot_reserva.png";
import robotLimpieza from "@/public/robot_limpieza.png";
import robotDisponible from "@/public/robot_disponible.png";
import { TableCard, DraggableTableCard } from "@/components/tables/table-card";
import {
  useRestaurantTables,
  useTableStatuses,
  useChangeTableStatus,
} from "@/lib/hooks/useTables";
import { useTableStatusStream } from "@/lib/hooks/useTableStatusStream";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { resolveTableStatus } from "@/lib/utils/table-status";
import { cn } from "cn";
import type { components } from "@/types/api";

type RestaurantTableResponse = components["schemas"]["RestaurantTableResponse"];
type TableStatus = components["schemas"]["TableStatus"];

function robotForStatus(name: string | undefined): StaticImageData | null {
  const value = (name ?? "").toUpperCase();
  if (/OCCUP|OCUP/.test(value)) return robotOcupado;
  if (/RESERV/.test(value)) return robotReserva;
  if (/CLEAN|LIMP/.test(value)) return robotLimpieza;
  if (/AVAIL|DISP|FREE|LIBRE/.test(value)) return robotDisponible;
  return null;
}

export function TableBoard() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const tablesQuery = useRestaurantTables();
  const statusesQuery = useTableStatuses();
  const changeStatus = useChangeTableStatus();

  useTableStatusStream();

  const tables = useMemo(() => tablesQuery.data ?? [], [tablesQuery.data]);
  const statuses = useMemo(
    () => statusesQuery.data ?? [],
    [statusesQuery.data]
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    })
  );

  const byStatus = useMemo(() => {
    const map: Record<string, RestaurantTableResponse[]> = {};
    for (const status of statuses) {
      if (status.id) map[status.id] = [];
    }
    for (const table of tables) {
      const key = statuses.find((s) => s.name === table.status)?.id;
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(table);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
    }
    return map;
  }, [tables, statuses]);

  const activeTable = tables.find((t) => t.id === activeId) ?? null;

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const fromId = String(event.active.id);
    const toId = event.over ? String(event.over.id) : null;
    setActiveId(null);
    if (!toId) return;
    const table = tables.find((t) => t.id === fromId);
    const target = statuses.find((s) => s.id === toId);
    if (!table || !target) return;
    const current = statuses.find((s) => s.name === table.status);
    if (current?.id === toId) return;
    changeStatus.mutate({ id: fromId, body: { statusId: toId } });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {statuses.map((status) => (
          <TableColumn
            key={status.id}
            status={status}
            statuses={statuses}
            tables={byStatus[status.id ?? ""] ?? []}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTable ? (
          <div className="cursor-grabbing">
            <TableCard table={activeTable} statuses={statuses} viewOnly />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function TableColumn({
  status,
  statuses,
  tables,
}: {
  status: TableStatus;
  statuses: TableStatus[];
  tables: RestaurantTableResponse[];
}) {
  const statusColors = usePreferencesStore((s) => s.statusColors);
  const { setNodeRef, isOver } = useDroppable({
    id: status.id ?? status.name ?? "col",
  });
  const ui = resolveTableStatus(status.name, statuses, statusColors);
  const robot = robotForStatus(status.name);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[320px] flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-border transition-colors",
        isOver && "bg-muted/60 ring-2 ring-primary/50"
      )}
      style={{ borderTopWidth: 3, borderTopColor: ui.color }}
    >
      <div className="flex items-center gap-2 px-1">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: ui.color }}
        />
        <h2 className="font-subtitle text-sm font-bold tracking-widest text-foreground uppercase">
          {ui.label}
        </h2>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
          style={{ backgroundColor: ui.color, color: ui.text }}
        >
          {tables.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {tables.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-2 py-6 text-center text-xs text-muted-foreground">
            Sin mesas
          </p>
        ) : (
          tables.map((table) => (
            <DraggableTableCard
              key={table.id}
              table={table}
              statuses={statuses}
            />
          ))
        )}
      </div>

      {robot && (
        <Image
          src={robot}
          alt=""
          className="mx-auto mt-2 h-auto w-36 select-none object-contain"
          draggable={false}
        />
      )}
    </div>
  );
}
