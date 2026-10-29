import Image, { type StaticImageData } from "next/image";
import { cn } from "cn";

interface MascotProps {
  src: StaticImageData;
  className?: string;
}

export function Mascot({ src, className }: MascotProps) {
  return (
    <div className={cn("pointer-events-none shrink-0 select-none", className)}>
      <Image
        src={src}
        alt=""
        aria-hidden
        loading="eager"
        className="animate-mascot h-auto w-full object-contain"
      />
    </div>
  );
}
