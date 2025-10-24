'use client';

import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary'|'secondary'|'ghost'|'danger';
  size?: 'sm'|'md'|'lg';
  loading?: boolean;
};

export default function Button({ 
  variant='primary', 
  size='md', 
  loading, 
  className, 
  children, 
  ...rest 
}: Props) {
  const base = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 ease-cine disabled:opacity-60 disabled:cursor-not-allowed";
  const sizes = { 
    sm: "h-9 px-3 text-sm", 
    md: "h-11 px-4", 
    lg: "h-12 px-6 text-lg" 
  };
  const variants = {
    primary: "bg-primary text-white hover:shadow-glow",
    secondary: "bg-surfaceAlt text-text border border-border hover:bg-surface",
    ghost: "bg-transparent text-text hover:bg-white/5",
    danger: "bg-red-600 text-white hover:bg-red-500"
  };
  
  return (
    <button 
      aria-busy={loading || undefined}
      className={cn(base, sizes[size], variants[variant], className)} 
      {...rest}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
