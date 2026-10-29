# Brief de implementación — Frontend GatoChef (Next.js)

Implementa el frontend completo de un sistema de gestión de restaurante que consume una API REST en Spring Boot ya existente y funcional. La API expone 91 endpoints en 17 controllers. Usa exactamente el stack técnico definido abajo — no sustituyas ninguna librería sin justificar el cambio.

Base URL de la API: `http://localhost:8080`
Autenticación: JWT (`Authorization: Bearer <token>`) en todos los endpoints salvo los marcados público.
Roles válidos: `WAITER`, `CHEF`, `ADMIN`.

---

## 1. Stack técnico obligatorio

| Librería | Propósito | Instalación |
|---|---|---|
| Next.js (App Router) | Framework base | — |
| TypeScript | Tipado | — |
| Zustand | Estado de cliente (sesión, carrito/pedido en construcción, UI) | `pnpm add zustand` |
| TanStack Query | Fetch, cache, invalidación, sincronización con backend | `pnpm add @tanstack/react-query` |
| React Hook Form | Formularios | `pnpm add react-hook-form` |
| Zod | Validación de esquemas | `pnpm add zod` |
| @hookform/resolvers | Conecta Zod con React Hook Form | `pnpm add @hookform/resolvers` |
| Tailwind CSS | Estilos | `pnpm add -D tailwindcss postcss autoprefixer` |
| shadcn/ui | Componentes base | `pnpm dlx shadcn@latest init` |
| lucide-react | Iconos | `pnpm add lucide-react` |
| clsx | Clases condicionales | `pnpm add clsx` |
| openapi-typescript | Tipos TS desde el schema OpenAPI del backend | `pnpm add -D openapi-typescript` |
| date-fns | Fechas | `pnpm add date-fns` |
| sonner | Notificaciones (toasts) | `pnpm add sonner` |
| TanStack Table | Tablas con paginación/orden | `pnpm add @tanstack/react-table` |
| Dinero.js | Montos monetarios sin errores de punto flotante | `pnpm add dinero.js @dinero.js/currencies` |
| convert-units | Conversión de unidades de peso/volumen | `pnpm add convert-units` |
| @microsoft/fetch-event-source | Consumo de los endpoints SSE con header `Authorization` (el `EventSource` nativo no permite headers custom) | `pnpm add @microsoft/fetch-event-source` |

Gestor de paquetes: **pnpm**. Cliente HTTP: **fetch nativo** envuelto en un wrapper propio (sin Axios).

> Excepción aprobada por el equipo: `@dnd-kit/core` + `@dnd-kit/utilities` se añadieron para el tablero kanban de mesas (arrastrar mesa entre columnas de estado). El resto se ciñe a la tabla de arriba.

---

## 2. Generación de tipos desde el backend

El backend expone Swagger/OpenAPI vía springdoc. Generar los tipos antes de tipar cualquier request/response:

```bash
pnpm dlx openapi-typescript http://localhost:8080/v3/api-docs -o types/api.ts
```

Todos los DTOs de request/response y los esquemas de Zod para formularios deben derivarse o mantenerse consistentes con este archivo generado. Si un campo cambia en el backend, regenerar este archivo antes de tocar el frontend.

---

## 3. Autenticación y sesión

Flujo: `register` → `verify-otp` → `login`. El login devuelve access token (y probablemente refresh token; confirmar el shape exacto de la respuesta contra `/v3/api-docs` antes de implementar, ya que no está especificado aquí).

Reglas:
- Guardar el access token en memoria (store de Zustand, no persistido en localStorage) junto con los datos del usuario autenticado (id, email, role).
- Si el refresh token viene en el body de la respuesta, decidir junto al equipo backend si se persiste en cookie httpOnly (preferido) o se maneja en memoria; no asumir localStorage sin confirmarlo, por seguridad.
- Wrapper de fetch: adjunta `Authorization: Bearer <token>` automáticamente a toda request salvo a `/auth/*` (excepto refresh) y `/api/bank/callback`.
- Si una request devuelve 401, intentar una única vez `POST /auth/refresh`; si falla, limpiar sesión y redirigir a `/login`.
- Proteger todas las rutas bajo `(dashboard)` con un layout que verifique sesión activa (rol lo maneja el backend; el frontend solo oculta/ordena navegación por UX, ver sección 6).

