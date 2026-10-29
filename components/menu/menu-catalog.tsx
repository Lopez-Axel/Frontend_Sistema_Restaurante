"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  MenuItemCard,
  type MenuItem,
} from "@/components/menu/menu-item-card";

export interface MenuCategory {
  id: string;
  label: string;
  items: MenuItem[];
}

interface MenuCatalogProps {
  restaurantName: string;
  tagline: string;
  categories: MenuCategory[];
  onSelect?: (item: MenuItem) => void;
}

export function MenuCatalog({
  restaurantName,
  tagline,
  categories,
  onSelect,
}: MenuCatalogProps) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col items-center gap-3 text-center">
        <p className="font-subtitle text-sm font-light uppercase tracking-[0.35em] text-muted-foreground">
          {tagline}
        </p>
        <h1 className="font-title text-4xl text-foreground sm:text-5xl">
          {restaurantName}
        </h1>
        <Separator className="w-24 bg-hub-electric-soft/70" />
      </header>

      <Tabs defaultValue={categories[0]?.id}>
        <TabsList className="mx-auto flex h-auto flex-wrap justify-center gap-1 bg-muted/60 p-1">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="font-subtitle h-7 uppercase tracking-[0.2em]"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}