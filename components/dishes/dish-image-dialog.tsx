"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DishImagePicker } from "@/components/dishes/dish-image-picker";
import { useUploadDishImage } from "@/lib/hooks/useDishes";
import { getErrorMessage } from "@/lib/utils/errors";

interface DishImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dishId: string;
  dishName?: string;
  currentImageUrl?: string | null;
  onUploaded?: () => void;
}

/**
 * Subida de la foto del plato. El backend solo permite `POST /dishes/{id}/image`
 * a ADMIN y guarda el archivo en su propio filesystem.
 */
export function DishImageDialog({
  open,
  onOpenChange,
  dishId,
  dishName,
  currentImageUrl,
  onUploaded,
}: DishImageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DishImageDialogBody
          key={dishId}
          dishId={dishId}
          dishName={dishName}
          currentImageUrl={currentImageUrl}
          onUploaded={onUploaded}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface DishImageDialogBodyProps {
  dishId: string;
  dishName?: string;
  currentImageUrl?: string | null;
  onUploaded?: () => void;
  onClose: () => void;
}

function DishImageDialogBody({
  dishId,
  dishName,
  currentImageUrl,
  onUploaded,
  onClose,
}: DishImageDialogBodyProps) {
  const uploadImage = useUploadDishImage();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setError(null);

    try {
      await uploadImage.mutateAsync({ id: dishId, file });
      onUploaded?.();
      onClose();
    } catch (uploadError) {
      setError(
        getErrorMessage(uploadError, "No se pudo subir la imagen del plato")
      );
      toast.error("No se pudo subir la imagen del plato");
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-title text-xl text-foreground">
          Foto del plato
        </DialogTitle>
        <DialogDescription>
          {dishName
            ? `Reemplaza la imagen de "${dishName}". JPG, PNG o WEBP, hasta 5MB.`
            : "JPG, PNG o WEBP, hasta 5MB."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <DishImagePicker
          file={file}
          onFileChange={setFile}
          currentImageUrl={currentImageUrl}
          uploading={uploadImage.isPending}
          error={error}
        />
        {currentImageUrl && (
          <p className="text-xs text-muted-foreground">
            Si no elegís una imagen nueva se conserva la actual.
          </p>
        )}
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={uploadImage.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={handleUpload}
          disabled={uploadImage.isPending || !file}
        >
          {uploadImage.isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload />
              Subir imagen
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  );
}
