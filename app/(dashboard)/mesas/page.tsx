"use client";

import { TableBoard } from "@/components/tables/table-board";

export default function MesasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-title text-3xl text-foreground">Mesas</h1>
        <p className="flex items-center gap-2 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 animate-pulse rounded-full bg-hub-neon-green" />
            En vivo
          </span>
          · Tablero con estados por columna
        </p>
      </div>
      <TableBoard />
    </div>
  );
}