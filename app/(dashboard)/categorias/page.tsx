"use client";

import { useState } from "react";
import { Calendar, FolderTree, Pencil, Plus, Trash2, User } from "lucide-react";
import robotCategoria from "@/public/robot_categoria.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mascot } from "@/components/brand/mascot";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { ConfirmDialog } from "@/components/tables/confirm-dialog";
import {
  useCategories,
  useDeleteCategory,
  type CategoryDTO,
} from "@/lib/hooks/useCategories";
import { useAuthStore } from "@/lib/stores/auth";
import { cn } from "cn";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function formatDate(value: string | undefined | null) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return format(date, "dd/MM/yyyy HH:mm", { locale: es });
  } catch {
    return null;
  }
}

function getUserName(user: unknown): string | null {
  if (!user || typeof user !== "object") return null;
  const u = user as Record<string, unknown>;
  const first = typeof u.firstName === "string" ? u.firstName.trim() : "";
  const last = typeof u.lastName === "string" ? u.lastName.trim() : "";
  const full = `${first} ${last}`.trim();
  if (full) return full;
  const email = typeof u.email === "string" ? u.email.trim() : "";
  if (email) return email;
  const username = typeof u.username === "string" ? u.username.trim() : "";
  if (username) return username;
  const name = typeof u.name === "string" ? u.name.trim() : "";
  if (name) return name;
  return null;
}

const MASCOT_CLASS = "-scale-x-100 size-10 shrink-0 sm:size-12 lg:size-14";

export default function CategoriasPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const categoriesQuery = useCategories();
  const deleteCategory = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDTO | undefined>(undefined);
  const [deleting, setDeleting] = useState<CategoryDTO | undefined>(undefined);

  const categories = categoriesQuery.data ?? [];

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(category: CategoryDTO) {
    setEditing(category);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/40">
            <FolderTree className="size-5 text-hub-electric-soft" />
          </span>
          <div>
            <h1 className="font-title text-3xl font-bold text-foreground">
              Categorías
            </h1>
            <p className="text-muted-foreground">Agrupación de platos por tipo</p>
          </div>
        </div>

        {isAdmin && (
          <Button
            size="lg"
            onClick={openCreate}
            className="w-full sm:w-auto"
          >
            <Plus />
            Nueva categoría
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
        <Mascot src={robotCategoria} className={MASCOT_CLASS} />

        <div className="@container min-w-0 flex-1">
          {categoriesQuery.isLoading && (
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!categoriesQuery.isLoading && categories.length === 0 && (
            <Card className="bg-card py-0 ring-1 ring-border">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
                  <FolderTree className="size-6 text-hub-electric-soft" />
                </span>
                <p className="mt-4 font-medium text-foreground">
                  No hay categorías registradas
                </p>
                {isAdmin && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Crea la primera categoría para agrupar tus platos.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {!categoriesQuery.isLoading && categories.length > 0 && (
            <div className="grid gap-4 @sm:grid-cols-2 @3xl:grid-cols-3">
              {categories.map((category) => {
                const createdByName = getUserName(category.createdBy);
                const updatedByName = getUserName(category.updatedBy);
                const createdAt = formatDate(category.createdAt);
                const updatedAt = formatDate(category.updatedAt);
                const showUpdated = updatedAt && updatedAt !== createdAt;

                return (
                  <Card
                    key={category.id}
                    className="flex flex-col bg-card py-0 ring-1 ring-border transition-colors hover:ring-primary/50"
                  >
                    <CardContent className="flex flex-1 flex-col gap-4 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <h2 className="font-title text-xl font-semibold text-foreground">
                          {category.name}
                        </h2>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                            category.available === false
                              ? "bg-muted text-muted-foreground"
                              : "bg-hub-neon-green/15 text-hub-neon-green"
                          )}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {category.available === false ? "Inactiva" : "Activa"}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        {createdByName && (
                          <div className="flex items-center gap-2">
                            <User className="size-4 shrink-0" />
                            <span className="truncate">
                              Creada por{" "}
                              <span className="font-medium text-foreground">
                                {createdByName}
                              </span>
                            </span>
                          </div>
                        )}
                        {createdAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="size-4 shrink-0" />
                            <span>
                              Creada el{" "}
                              <span className="font-medium text-foreground">
                                {createdAt}
                              </span>
                            </span>
                          </div>
                        )}
                        {showUpdated && (
                          <div className="flex items-center gap-2">
                            <Calendar className="size-4 shrink-0" />
                            <span>
                              Última modificación{" "}
                              {updatedByName ? (
                                <>
                                  por{" "}
                                  <span className="font-medium text-foreground">
                                    {updatedByName}
                                  </span>{" "}
                                </>
                              ) : null}
                              el{" "}
                              <span className="font-medium text-foreground">
                                {updatedAt}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="mt-auto flex justify-end gap-1 pt-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Editar categoría"
                            onClick={() => openEdit(category)}
                            className="text-hub-electric-soft hover:bg-primary/15 hover:text-hub-electric-soft"
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Eliminar categoría"
                            onClick={() => setDeleting(category)}
                            className="text-hub-neon-red hover:bg-hub-neon-red/10 hover:text-hub-neon-red"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Eliminar categoría"
        description={`Se eliminará la categoría "${deleting?.name ?? ""}". No se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        pending={deleteCategory.isPending}
        onConfirm={() => {
          if (!deleting?.id) return;
          deleteCategory.mutate(deleting.id, {
            onSuccess: () => setDeleting(undefined),
          });
        }}
      />
    </div>
  );
}
