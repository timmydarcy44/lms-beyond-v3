'use client';

import { PropsWithChildren, useRef } from "react";
import Button from "./Button";

export function Rail({ title, children }: PropsWithChildren<{ title: string }>) {
  const ref = useRef<HTMLDivElement>(null);
  
  const scroll = (dx: number) => {
    ref.current?.scrollBy({ left: dx, behavior: 'smooth' });
  };

  return (
    <section className="my-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="space-x-2">
          <Button 
            variant="ghost" 
            onClick={() => scroll(-400)} 
            aria-label="Défiler à gauche"
          >
            ◀
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => scroll(400)} 
            aria-label="Défiler à droite"
          >
            ▶
          </Button>
        </div>
      </div>
      <div 
        ref={ref} 
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 scrollbar-hide"
      >
        {children}
      </div>
    </section>
  );
}
