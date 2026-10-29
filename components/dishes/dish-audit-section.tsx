"use client";

import {
  CalendarClock,
  Clock,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import {
  AUDIT_UNAVAILABLE,
  auditDateLabel,
  auditUserLabel,
  type AuditUser,
} from "@/lib/utils/audit";
import { cn } from "cn";

interface DishAuditSectionProps {
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: AuditUser | null;
  updatedBy?: AuditUser | null;
  className?: string;
}

/**
 * Auditoría del registro del plato.
 *
 * La información viene del backend (`createdAt`, `updatedAt`, `createdBy` y
 * `updatedBy`) y es de solo lectura: no se envía en las operaciones de alta ni
 * de edición, solamente se muestra.
 */
export function DishAuditSection({
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  className,
}: DishAuditSectionProps) {
  const fields = [
    {
      label: "Fecha de creación",
      value: auditDateLabel(createdAt),
      icon: CalendarClock,
    },
    {
      label: "Creado por",
      value: auditUserLabel(createdBy) ?? AUDIT_UNAVAILABLE,
      icon: UserRound,
    },
    {
      label: "Última actualización",
      value: auditDateLabel(updatedAt),
      icon: Clock,
    },
    {
      label: "Actualizado por",
      value: auditUserLabel(updatedBy) ?? AUDIT_UNAVAILABLE,
      icon: UserRoundCheck,
    },
  ];

  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-muted/20 p-4",
        className
      )}
    >
      <h3 className="font-title flex items-center gap-2 text-sm font-semibold tracking-wide text-foreground uppercase">
        <ShieldCheck
          className="size-4 shrink-0 text-hub-electric-soft"
          aria-hidden="true"
        />
        Auditoría del registro
      </h3>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {fields.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-start gap-2 rounded-lg border border-border bg-card/40 px-3 py-2"
          >
            <Icon
              className="mt-0.5 size-4 shrink-0 text-hub-mist"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
              </dt>
              <dd className="mt-0.5 text-sm break-words text-foreground">
                {value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
