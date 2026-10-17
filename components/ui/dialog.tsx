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
      "fixed inset-0 z-50 bg-black/40",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none",
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { raw?: boolean; hideClose?: boolean; footer?: React.ReactNode }
>(({ className, children, raw, hideClose, footer, ...props }, ref) => {
  return <DialogPortal>
    <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-0 top-auto z-50 flex w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-t-xl border bg-card text-card-foreground shadow-[0_2px_2px_hsl(0_0%_0%/0.04),0_8px_16px_-4px_hsl(0_0%_0%/0.14)]",
          "max-h-[85dvh]",
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100vw-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:max-h-[80dvh]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4",
          "sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
          "duration-200 focus:outline-none motion-reduce:animate-none",
          className,
        )}
        {...props}
        data-dialog-layout={raw ? "custom" : "standard"}
      >
        {raw ? (
          children
        ) : (
          <>
            {/* Área scrollable */}
            <div
              className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-5 sm:px-6 sm:pt-6", footer ? "pb-4 sm:pb-5" : "safe-bottom-content")}
              style={{ scrollbarGutter: "stable" }}
            >
              {children}
            </div>

            {footer}

            {/* Botón cerrar */}
            {!hideClose && (
              <DialogPrimitive.Close className="absolute right-2 top-2 z-50 flex size-11 items-center justify-center rounded-md bg-card text-muted-foreground ring-offset-background transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none">
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Cerrar</span>
              </DialogPrimitive.Close>
            )}
          </>
        )}
      </DialogPrimitive.Content>
  </DialogPortal>
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  if (className?.split(/\s+/).includes("sr-only")) {
    return <div {...props} className={className} />
  }
  return <div {...props} className={cn("mb-5 flex flex-col gap-1 border-b pb-4 pr-12 text-left", className)} />
}
DialogHeader.displayName = "DialogHeader"

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  detached?: boolean
}

const DialogFooter = ({
  className,
  detached = false,
  style,
  ...props
}: DialogFooterProps) => (
  <div
    className={cn(
      detached
        ? "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
        : [
            "mt-auto shrink-0 border-t bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-3",
            "flex flex-col-reverse items-center gap-2 sm:flex-row sm:justify-end",
          ],
      className,
    )}
    style={style}
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
    className={cn("break-words text-xl font-semibold leading-7 tracking-tight", className)}
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
    className={cn("text-sm leading-5 text-muted-foreground", className)}
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
