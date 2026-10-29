"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "cn";

interface StepperControlsProps {
  incrementLabel: string;
  decrementLabel: string;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  className?: string;
}

const buttonClass =
  "flex flex-1 items-center justify-center transition-colors outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-hub-electric-soft disabled:pointer-events-none disabled:opacity-40";

/**
 * Controles de incremento propios para los campos `type="number"`.
 *
 * Se usan en el formulario de ingredientes, donde el campo numérico lleva
 * flechas propias en lugar de las del navegador.
 */
export function StepperControls({
  incrementLabel,
  decrementLabel,
  onIncrement,
  onDecrement,
  disabled,
  className,
}: StepperControlsProps) {
  return (
    <div
      className={cn(
        "absolute top-0.5 right-0.5 bottom-0.5 flex w-7 flex-col overflow-hidden rounded-md border border-hub-line bg-card shadow-sm",
        className
      )}
    >
      <button
        type="button"
        aria-label={incrementLabel}
        title={incrementLabel}
        onClick={onIncrement}
        disabled={disabled}
        className={cn(
          buttonClass,
          "text-hub-neon-green/80 hover:bg-hub-neon-green/15 hover:text-hub-neon-green"
        )}
      >
        <ChevronUp className="size-3" strokeWidth={2.75} />
      </button>
      <span className="h-px shrink-0 bg-hub-line" aria-hidden="true" />
      <button
        type="button"
        aria-label={decrementLabel}
        title={decrementLabel}
        onClick={onDecrement}
        disabled={disabled}
        className={cn(
          buttonClass,
          "text-hub-neon-red/80 hover:bg-hub-neon-red/15 hover:text-hub-neon-red"
        )}
      >
        <ChevronDown className="size-3" strokeWidth={2.75} />
      </button>
    </div>
  );
}
