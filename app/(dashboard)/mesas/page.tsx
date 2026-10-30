"use client";

import { useState } from "react";
import { Armchair, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableBoard } from "@/components/tables/table-board";
import { TableFormDialog } from "@/components/tables/table-form-dialog";
import { useRestaurantTables } from "@/lib/hooks/useTables";
import { useAuthStore } from "@/lib/stores/auth";
import { cn } from "cn";

export default function MesasPage() {
  const isAdmin = useAuthStore((s) => s.user?.role === "ADMIN");
  const tablesQuery = useRestaurantTables();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/40">
            <Armchair className="size-5 text-hub-electric-soft" />
          </span>
          <div>
            <h1 className="font-title text-3xl font-bold text-foreground">
              Mesas
            </h1>
            <p className="flex items-center gap-2 text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 animate-pulse rounded-full bg-hub-neon-green" />
                En vivo
              </span>
              · Arrastra una mesa a otra columna para cambiar su estado
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="lg"
            variant="outline"
            onClick={() => void tablesQuery.refetch()}
            disabled={tablesQuery.isFetching}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={cn(tablesQuery.isFetching && "animate-spin")} />
            Actualizar
          </Button>
          {isAdmin && (
            <Button
              size="lg"
              onClick={() => setCreateOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus />
              Nueva mesa
            </Button>
          )}
        </div>
      </header>

      <TableBoard />

      <TableFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
