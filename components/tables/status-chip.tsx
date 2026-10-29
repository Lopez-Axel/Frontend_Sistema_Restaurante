"use client";

import { cn } from "cn";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { resolveTableStatus } from "@/lib/utils/table-status";
import type { components } from "@/types/api";

type TableStatus = components["schemas"]["TableStatus"];

interface StatusChipProps {
  statusValue?: string;
  statuses?: TableStatus[];
  size?: "sm" | "md";
  className?: string;
}

export function StatusChip({
  statusValue,
  statuses = [],
  size = "sm",
  className,
}: StatusChipProps) {
  const statusColors = usePreferencesStore((s) => s.statusColors);
  const ui = resolveTableStatus(statusValue, statuses, statusColors);

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2 text-xs font-medium whitespace-nowrap",
        size === "sm" ? "h-5" : "h-6 px-2.5 text-sm",
        className
      )}
      style={{ backgroundColor: ui.color, color: ui.text }}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: ui.text }}
      />
      {ui.label}
    </span>
  );
}