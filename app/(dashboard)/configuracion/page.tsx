"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-title text-3xl text-foreground">Configuración</h1>
        <p className="text-muted-foreground">
          Ajustes generales del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-subtitle text-base">
            Ajustes del negocio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Los ajustes de negocio (margen de ganancia, datos del negocio, etc.)
            se integrarán con el endpoint de configuración del backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}