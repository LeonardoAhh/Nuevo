"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    // Evita que Vaul manipule el scroll del documento al abrir el teclado
    noBodyStyles={false}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
      className
    )}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  // Detecta cuando el teclado está visible para ajustar la altura
  const [keyboardVisible, setKeyboardVisible] = React.useState(false)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      if (isInput) setKeyboardVisible(true)
    }

    const handleFocusOut = () => {
      setKeyboardVisible(false)
    }

    // visualViewport es la API más confiable para detectar el teclado en iOS
    const handleViewportResize = () => {
      if (!window.visualViewport) return
      const viewportHeight = window.visualViewport.height
      const windowHeight = window.innerHeight
      // Si el viewport visible es significativamente menor, el teclado está activo
      setKeyboardVisible(viewportHeight < windowHeight * 0.75)
    }

    document.addEventListener("focusin", handleFocusIn)
    document.addEventListener("focusout", handleFocusOut)
    window.visualViewport?.addEventListener("resize", handleViewportResize)

    return () => {
      document.removeEventListener("focusin", handleFocusIn)
      document.removeEventListener("focusout", handleFocusOut)
      window.visualViewport?.removeEventListener("resize", handleViewportResize)
    }
  }, [])

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          // Posicionamiento base
          "fixed inset-x-0 bottom-0 z-50",
          // Altura máxima: nunca sube más allá del safe-area-top
          // Cuando el teclado está visible, usa visualViewport height
          "flex flex-col",
          "rounded-t-2xl border bg-background",
          // mt-24 original mantenido para el snap inicial
          "mt-24",
          className
        )}
        style={{
          // Altura dinámica según estado del teclado
          maxHeight: keyboardVisible
            ? `calc(var(--visual-viewport-height, 100dvh) - env(safe-area-inset-top, 44px))`
            : `calc(100dvh - env(safe-area-inset-top, 44px))`,
        }}
        {...props}
      >
        {/* Drag handle — shrink-0 para que nunca desaparezca */}
        <div className="mx-auto mt-4 mb-1 h-2 w-[100px] shrink-0 rounded-full bg-border" />

        {/*
          Contenedor scrollable interno.
          - overflow-y-auto: scroll ocurre DENTRO del drawer, no mueve el drawer
          - overscroll-contain: el scroll no se propaga al documento
          - padding-bottom con env(): un solo punto de safe-area, sin duplicados
        */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{
            paddingBottom: "env(safe-area-inset-bottom, 20px)",
            // Scroll suave en iOS
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
})
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}