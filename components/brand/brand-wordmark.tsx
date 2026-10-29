import { cn } from "cn";
import { BRAND_NAME_ACCENT, BRAND_NAME_BASE } from "@/lib/brand";

interface BrandWordmarkProps {
  className?: string;
  accentClassName?: string;
}

export function BrandWordmark({ className, accentClassName }: BrandWordmarkProps) {
  return (
    <span className={className}>
      {BRAND_NAME_BASE}
      <span className={cn("font-semibold italic", accentClassName)}>
        {BRAND_NAME_ACCENT}
      </span>
    </span>
  );
}