Endpoints: `POST /auth/register`, `POST /auth/verify-otp`, `POST /auth/login`, `POST /auth/refresh`.

---

## 4. Listados paginados

Todo endpoint `Pageable` recibe `page`, `size` y `sort` como **query params**, no como body JSON (`sort` en formato `campo,direccion`, repetible para múltiples criterios). Crear un hook reutilizable (`usePagination` o similar) que arme el `URLSearchParams` y un componente de tabla base sobre TanStack Table que reciba `data`, `columns`, `pageCount` y exponga controles de página/tamaño/orden. Validar que los campos de sort ofrecidos en la UI correspondan a propiedades reales de la entidad, para evitar el 400 "El parámetro de orden (sort) referencia una propiedad que no existe".

---

## 5. Tiempo real (SSE)

Dos endpoints SSE, ambos autenticados:
- `GET /orders/status-stream`
- `GET /restaurantTable/status-stream`

Consumirlos con `@microsoft/fetch-event-source` (no `EventSource` nativo) para poder enviar el header `Authorization`. Cada evento recibido debe invalidar/actualizar la query de TanStack Query correspondiente (lista de pedidos, tablero de mesas) en vez de mantener un estado paralelo desincronizado.

---

## 6. Roles y navegación

El backend autoriza la mayoría de endpoints solo con `anyRequest().authenticated()` (cualquier rol). La única restricción de rol explícita en la API es `GET /dishes?analysis=true` (solo ADMIN). El resto de la separación por rol abajo es una propuesta de UX para ordenar la navegación — confirmar con el equipo si además debe bloquearse a nivel de ruta o solo se oculta visualmente:

- **WAITER**: Mesas, Pedidos (crear/gestionar), Pagos (crear/dividir/confirmar), Menú (solo lectura para tomar pedidos), Mi perfil.
- **CHEF**: Pedidos (tablero de cocina, cambio de estado), Platos e Ingredientes (lectura y edición de recetas), Mi perfil.
- **ADMIN**: todo lo anterior + Usuarios, Platos (análisis de costos, precios), Menús, Categorías, Ingredientes, Unidades de medida, Catálogos de estados (mesa/pedido/pago), Configuración del negocio.

---

## 7. Estructura de carpetas propuesta (raíz del repo, sin `src/`)

```
app/                 -> App Router (ya existe app/layout.tsx y app/globals.css)
  (auth)/login/page.tsx
  (auth)/register/page.tsx
  (auth)/verify-otp/page.tsx
  (dashboard)/layout.tsx
  (dashboard)/page.tsx
  (dashboard)/mesas/page.tsx
  (dashboard)/mesas/[id]/page.tsx
  (dashboard)/pedidos/page.tsx
  (dashboard)/pedidos/mis-pedidos/page.tsx
  (dashboard)/pedidos/[id]/page.tsx
  (dashboard)/pagos/page.tsx
  (dashboard)/pagos/[id]/page.tsx
  (dashboard)/platos/page.tsx
  (dashboard)/platos/[id]/page.tsx
  (dashboard)/menus/page.tsx
  (dashboard)/menus/[id]/page.tsx
  (dashboard)/categorias/page.tsx
  (dashboard)/ingredientes/page.tsx
  (dashboard)/unidades-medida/page.tsx
  (dashboard)/usuarios/page.tsx
  (dashboard)/usuarios/[id]/page.tsx
  (dashboard)/perfil/page.tsx
  (dashboard)/configuracion/page.tsx
  (dashboard)/catalogos/estados-mesa/page.tsx
  (dashboard)/catalogos/estados-pedido/page.tsx
  (dashboard)/catalogos/estados-pago/page.tsx
components/          -> ya existe components/ui (shadcn)
  ui/          -> shadcn
  forms/
  tables/
  layout/
lib/                 -> ya existe lib/utils.ts (shadcn)
  api/         -> fetch wrapper + funciones por recurso
  hooks/       -> hooks de TanStack Query y SSE
  stores/      -> stores de Zustand
  utils/       -> money.ts (Dinero.js), units.ts (convert-units), dates.ts
types/
  api.ts       -> generado por openapi-typescript
```

