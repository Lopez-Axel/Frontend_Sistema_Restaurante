/** Límite aplicado por ImageStorageService.store() en el backend. */
export const MAX_DISH_IMAGE_BYTES = 5 * 1024 * 1024;

export const DISH_IMAGE_ACCEPTED_TYPES = "image/*";

export type DishImageValidation =
  | { valid: true }
  | { valid: false; message: string };

/**
 * El backend valida el archivo en `ImageStorageService.store()`: archivo no
 * vacío, content-type `image/*` y máximo 5MB. Estas reglas se replican aquí
 * solo para mejorar la experiencia; el servidor sigue siendo la autoridad.
 */
export function validateDishImage(file: File | null | undefined): DishImageValidation {
  if (!file) return { valid: false, message: "Selecciona una imagen" };
  if (file.size === 0) {
    return { valid: false, message: "El archivo de imagen está vacío" };
  }
  if (!file.type || !file.type.startsWith("image/")) {
    return { valid: false, message: "El archivo debe ser una imagen" };
  }
  if (file.size > MAX_DISH_IMAGE_BYTES) {
    return {
      valid: false,
      message: "La imagen supera el tamaño máximo de 5MB",
    };
  }
  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
