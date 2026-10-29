"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DishImage } from "@/components/dishes/dish-image";
import {
  DISH_IMAGE_ACCEPTED_TYPES,
  formatFileSize,
  validateDishImage,
} from "@/lib/utils/dish-image";
import { cn } from "cn";

interface DishImagePickerProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  currentImageUrl?: string | null;
  disabled?: boolean;
  uploading?: boolean;
  error?: string | null;
}

export function DishImagePicker({
  file,
  onFileChange,
  currentImageUrl,
  disabled = false,
  uploading = false,
  error,
}: DishImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleSelect(next: File | null) {
    if (!next) {
      onFileChange(null);
      setLocalError(null);
      return;
    }

    const validation = validateDishImage(next);
    if (!validation.valid) {
      setLocalError(validation.message);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setLocalError(null);
    onFileChange(next);
  }

  const message = localError ?? error;
  const preview = previewUrl ?? currentImageUrl ?? null;

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={DISH_IMAGE_ACCEPTED_TYPES}
        className="sr-only"
        onChange={(event) => handleSelect(event.target.files?.[0] ?? null)}
        disabled={disabled}
        aria-label="Seleccionar imagen del plato"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className={cn(
          "group relative flex min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 text-center transition-colors hover:border-primary/60 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
          message && "border-hub-neon-red/60"
        )}
      >
        {preview ? (
          <>
            <span className="absolute inset-0">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Vista previa de la imagen seleccionada"
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 480px"
                  className="object-cover"
                />
              ) : (
                <DishImage src={preview} alt="Imagen actual del plato" />
              )}
            </span>
            <span className="absolute inset-0 bg-black/45" />
            <span className="relative flex flex-col items-center gap-2 px-4 text-sm font-medium text-white">
              {uploading ? (
                <>
                  <Loader2 className="size-6 animate-spin" />
                  Subiendo imagen...
                </>
              ) : (
                <>
                  <ImagePlus className="size-6" />
                  Cambiar imagen
                </>
              )}
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 px-4 text-muted-foreground">
            <ImagePlus className="size-7 text-hub-electric-soft" />
            <span className="text-sm font-medium text-foreground">
              Toca para elegir una imagen
            </span>
            <span className="text-xs">JPG, PNG o WEBP · máximo 5MB</span>
          </span>
        )}
      </button>

      {file && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)} · lista para subir
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
              handleSelect(null);
            }}
          >
            <Trash2 />
            Quitar
          </Button>
        </div>
      )}

      {!file && currentImageUrl && (
        <p className="text-xs text-muted-foreground">
          Si no eliges una imagen, se conserva la actual del plato.
        </p>
      )}

      {message && (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          {message}
        </p>
      )}
    </div>
  );
}
