import { apiFetch } from "@/lib/api/http";
import type { components } from "@/types/api";

type AuthResponse = components["schemas"]["AuthResponse"];

export const authApi = {
  register(body: components["schemas"]["RegisterRequest"]) {
    return apiFetch<Record<string, string>>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  verifyOtp(body: components["schemas"]["VerifyOtpRequest"]) {
    return apiFetch<Record<string, string>>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  login(body: components["schemas"]["LoginRequest"]) {
    return apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  refresh(refreshToken: string) {
    return apiFetch<AuthResponse>(
      "/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      },
      true
    );
  },
};