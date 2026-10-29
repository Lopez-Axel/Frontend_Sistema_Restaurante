import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MenuBadge } from "@/components/menu/menu-badge";
import { formatMoney } from "@/lib/utils/money";
import { cn } from "cn";

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  tags?: string[];
  featured?: boolean;
}

interface MenuItemCardProps {
  item: MenuItem;
  onSelect?: (item: MenuItem) => void;
  className?: string;
}

export function MenuItemCard({ item, onSelect, className }: MenuItemCardProps) {
  const { name, description, priceCents, tags, featured } = item;

  return (
    <Card
      data-featured={featured ?? undefined}
      className={cn(
        "gap-3 transition-colors group-hover:bg-muted/40",
        featured &&
          "shadow-[inset_0_2px_0_0_var(--color-hub-neon-green)]",
        className
      )}
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            {featured && (
              <MenuBadge variant="accent">Destacado</MenuBadge>
            )}
            <h3
              className={cn(
                "font-title text-lg leading-snug",
                featured ? "text-hub-neon-green" : "text-foreground"
              )}
            >
              {name}
            </h3>
          </div>
          <p
            className={cn(
              "font-title text-lg tabular-nums",
              featured ? "text-hub-neon-green" : "text-foreground"
            )}
          >
            {formatMoney(priceCents)}
          </p>
        </div>
        {description && (
          <p className="font-body text-sm leading-relaxed text-foreground">
            {description}
          </p>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <MenuBadge key={tag} variant="outline">
                {tag}
              </MenuBadge>
            ))}
          </div>
        )}
        {onSelect && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(item)}
            className="self-start"
          >
            Agregar al pedido
          </Button>
        )}
      </CardContent>
    </Card>
  );
}