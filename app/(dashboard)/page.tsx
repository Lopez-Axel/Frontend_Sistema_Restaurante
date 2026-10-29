"use client";

import Link from "next/link";
import {
  ChefHat,
  Receipt,
  Settings,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import robot from "@/public/robot.png";
import { Mascot } from "@/components/brand/mascot";
import { useAuthStore } from "@/lib/stores/auth";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Role = "WAITER" | "CHEF" | "ADMIN";

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  WAITER: "Mesas, pedidos, pagos y menú",
  CHEF: "Tablero de cocina, platos e ingredientes",
  ADMIN: "Gestión completa del negocio",
};

const CARD_CLASS =
  "bg-card ring-1 ring-border transition duration-200 group-hover:bg-accent group-hover:ring-primary/60";
const ICON_CLASS = "mb-2 size-6 text-hub-electric-soft";
const TITLE_CLASS = "text-foreground";
const DESCRIPTION_CLASS = "text-muted-foreground";
const MASCOT_HEADER_CLASS =
  "-scale-x-100 size-10 shrink-0 sm:size-12 lg:size-14";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? "WAITER") as Role;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Mascot src={robot} className={MASCOT_HEADER_CLASS} />
        <div>
          <h1 className="font-title text-3xl font-bold text-foreground">
            Hola, {user?.firstName || user?.email} {user?.lastName}
          </h1>
          <p className="text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
        </div>
      </div>

      <div className="min-w-0 flex-1">
          <div className="grid gap-4 @sm:grid-cols-2 @3xl:grid-cols-3">
            <Link href="/mesas" className="group">
              <Card className={CARD_CLASS}>
                <CardHeader>
                  <UtensilsCrossed className={ICON_CLASS} />
                  <CardTitle className={TITLE_CLASS}>Mesas</CardTitle>
                  <CardDescription className={DESCRIPTION_CLASS}>
                    Tablero de mesas en tiempo real
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/pedidos" className="group">
              <Card className={CARD_CLASS}>
                <CardHeader>
                  <ShoppingCart className={ICON_CLASS} />
                  <CardTitle className={TITLE_CLASS}>Pedidos</CardTitle>
                  <CardDescription className={DESCRIPTION_CLASS}>
                    {role === "CHEF" ? "Tablero de cocina" : "Gestión de pedidos"}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            {(role === "WAITER" || role === "ADMIN") && (
              <Link href="/pagos" className="group">
                <Card className={CARD_CLASS}>
                  <CardHeader>
                    <Receipt className={ICON_CLASS} />
                    <CardTitle className={TITLE_CLASS}>Pagos</CardTitle>
                    <CardDescription className={DESCRIPTION_CLASS}>
                      Registrar y confirmar pagos
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}
            {role === "CHEF" && (
              <Link href="/pedidos" className="group">
                <Card className={CARD_CLASS}>
                  <CardHeader>
                    <ChefHat className={ICON_CLASS} />
                    <CardTitle className={TITLE_CLASS}>Cocina</CardTitle>
                    <CardDescription className={DESCRIPTION_CLASS}>
                      Pedidos en cola de preparación
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}
            {role === "ADMIN" && (
              <Link href="/catalogos/estados-mesa" className="group">
                <Card className={CARD_CLASS}>
                  <CardHeader>
                    <Settings className={ICON_CLASS} />
                    <CardTitle className={TITLE_CLASS}>Catálogos</CardTitle>
                    <CardDescription className={DESCRIPTION_CLASS}>
                      Estados de mesa, pedido y pago
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}
          </div>
        </div>
      </div>
  );
}
