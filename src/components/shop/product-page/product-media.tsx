import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "./types";

export function ProductMedia({
  isLight,
  product,
  images,
}: {
  isLight: boolean;
  product: Record<string, unknown>;
  images: ProductImage[];
}) {
  return (
    <>
      <div
        className={cn(
          "flex h-44 items-center justify-center overflow-hidden rounded-2xl",
          isLight ? "bg-white/90" : "bg-[#1c1c1e]",
        )}
      >
        {images[0]?.url || product.primary_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            decoding="async"
            src={String(images[0]?.url || product.primary_image_url)}
            alt={String(product.name)}
            className="h-full w-full object-cover"
          />
        ) : (
          <ShoppingBag className="h-12 w-12 text-[#FF6B35]" />
        )}
      </div>
      {images.length > 1 ? (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              loading="lazy"
              decoding="async"
              key={`${img.url}-${i}`}
              src={img.url}
              alt=""
              className={cn(
                "h-14 w-14 shrink-0 rounded-lg object-cover",
                isLight ? "bg-white" : "bg-[#1c1c1e]",
              )}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
