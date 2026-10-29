import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth";
import type { components } from "@/types/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  readonly status: number;
  readonly path?: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    status = 0,
    fieldErrors?: Record<string, string>,
    path?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.path = path;
  }
}

interface ApiErrorShape {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: Record<string, string | string[]>;
}

type AuthResponse = components["schemas"]["AuthResponse"];

const PUBLIC_PATHS = ["/auth/login", "/auth/register", "/auth/verify-otp"];

function normalizeFieldErrors(
  fieldErrors?: Record<string, string | string[]>
): Record<string, string> | undefined {
  if (!fieldErrors) return undefined;
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(fieldErrors)) {
    normalized[key] = Array.isArray(value) ? value.join(", ") : value;
  }
  return normalized;
}

function isAuthExempt(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p);
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  skipRefresh = false
): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const headers = new Headers(init.headers);

  // FormData debe viajar sin Content-Type: el navegador necesita poner el
  // boundary del multipart por su cuenta al serializar el body.
  const isMultipart =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  if (init.body && !isMultipart && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken && !isAuthExempt(path)) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  if (response.status === 401 && !skipRefresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, init, true);
    }
  }

  throw await parseError(response);
}

async function parseError(response: Response): Promise<ApiError> {
  let message = response.statusText || "Error de la API";
  let fieldErrors: Record<string, string> | undefined;
  let path: string | undefined;

  try {
    const body = (await response.json()) as ApiErrorShape;
    if (body.message) message = body.message;
    fieldErrors = normalizeFieldErrors(body.fieldErrors);
    path = body.path;
  } catch {
    // cuerpo no JSON
  }

  return new ApiError(message, response.status, fieldErrors, path);
}

function handleSessionExpired(): void {
  toast.error("Debe volver a ingresar en el sistema");
  useAuthStore.getState().clearSession();
  redirectToLogin();
}

export async function tryRefresh(): Promise<boolean> {
  const { refreshToken, setSession, clearSession } = useAuthStore.getState();

  if (!refreshToken) {
    clearSession();
    redirectToLogin();
    return false;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    handleSessionExpired();
    return false;
  }

  if (!response.ok) {
    handleSessionExpired();
    return false;
  }

  const data = (await response.json()) as AuthResponse;
  if (!data.accessToken) {
    handleSessionExpired();
    return false;
  }

  setSession(data);
  return true;
}

export function redirectToLogin(): void {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- navegación fuera de React (wrapper de fetch)
    window.location.assign("/login");
  }
}