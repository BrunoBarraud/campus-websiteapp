import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
  }
>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-yellow-600 text-white shadow-sm hover:bg-yellow-700 hover:shadow-md",
    destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md",
    outline: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    link: "text-yellow-700 underline-offset-4 hover:underline",
  }

  const sizes = {
    default: "h-11 px-4 py-2.5",
    sm: "h-9 rounded-xl px-3.5 text-xs",
    lg: "h-12 rounded-2xl px-6 text-sm",
    icon: "h-11 w-11 rounded-xl",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold ring-offset-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
