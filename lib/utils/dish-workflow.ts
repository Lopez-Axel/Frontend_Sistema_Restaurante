import type { DishDTO, DishRequest } from "@/lib/api/dishes";

export interface DishWorkflowApi {
  create(body: DishRequest): Promise<DishDTO>;
  update(id: string, body: DishRequest): Promise<DishDTO>;
  uploadImage(id: string, file: File): Promise<DishDTO>;
}

export interface DishSaveInput {
  /** Cuando viene informado se actualiza; si no, se crea el plato. */
  id?: string | null;
  body: DishRequest;
  /** Archivo opcional a subir una vez guardado el plato. */
  file?: File | null;
}

export type DishSaveOutcome =
  | { status: "saved"; dish: DishDTO; imageUploaded: boolean }
  | {
      status: "saved-without-image";
      dish: DishDTO;
      imageUploaded: false;
      imageError: unknown;
    };

/**
 * Coordina la creación/actualización del plato con la subida de la imagen.
 *
 * El backend expone la imagen en `POST /dishes/{id}/image`, por lo que el
 * archivo solo se puede subir cuando ya existe el UUID definitivo del plato.
 * La creación y la subida son operaciones independientes: si la subida falla,
 * el plato NO se vuelve a crear, se conserva su UUID y se devuelve el error
 * para que la interfaz pueda reintentar la subida.
 */
export async function saveDishWithImage(
  api: DishWorkflowApi,
  input: DishSaveInput
): Promise<DishSaveOutcome> {
  const dish = input.id
    ? await api.update(input.id, input.body)
    : await api.create(input.body);

  if (!input.file) {
    return { status: "saved", dish, imageUploaded: false };
  }

  const dishId = dish.id ?? input.id;
  if (!dishId) {
    return {
      status: "saved-without-image",
      dish,
      imageUploaded: false,
      imageError: new Error(
        "El servidor no devolvió el identificador del plato; la imagen quedó pendiente"
      ),
    };
  }

  try {
    const updated = await api.uploadImage(dishId, input.file);
    return {
      status: "saved",
      dish: updated.id ? updated : { ...updated, id: dishId },
      imageUploaded: true,
    };
  } catch (imageError) {
    return {
      status: "saved-without-image",
      dish,
      imageUploaded: false,
      imageError,
    };
  }
}
