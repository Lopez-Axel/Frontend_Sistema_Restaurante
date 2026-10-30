# AGENTS.md

Next.js App Router frontend for the existing Spring Boot restaurant API. UI copy, comments, and domain terms are Spanish; keep new user-facing text and comments in Spanish.

## Commands

- `pnpm install` (pnpm 11, lockfile committed; no npm/yarn).
- `pnpm dev` → http://localhost:3000. The backend must be running at http://localhost:8080; almost every screen calls it.
- Verify before finishing: `pnpm lint` (runs bare `eslint`) and `pnpm exec tsc --noEmit`. There is no test suite, formatter, or CI in this repo.
- After a backend contract change, regenerate types (backend must be up): `pnpm exec openapi-typescript http://localhost:8080/v3/api-docs -o types/api.ts`. Never hand-edit `types/api.ts`; import DTOs as `components["schemas"]["Name"]`.

## Wiring

- No `src/`. Alias `@/*` → repo root. Most pages are `"use client"` because data fetching is client-side TanStack Query; the only server route is the uploads proxy.
- The browser calls same-origin `/api/*`; `next.config.ts` rewrites it to `http://localhost:8080/*` (hardcoded). `NEXT_PUBLIC_API_BASE_URL` defaults to `/api`. Do not call port 8080 from the browser or add CORS. `.env` is gitignored and its `BACKEND_URL` is not read anywhere; if the backend moves, update the rewrite and the uploads route.
- `/api/uploads/[...path]` proxies the JWT-protected backend `/uploads/**`. Use `dishImageSrc()` (`lib/utils/dishes.ts`) rather than raw `/uploads/...` URLs, since it rewrites to the proxy.
- `app/(auth)` = login/register/verify-otp. `app/(dashboard)` = authenticated screens; its layout only checks that a token exists. `app/menu` = static public demo menu with hardcoded prices, not API-backed.
- One `lib/api` module per resource; query/mutation hooks in `lib/hooks`; Zod schemas in `lib/schemas`; Zustand stores in `lib/stores`; pure helpers in `lib/utils`. Components are grouped by domain (`components/dishes`, `orders`, `tables`, …), with shadcn primitives in `components/ui`.

## Auth and HTTP

- Access token lives in memory only. Refresh token + user are persisted to localStorage key `gatochef-auth`; `skipHydration` plus `components/providers.tsx` rehydrate and call `tryRefresh()` before `hasHydrated` flips. Preserve that order or the dashboard briefly redirects to `/login`.
- Use `apiFetch` (`lib/api/http.ts`) for all client API calls. It adds Bearer except to `/auth/login|register|verify-otp`, retries one 401 via `/auth/refresh`, then clears the session and hard-redirects to `/login`. Only the refresh call and SSE hooks bypass it; the uploads route is server-side.
- `ApiError.fieldErrors` is already normalized to `string`; map it with RHF `setError` as the login page does. Toasts come from `sonner`; `<Toaster>` is mounted once in `Providers`.
- Role checks are UX only: the sidebar is filtered in `app/(dashboard)/layout.tsx`, and dish permissions are centralized in `dishPermissions()` (`lib/utils/dishes.ts`). There are no route-level role guards; the backend is the authority.

## Data and realtime

- Pagination is 0-based `page`, `size`, and repeated `sort=field,dir` query params, built with `URLSearchParams` inside each `lib/api` module. Paginated responses expose `content`, `totalPages`, `totalElements`. Sort ids must be real backend properties.
- Tables use `usePagination()` (`lib/hooks/usePagination.ts`) plus `DataTable` (`components/tables/data-table.tsx`). TanStack Table is **v9**: use `createDataColumnHelper` and the hook-based API there, not classic `useReactTable`.
- TanStack Query keys are resource prefixes (`["orders"]`, `["tables"]`, `["dishes"]`, …); mutations and SSE invalidate the prefix. Do not duplicate server data into Zustand — stores hold UI state/session only.
- SSE hooks (`useOrderStatusStream`, `useTableStatusStream`) use `@microsoft/fetch-event-source` with the Bearer header and invalidate their query prefix. Native `EventSource` cannot send Authorization — don't use it.
- Money: API amounts are BOB decimals (e.g. `12.5`). Render them with `formatAmount()`; `formatMoney()` expects integer cents and is only for cents values (e.g. the static `/menu`). Mixing them is a 100× error.
- Order statuses are a fixed enum (`PENDING`, `IN_PROGRESS`, `SERVED`, `CLOSED`, `CANCELLED`) in `lib/utils/order-status.ts`; table statuses come from `/table-status`.

## UI kit quirks

- shadcn uses style `base-nova` on **Base UI** (`@base-ui/react`), not Radix. Use the `render={<Link ... />}` prop instead of `asChild`; `Select` callbacks receive `string | null`, and `SelectValue` children may be a function (see the pedidos table filter).
- Import `cn` from `"cn"` (twMerge + clsx) like existing files; `@/lib/utils` only re-exports it.
- Tailwind v4 is configured entirely in `app/globals.css` (`@theme`, `hub-*` colors, `font-title`/`font-subtitle`); there is no `tailwind.config`.
- Known bug: `globals.css` maps title fonts to `--font-playfair-display`, but `app/layout.tsx` defines Playfair as `--font-plus-jakarta-sans`; titles currently fall back to Georgia. Fix the variable if you touch fonts.
- `components.json` aliases `hooks` to `@/hooks`, but hooks live in `lib/hooks`; move/import `shadcn add` output accordingly.

## Current state and gaps

Implemented: auth flow, dashboard, mesas (kanban + seats/history + SSE), pedidos (list/my/new/detail + SSE), platos (ingredients, image upload, cost analysis), menus, categorias, ingredientes, unidades-medida, estados-mesa. `/configuracion` is only a placeholder.

These routes are linked from the sidebar/dashboard but do not exist yet (they 404): `/pagos`, `/pagos/[id]`, `/usuarios`, `/usuarios/[id]`, `/perfil`, `/catalogos/estados-pedido`, `/catalogos/estados-pago`.

There are also no `lib/api`/`lib/hooks` modules for payments, users, order/payment status catalogs, or business settings. Relevant paths are in `types/api.ts`: `/payments` (plus `/order/{orderId}`, `/split/{orderId}`, `/{id}/confirm|fail|receipt`), `/users` and `/users/me`, `/order-statuses`, `/payment-statuses`, `/business-settings`.

## Constraints

- Stay on the installed stack: pnpm, native `fetch` wrapped by `apiFetch` (no Axios), Zod + React Hook Form, Dinero.js for display, `@microsoft/fetch-event-source` for SSE.
- `@dnd-kit` is an approved addition for the mesa kanban. `convert-units` is installed but unused; unit conversions are hand-rolled in `lib/utils/measurement-units.ts`.
- Brand in the UI is **BarHub** (`lib/brand.ts`) even though older docs and store keys say GatoChef.
