"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddMenuDishDialog } from "@/components/menus/add-menu-dish-dialog";
import { MenuFormDialog } from "@/components/menus/menu-form-dialog";
import { ConfirmDialog } from "@/components/tables/confirm-dialog";
import type { MenuDishResponse } from "@/lib/api/menus";
import {
  useDeleteMenu,
  useDishes,
  useMenu,
  useMenuDishes,
  useRemoveMenuDish,
} from "@/lib/hooks/useMenus";
import { useAuthStore } from "@/lib/stores/auth";
import { formatDateTime } from "@/lib/utils/dates";
import { formatAmount } from "@/lib/utils/money";
import { cn } from "cn";

export default function MenuDetailPage() {
  const params = useParams<{ id: string }>();
  const menuId = typeof params?.id === "string" ? params.id : undefined;
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "ADMIN" || user?.role === "CHEF";

  const menuQuery = useMenu(menuId);
  const dishesQuery = useMenuDishes(menuId);
  const dishesCatalogQuery = useDishes();
  const deleteMenu = useDeleteMenu();
  const removeDish = useRemoveMenuDish();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<MenuDishResponse | null>(null);

  const menu = menuQuery.data;
  const menuDishes = dishesQuery.data ?? [];
  const existingDishIds = menuDishes
    .map((entry) => entry.dishId)
    .filter((id): id is string => !!id);
  const dishById = new Map(
    (dishesCatalogQuery.data ?? [])
      .filter((dish): dish is typeof dish & { id: string } => !!dish.id)
      .map((dish) => [dish.id, dish] as const)
  );

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/menus" />}
          className="-ml-2 text-muted-foreground"
        >
          <ArrowLeft />
          Volver a menús
        </Button>
      </div>

      {menuQuery.isLoading && (
        <Card className="animate-pulse bg-card py-0 ring-1 ring-border">
          <CardContent className="space-y-4 p-6">
            <div className="h-8 w-56 rounded bg-muted" />
            <div className="h-4 w-80 max-w-full rounded bg-muted" />
            <div className="h-10 w-44 rounded bg-muted" />
          </CardContent>
        </Card>
      )}

      {!menuQuery.isLoading && menuQuery.isError && (
        <Card className="bg-card py-0 ring-1 ring-border">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-hub-neon-red/15">
              <BookOpen className="size-6 text-hub-neon-red" />
            </span>
            <div>
              <p className="font-medium text-foreground">
                No se pudo cargar el menú
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Es posible que ya no exista o que no tengas acceso.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => void menuQuery.refetch()}
                disabled={menuQuery.isFetching}
              >
                <RefreshCw
                  className={cn(menuQuery.isFetching && "animate-spin")}
                />
                Reintentar
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/menus" />}
              >
                Volver a menús
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!menuQuery.isLoading && !menuQuery.isError && menu && (
        <>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/40">
                <BookOpen className="size-5 text-hub-electric-soft" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-title text-3xl font-bold text-foreground">
                    {menu.name?.trim() || "Menú sin nombre"}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                      menu.active !== false
                        ? "bg-hub-neon-green/15 text-hub-neon-green"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {menu.active !== false ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-muted-foreground">
                  {menu.description?.trim() || "Sin descripción registrada."}
                </p>
              </div>
            </div>

            {canManage && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setEditOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Pencil />
                  Editar
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setDeleteOpen(true)}
                  className="w-full text-hub-neon-red hover:bg-hub-neon-red/10 hover:text-hub-neon-red sm:w-auto"
                >
                  <Trash2 />
                  Eliminar
                </Button>
              </div>
            )}
          </header>

          <section className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-title text-xl font-semibold text-foreground">
                  Platos del menú
                </h2>
                <p className="text-sm text-muted-foreground">
                  {dishesQuery.isLoading
                    ? "Cargando platos..."
                    : `${menuDishes.length} ${
                        menuDishes.length === 1 ? "plato" : "platos"
                      } en este menú`}
                </p>
              </div>
              {canManage && menuId && (
                <Button
                  onClick={() => setAddOpen(true)}
                  disabled={dishesQuery.isLoading}
                  className="w-full sm:w-auto"
                >
                  <Plus />
                  Agregar plato
                </Button>
              )}
            </div>

            {dishesQuery.isLoading && (
              <Card className="animate-pulse bg-card py-0 ring-1 ring-border">
                <CardContent className="space-y-4 p-5">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <div className="h-4 w-48 rounded bg-muted" />
                        <div className="h-3 w-36 rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {!dishesQuery.isLoading && dishesQuery.isError && (
              <Card className="bg-card py-0 ring-1 ring-border">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-hub-neon-red/15">
                    <UtensilsCrossed className="size-6 text-hub-neon-red" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">
                      No se pudieron cargar los platos
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Revisa la conexión e inténtalo de nuevo.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void dishesQuery.refetch()}
                    disabled={dishesQuery.isFetching}
                  >
                    <RefreshCw
                      className={cn(dishesQuery.isFetching && "animate-spin")}
                    />
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            )}

            {!dishesQuery.isLoading &&
              !dishesQuery.isError &&
              menuDishes.length === 0 && (
                <Card className="bg-card py-0 ring-1 ring-border">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
                      <UtensilsCrossed className="size-6 text-hub-electric-soft" />
                    </span>
                    <p className="mt-4 font-medium text-foreground">
                      Este menú aún no tiene platos
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {canManage
                        ? "Agrega platos del catálogo para armar la carta de este menú."
                        : "Un administrador debe agregar platos a este menú."}
                    </p>
                    {canManage && (
                      <Button
                        className="mt-4"
                        onClick={() => setAddOpen(true)}
                        disabled={!menuId}
                      >
                        <Plus />
                        Agregar plato
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

            {!dishesQuery.isLoading &&
              !dishesQuery.isError &&
              menuDishes.length > 0 && (
                <Card className="bg-card py-0 ring-1 ring-border">
                  <CardContent className="p-0">
                    <ul className="divide-y divide-border">
                      {menuDishes.map((entry, index) => {
                        const dish = entry.dishId
                          ? dishById.get(entry.dishId)
                          : undefined;
                        const name =
                          entry.dishName?.trim() ||
                          dish?.name?.trim() ||
                          "Plato sin nombre";
                        const available = dish?.available !== false;

                        return (
                          <li
                            key={
                              entry.id ?? `${entry.dishId ?? "dish"}-${index}`
                            }
                            className="flex items-center justify-between gap-4 p-4"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-hub-electric-soft">
                                <UtensilsCrossed className="size-4" />
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  {entry.dishId ? (
                                    <Link
                                      href={`/platos/${entry.dishId}`}
                                      className="truncate font-medium text-foreground transition-colors hover:text-hub-electric-soft"
                                    >
                                      {name}
                                    </Link>
                                  ) : (
                                    <p className="truncate font-medium text-foreground">
                                      {name}
                                    </p>
                                  )}
                                  {dish && (
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold",
                                        available
                                          ? "bg-hub-neon-green/15 text-hub-neon-green"
                                          : "bg-muted text-muted-foreground"
                                      )}
                                    >
                                      <span className="size-1.5 rounded-full bg-current" />
                                      {available
                                        ? "Disponible"
                                        : "No disponible"}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  {dish?.categoryName && (
                                    <span>{dish.categoryName}</span>
                                  )}
                                  {dish?.sellingPrice != null && (
                                    <span className="font-medium text-foreground">
                                      {formatAmount(dish?.sellingPrice)}
                                    </span>
                                  )}
                                  {entry.addedByName && (
                                    <span className="inline-flex items-center gap-1">
                                      <User className="size-3" />
                                      {entry.addedByName}
                                    </span>
                                  )}
                                  {entry.addedAt && (
                                    <span className="inline-flex items-center gap-1">
                                      <Calendar className="size-3" />
                                      {formatDateTime(entry.addedAt)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {canManage && entry.id && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Quitar plato del menú"
                                onClick={() => setRemoving(entry)}
                                className="text-hub-neon-red hover:bg-hub-neon-red/10 hover:text-hub-neon-red"
                              >
                                <Trash2 />
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              )}
          </section>
        </>
      )}

      {menuId && (
        <AddMenuDishDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          menuId={menuId}
          existingDishIds={existingDishIds}
        />
      )}

      <MenuFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        menu={menu ?? null}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar menú"
        description={`Se eliminará el menú "${menu?.name ?? ""}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        pending={deleteMenu.isPending}
        onConfirm={() => {
          if (!menuId) return;
          deleteMenu.mutate(menuId, {
            onSuccess: () => {
              setDeleteOpen(false);
              router.push("/menus");
            },
          });
        }}
      />

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Quitar plato del menú"
        description={`"${removing?.dishName ?? "El plato"}" dejará de formar parte de este menú.`}
        confirmLabel="Quitar plato"
        destructive
        pending={removeDish.isPending}
        onConfirm={() => {
          if (!menuId || !removing?.id) return;
          removeDish.mutate(
            { menuId, menuDishId: removing.id },
            { onSuccess: () => setRemoving(null) }
          );
        }}
      />
    </div>
  );
}
