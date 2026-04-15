"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // ── Base ────────────────────────────────────────────────────────
        "fixed z-50 bg-card shadow-xl",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "duration-300 ease-out",

        // ── Mobile: bottom-sheet ─────────────────────────────────────────
        // Ocupa todo el ancho, sube desde abajo, esquinas superiores redondeadas
        "inset-x-0 bottom-0 w-full rounded-t-2xl border-t",
        "max-h-[92dvh] flex flex-col",
        "data-[state=open]:slide-in-from-bottom-4",
        "data-[state=closed]:slide-out-to-bottom-4",

        // ── Desktop ≥ sm: dialog centrado ────────────────────────────────
        "sm:inset-auto sm:bottom-auto",
        "sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
        "sm:rounded-xl sm:border sm:max-w-lg sm:w-full",
        "sm:max-h-[85dvh]",
        "sm:data-[state=open]:slide-in-from-left-1/2",
        "sm:data-[state=open]:slide-in-from-top-[48%]",
        "sm:data-[state=closed]:slide-out-to-left-1/2",
        "sm:data-[state=closed]:slide-out-to-top-[48%]",
        "sm:data-[state=closed]:zoom-out-95",
        "sm:data-[state=open]:zoom-in-95",

        className,
      )}
      {...props}
    >
      {/* Drag handle — solo en móvil */}
      <div className="sm:hidden flex-shrink-0 flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
      </div>

      {/* Área scrollable */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-6 pt-1 sm:pt-6"
        style={{
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          scrollbarGutter: "stable",
        }}
      >
        {children}
      </div>

      {/* Botón cerrar */}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 opacity-60 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Cerrar</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      // sticky al fondo del área scrollable del dialog
      "sticky bottom-0 -mx-6 px-6 pt-3 mt-4",
      "bg-background/95 backdrop-blur-sm",
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2",
      className,
    )}
    style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