El alias `@/*` apunta a la raíz del repo (`tsconfig.json`), no a `src/`.

---

## 8. Diseño de pantallas por módulo

### 8.1 Autenticación
- **Login** (`/login`): email + password. `POST /auth/login`.
- **Registro** (`/register`): formulario de alta. `POST /auth/register`.
- **Verificar OTP** (`/verify-otp`): input de código, reenvío. `POST /auth/verify-otp`.

### 8.2 Dashboard (`/`)
Home post-login. Resumen según rol: mesas ocupadas/libres, pedidos activos, pagos pendientes de confirmar (WAITER/ADMIN); pedidos en cola de cocina (CHEF); accesos rápidos a catálogos (ADMIN).

### 8.3 Mesas (`/mesas`)
- **Tablero de mesas**: grid de tarjetas por mesa con color según estado, actualizado en vivo vía SSE. `GET /restaurantTable`, `GET /restaurantTable/status-stream`.
- **Detalle de mesa** (`/mesas/[id]`): estado actual, asientos (`GET /restaurantTable/{tableId}/seats`), historial de cambios (`GET /restaurantTable/{id}/history`), botón cambiar estado (`PUT /restaurantTable/{id}/status`), acceso a crear pedido para esa mesa.
- **Crear/editar mesa** (modal, ADMIN): `POST`/`PUT /restaurantTable`, `DELETE /restaurantTable/{id}`.
- **Catálogo de estados de mesa** (`/catalogos/estados-mesa`, ADMIN): CRUD sobre `/table-status`.

### 8.4 Pedidos (`/pedidos`)
- **Tablero de pedidos**: columnas por estado (kanban), filtrable por mesa (`?tableId=`), actualizado en vivo vía SSE. `GET /orders`, `GET /orders/status-stream`.
- **Mis pedidos** (`/pedidos/mis-pedidos`): pedidos tomados por el usuario actual. `GET /orders/my`.
- **Crear pedido**: seleccionar mesa, agregar platos del menú. `POST /orders` + `POST /orders/{orderId}/details` por cada línea.
- **Detalle de pedido** (`/pedidos/[id]`): líneas del pedido, estado, historial, botón cambiar estado, acceso directo a registrar pago. `GET /orders/{id}`, `PATCH /orders/{id}/status`, `DELETE /orders/{id}`.
- **Catálogo de estados de pedido** (`/catalogos/estados-pedido`, ADMIN): CRUD sobre `/order-statuses`.

### 8.5 Pagos (`/pagos`)
- **Lista de pagos**: filtro por estado (`?status=`), paginada. `GET /payments`.
- **Detalle de pago** (`/pagos/[id]`): monto (formateado con Dinero.js), método, QR si aplica, botones confirmar/fallar, descarga de recibo. `GET /payments/{id}`, `PATCH /payments/{id}/confirm`, `PATCH /payments/{id}/fail`, `GET /payments/{id}/receipt`, `DELETE /payments/{id}`.
- **Pagos de un pedido**: listado embebido en el detalle de pedido. `GET /payments/order/{orderId}`.
- **Registrar pago / dividir cuenta**: desde el detalle de pedido, crear un pago completo (`POST /payments`) o dividir entre varias personas (`POST /payments/split/{orderId}`).
- **Catálogo de estados de pago** (`/catalogos/estados-pago`, ADMIN): CRUD sobre `/payment-statuses`.

### 8.6 Platos (`/platos`)
- **Catálogo de platos**: grid con imagen, nombre, precio. Toggle "análisis de costos" visible solo si el usuario es ADMIN (`?analysis=true`). `GET /dishes`.
- **Detalle de plato** (`/platos/[id]`): datos generales, imagen (`POST /dishes/{id}/image`), lista de ingredientes con cantidades (`GET/POST/PUT/DELETE /dishes/{id}/ingredients...`), resumen (`GET /dishes/{id}/summary`).
- **Análisis de costos** (sección dentro del detalle, ADMIN): costo de producción, análisis de costo, edición de precio de venta. `GET /dishes/{id}/cost-analysis`, `GET /dishes/{id}/production-cost`, `PATCH /dishes/{id}/selling-price`.
- **Crear/editar/eliminar plato**: formulario con Zod. `POST/PUT/DELETE /dishes`.

