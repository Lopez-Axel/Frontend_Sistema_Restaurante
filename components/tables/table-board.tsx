"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCard, DraggableTableCard } from "@/components/tables/table-card";
import { TableFormDialog } from "@/components/tables/table-form-dialog";
import { useRestaurantTables, useTableStatuses, useChangeTableStatus } from "@/lib/hooks/useTables";
import { useTableStatusStream } from "@/lib/hooks/useTableStatusStream";
import { useAuthStore } from "@/lib/stores/auth";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { resolveTableStatus } from "@/lib/utils/table-status";
import { cn } from "cn";
import type { components } from "@/types/api";

type RestaurantTableResponse = components["schemas"]["RestaurantTableResponse"];
type TableStatus = components["schemas"]["TableStatus"];

export function TableBoard() {
  const role = useAuthStore((s) => s.user?.role);
  const isAdmin = role === "ADMIN";

  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

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
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const byStatus = useMemo(() => {
    const map: Record<string, RestaurantTableResponse[]> = {};
    for (const status of statuses) {
      if (status.id) map[status.id] = [];
    }
    for (const table of tables) {
      const entry = statuses.find((s) => s.name === table.status);
      const key = entry?.id;
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
    if (!fromId || !toId) return;
    const table = tables.find((t) => t.id === fromId);
    const target = statuses.find((s) => s.id === toId);
    if (!table || !target) return;
    const current = statuses.find((s) => s.name === table.status);
    if (current?.id === toId) return;
    changeStatus.mutate({ id: fromId, body: { statusId: toId } });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Arrastra una mesa entre columnas para cambiar su estado.
        </p>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> Nueva mesa
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => tablesQuery.refetch()}
            disabled={tablesQuery.isFetching}
          >
            <RefreshCw
              className={cn("size-4", tablesQuery.isFetching && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid auto-cols-[minmax(240px,260px)] grid-flow-col gap-3 overflow-x-auto pb-2">
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
            <div className="w-[260px]">
              <TableCard table={activeTable} statuses={statuses} viewOnly />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TableFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
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
  const { setNodeRef, isOver } = useDroppable({ id: status.id ?? status.name ?? "col" });
  const ui = resolveTableStatus(status.name, statuses, statusColors);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[120px] flex-col gap-2 rounded-xl border bg-muted/40 p-2 transition-colors",
        isOver && "bg-muted/80 ring-2 ring-ring/40"
      )}
      style={{ borderTopWidth: 2, borderTopColor: ui.color }}
    >
      <div className="flex items-center gap-2 px-1 pb-1.5">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: ui.color }}
        />
        <span className="font-subtitle text-xs font-bold tracking-widest uppercase text-foreground">
          {ui.label}
        </span>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: ui.color, color: ui.text }}
        >
          {tables.length}
        </span>
      </div>
      {tables.length === 0 ? (
        <p className="px-1 py-3 text-center text-xs text-muted-foreground">
          Sin mesas
        </p>
      ) : (
        tables.map((table) => (
          <DraggableTableCard key={table.id} table={table} statuses={statuses} />
        ))
      )}
    </div>
  );
}