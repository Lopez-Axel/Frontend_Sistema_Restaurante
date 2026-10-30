"use client";

import type { StaticImageData } from "next/image";
import type { LucideIcon } from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { cn } from "cn";

export interface FooterTip {
  icon: LucideIcon;
  text: string;
}

interface FooterProps {
  images: StaticImageData | StaticImageData[];
  description: React.ReactNode;
  hint?: React.ReactNode;
  tips?: FooterTip[];
}

export function Footer({ images, description, hint, tips }: FooterProps) {
  const mascots = Array.isArray(images) ? images : [images];
  const mascotWidth =
    mascots.length > 1 ? "w-24 sm:w-28 lg:w-32" : "w-28 sm:w-32 lg:w-36";

  return (
    <footer className="border-t border-border pt-6">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
        <div className="flex shrink-0 items-end gap-2">
          {mascots.map((image, index) => (
            <Mascot
              key={index}
              src={image}
              className={cn(
                mascotWidth,
                index % 2 === 1 && "-scale-x-100"
              )}
            />
          ))}
        </div>
        <div className="max-w-3xl space-y-2">
          <h2 className="font-title text-xl font-semibold text-foreground">
            ¿Cómo funciona esta sección?
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
          {tips && tips.length > 0 && (
            <ul className="grid gap-2 pt-1 text-sm text-muted-foreground sm:grid-cols-3">
              {tips.map((tip) => {
                const Icon = tip.icon;
                return (
                  <li key={tip.text} className="flex items-start gap-2">
                    <Icon className="mt-0.5 size-4 shrink-0 text-hub-electric-soft" />
                    <span>{tip.text}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
