"use client";

import { cn } from "cn";
import { resolveOrderStatus } from "@/lib/utils/order-status";

interface OrderStatusBadgeProps {
  name?: string;
  colorHex?: string;
  className?: string;
}

export function OrderStatusBadge({ name, colorHex, className }: OrderStatusBadgeProps) {
  const ui = resolveOrderStatus(name, colorHex);

  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit items-center gap-1.5 rounded-full px-2 text-xs font-medium whitespace-nowrap",
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