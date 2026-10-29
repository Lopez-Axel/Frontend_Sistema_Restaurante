import { apiFetch } from "@/lib/api/http";
import type { components } from "@/types/api";

type TableStatus = components["schemas"]["TableStatus"];
type TableStatusName = NonNullable<TableStatus["name"]>;
type RestaurantTableRequest = components["schemas"]["RestaurantTableRequest"];
type RestaurantTableResponse = components["schemas"]["RestaurantTableResponse"];
type UpdateTableStatusRequest = components["schemas"]["UpdateTableStatusRequest"];

export const tablesApi = {
  listStatuses() {
    return apiFetch<TableStatus[]>("/table-status");
  },
  getStatus(id: string) {
    return apiFetch<TableStatus>(`/table-status/${id}`);
  },
  createStatus(name: TableStatusName) {
    return apiFetch<TableStatus>("/table-status", {
      method: "POST",
      body: JSON.stringify(name),
    });
  },
  updateStatus(id: string, name: TableStatusName) {
    return apiFetch<TableStatus>(`/table-status/${id}`, {
      method: "PUT",
      body: JSON.stringify(name),
    });
  },
  deleteStatus(id: string) {
    return apiFetch<void>(`/table-status/${id}`, { method: "DELETE" });
  },

  list() {
    return apiFetch<RestaurantTableResponse[]>("/restaurantTable");
  },
  get(id: string) {
    return apiFetch<RestaurantTableResponse>(`/restaurantTable/${id}`);
  },
  create(body: RestaurantTableRequest) {
    return apiFetch<RestaurantTableResponse>("/restaurantTable", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  update(id: string, body: RestaurantTableRequest) {
    return apiFetch<RestaurantTableResponse>(`/restaurantTable/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  remove(id: string) {
    return apiFetch<void>(`/restaurantTable/${id}`, { method: "DELETE" });
  },
  changeStatus(id: string, body: UpdateTableStatusRequest) {
    return apiFetch<RestaurantTableResponse>(`/restaurantTable/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  seats(tableId: string) {
    return apiFetch<components["schemas"]["SeatResponse"][]>(
      `/restaurantTable/${tableId}/seats`
    );
  },
  updateSeat(tableId: string, seatId: string, occupied: boolean) {
    return apiFetch<components["schemas"]["SeatResponse"]>(
      `/restaurantTable/${tableId}/seats/${seatId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ occupied }),
      }
    );
  },
  history(id: string) {
    return apiFetch<components["schemas"]["TableStatusHistoryResponse"][]>(
      `/restaurantTable/${id}/history`
    );
  },
};