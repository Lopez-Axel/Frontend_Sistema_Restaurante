import { apiFetch } from "@/lib/api/http";
import type { components } from "@/types/api";

type OrderCreateRequest = components["schemas"]["OrderCreateRequest"];
type OrderDetailCreateRequest = components["schemas"]["OrderDetailCreateRequest"];
type OrderDetailResponse = components["schemas"]["OrderDetailResponse"];
type OrderResponse = components["schemas"]["OrderResponse"];
type PageOrderResponse = components["schemas"]["PageOrderResponse"];
type OrderStatusName = NonNullable<
  components["schemas"]["OrderStatusUpdateRequest"]["statusName"]
>;

export interface OrdersListParams {
  tableId?: string;
  page?: number;
  size?: number;
  sort?: string[];
}

function ordersQuery(params: OrdersListParams = {}): string {
  const search = new URLSearchParams();
  if (params.tableId) search.set("tableId", params.tableId);
  search.set("page", String(params.page ?? 0));
  search.set("size", String(params.size ?? 10));
  for (const sort of params.sort ?? []) search.append("sort", sort);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const ordersApi = {
  list(params: OrdersListParams = {}) {
    return apiFetch<PageOrderResponse>(`/orders${ordersQuery(params)}`);
  },
  my(params: Omit<OrdersListParams, "tableId"> = {}) {
    return apiFetch<PageOrderResponse>(`/orders/my${ordersQuery(params)}`);
  },
  get(id: string) {
    return apiFetch<OrderResponse>(`/orders/${id}`);
  },
  details(orderId: string) {
    return apiFetch<OrderDetailResponse[]>(`/orders/${orderId}/details`);
  },
  create(body: OrderCreateRequest) {
    return apiFetch<OrderResponse>("/orders", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  addDetail(orderId: string, body: OrderDetailCreateRequest) {
    return apiFetch<OrderDetailResponse>(`/orders/${orderId}/details`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  updateStatus(id: string, statusName: OrderStatusName) {
    return apiFetch<OrderResponse>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ statusName }),
    });
  },
  remove(id: string) {
    return apiFetch<void>(`/orders/${id}`, { method: "DELETE" });
  },
};