import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

// Simple cn function replacement
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-neutral-900 text-neutral-50 hover:bg-neutral-900/80',
        secondary: 'border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-100/80',
        destructive: 'border-transparent bg-red-500 text-neutral-50 hover:bg-red-500/80',
        success: 'border-transparent bg-green-500 text-white hover:bg-green-500/80',
        warning: 'border-transparent bg-amber-500 text-white hover:bg-amber-500/80',
        info: 'border-transparent bg-blue-500 text-white hover:bg-blue-500/80',
        outline: 'text-neutral-950 border-neutral-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }