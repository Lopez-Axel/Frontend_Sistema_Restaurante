import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "cn";
import { dishImageSrc } from "@/lib/utils/dishes";

interface DishImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Imagen del plato con reemplazo visual cuando todavía no hay fotografía.
 * La URL puede venir relativa (`/uploads/...`) o absoluta; se normaliza con
 * `dishImageSrc` para respetar el contrato del backend.
 */
export function DishImage({
  src,
  alt,
  className,
  imageClassName,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
}: DishImageProps) {
  const resolved = dishImageSrc(src);

  if (!resolved) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-gradient-to-br from-hub-navy/70 via-hub-twilight to-hub-prussian",
          className
        )}
      >
        <ImageOff className="size-8 text-hub-mist/50" aria-hidden />
        <span className="sr-only">Sin imagen</span>
      </div>
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", imageClassName)}
    />
  );
}
