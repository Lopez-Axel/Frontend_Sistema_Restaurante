"use client";

import { toast } from "sonner";
import {
  MenuCatalog,
  type MenuCategory,
} from "@/components/menu/menu-catalog";
import { BRAND_NAME } from "@/lib/brand";

const CATEGORIES: MenuCategory[] = [
  {
    id: "entradas",
    label: "Entradas",
    items: [
      {
        id: "saltenas",
        name: "Salteñas de la casa",
        description: "Jugosas, horneadas al momento, con relleno de pollo y papa.",
        priceCents: 1800,
        tags: ["Horneadas", "Pollo"],
        featured: true,
      },
      {
        id: "empanada-queso",
        name: "Empanada de queso",
        description: "Masa crujiente rellena de queso mantecoso y ají de la casa.",
        priceCents: 1200,
        tags: ["Vegetariana"],
      },
      {
        id: "causa-pollo",
        name: "Causa de pollo",
        description: "Papa amarilla, pollo sellado y crema de ají amarillo.",
        priceCents: 2200,
      },
    ],
  },
  {
    id: "principales",
    label: "Principales",
    items: [
      {
        id: "silpancho",
        name: "Silpancho de la casa",
        description: "Carne apanada, arroz, papa, huevo y ensalada fresca.",
        priceCents: 3200,
        featured: true,
      },
      {
        id: "pique-macho",
        name: "Pique macho",
        description: "Trozos de res salteados con salchicha, cebolla, tomate y locoto.",
        priceCents: 3800,
        tags: ["Picante"],
      },
      {
        id: "pescado-parrilla",
        name: "Pescado a la parrilla",
        description: "Filete del día con ensalada de palta y arroz con queso.",
        priceCents: 3400,
        tags: ["Chef"],
      },
    ],
  },
  {
    id: "postres",
    label: "Postres",
    items: [
      {
        id: "arroz-leche",
        name: "Arroz con leche a la canela",
        description: "Receta artesanal, servido tibio con canela recién rallada.",
        priceCents: 1400,
        featured: true,
      },
      {
        id: "torta-chocolate",
        name: "Torta de chocolate amargo",
        description: "Bomba de chocolate 70% con corazón fundido.",
        priceCents: 1600,
      },
      {
        id: "helado-chirimoya",
        name: "Helado de chirimoya",
        description: "Crema helada de chirimoya boliviana con hojitas de menta.",
        priceCents: 1300,
        tags: ["Sin gluten"],
      },
    ],
  },
  {
    id: "bebidas",
    label: "Bebidas",
    items: [
      {
        id: "mocochinchi",
        name: "Mocochinchi",
        description: "Refresco tradicional de durazno, canela y clavo de olor.",
        priceCents: 900,
      },
      {
        id: "singani-sour",
        name: "Singani sour",
        description: "Cóctel clásico con singani, limón, azúcar y amargo.",
        priceCents: 2500,
        tags: ["Bar"],
        featured: true,
      },
      {
        id: "cafe-altura",
        name: "Café de altura",
        description: "Selección de los Yungas, molido al momento.",
        priceCents: 1000,
      },
    ],
  },
];

export default function MenuPage() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <MenuCatalog
        restaurantName={BRAND_NAME}
        tagline="Cocina boliviana de autor"
        categories={CATEGORIES}
        onSelect={(item) =>
          toast.info(`${item.name} — agregado al pedido`)
        }
      />
    </main>
  );
}