### 8.7 Menús (`/menus`)
- **Lista de menús**: CRUD básico. `GET/POST/PUT/DELETE /menus`.
- **Detalle de menú** (`/menus/[id]`): platos incluidos, agregar/quitar. `GET/POST/DELETE /menus/{menuId}/dishes`.

### 8.8 Categorías (`/categorias`)
CRUD simple en tabla con modal de formulario. `GET/POST/PUT/DELETE /categories`.

### 8.9 Ingredientes (`/ingredientes`)
- **Lista de ingredientes**: tabla con stock actual, alerta visual para bajo stock. `GET /ingredients`, `GET /ingredients/low-stock`.
- **CRUD**: `POST/PUT/DELETE /ingredients`, con selector de unidad de medida.

### 8.10 Unidades de medida (`/unidades-medida`)
CRUD simple (kg, g, litro, unidad, etc.). `GET/POST/PUT/DELETE /measurement-units`. Usar `convert-units` para mostrar equivalencias al usuario al ingresar cantidades cuando aplique.

### 8.11 Usuarios (`/usuarios`, ADMIN)
- **Lista de usuarios**: tabla paginada. `GET /users`.
- **Detalle de usuario**: `GET /users/{id}`, `DELETE /users/{id}` (soft delete, confirmación).
- **Mi perfil** (`/perfil`, todos los roles): ver/editar datos propios. `GET/PUT /users/me`.

### 8.12 Configuración del negocio (`/configuracion`, ADMIN)
Formulario único de ajustes generales (margen de ganancia, datos del negocio, etc. según el DTO real). `GET/PUT /business-settings`.

### 8.13 Fuera de alcance del frontend
`POST /api/bank/callback` es un webhook consumido por el backend, no requiere pantalla. Swagger UI, `/actuator/health` y `/error` son infraestructura, no aplican a la UI.

---

## 9. Convenciones generales

- **Formularios**: React Hook Form + `zodResolver`, esquemas Zod ubicados junto al formulario o en `lib/schemas/`, coherentes con los tipos generados en `types/api.ts`.
- **Dinero**: todo campo monetario (`amount`, `productionCost`, `sellingPrice`, etc.) se maneja con Dinero.js en centavos internamente; nunca operar montos como `number` flotante directo. Moneda por defecto BOB (confirmar con el equipo si aplica multi-moneda).
- **Notificaciones**: `sonner` para feedback de mutaciones (éxito/error), `<Toaster />` una sola vez en el layout raíz.
- **Fechas**: `date-fns` para formateo y cálculos (vencimiento de QR, fechas de pedido/pago).
- **Errores de API**: el backend devuelve un shape consistente (`timestamp`, `status`, `error`, `message`, `path`, `fieldErrors`); el wrapper de fetch debe parsear ese shape y `fieldErrors` debe mapearse a errores de campo en React Hook Form cuando existan.

---

## 10. Criterios de aceptación

- Los 91 endpoints listados están integrados en al menos una pantalla o flujo (ver mapeo en sección 8).
- Login, registro, OTP y refresh de sesión funcionan de punta a punta contra el backend real.
- Las dos pantallas con SSE (mesas y pedidos) reflejan cambios en vivo sin recargar.
- Todos los listados paginados usan `page`/`size`/`sort` como query params y permiten cambiar de página y ordenar.
- Los montos se muestran formateados con Dinero.js en toda la UI (nunca `number` crudo).
- Los formularios validan con Zod antes de enviar, y muestran los `fieldErrors` que devuelva el backend.
- La navegación se organiza según la sección 6, sin bloquear por rol a nivel de código si el backend no lo exige (evitar falsa sensación de seguridad en el frontend).
- El proyecto usa pnpm, fetch nativo y exactamente las librerías listadas en la sección 1.