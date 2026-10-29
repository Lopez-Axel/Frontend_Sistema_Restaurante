"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  Trash2,
} from "lucide-react";
import robotMenu from "@/public/robot_menu_2.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mascot } from "@/components/brand/mascot";
import { MenuFormDialog } from "@/components/menus/menu-form-dialog";
import { ConfirmDialog } from "@/components/tables/confirm-dialog";
import type { MenuResponse } from "@/lib/api/menus";
import { useDeleteMenu, useMenus } from "@/lib/hooks/useMenus";
import { useAuthStore } from "@/lib/stores/auth";
import { cn } from "cn";

const MASCOT_CLASS =
  "order-last mx-auto w-full max-w-56 sm:max-w-64 lg:order-first lg:mx-0 lg:w-56 lg:max-w-none xl:w-72";

export default function MenusPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "ADMIN" || user?.role === "CHEF";

  const menusQuery = useMenus();
  const deleteMenu = useDeleteMenu();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenuResponse | null>(null);
  const [deleting, setDeleting] = useState<MenuResponse | null>(null);

  const menus = useMemo(() => menusQuery.data ?? [], [menusQuery.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return menus;
    return menus.filter((menu) => {
      const name = menu.name?.toLowerCase() ?? "";
      const description = menu.description?.toLowerCase() ?? "";
      return name.includes(term) || description.includes(term);
    });
  }, [menus, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(menu: MenuResponse) {
    setEditing(menu);
    setFormOpen(true);
  }

  const showSkeleton = menusQuery.isLoading;
  const showError =
    menusQuery.isError && !menusQuery.isLoading && menus.length === 0;
  const showEmpty = !showSkeleton && !showError && menus.length === 0;
  const showNoResults =
    !showSkeleton && !showError && menus.length > 0 && filtered.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/40">
            <BookOpen className="size-5 text-hub-electric-soft" />
          </span>
          <div>
            <h1 className="font-title text-3xl font-bold text-foreground">
              Menú
            </h1>
            <p className="text-muted-foreground">
              Agrupaciones de platos que se ofrecen en la carta
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            size="lg"
            variant="outline"
            onClick={() => void menusQuery.refetch()}
            disabled={menusQuery.isFetching}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={cn(menusQuery.isFetching && "animate-spin")}
            />
            Actualizar
          </Button>
          {canManage && (
            <Button
              size="lg"
              onClick={openCreate}
              className="w-full sm:w-auto"
            >
              <Plus />
              Nuevo menú
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
        <Mascot src={robotMenu} className={MASCOT_CLASS} />

        <div className="@container min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {menusQuery.data
                  ? `${filtered.length} de ${menus.length} menús`
                  : "Cargando menús..."}
              </p>
              <p className="text-xs text-muted-foreground">
                El listado muestra únicamente menús activos.
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o descripción..."
                aria-label="Buscar menús"
                className="pl-9"
              />
            </div>
          </div>

          {showSkeleton && (
            <div className="grid gap-4 @sm:grid-cols-2 @3xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card
                  key={index}
                  className="animate-pulse bg-card py-0 ring-1 ring-border"
                >
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="h-5 w-40 rounded bg-muted" />
                      <div className="h-5 w-20 rounded-full bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-52 rounded bg-muted" />
                      <div className="h-4 w-48 rounded bg-muted" />
                    </div>
                    <div className="h-8 w-28 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {showError && (
            <Card className="bg-card py-0 ring-1 ring-border">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-hub-neon-red/15">
                  <BookOpen className="size-6 text-hub-neon-red" />
                </span>
                <div>
                  <p className="font-medium text-foreground">
                    No se pudieron cargar los menús
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Revisa la conexión e inténtalo de nuevo.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => void menusQuery.refetch()}
                  disabled={menusQuery.isFetching}
                >
                  <RefreshCw
                    className={cn(menusQuery.isFetching && "animate-spin")}
                  />
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          )}

          {showEmpty && (
            <Card className="bg-card py-0 ring-1 ring-border">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
                  <BookOpen className="size-6 text-hub-electric-soft" />
                </span>
                <p className="mt-4 font-medium text-foreground">
                  No hay menús registrados
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {canManage
                    ? "Crea el primer menú para agrupar los platos de la carta."
                    : "Un administrador debe crear el primer menú."}
                </p>
                {canManage && (
                  <Button className="mt-4" onClick={openCreate}>
                    <Plus />
                    Nuevo menú
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {showNoResults && (
            <Card className="bg-card py-0 ring-1 ring-border">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <SearchX className="size-6 text-muted-foreground" />
                </span>
                <p className="mt-4 font-medium text-foreground">
                  No hay menús que coincidan con la búsqueda
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prueba con otro nombre o descripción.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearch("")}
                >
                  Limpiar búsqueda
                </Button>
              </CardContent>
            </Card>
          )}

          {!showSkeleton &&
            !showError &&
            !showEmpty &&
            !showNoResults && (
              <div className="grid gap-4 @sm:grid-cols-2 @3xl:grid-cols-3">
                {filtered.map((menu) => {
                  const active = menu.active !== false;
                  return (
                    <Card
                      key={menu.id ?? menu.name}
                      className="flex flex-col bg-card py-0 ring-1 ring-border transition-colors hover:ring-primary/50"
                    >
                      <CardContent className="flex flex-1 flex-col gap-4 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <h2 className="font-title text-xl font-semibold text-foreground">
                            {menu.name?.trim() || "Menú sin nombre"}
                          </h2>
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                              active
                                ? "bg-hub-neon-green/15 text-hub-neon-green"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <span className="size-1.5 rounded-full bg-current" />
                            {active ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        <p className="line-clamp-4 text-sm text-muted-foreground">
                          {menu.description?.trim() ||
                            "Sin descripción registrada."}
                        </p>

                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                          {menu.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              nativeButton={false}
                              render={<Link href={`/menus/${menu.id}`} />}
                            >
                              <BookOpen />
                              Ver platos
                            </Button>
                          )}
                          {canManage && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Editar menú"
                                onClick={() => openEdit(menu)}
                                className="text-hub-electric-soft hover:bg-primary/15 hover:text-hub-electric-soft"
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Eliminar menú"
                                onClick={() => setDeleting(menu)}
                                className="text-hub-neon-red hover:bg-hub-neon-red/10 hover:text-hub-neon-red"
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      <MenuFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        menu={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar menú"
        description={`Se eliminará el menú "${deleting?.name ?? ""}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        pending={deleteMenu.isPending}
        onConfirm={() => {
          if (!deleting?.id) return;
          deleteMenu.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
          });
        }}
      />
    </div>
  );
}
