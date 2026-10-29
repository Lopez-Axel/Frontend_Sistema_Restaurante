import { apiFetch } from "@/lib/api/http";
import type { components } from "@/types/api";

type MeasurementUnitDTO = components["schemas"]["MeasurementUnitDTO"];
type MeasurementUnitRequest = components["schemas"]["MeasurementUnitRequest"];

export const measurementUnitsApi = {
  list() {
    return apiFetch<MeasurementUnitDTO[]>("/measurement-units");
  },
  get(id: string) {
    return apiFetch<MeasurementUnitDTO>(`/measurement-units/${id}`);
  },
  create(body: MeasurementUnitRequest) {
    return apiFetch<MeasurementUnitDTO>("/measurement-units", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: MeasurementUnitRequest) {
    return apiFetch<MeasurementUnitDTO>(`/measurement-units/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  remove(id: string) {
    return apiFetch<void>(`/measurement-units/${id}`, { method: "DELETE" });
  },
};
