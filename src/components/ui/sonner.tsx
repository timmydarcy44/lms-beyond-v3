"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[#F8F5F0]/98 group-[.toaster]:dark:bg-[#2F2A25]/98 group-[.toaster]:backdrop-blur-xl group-[.toaster]:shadow-2xl group-[.toaster]:border group-[.toaster]:border-[#E6D9C6]/80 group-[.toaster]:dark:border-[#8B6F47]/50 group-[.toaster]:rounded-2xl group-[.toaster]:p-6",
          title: "group-[.toast]:text-[#2F2A25] group-[.toast]:dark:text-[#F8F5F0] group-[.toast]:font-semibold group-[.toast]:text-base",
          description: "group-[.toast]:text-[#2F2A25]/80 group-[.toast]:dark:text-[#F8F5F0]/80",
          success: "group-[.toast]:border-[#C6A664] group-[.toast]:bg-[#F8F5F0]",
          error: "group-[.toast]:border-red-400 group-[.toast]:bg-red-50",
          info: "group-[.toast]:border-[#C6A664] group-[.toast]:bg-[#F8F5F0]",
          warning: "group-[.toast]:border-yellow-400 group-[.toast]:bg-yellow-50",
          actionButton: "group-[.toast]:bg-[#8B6F47] group-[.toast]:text-white group-[.toast]:hover:bg-[#B88A44] group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:text-sm group-[.toast]:font-medium",
          cancelButton: "group-[.toast]:bg-[#E6D9C6] group-[.toast]:text-[#2F2A25] group-[.toast]:hover:bg-[#D4C4A8] group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:text-sm group-[.toast]:font-medium",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
