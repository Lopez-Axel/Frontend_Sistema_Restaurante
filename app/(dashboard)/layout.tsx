"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  ChefHat,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Ruler,
  Settings,
  ShoppingCart,
  UserRound,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "cn";
import type { components } from "@/types/api";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/lib/stores/auth";

type UserResponse = components["schemas"]["UserResponse"];
type Role = "WAITER" | "CHEF" | "ADMIN";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const ALL_ROLES: Role[] = ["WAITER", "CHEF", "ADMIN"];

const NAV_SECTIONS: NavSection[] = [
  {
    label: "General",
    items: [
      { href: "/", label: "Inicio", icon: LayoutDashboard, roles: ALL_ROLES },
      { href: "/perfil", label: "Mi perfil", icon: UserRound, roles: ALL_ROLES },
    ],
  },
  {
    label: "Operación",
    items: [
      { href: "/mesas", label: "Mesas", icon: UtensilsCrossed, roles: ["WAITER", "ADMIN"] },
      { href: "/pedidos", label: "Pedidos", icon: ShoppingCart, roles: ALL_ROLES },
      { href: "/pedidos/mis-pedidos", label: "Mis pedidos", icon: ClipboardList, roles: ["WAITER", "ADMIN"] },
      { href: "/pagos", label: "Pagos", icon: Receipt, roles: ["WAITER", "ADMIN"] },
    ],
  },
  {
    label: "Menú",
    items: [
      { href: "/platos", label: "Platos", icon: ChefHat, roles: ALL_ROLES },
      { href: "/menus", label: "Menús", icon: FolderTree, roles: ["ADMIN"] },
      { href: "/categorias", label: "Categorías", icon: FolderTree, roles: ["ADMIN"] },
      { href: "/ingredientes", label: "Ingredientes", icon: Boxes, roles: ["CHEF", "ADMIN"] },
      { href: "/unidades-medida", label: "Unidades de medida", icon: Ruler, roles: ["ADMIN"] },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/usuarios", label: "Usuarios", icon: Users, roles: ["ADMIN"] },
      { href: "/catalogos/estados-mesa", label: "Estados de mesa", icon: Settings, roles: ["ADMIN"] },
      { href: "/catalogos/estados-pedido", label: "Estados de pedido", icon: Settings, roles: ["ADMIN"] },
      { href: "/catalogos/estados-pago", label: "Estados de pago", icon: Settings, roles: ["ADMIN"] },
      { href: "/configuracion", label: "Configuración", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

function hasRole(userRole: string | undefined, roles: Role[]): boolean {
  return !!userRole && (roles as string[]).includes(userRole);
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  role,
  pathname,
  onNavigate,
}: {
  role?: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {NAV_SECTIONS.filter((section) =>
        section.items.some((item) => hasRole(role, item.roles))
      ).map((section) => (
        <div key={section.label}>
          <p className="mb-2 px-2 font-subtitle text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {section.label}
          </p>
          <ul className="space-y-1">
            {section.items
              .filter((item) => hasRole(role, item.roles))
              .map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-primary font-medium text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </>
  );
}

function SidebarContent({
  user,
  role,
  pathname,
  onLogout,
  onNavigate,
}: {
  user: UserResponse | null;
  role?: string;
  pathname: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2 font-title text-lg text-sidebar-foreground"
        >
          <Image
            src="/logo.png"
            alt="BarHub"
            width={32}
            height={32}
            priority
            className="h-8 w-8 shrink-0 object-contain"
          />
          <BrandWordmark accentClassName="text-hub-electric-soft" />
        </Link>
      </div>
      <nav
        aria-label="Navegación principal"
        className="scrollbar-hub flex-1 space-y-6 overflow-y-auto p-4"
      >
        <NavList role={role} pathname={pathname} onNavigate={onNavigate} />
      </nav>
      <div className="border-t border-border p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.firstName || user?.email}
            </p>
            <p className="text-xs text-muted-foreground">{role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [mobileMenu, setMobileMenu] = useState({ open: false, path: pathname });
  // El menú móvil se cierra solo al cambiar de ruta: el estado guarda la ruta
  // en la que se abrió y el panel solo queda visible si sigue siendo la actual.
  const mobileOpen = mobileMenu.open && mobileMenu.path === pathname;

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace("/login");
    }
  }, [hasHydrated, accessToken, router]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!accessToken) return null;

  const role = user?.role;

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarContent
          user={user}
          role={role}
          pathname={pathname}
          onLogout={handleLogout}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-sidebar px-3 text-sidebar-foreground lg:hidden">
          <Sheet
            open={mobileOpen}
            onOpenChange={(open: boolean) =>
              setMobileMenu({ open, path: pathname })
            }
          >
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Abrir menú de navegación"
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent className="bg-sidebar text-sidebar-foreground">
              <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
              <SidebarContent
                user={user}
                role={role}
                pathname={pathname}
                onLogout={handleLogout}
                onNavigate={() => setMobileMenu({ open: false, path: pathname })}
              />
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-title text-lg text-sidebar-foreground"
          >
            <Image
              src="/logo.png"
              alt="BarHub"
              width={32}
              height={32}
              priority
              className="h-8 w-8 shrink-0 object-contain"
            />
            <BrandWordmark accentClassName="text-hub-electric-soft" />
          </Link>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto bg-black p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
