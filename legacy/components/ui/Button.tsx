'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
// Simple cn function replacement
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iris-500 focus-visible:ring-opacity-50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-iris-500 to-cyan-400 text-white shadow-elev-2 hover:shadow-glow-iris hover:scale-105 active:scale-100',
        secondary: 'bg-gradient-to-r from-blush-500 to-lime-400 text-white shadow-elev-2 hover:shadow-glow-blush hover:scale-105 active:scale-100',
        glass: 'glass text-neutral-100 hover:shadow-glow-iris hover:scale-105 active:scale-100',
        ghost: 'text-neutral-300 hover:text-white hover:bg-white/5 active:bg-white/10',
        outline: 'border border-white/20 bg-transparent text-neutral-100 hover:bg-white/5 hover:border-white/30 hover:shadow-glow-iris',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

