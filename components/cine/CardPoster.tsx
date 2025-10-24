import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  coverUrl?: string;
  onClick?: () => void;
  className?: string;
};

export function CardPoster({ title, subtitle, coverUrl, onClick, className }: Props) {
  const getInitials = (text: string) => {
    return text
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }} 
      transition={{ duration: 0.2, ease: "easeOut" }}
      role="button" 
      tabIndex={0}
      onClick={onClick} 
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        "relative w-[220px] h-[320px] overflow-hidden rounded-2xl bg-surface shadow-card cursor-pointer",
        className
      )}
    >
      {coverUrl ? (
        <Image 
          src={coverUrl} 
          alt={title} 
          fill 
          className="object-cover" 
          sizes="220px" 
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <div className="text-4xl font-bold text-white/80">
            {getInitials(title)}
          </div>
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      
      <div className="absolute bottom-2 left-2 right-2">
        <div className="text-white font-semibold truncate">{title}</div>
        {subtitle && (
          <div className="text-xs text-white/70 truncate">{subtitle}</div>
        )}
      </div>
    </motion.div>
  );
}
