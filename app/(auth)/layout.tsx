import Image from "next/image";
import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { BRAND_TAGLINE } from "@/lib/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-background p-6 text-foreground">
      <header className="flex flex-col items-center gap-2 text-center">
        <p className="font-subtitle text-sm font-light uppercase tracking-[0.35em] text-muted-foreground">
          {BRAND_TAGLINE}
        </p>
        <div className="relative inline-flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="BarHub"
            width={48}
            height={48}
            priority
            className="absolute right-full mr-3 h-12 w-12 object-contain"
          />
          <h1 className="font-title text-4xl text-title">
            <BrandWordmark />
          </h1>
        </div>
      </header>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}