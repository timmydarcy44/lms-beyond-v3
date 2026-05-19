import Image from "next/image";
import { cn } from "@/lib/utils";
import { EDGE_HERO_IMAGE_URL } from "@/lib/edge-site/constants";

type Props = {
  /** Par défaut : image hero (temporaire pour tous les emplacements sans visuel dédié). */
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  priority?: boolean;
  sizes?: string;
};

export function ImagePlaceholder({
  src = EDGE_HERO_IMAGE_URL,
  alt,
  className,
  fallbackClassName = "bg-edge-photo",
  priority,
  sizes = "100vw",
}: Props) {
  return (
    <div className={cn("relative overflow-hidden", fallbackClassName, className)}>
      <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} priority={priority} />
    </div>
  );
}
