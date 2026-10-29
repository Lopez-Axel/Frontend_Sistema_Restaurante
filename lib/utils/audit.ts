import type { components } from "@/types/api";
import { formatDateTime } from "@/lib/utils/dates";

/**
 * Usuario auditor que devuelve el backend en los DTO con trazabilidad
 * (`createdBy` / `updatedBy`). El tipo es único y compartido: no se duplican
 * interfaces por cada recurso que lo consuma.
 */
export type AuditUser = components["schemas"]["AuditUserDTO"];

/** Texto alternativo usado cuando el backend no envía un dato de auditoría. */
export const AUDIT_UNAVAILABLE = "No disponible";

/**
 * Nombre del auditor con el formato ya usado por el resto del sistema:
 * nombre y apellido; si no hay, se cae al correo registrado.
 */
export function auditUserLabel(user?: AuditUser | null): string | null {
  if (!user) return null;

  const fullName = `${user.firstName?.trim() ?? ""} ${
    user.lastName?.trim() ?? ""
  }`.trim();
  if (fullName) return fullName;

  return user.email?.trim() || null;
}

/** Fecha de auditoría con el formato `dd/MM/yyyy HH:mm` del proyecto. */
export function auditDateLabel(value?: string | null): string {
  if (!value?.trim()) return AUDIT_UNAVAILABLE;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return AUDIT_UNAVAILABLE;

  return formatDateTime(value);
}
