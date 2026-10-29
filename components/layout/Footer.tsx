"use client";

import robotMedida from "@/public/robot_medida.png";
import { Mascot } from "@/components/brand/mascot";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border bg-card/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <Mascot
            src={robotMedida}
            className="-scale-x-100 size-12 shrink-0 sm:size-14"
          />
          <p className="max-w-md text-sm text-muted-foreground">
            Gestiona y organiza las unidades de medida para mantener la
            consistencia en recetas, ingredientes y conversiones.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
