'use client';

import Image from "next/image";
import Button from "./Button";

export function Hero({ 
  title, 
  description, 
  coverUrl, 
  cta, 
  onCta 
}: {
  title: string;
  description?: string;
  coverUrl?: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="relative h-[46vh] min-h-[360px] rounded-2xl overflow-hidden bg-surface mb-6">
      {coverUrl && (
        <Image 
          src={coverUrl} 
          alt={title} 
          fill 
          className="object-cover" 
          priority 
        />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
      
      <div className="absolute left-8 bottom-8 max-w-xl">
        <h1 className="text-4xl font-extrabold mb-3">{title}</h1>
        {description && (
          <p className="text-white/80 mb-4 line-clamp-3">{description}</p>
        )}
        {cta && (
          <Button onClick={onCta} variant="primary" size="lg">
            {cta}
          </Button>
        )}
      </div>
    </div>
  );
}
