"use client"

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react"
import {
  Type,
  Image as ImageIcon,
  Trash2,
  Printer,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignEndVertical,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Plus,
  Minus,
  Upload,
  Palette,
  RefreshCw,
  Undo2,
  Redo2,
  Copy,
  Download,
  Save,
  FolderOpen,
  LayoutTemplate,
  Keyboard,
  PanelLeftClose,
  PanelRightClose,
  PanelLeftOpen,
  PanelRightOpen,
  Grid3X3,
  Magnet,
  Trash,
  FileImage,
  Layers,
  X,
  Lock,
  Unlock,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  Pipette,
  ClipboardCopy,
  ClipboardPaste,
  Shapes,
  SmilePlus,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  // Icons for the icon library
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Wrench,
  GraduationCap,
  Clipboard,
  FileText,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Star,
  Award,
  Heart,
  Zap,
  Megaphone,
  Building2,
  Factory,
  HardHat,
  Flame,
  Target,
  Trophy,
  BookOpen,
  Lightbulb,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useFlayerHistory } from "@/lib/hooks/useFlayerHistory"

// ── Imports from extracted modules ────────────────────────────────────────────

import {
  CANVAS_W,
  CANVAS_H,
  GRID_SIZE,
  SNAP_THRESHOLD,
  STORAGE_KEY,
  GALLERY_KEY,
  COLOR_HISTORY_KEY,
  AUTOSAVE_KEY,
  AUTOSAVE_INTERVAL,
  FONTS,
  DEFAULT_STYLE,
  DEFAULT_SHAPE_COLOR,
  DEFAULT_TEXT_COLOR,
  TEXT_SHADOWS,
  BOX_SHADOWS,
  GRADIENT_PRESETS,
  COLOR_PRESETS,
  SHAPE_CATALOG,
  ICON_CATALOG,
  uid,
  snapToGrid,
  compressImage,
  migrateElement,
} from "@/lib/flayer/types"

import type {
  ElementStyle,
  FlayerElement,
  FlayerInfo,
  FlayerState,
  SavedFlayer,
  ShapeType,
} from "@/lib/flayer/types"

import { TEMPLATES } from "@/lib/flayer/templates"

// ── Icon component map ────────────────────────────────────────────────────────

const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  calendar: Calendar,
  clock: Clock,
  "map-pin": MapPin,
  user: User,
  users: Users,
  "alert-triangle": AlertTriangle,
  shield: Shield,
  "shield-check": ShieldCheck,
  wrench: Wrench,
  "graduation-cap": GraduationCap,
  clipboard: Clipboard,
  "file-text": FileText,
  "check-circle": CheckCircle2,
  "x-circle": XCircle,
  phone: Phone,
  mail: Mail,
  star: Star,
  award: Award,
  heart: Heart,
  zap: Zap,
  megaphone: Megaphone,
  building: Building2,
  factory: Factory,
  "hard-hat": HardHat,
  flame: Flame,
  eye: Eye,
  target: Target,
  trophy: Trophy,
  "book-open": BookOpen,
  lightbulb: Lightbulb,
}

// ── Types ─────────────────────────────────────────────────────────────────────

type MobileTab = "info" | "canvas" | "properties" | "layers"

interface ContextMenuState {
  x: number
  y: number
  elementId: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function useAnnounce() {
  const [msg, setMsg] = useState("")
  const announce = useCallback((text: string) => {
    setMsg("")
    requestAnimationFrame(() => setMsg(text))
  }, [])
  return { msg, announce }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function FlayersContent() {
  // ── Core state via history hook ─────────────────────────────────────────
  const {
    state: flayerState,
    set: setFlayerState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useFlayerHistory<FlayerState>({
    elements: [],
    canvasBg: "#ffffff",
    canvasBgImage: null,
  })

  const { elements, canvasBg, canvasBgImage } = flayerState

  // Keep a ref so async callbacks never go stale
  const stateRef = useRef(flayerState)
  stateRef.current = flayerState

  const setElements = useCallback(
    (fn: (prev: FlayerElement[]) => FlayerElement[]) => {
      const latest = stateRef.current
      setFlayerState({ ...latest, elements: fn(latest.elements) })
    },
    [setFlayerState],
  )

  const setCanvasBg = useCallback(
    (bg: string) => {
      const latest = stateRef.current
      setFlayerState({ ...latest, canvasBg: bg, canvasBgImage: null })
    },
    [setFlayerState],
  )

  const setCanvasBgImage = useCallback(
    (img: string | null) => {
      const latest = stateRef.current
      setFlayerState({ ...latest, canvasBgImage: img })
    },
    [setFlayerState],
  )

  // ── UI state (NOT tracked by undo) ──────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(false)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [mobileTab, setMobileTab] = useState<MobileTab>("canvas")
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSaves, setShowSaves] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showShapePicker, setShowShapePicker] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showLayers, setShowLayers] = useState(false)
  const [saveName, setSaveName] = useState("")
  const shapeBtnRef = useRef<HTMLButtonElement>(null)
  const iconBtnRef = useRef<HTMLButtonElement>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [zoom, setZoom] = useState(100)
  const [clipboardStyle, setClipboardStyle] = useState<ElementStyle | null>(null)
  const [colorHistory, setColorHistory] = useState<string[]>([])
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [lastAutoSave, setLastAutoSave] = useState<string>("")

  const [info, setInfo] = useState<FlayerInfo>({
    folio: "",
    curso: "",
    instructor: "",
    sala: "",
    turno1: "",
    fechaTurno1: "",
    turno2: "",
    fechaTurno2: "",
    turno3: "",
    fechaTurno3: "",
    turno4: "",
    fechaTurno4: "",
    horarioEspecial: "",
  })

  // ── Gallery ─────────────────────────────────────────────────────────────
  const [gallery, setGallery] = useState<string[]>([])
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GALLERY_KEY)
      if (saved) setGallery(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const addToGallery = useCallback((dataUrl: string) => {
    setGallery((prev) => {
      const next = [dataUrl, ...prev].slice(0, 20)
      try { localStorage.setItem(GALLERY_KEY, JSON.stringify(next)) } catch { /* quota */ }
      return next
    })
  }, [])

  // ── Color history ───────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLOR_HISTORY_KEY)
      if (saved) setColorHistory(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const trackColor = useCallback((color: string) => {
    if (color === "transparent" || !color) return
    setColorHistory((prev) => {
      const next = [color, ...prev.filter((c) => c !== color)].slice(0, 12)
      try { localStorage.setItem(COLOR_HISTORY_KEY, JSON.stringify(next)) } catch { /* quota */ }
      return next
    })
  }, [])

  // ── Refs ────────────────────────────────────────────────────────────────
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null)
  const resizing = useRef<{ id: string; startX: number; startY: number; startW: number; startH: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // ── Responsiveness + Zoom ──────────────────────────────────────────────
  const [baseScale, setBaseScale] = useState(1)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const recalc = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (wrapperRef.current) {
        const avail = wrapperRef.current.clientWidth - 32
        setBaseScale(Math.min(1, avail / CANVAS_W))
      }
    }
    recalc()
    window.addEventListener("resize", recalc)
    return () => window.removeEventListener("resize", recalc)
  }, [])

  const scale = baseScale * (zoom / 100)

  // ── Auto-save ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoSaveEnabled) return
    const timer = setInterval(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(flayerState))
        setLastAutoSave(new Date().toLocaleTimeString())
      } catch { /* quota */ }
    }, AUTOSAVE_INTERVAL)
    return () => clearInterval(timer)
  }, [autoSaveEnabled, flayerState])

  // Load autosave on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY)
      if (saved) {
        const state: FlayerState = JSON.parse(saved)
        if (state.elements?.length > 0) {
          setFlayerState({
            ...state,
            elements: state.elements.map(migrateElement),
          })
        }
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Accessibility ──────────────────────────────────────────────────────
  const { msg: a11yMsg, announce } = useAnnounce()

  // ── Memoised selectors ─────────────────────────────────────────────────
  const sortedElements = useMemo(
    () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
    [elements],
  )

  const selected = useMemo(
    () => elements.find((e) => e.id === selectedId) ?? null,
    [elements, selectedId],
  )

  // ── Element CRUD ───────────────────────────────────────────────────────

  const addText = useCallback(() => {
    const el: FlayerElement = {
      id: uid(), type: "text", x: 60, y: 60, width: 300, height: 50,
      content: "Texto de ejemplo", zIndex: elements.length + 1,
      style: { ...DEFAULT_STYLE },
    }
    setElements((prev) => [...prev, el])
    setSelectedId(el.id)
    announce("Texto añadido")
  }, [elements.length, setElements, announce])

  const addImageFromData = useCallback(
    (src: string) => {
      const img = new window.Image()
      img.onload = () => {
        const maxW = 300
        const ratio = img.height / img.width
        const w = Math.min(maxW, img.width)
        const h = w * ratio
        const newEl: FlayerElement = {
          id: uid(), type: "image", x: 60, y: 60, width: w, height: h,
          content: src, zIndex: stateRef.current.elements.length + 1,
          style: { ...DEFAULT_STYLE, backgroundColor: "transparent" },
        }
        setElements((prev) => [...prev, newEl])
        setSelectedId(newEl.id)
        announce("Imagen añadida")
      }
      img.src = src
    },
    [setElements, announce],
  )

  const addImage = useCallback(
    async (file: File) => {
      const src = await compressImage(file)
      addToGallery(src)
      addImageFromData(src)
    },
    [addToGallery, addImageFromData],
  )

  const addShape = useCallback(
    (shapeType: ShapeType) => {
      const dims: Record<ShapeType, { w: number; h: number }> = {
        rectangle: { w: 200, h: 120 },
        circle: { w: 120, h: 120 },
        line: { w: 300, h: 4 },
        triangle: { w: 120, h: 120 },
        divider: { w: 600, h: 3 },
        star: { w: 100, h: 100 },
      }
      const { w, h } = dims[shapeType]
      const newEl: FlayerElement = {
        id: uid(), type: "shape", shapeType, x: 80, y: 80, width: w, height: h,
        content: "", zIndex: elements.length + 1,
        style: { ...DEFAULT_STYLE, backgroundColor: DEFAULT_SHAPE_COLOR },
      }
      setElements((prev) => [...prev, newEl])
      setSelectedId(newEl.id)
      setShowShapePicker(false)
      announce(`Forma ${shapeType} añadida`)
    },
    [elements.length, setElements, announce],
  )

  const addIcon = useCallback(
    (iconName: string) => {
      const newEl: FlayerElement = {
        id: uid(), type: "icon", iconName, x: 80, y: 80, width: 48, height: 48,
        content: "", zIndex: elements.length + 1,
        style: { ...DEFAULT_STYLE, color: DEFAULT_TEXT_COLOR, backgroundColor: "transparent" },
      }
      setElements((prev) => [...prev, newEl])
      setSelectedId(newEl.id)
      setShowIconPicker(false)
      announce(`Ícono ${iconName} añadido`)
    },
    [elements.length, setElements, announce],
  )

  const deleteElement = useCallback(
    (id: string) => {
      setElements((prev) => prev.filter((e) => e.id !== id))
      if (selectedId === id) setSelectedId(null)
      announce("Elemento eliminado")
    },
    [selectedId, setElements, announce],
  )

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    const el = elements.find((e) => e.id === selectedId)
    if (el?.locked) return
    deleteElement(selectedId)
  }, [selectedId, elements, deleteElement])

  const duplicateElement = useCallback(
    (id: string) => {
      const el = elements.find((e) => e.id === id)
      if (!el) return
      const dup: FlayerElement = {
        ...structuredClone(el),
        id: uid(),
        x: el.x + 20,
        y: el.y + 20,
        zIndex: elements.length + 1,
        locked: false,
      }
      setElements((prev) => [...prev, dup])
      setSelectedId(dup.id)
      announce("Elemento duplicado")
    },
    [elements, setElements, announce],
  )

  const duplicateSelected = useCallback(() => {
    if (selectedId) duplicateElement(selectedId)
  }, [selectedId, duplicateElement])

  const updateElement = useCallback(
    (id: string, patch: Partial<FlayerElement>) => {
      setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
    },
    [setElements],
  )

  const updateStyle = useCallback(
    (id: string, patch: Partial<ElementStyle>) => {
      setElements((prev) =>
        prev.map((e) => (e.id === id ? { ...e, style: { ...e.style, ...patch } } : e)),
      )
    },
    [setElements],
  )

  // ── Z-order ─────────────────────────────────────────────────────────────

  const bringForward = useCallback(() => {
    if (!selectedId) return
    const el = elements.find((e) => e.id === selectedId)
    if (el) updateElement(selectedId, { zIndex: el.zIndex + 1 })
  }, [selectedId, elements, updateElement])

  const sendBackward = useCallback(() => {
    if (!selectedId) return
    const el = elements.find((e) => e.id === selectedId)
    if (el) updateElement(selectedId, { zIndex: Math.max(0, el.zIndex - 1) })
  }, [selectedId, elements, updateElement])

  const bringToFront = useCallback(() => {
    if (!selectedId) return
    const maxZ = Math.max(...elements.map((e) => e.zIndex), 0)
    updateElement(selectedId, { zIndex: maxZ + 1 })
  }, [selectedId, elements, updateElement])

  const sendToBack = useCallback(() => {
    if (!selectedId) return
    const minZ = Math.min(...elements.map((e) => e.zIndex), 0)
    updateElement(selectedId, { zIndex: minZ - 1 })
  }, [selectedId, elements, updateElement])

  // ── Lock / Unlock ───────────────────────────────────────────────────────

  const toggleLock = useCallback(
    (id: string) => {
      const el = elements.find((e) => e.id === id)
      if (el) updateElement(id, { locked: !el.locked })
    },
    [elements, updateElement],
  )

  // ── Flip ────────────────────────────────────────────────────────────────

  const toggleFlipH = useCallback(() => {
    if (!selected) return
    updateElement(selected.id, { flipH: !selected.flipH })
  }, [selected, updateElement])

  const toggleFlipV = useCallback(() => {
    if (!selected) return
    updateElement(selected.id, { flipV: !selected.flipV })
  }, [selected, updateElement])

  // ── Copy / Paste Style ──────────────────────────────────────────────────

  const copyStyle = useCallback(() => {
    if (!selected) return
    setClipboardStyle(structuredClone(selected.style))
    announce("Estilo copiado")
  }, [selected, announce])

  const pasteStyle = useCallback(() => {
    if (!selectedId || !clipboardStyle) return
    updateStyle(selectedId, clipboardStyle)
    announce("Estilo pegado")
  }, [selectedId, clipboardStyle, updateStyle, announce])

  // ── Alignment ───────────────────────────────────────────────────────────

  const alignTo = useCallback(
    (direction: string) => {
      if (!selected) return
      switch (direction) {
        case "left":
          updateElement(selected.id, { x: 0 }); break
        case "center-h":
          updateElement(selected.id, { x: (CANVAS_W - selected.width) / 2 }); break
        case "right":
          updateElement(selected.id, { x: CANVAS_W - selected.width }); break
        case "top":
          updateElement(selected.id, { y: 0 }); break
        case "center-v":
          updateElement(selected.id, { y: (CANVAS_H - selected.height) / 2 }); break
        case "bottom":
          updateElement(selected.id, { y: CANVAS_H - selected.height }); break
      }
    },
    [selected, updateElement],
  )

  // ── Insert info from form ──────────────────────────────────────────────

  const insertInfo = useCallback(() => {
    const lines: string[] = []
    if (info.folio) lines.push(`Folio: ${info.folio}`)
    if (info.curso) lines.push(`Curso: ${info.curso}`)
    if (info.instructor) lines.push(`Instructor: ${info.instructor}`)
    if (info.sala) lines.push(`Sala: ${info.sala}`)
    if (info.turno1) lines.push(`Turno 1: ${info.turno1}${info.fechaTurno1 ? ` — ${info.fechaTurno1}` : ""}`)
    if (info.turno2) lines.push(`Turno 2: ${info.turno2}${info.fechaTurno2 ? ` — ${info.fechaTurno2}` : ""}`)
    if (info.turno3) lines.push(`Turno 3: ${info.turno3}${info.fechaTurno3 ? ` — ${info.fechaTurno3}` : ""}`)
    if (info.turno4) lines.push(`Turno 4: ${info.turno4}${info.fechaTurno4 ? ` — ${info.fechaTurno4}` : ""}`)
    if (info.horarioEspecial) lines.push(`Horario especial: ${info.horarioEspecial}`)
    if (lines.length === 0) return

    const el: FlayerElement = {
      id: uid(), type: "text", x: 60, y: 80,
      width: 650, height: lines.length * 32 + 20,
      content: lines.join("\n"), zIndex: elements.length + 1,
      style: { ...DEFAULT_STYLE, fontSize: 20 },
    }
    setElements((prev) => [...prev, el])
    setSelectedId(el.id)
    announce("Información insertada")
  }, [info, elements.length, setElements, announce])

  // ── Drag & Drop (with snap-to-grid) ────────────────────────────────────

  const getCanvasOffset = useCallback(() => {
    if (!canvasRef.current) return { left: 0, top: 0 }
    const rect = canvasRef.current.getBoundingClientRect()
    return { left: rect.left, top: rect.top }
  }, [])

  const onElementPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      const el = elements.find((el) => el.id === id)
      if (el?.locked) { setSelectedId(id); return }
      if (editingId === id) return
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      const offset = getCanvasOffset()
      dragging.current = {
        id,
        ox: (e.clientX - offset.left) / scale - el!.x,
        oy: (e.clientY - offset.top) / scale - el!.y,
      }
      setSelectedId(id)
    },
    [editingId, elements, scale, getCanvasOffset],
  )

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      const el = elements.find((el) => el.id === id)!
      resizing.current = { id, startX: e.clientX, startY: e.clientY, startW: el.width, startH: el.height }
    },
    [elements],
  )

  const onCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging.current) {
        const { id, ox, oy } = dragging.current
        const offset = getCanvasOffset()
        let x = (e.clientX - offset.left) / scale - ox
        let y = (e.clientY - offset.top) / scale - oy
        x = Math.max(0, Math.min(CANVAS_W - 20, x))
        y = Math.max(0, Math.min(CANVAS_H - 20, y))
        if (snapEnabled) {
          const sx = snapToGrid(x, GRID_SIZE)
          const sy = snapToGrid(y, GRID_SIZE)
          if (Math.abs(x - sx) < SNAP_THRESHOLD) x = sx
          if (Math.abs(y - sy) < SNAP_THRESHOLD) y = sy
        }
        updateElement(id, { x, y })
      }
      if (resizing.current) {
        const { id, startX, startY, startW, startH } = resizing.current
        const dw = (e.clientX - startX) / scale
        const dh = (e.clientY - startY) / scale
        updateElement(id, { width: Math.max(20, startW + dw), height: Math.max(10, startH + dh) })
      }
    },
    [scale, snapEnabled, getCanvasOffset, updateElement],
  )

  const onCanvasPointerUp = useCallback(() => {
    dragging.current = null
    resizing.current = null
  }, [])

  // ── Context menu ────────────────────────────────────────────────────────

  const onElementContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, elementId: id })
    setSelectedId(id)
  }, [])

  // Close context menu on click anywhere
  useEffect(() => {
    if (!contextMenu) return
    const handler = () => setContextMenu(null)
    window.addEventListener("click", handler)
    return () => window.removeEventListener("click", handler)
  }, [contextMenu])

  // Close pickers on click outside
  useEffect(() => {
    if (!showShapePicker && !showIconPicker) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (shapeBtnRef.current?.contains(target) || iconBtnRef.current?.contains(target)) return
      setShowShapePicker(false)
      setShowIconPicker(false)
    }
    window.addEventListener("click", handler)
    return () => window.removeEventListener("click", handler)
  }, [showShapePicker, showIconPicker])

  // ── Background ─────────────────────────────────────────────────────────

  const onBgImageChange = useCallback(
    async (file: File) => {
      const src = await compressImage(file, 1600, 0.85)
      setCanvasBgImage(src)
    },
    [setCanvasBgImage],
  )

  // ── Print ──────────────────────────────────────────────────────────────

  const handlePrint = useCallback(() => window.print(), [])

  // ── Export ─────────────────────────────────────────────────────────────

  const handleExport = useCallback(
    async (format: "png" | "jpeg") => {
      if (!canvasRef.current) return
      try {
        const { toPng, toJpeg } = await import("html-to-image")
        const fn = format === "png" ? toPng : toJpeg
        const dataUrl = await fn(canvasRef.current, {
          width: CANVAS_W,
          height: CANVAS_H,
          style: { transform: "none" },
          quality: 0.95,
          skipFonts: true,
          filter: (node: HTMLElement) => {
            if (node.tagName === "LINK" && (node as HTMLLinkElement).href?.includes("fonts.googleapis")) return false
            return true
          },
        })
        const a = document.createElement("a")
        a.href = dataUrl
        a.download = `flayer.${format}`
        a.click()
        announce(`Exportado como ${format.toUpperCase()}`)
      } catch {
        announce("Error al exportar")
      }
    },
    [announce],
  )

  // ── Save / Load ────────────────────────────────────────────────────────

  const getSaves = useCallback((): SavedFlayer[] => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") } catch { return [] }
  }, [])

  const [saves, setSaves] = useState<SavedFlayer[]>([])
  useEffect(() => setSaves(getSaves()), [getSaves])

  const saveFlayer = useCallback(() => {
    const name = saveName.trim() || `Flayer ${new Date().toLocaleDateString()}`
    const entry: SavedFlayer = { name, date: new Date().toISOString(), state: structuredClone(flayerState) }
    const list = [entry, ...getSaves()].slice(0, 20)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* quota */ }
    setSaves(list)
    setSaveName("")
    announce(`"${name}" guardado`)
  }, [saveName, flayerState, getSaves, announce])

  const loadFlayer = useCallback(
    (s: SavedFlayer) => {
      setFlayerState({
        ...s.state,
        elements: s.state.elements.map(migrateElement),
      })
      setSelectedId(null)
      setShowSaves(false)
      announce(`"${s.name}" cargado`)
    },
    [setFlayerState, announce],
  )

  const deleteSave = useCallback(
    (index: number) => {
      const list = getSaves().filter((_, i) => i !== index)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* */ }
      setSaves(list)
      announce("Guardado eliminado")
    },
    [getSaves, announce],
  )

  // ── Templates ──────────────────────────────────────────────────────────

  const applyTemplate = useCallback(
    (t: (typeof TEMPLATES)[number]) => {
      setFlayerState({
        elements: structuredClone(t.elements),
        canvasBg: t.bg,
        canvasBgImage: null,
      })
      setSelectedId(null)
      setShowTemplates(false)
      announce(`Plantilla "${t.name}" aplicada`)
    },
    [setFlayerState, announce],
  )

  // ── Zoom ───────────────────────────────────────────────────────────────

  const zoomIn = useCallback(() => setZoom((z) => Math.min(200, z + 10)), [])
  const zoomOut = useCallback(() => setZoom((z) => Math.max(25, z - 10)), [])
  const zoomReset = useCallback(() => setZoom(100), [])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
      if (isInput) return

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "z": e.preventDefault(); undo(); return
          case "y": e.preventDefault(); redo(); return
          case "d": e.preventDefault(); duplicateSelected(); return
          case "s": e.preventDefault(); saveFlayer(); return
          case "c": if (selected) { e.preventDefault(); copyStyle() }; return
          case "v": if (clipboardStyle) { e.preventDefault(); pasteStyle() }; return
          case "=": e.preventDefault(); zoomIn(); return
          case "-": e.preventDefault(); zoomOut(); return
          case "0": e.preventDefault(); zoomReset(); return
          case "l": if (selectedId) { e.preventDefault(); toggleLock(selectedId) }; return
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && editingId !== selectedId) {
          e.preventDefault()
          deleteSelected()
        }
        return
      }

      if (e.key === "Escape") {
        setSelectedId(null)
        setEditingId(null)
        setContextMenu(null)
        return
      }

      if (selectedId && editingId !== selectedId) {
        const el = elements.find((el) => el.id === selectedId)
        if (!el || el.locked) return
        const step = e.shiftKey ? 10 : 1
        switch (e.key) {
          case "ArrowUp": e.preventDefault(); updateElement(selectedId, { y: Math.max(0, el.y - step) }); return
          case "ArrowDown": e.preventDefault(); updateElement(selectedId, { y: Math.min(CANVAS_H - 20, el.y + step) }); return
          case "ArrowLeft": e.preventDefault(); updateElement(selectedId, { x: Math.max(0, el.x - step) }); return
          case "ArrowRight": e.preventDefault(); updateElement(selectedId, { x: Math.min(CANVAS_W - 20, el.x + step) }); return
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo, redo, duplicateSelected, saveFlayer, deleteSelected, selectedId, editingId, elements, updateElement, selected, copyStyle, pasteStyle, clipboardStyle, zoomIn, zoomOut, zoomReset, toggleLock])

  // ─── Render helpers ────────────────────────────────────────────────────

  const elementLabel = (el: FlayerElement): string => {
    switch (el.type) {
      case "text": return el.content.slice(0, 24) || "Texto"
      case "image": return "Imagen"
      case "shape": return el.shapeType || "Forma"
      case "icon": return el.iconName || "Ícono"
      default: return "Elemento"
    }
  }

  const elementIcon = (el: FlayerElement) => {
    switch (el.type) {
      case "text": return <Type size={12} />
      case "image": return <ImageIcon size={12} />
      case "shape": return <Shapes size={12} />
      case "icon": return <SmilePlus size={12} />
    }
  }

  // ─── Color swatch helper ───────────────────────────────────────────────

  const ColorSwatches = ({ value, onChange }: { value: string; onChange: (c: string) => void }) => (
    <div className="flex flex-wrap gap-1 mt-1">
      {COLOR_PRESETS.map((p) => (
        <button
          key={p.value}
          className="w-5 h-5 rounded border border-input hover:scale-110 transition-transform"
          style={{ backgroundColor: p.value }}
          title={p.label}
          onClick={() => { onChange(p.value); trackColor(p.value) }}
          aria-label={p.label}
        />
      ))}
      {colorHistory.length > 0 && (
        <>
          <div className="w-px h-5 bg-border mx-0.5" />
          {colorHistory.slice(0, 6).map((c, i) => (
            <button
              key={`h-${i}`}
              className="w-5 h-5 rounded border border-input hover:scale-110 transition-transform opacity-70"
              style={{ backgroundColor: c }}
              title={`Reciente: ${c}`}
              onClick={() => onChange(c)}
              aria-label={`Color reciente ${c}`}
            />
          ))}
        </>
      )}
    </div>
  )

  // ─── Info panel ────────────────────────────────────────────────────────

  const infoPanel = (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Información del flyer
      </p>
      {([
        ["folio", "Folio", "Ej. CAP-2024-001"],
        ["curso", "Nombre del curso", "Ej. Seguridad Industrial"],
        ["instructor", "Instructor", "Nombre del instructor"],
        ["sala", "Sala / Lugar", "Ej. Sala A"],
      ] as const).map(([key, label, placeholder]) => (
        <div key={key} className="space-y-1">
          <Label htmlFor={`f-${key}`} className="text-xs">{label}</Label>
          <Input
            id={`f-${key}`}
            placeholder={placeholder}
            value={info[key]}
            onChange={(e) => setInfo((p) => ({ ...p, [key]: e.target.value }))}
            className="h-8 text-sm"
          />
        </div>
      ))}
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Horarios por turno
      </p>
      {(["turno1", "turno2", "turno3", "turno4"] as const).map((t, i) => {
        const fechaKey = `fechaTurno${i + 1}` as keyof FlayerInfo
        return (
          <div key={t} className="space-y-1">
            <Label htmlFor={`f-${t}`} className="text-xs">Turno {i + 1}</Label>
            <Input
              id={`f-${t}`}
              placeholder="Ej. 06:00 - 14:00"
              value={info[t]}
              onChange={(e) => setInfo((p) => ({ ...p, [t]: e.target.value }))}
              className="h-8 text-sm"
            />
            <Label htmlFor={`f-fecha-${t}`} className="text-xs text-muted-foreground">
              Fecha turno {i + 1}
            </Label>
            <Input
              id={`f-fecha-${t}`}
              type="date"
              value={info[fechaKey]}
              onChange={(e) => setInfo((p) => ({ ...p, [fechaKey]: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
        )
      })}
      <div className="space-y-1">
        <Label htmlFor="f-horario" className="text-xs">Horario especial</Label>
        <Input
          id="f-horario"
          placeholder="Ej. Sábado 08:00 - 12:00"
          value={info.horarioEspecial}
          onChange={(e) => setInfo((p) => ({ ...p, horarioEspecial: e.target.value }))}
          className="h-8 text-sm"
        />
      </div>
      <Button className="w-full" size="sm" onClick={insertInfo}>
        <Plus size={14} className="mr-1" /> Insertar info al flyer
      </Button>
    </div>
  )

  // ─── Properties panel ──────────────────────────────────────────────────

  const propertiesPanel = (
    <>
      {!selected ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm gap-2 py-12">
          <Palette size={28} className="opacity-30" />
          <p>Selecciona un elemento para editar sus propiedades</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {selected.type === "text" ? "Texto" : selected.type === "image" ? "Imagen" : selected.type === "shape" ? "Forma" : "Ícono"}
            </p>
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={selected.locked ? "default" : "outline"} size="icon" className="h-6 w-6"
                    onClick={() => toggleLock(selected.id)} aria-label={selected.locked ? "Desbloquear" : "Bloquear"}>
                    {selected.locked ? <Lock size={11} /> : <Unlock size={11} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{selected.locked ? "Desbloquear" : "Bloquear"}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* ── Text properties ── */}
          {(selected.type === "text" || selected.type === "icon") && (
            <>
              {/* Font family */}
              <div className="space-y-1">
                <Label className="text-xs">Tipografía</Label>
                <Select
                  value={selected.style.fontFamily}
                  onValueChange={(v) => updateStyle(selected.id, { fontFamily: v })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONTS.map((f) => (
                      <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font size */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Tamaño</Label>
                  <span className="text-xs text-muted-foreground">{selected.style.fontSize}px</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-6 w-6"
                    onClick={() => updateStyle(selected.id, { fontSize: Math.max(8, selected.style.fontSize - 2) })}>
                    <Minus size={10} />
                  </Button>
                  <Slider min={8} max={120} step={1} value={[selected.style.fontSize]}
                    onValueChange={([v]) => updateStyle(selected.id, { fontSize: v })} className="flex-1" />
                  <Button variant="outline" size="icon" className="h-6 w-6"
                    onClick={() => updateStyle(selected.id, { fontSize: Math.min(120, selected.style.fontSize + 2) })}>
                    <Plus size={10} />
                  </Button>
                </div>
              </div>

              {/* Bold / Italic / Underline / Strikethrough / Align */}
              <div className="space-y-1">
                <Label className="text-xs">Estilo y alineación</Label>
                <div className="flex gap-1 flex-wrap">
                  {([
                    ["fontWeight", "bold", Bold, "Negrita"],
                    ["fontStyle", "italic", Italic, "Cursiva"],
                  ] as const).map(([prop, val, Icon, label]) => (
                    <Tooltip key={prop}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={selected.style[prop] === val ? "default" : "outline"}
                          size="icon" className="h-7 w-7"
                          onClick={() => updateStyle(selected.id, { [prop]: selected.style[prop] === val ? "normal" : val })}
                        >
                          <Icon size={12} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  ))}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selected.style.textDecoration === "underline" ? "default" : "outline"}
                        size="icon" className="h-7 w-7"
                        onClick={() => updateStyle(selected.id, { textDecoration: selected.style.textDecoration === "underline" ? "none" : "underline" })}
                      >
                        <UnderlineIcon size={12} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Subrayado</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={selected.style.textDecoration === "line-through" ? "default" : "outline"}
                        size="icon" className="h-7 w-7"
                        onClick={() => updateStyle(selected.id, { textDecoration: selected.style.textDecoration === "line-through" ? "none" : "line-through" })}
                      >
                        <Strikethrough size={12} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Tachado</TooltipContent>
                  </Tooltip>
                  <div className="w-px h-7 bg-border" />
                  {([
                    ["left", AlignLeft, "Izquierda"],
                    ["center", AlignCenter, "Centrar"],
                    ["right", AlignRight, "Derecha"],
                  ] as const).map(([align, Icon, label]) => (
                    <Tooltip key={align}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={selected.style.textAlign === align ? "default" : "outline"}
                          size="icon" className="h-7 w-7"
                          onClick={() => updateStyle(selected.id, { textAlign: align as "left" | "center" | "right" })}
                        >
                          <Icon size={12} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Text transform */}
              <div className="space-y-1">
                <Label className="text-xs">Transformación</Label>
                <Select
                  value={selected.style.textTransform}
                  onValueChange={(v) => updateStyle(selected.id, { textTransform: v as ElementStyle["textTransform"] })}
                >
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Normal</SelectItem>
                    <SelectItem value="uppercase">MAYÚSCULAS</SelectItem>
                    <SelectItem value="lowercase">minúsculas</SelectItem>
                    <SelectItem value="capitalize">Capitalizar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Text colour */}
              <div className="space-y-1">
                <Label className="text-xs">Color de texto</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={selected.style.color}
                    onChange={(e) => { updateStyle(selected.id, { color: e.target.value }); trackColor(e.target.value) }}
                    className="w-7 h-7 cursor-pointer rounded border border-input" />
                  <span className="text-xs text-muted-foreground font-mono">{selected.style.color}</span>
                </div>
                <ColorSwatches value={selected.style.color} onChange={(c) => updateStyle(selected.id, { color: c })} />
              </div>

              {/* Line height */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Interlineado</Label>
                  <span className="text-xs text-muted-foreground">{selected.style.lineHeight.toFixed(1)}</span>
                </div>
                <Slider min={0.8} max={3} step={0.1} value={[selected.style.lineHeight]}
                  onValueChange={([v]) => updateStyle(selected.id, { lineHeight: v })} />
              </div>

              {/* Letter spacing */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Espaciado letras</Label>
                  <span className="text-xs text-muted-foreground">{selected.style.letterSpacing}px</span>
                </div>
                <Slider min={-2} max={20} step={0.5} value={[selected.style.letterSpacing]}
                  onValueChange={([v]) => updateStyle(selected.id, { letterSpacing: v })} />
              </div>

              {/* Text shadow */}
              <div className="space-y-1">
                <Label className="text-xs">Sombra de texto</Label>
                <Select value={selected.style.textShadow}
                  onValueChange={(v) => updateStyle(selected.id, { textShadow: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEXT_SHADOWS.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* ── Icon picker (for icon elements) ── */}
          {selected.type === "icon" && (
            <div className="space-y-1">
              <Label className="text-xs">Ícono</Label>
              <div className="grid grid-cols-6 gap-1 max-h-28 overflow-y-auto">
                {ICON_CATALOG.map((ic) => {
                  const Ic = ICON_COMPONENTS[ic.key]
                  return Ic ? (
                    <button key={ic.key} title={ic.label}
                      className={`p-1.5 rounded border transition-colors ${selected.iconName === ic.key ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                      onClick={() => updateElement(selected.id, { iconName: ic.key })}>
                      <Ic size={16} />
                    </button>
                  ) : null
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* ── Common properties (all types) ── */}

          {/* Background / Gradient */}
          <div className="space-y-1">
            <Label className="text-xs">Fondo del elemento</Label>
            <div className="flex items-center gap-2">
              <input type="color"
                value={selected.style.backgroundColor === "transparent" ? "#ffffff" : selected.style.backgroundColor}
                onChange={(e) => { updateStyle(selected.id, { backgroundColor: e.target.value, gradient: "none" }); trackColor(e.target.value) }}
                className="w-7 h-7 cursor-pointer rounded border border-input" />
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2"
                onClick={() => updateStyle(selected.id, { backgroundColor: "transparent", gradient: "none" })}>
                Transparente
              </Button>
            </div>
            <ColorSwatches value={selected.style.backgroundColor}
              onChange={(c) => updateStyle(selected.id, { backgroundColor: c, gradient: "none" })} />
          </div>

          {/* Gradient */}
          <div className="space-y-1">
            <Label className="text-xs">Gradiente</Label>
            <Select value={selected.style.gradient}
              onValueChange={(v) => updateStyle(selected.id, { gradient: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GRADIENT_PRESETS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    <div className="flex items-center gap-2">
                      {g.value !== "none" && <div className="w-4 h-4 rounded" style={{ background: g.value }} />}
                      {g.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Opacity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Opacidad</Label>
              <span className="text-xs text-muted-foreground">{Math.round(selected.style.opacity * 100)}%</span>
            </div>
            <Slider min={0} max={1} step={0.05} value={[selected.style.opacity]}
              onValueChange={([v]) => updateStyle(selected.id, { opacity: v })} />
          </div>

          {/* Border radius */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Redondez</Label>
              <span className="text-xs text-muted-foreground">{selected.style.borderRadius}px</span>
            </div>
            <Slider min={0} max={100} step={1} value={[selected.style.borderRadius]}
              onValueChange={([v]) => updateStyle(selected.id, { borderRadius: v })} />
          </div>

          {/* Rotation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Rotación</Label>
              <span className="text-xs text-muted-foreground">{selected.style.rotation}°</span>
            </div>
            <div className="flex items-center gap-1">
              <Slider min={0} max={360} step={1} value={[selected.style.rotation]}
                onValueChange={([v]) => updateStyle(selected.id, { rotation: v })} className="flex-1" />
              <Button variant="outline" size="icon" className="h-6 w-6 shrink-0"
                onClick={() => updateStyle(selected.id, { rotation: (selected.style.rotation + 90) % 360 })}>
                <RotateCw size={10} />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Border */}
          <div className="space-y-1">
            <Label className="text-xs">Borde</Label>
            <div className="grid grid-cols-3 gap-1">
              <div>
                <span className="text-[10px] text-muted-foreground">Ancho</span>
                <Input type="number" min={0} max={20} value={selected.style.borderWidth}
                  onChange={(e) => updateStyle(selected.id, { borderWidth: Number(e.target.value) || 0, borderStyle: Number(e.target.value) > 0 ? (selected.style.borderStyle === "none" ? "solid" : selected.style.borderStyle) : "none" })}
                  className="h-7 text-xs" />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">Estilo</span>
                <Select value={selected.style.borderStyle}
                  onValueChange={(v) => updateStyle(selected.id, { borderStyle: v as ElementStyle["borderStyle"] })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    <SelectItem value="solid">Sólido</SelectItem>
                    <SelectItem value="dashed">Punteado</SelectItem>
                    <SelectItem value="dotted">Puntos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">Color</span>
                <input type="color" value={selected.style.borderColor}
                  onChange={(e) => updateStyle(selected.id, { borderColor: e.target.value })}
                  className="w-full h-7 cursor-pointer rounded border border-input" />
              </div>
            </div>
          </div>

          {/* Box shadow */}
          <div className="space-y-1">
            <Label className="text-xs">Sombra</Label>
            <Select value={selected.style.boxShadow}
              onValueChange={(v) => updateStyle(selected.id, { boxShadow: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BOX_SHADOWS.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {/* Padding */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Padding</Label>
              <span className="text-xs text-muted-foreground">{selected.style.padding}px</span>
            </div>
            <Slider min={0} max={40} step={1} value={[selected.style.padding]}
              onValueChange={([v]) => updateStyle(selected.id, { padding: v })} />
          </div>

          <Separator />

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Ancho</Label>
              <Input type="number" value={Math.round(selected.width)}
                onChange={(e) => updateElement(selected.id, { width: Number(e.target.value) || selected.width })}
                className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Alto</Label>
              <Input type="number" value={Math.round(selected.height)}
                onChange={(e) => updateElement(selected.id, { height: Number(e.target.value) || selected.height })}
                className="h-7 text-xs" />
            </div>
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">X</Label>
              <Input type="number" value={Math.round(selected.x)}
                onChange={(e) => updateElement(selected.id, { x: Number(e.target.value) || 0 })}
                className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Y</Label>
              <Input type="number" value={Math.round(selected.y)}
                onChange={(e) => updateElement(selected.id, { y: Number(e.target.value) || 0 })}
                className="h-7 text-xs" />
            </div>
          </div>

          <Separator />

          {/* Alignment */}
          <div className="space-y-1">
            <Label className="text-xs">Alinear en canvas</Label>
            <div className="flex gap-1 flex-wrap">
              {([
                ["left", AlignStartHorizontal, "Izquierda"],
                ["center-h", AlignHorizontalJustifyCenter, "Centro H"],
                ["right", AlignEndHorizontal, "Derecha"],
                ["top", AlignStartVertical, "Arriba"],
                ["center-v", AlignVerticalJustifyCenter, "Centro V"],
                ["bottom", AlignEndVertical, "Abajo"],
              ] as const).map(([dir, Icon, label]) => (
                <Tooltip key={dir}>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => alignTo(dir)}>
                      <Icon size={12} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Flip */}
          <div className="space-y-1">
            <Label className="text-xs">Voltear</Label>
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={selected.flipH ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={toggleFlipH}>
                    <FlipHorizontal size={12} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voltear horizontal</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={selected.flipV ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={toggleFlipV}>
                    <FlipVertical size={12} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voltear vertical</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <Separator />

          {/* Z-order */}
          <div className="space-y-1">
            <Label className="text-xs">Orden (capas)</Label>
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={bringToFront}>
                    <ChevronsUp size={12} className="mr-0.5" /> Frente
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Al frente de todo</TooltipContent>
              </Tooltip>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={bringForward}>
                <ChevronUp size={12} />
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={sendBackward}>
                <ChevronDown size={12} />
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={sendToBack}>
                    <ChevronsDown size={12} className="mr-0.5" /> Atrás
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Al fondo de todo</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <Separator />

          {/* Copy/Paste style */}
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={copyStyle}>
                  <ClipboardCopy size={12} className="mr-1" /> Copiar estilo
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ctrl+C</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={pasteStyle} disabled={!clipboardStyle}>
                  <ClipboardPaste size={12} className="mr-1" /> Pegar estilo
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ctrl+V</TooltipContent>
            </Tooltip>
          </div>

          {/* Duplicate & Delete */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={duplicateSelected}>
              <Copy size={12} className="mr-1" /> Duplicar
            </Button>
            <Button variant="destructive" size="sm" className="flex-1 h-7 text-xs" onClick={deleteSelected} disabled={selected.locked}>
              <Trash2 size={12} className="mr-1" /> Eliminar
            </Button>
          </div>
        </div>
      )}
    </>
  )

  // ─── Layers panel ──────────────────────────────────────────────────────

  const layersPanel = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Capas ({elements.length})
        </p>
      </div>
      {elements.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Sin elementos</p>
      ) : (
        <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
          {[...elements].sort((a, b) => b.zIndex - a.zIndex).map((el) => (
            <div
              key={el.id}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                el.id === selectedId ? "bg-primary/10 border border-primary/30" : "hover:bg-accent"
              }`}
              onClick={() => setSelectedId(el.id)}
            >
              <span className="shrink-0 opacity-60">{elementIcon(el)}</span>
              <span className="flex-1 truncate min-w-0">{elementLabel(el)}</span>
              {el.locked && <Lock size={10} className="text-muted-foreground shrink-0" />}
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0"
                onClick={(e) => { e.stopPropagation(); toggleLock(el.id) }}>
                {el.locked ? <Lock size={10} /> : <Unlock size={10} className="opacity-30" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-destructive/60 hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); deleteElement(el.id) }}>
                <X size={10} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ─── Canvas view ───────────────────────────────────────────────────────

  const canvasView = (
    <div
      ref={wrapperRef}
      className="flex-1 min-w-0 overflow-auto bg-muted/40 flex items-start justify-center p-4"
      onClick={() => { setSelectedId(null); setContextMenu(null) }}
    >
      <div id="flayer-print-root">
        <div
          id="flayer-canvas-print"
          ref={canvasRef}
          role="application"
          aria-label="Editor de flyer — Canvas de diseño"
          className="relative shadow-xl overflow-hidden select-none"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            backgroundColor: canvasBg,
            backgroundImage: canvasBgImage ? `url(${canvasBgImage})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            marginBottom: `${CANVAS_H * (scale - 1)}px`,
            cursor: dragging.current ? "grabbing" : "default",
          }}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Grid overlay */}
          {showGrid && (
            <>
              <svg className="absolute inset-0 pointer-events-none" width={CANVAS_W} height={CANVAS_H} aria-hidden="true">
                <defs>
                  <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                    <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-400/30 pointer-events-none" aria-hidden="true" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-400/30 pointer-events-none" aria-hidden="true" />
            </>
          )}

          {/* Empty state */}
          {sortedElements.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center gap-3" aria-hidden="true">
              <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center">
                <Layers size={32} className="text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground/60 text-lg font-medium">Canvas vacío</p>
              <p className="text-muted-foreground/40 text-sm max-w-[300px]">
                Añade texto, formas, íconos o usa una plantilla
              </p>
            </div>
          )}

          {/* Elements */}
          {sortedElements.map((el) => (
            <CanvasElement
              key={el.id}
              el={el}
              isSelected={el.id === selectedId}
              isEditing={el.id === editingId}
              onPointerDown={(e) => onElementPointerDown(e, el.id)}
              onResizePointerDown={(e) => onResizePointerDown(e, el.id)}
              onDoubleClick={() => el.type === "text" && !el.locked && setEditingId(el.id)}
              onBlur={() => setEditingId(null)}
              onChange={(content) => updateElement(el.id, { content })}
              onContextMenu={(e) => onElementContextMenu(e, el.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )

  // ─── Return ────────────────────────────────────────────────────────────

  return (
    <>
      {/* Google Fonts */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Roboto:wght@400;700&family=Playfair+Display:wght@400;700&family=Montserrat:wght@400;700&family=Oswald:wght@400;700&family=Poppins:wght@400;700&family=Raleway:wght@400;700&display=swap"
      />

      <style>{`
        @media print {
          #flayer-print-root,
          #flayer-print-root *,
          #flayer-canvas-print,
          #flayer-canvas-print * {
            visibility: visible !important;
          }
          .no-print { display: none !important; }
          #flayer-print-root {
            display: block !important;
            position: fixed !important;
            inset: 0 !important;
            z-index: 99999 !important;
            background: white !important;
          }
          #flayer-canvas-print {
            transform: none !important;
            width: 816px !important;
            height: 1056px !important;
            box-shadow: none !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        @media screen {
          #flayer-print-root { display: contents; }
        }
      `}</style>

      {/* a11y */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{a11yMsg}</div>

      <TooltipProvider>
        <div className="flex flex-col h-full min-h-0 overflow-hidden">

          {/* ── Toolbar ── */}
          <div className="no-print flex items-center gap-1 px-2 sm:px-3 py-1.5 border-b bg-background flex-shrink-0 overflow-x-auto">
            {/* Sidebar toggle */}
            <div className="hidden md:flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLeftOpen((v) => !v)}>
                    {leftOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{leftOpen ? "Cerrar info" : "Abrir info"}</TooltipContent>
              </Tooltip>
            </div>

            {/* Add text */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addText}>
                  <Type size={14} className="mr-1" /> <span className="hidden sm:inline">Texto</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Añadir texto</TooltipContent>
            </Tooltip>

            {/* Add image */}
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <span><ImageIcon size={14} className="mr-1" /> <span className="hidden sm:inline">Imagen</span></span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && addImage(e.target.files[0])} />
                </label>
              </TooltipTrigger>
              <TooltipContent>Añadir imagen</TooltipContent>
            </Tooltip>

            {/* Add shape */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button ref={shapeBtnRef} variant="outline" size="sm" className="h-7 text-xs"
                  onClick={() => { setShowShapePicker((v) => !v); setShowIconPicker(false) }}>
                  <Shapes size={14} className="mr-1" /> <span className="hidden sm:inline">Forma</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Añadir forma</TooltipContent>
            </Tooltip>

            {/* Add icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button ref={iconBtnRef} variant="outline" size="sm" className="h-7 text-xs"
                  onClick={() => { setShowIconPicker((v) => !v); setShowShapePicker(false) }}>
                  <SmilePlus size={14} className="mr-1" /> <span className="hidden sm:inline">Ícono</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Añadir ícono</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 hidden sm:block" />

            {/* Background */}
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="flex items-center gap-1 cursor-pointer border rounded-md px-2 py-1 text-xs hover:bg-accent transition-colors h-7">
                  <Palette size={13} />
                  <input type="color" value={canvasBg} onChange={(e) => setCanvasBg(e.target.value)}
                    className="w-5 h-4 cursor-pointer rounded border-0 p-0" />
                </label>
              </TooltipTrigger>
              <TooltipContent>Color de fondo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <span><Upload size={13} className="mr-1" /> <span className="hidden lg:inline">Fondo</span></span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && onBgImageChange(e.target.files[0])} />
                </label>
              </TooltipTrigger>
              <TooltipContent>Imagen de fondo</TooltipContent>
            </Tooltip>

            {canvasBgImage && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCanvasBgImage(null)}>
                <RefreshCw size={12} className="mr-1" /> <span className="hidden sm:inline">Quitar</span>
              </Button>
            )}

            <Separator orientation="vertical" className="h-5 hidden sm:block" />

            {/* Grid / Snap */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={showGrid ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => setShowGrid((v) => !v)}>
                  <Grid3X3 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cuadrícula</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={snapEnabled ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => setSnapEnabled((v) => !v)}>
                  <Magnet size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Snap</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 hidden sm:block" />

            {/* Undo / Redo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={!canUndo} onClick={() => undo()}>
                  <Undo2 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deshacer (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={!canRedo} onClick={() => redo()}>
                  <Redo2 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rehacer (Ctrl+Y)</TooltipContent>
            </Tooltip>

            {/* Delete / Duplicate */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={!selectedId} onClick={deleteSelected}>
                  <Trash2 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar (Del)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={!selectedId} onClick={duplicateSelected}>
                  <Copy size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicar (Ctrl+D)</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5 hidden sm:block" />

            {/* Zoom */}
            <div className="hidden sm:flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={zoomOut}>
                <ZoomOut size={13} />
              </Button>
              <button className="text-xs text-muted-foreground w-10 text-center hover:text-foreground" onClick={zoomReset}>
                {zoom}%
              </button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={zoomIn}>
                <ZoomIn size={13} />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-5 hidden sm:block" />

            {/* Templates / Gallery / Layers / Shortcuts */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowTemplates((v) => !v)}>
                  <LayoutTemplate size={14} className="mr-1" /> <span className="hidden lg:inline">Plantillas</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Plantillas</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowGallery((v) => !v)}>
                  <FileImage size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Galería</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={showLayers ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => setShowLayers((v) => !v)}>
                  <Layers size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Capas</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowShortcuts((v) => !v)}>
                  <Keyboard size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atajos</TooltipContent>
            </Tooltip>

            {/* ── Right actions ── */}
            <div className="ml-auto flex items-center gap-1">
              {lastAutoSave && (
                <span className="text-[10px] text-muted-foreground hidden xl:inline mr-1">
                  Auto: {lastAutoSave}
                </span>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowSaves((v) => !v)}>
                    <FolderOpen size={14} className="mr-1" /> <span className="hidden sm:inline">Archivos</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Guardar / Cargar</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleExport("png")}>
                    <Download size={14} className="mr-1" /> <span className="hidden sm:inline">PNG</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar PNG</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleExport("jpeg")}>
                    <Download size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar JPG</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="sm" className="h-7 text-xs" onClick={handlePrint}>
                    <Printer size={14} className="mr-1" /> <span className="hidden sm:inline">Imprimir</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Imprimir / PDF</TooltipContent>
              </Tooltip>
              <div className="hidden md:block">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRightOpen((v) => !v)}>
                      {rightOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{rightOpen ? "Cerrar propiedades" : "Abrir propiedades"}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* ── Overlay bars ── */}
          {showShortcuts && (
            <div className="no-print border-b bg-background px-4 py-2 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Atajos de teclado</p>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowShortcuts(false)}><X size={12} /></Button>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-muted-foreground">
                {[
                  ["Ctrl+Z", "Deshacer"], ["Ctrl+Y", "Rehacer"], ["Ctrl+D", "Duplicar"],
                  ["Ctrl+S", "Guardar"], ["Ctrl+C", "Copiar estilo"], ["Ctrl+V", "Pegar estilo"],
                  ["Ctrl+L", "Bloquear"], ["Ctrl++/-", "Zoom"], ["Del", "Eliminar"],
                  ["Esc", "Deseleccionar"], ["Flechas", "Mover ±1px"], ["Shift+↑↓", "Mover ±10px"],
                  ["DblClick", "Editar texto"],
                ].map(([key, desc]) => (
                  <span key={key}>
                    <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">{key}</kbd> {desc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {showTemplates && (
            <div className="no-print border-b bg-background px-4 py-2 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plantillas Premium</p>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowTemplates(false)}><X size={12} /></Button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {TEMPLATES.map((t) => (
                  <button key={t.name}
                    className="flex flex-col items-center gap-1 min-w-[90px] p-2 border rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => applyTemplate(t)}>
                    <span className="text-xl">{t.preview}</span>
                    <span className="text-[10px] font-medium leading-tight text-center">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showGallery && (
            <div className="no-print border-b bg-background px-4 py-2 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Galería</p>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowGallery(false)}><X size={12} /></Button>
              </div>
              {gallery.length === 0 ? (
                <p className="text-xs text-muted-foreground">Las imágenes subidas aparecerán aquí.</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {gallery.map((src, i) => (
                    <button key={i} className="flex-shrink-0 w-14 h-14 rounded border overflow-hidden hover:ring-2 ring-primary transition-all"
                      onClick={() => addImageFromData(src)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {showSaves && (
            <div className="no-print border-b bg-background px-4 py-2 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Guardar / Cargar</p>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowSaves(false)}><X size={12} /></Button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Input placeholder="Nombre del flyer..." value={saveName}
                  onChange={(e) => setSaveName(e.target.value)} className="h-7 text-xs flex-1 max-w-xs"
                  onKeyDown={(e) => e.key === "Enter" && saveFlayer()} />
                <Button size="sm" className="h-7 text-xs" onClick={saveFlayer}>
                  <Save size={12} className="mr-1" /> Guardar
                </Button>
              </div>
              {saves.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay flyers guardados.</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {saves.map((s, i) => (
                    <div key={i} className="flex-shrink-0 flex items-center gap-2 border rounded-lg px-3 py-1.5 min-w-[160px]">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(s.date).toLocaleString()}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => loadFlayer(s)}>
                        <FolderOpen size={12} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteSave(i)}>
                        <Trash size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showLayers && (
            <div className="no-print border-b bg-background px-4 py-2 animate-in slide-in-from-top-2 duration-200 max-h-[30vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capas</p>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowLayers(false)}><X size={12} /></Button>
              </div>
              {layersPanel}
            </div>
          )}

          {/* ── Body ── */}
          {isMobile ? (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 min-h-0 overflow-auto">
                {mobileTab === "info" && <div className="p-3">{infoPanel}</div>}
                {mobileTab === "canvas" && canvasView}
                {mobileTab === "properties" && <div className="p-3">{propertiesPanel}</div>}
                {mobileTab === "layers" && <div className="p-3">{layersPanel}</div>}
              </div>
              <nav className="no-print flex border-t bg-background shrink-0" role="tablist">
                {([
                  ["info", "Info", Type],
                  ["canvas", "Canvas", Layers],
                  ["properties", "Props", Palette],
                  ["layers", "Capas", Layers],
                ] as const).map(([tab, label, Icon]) => (
                  <button key={tab} role="tab" aria-selected={mobileTab === tab}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                      mobileTab === tab ? "text-primary border-t-2 border-primary font-medium" : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setMobileTab(tab)}>
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          ) : (
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {leftOpen && (
                <aside className="no-print w-60 shrink-0 border-r overflow-y-auto p-3 bg-background animate-in slide-in-from-left-2 duration-200">
                  {infoPanel}
                </aside>
              )}
              {canvasView}
              {rightOpen && (
                <aside className="no-print w-64 shrink-0 border-l overflow-y-auto p-3 bg-background animate-in slide-in-from-right-2 duration-200">
                  {propertiesPanel}
                </aside>
              )}
            </div>
          )}
        </div>
      </TooltipProvider>

      {/* ── Shape Picker (portal, fixed) ── */}
      {showShapePicker && (() => {
        const rect = shapeBtnRef.current?.getBoundingClientRect()
        return rect ? (
          <div
            className="fixed z-[9999] bg-popover border rounded-lg shadow-lg p-2 min-w-[160px] animate-in fade-in-0 zoom-in-95"
            style={{ left: rect.left, top: rect.bottom + 4 }}
            onClick={(e) => e.stopPropagation()}
          >
            {SHAPE_CATALOG.map((s) => (
              <button key={s.type}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs rounded hover:bg-accent transition-colors"
                onClick={() => addShape(s.type)}>
                <span className="text-base w-5 text-center">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        ) : null
      })()}

      {/* ── Icon Picker (portal, fixed) ── */}
      {showIconPicker && (() => {
        const rect = iconBtnRef.current?.getBoundingClientRect()
        return rect ? (
          <div
            className="fixed z-[9999] bg-popover border rounded-lg shadow-lg p-3 w-[280px] animate-in fade-in-0 zoom-in-95"
            style={{ left: rect.left, top: rect.bottom + 4 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Selecciona un ícono</p>
            <div className="grid grid-cols-6 gap-1 max-h-[200px] overflow-y-auto">
              {ICON_CATALOG.map((ic) => {
                const Ic = ICON_COMPONENTS[ic.key]
                return Ic ? (
                  <button key={ic.key} title={ic.label}
                    className="p-2 rounded hover:bg-accent transition-colors flex items-center justify-center"
                    onClick={() => addIcon(ic.key)}>
                    <Ic size={18} />
                  </button>
                ) : null
              })}
            </div>
          </div>
        ) : null
      })()}

      {/* ── Context Menu ── */}
      {contextMenu && (
        <div
          className="fixed z-[9999] bg-popover border rounded-lg shadow-xl py-1 min-w-[180px] animate-in fade-in-0 zoom-in-95"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const el = elements.find((e) => e.id === contextMenu.elementId)
            if (!el) return null
            return (
              <>
                <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                  onClick={() => { duplicateElement(el.id); setContextMenu(null) }}>
                  <Copy size={12} /> Duplicar
                </button>
                <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                  onClick={() => { toggleLock(el.id); setContextMenu(null) }}>
                  {el.locked ? <Unlock size={12} /> : <Lock size={12} />}
                  {el.locked ? "Desbloquear" : "Bloquear"}
                </button>
                <div className="h-px bg-border my-1" />
                <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                  onClick={() => { setSelectedId(el.id); bringToFront(); setContextMenu(null) }}>
                  <ChevronsUp size={12} /> Traer al frente
                </button>
                <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                  onClick={() => { setSelectedId(el.id); sendToBack(); setContextMenu(null) }}>
                  <ChevronsDown size={12} /> Enviar al fondo
                </button>
                <div className="h-px bg-border my-1" />
                <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                  onClick={() => { setSelectedId(el.id); copyStyle(); setContextMenu(null) }}>
                  <ClipboardCopy size={12} /> Copiar estilo
                </button>
                {clipboardStyle && (
                  <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                    onClick={() => { updateStyle(el.id, clipboardStyle); setContextMenu(null) }}>
                    <ClipboardPaste size={12} /> Pegar estilo
                  </button>
                )}
                <div className="h-px bg-border my-1" />
                <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => { deleteElement(el.id); setContextMenu(null) }}>
                  <Trash2 size={12} /> Eliminar
                </button>
              </>
            )
          })()}
        </div>
      )}
    </>
  )
}

// ─── Canvas element sub-component ─────────────────────────────────────────────

interface CanvasElementProps {
  el: FlayerElement
  isSelected: boolean
  isEditing: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onResizePointerDown: (e: React.PointerEvent) => void
  onDoubleClick: () => void
  onBlur: () => void
  onChange: (content: string) => void
  onContextMenu: (e: React.MouseEvent) => void
}

const CanvasElement = React.memo(function CanvasElement({
  el,
  isSelected,
  isEditing,
  onPointerDown,
  onResizePointerDown,
  onDoubleClick,
  onBlur,
  onChange,
  onContextMenu,
}: CanvasElementProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  // Compute shared transform
  const transforms: string[] = []
  if (el.style.rotation) transforms.push(`rotate(${el.style.rotation}deg)`)
  if (el.flipH) transforms.push("scaleX(-1)")
  if (el.flipV) transforms.push("scaleY(-1)")
  const transformStr = transforms.length > 0 ? transforms.join(" ") : undefined

  // Compute background (gradient takes precedence)
  const bgStyle: React.CSSProperties =
    el.style.gradient !== "none"
      ? { background: el.style.gradient }
      : { backgroundColor: el.style.backgroundColor }

  const boxStyle: React.CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    zIndex: el.zIndex,
    opacity: el.style.opacity,
    borderRadius: el.style.borderRadius,
    ...bgStyle,
    borderWidth: el.style.borderWidth > 0 ? el.style.borderWidth : undefined,
    borderColor: el.style.borderWidth > 0 ? el.style.borderColor : undefined,
    borderStyle: el.style.borderWidth > 0 ? el.style.borderStyle : undefined,
    boxShadow: el.style.boxShadow !== "none" ? el.style.boxShadow : undefined,
    transform: transformStr,
    outline: isSelected ? "2px solid hsl(var(--primary))" : "2px solid transparent",
    outlineOffset: 2,
    cursor: el.locked ? "not-allowed" : "grab",
    overflow: "hidden",
    userSelect: "none",
  }

  // ── Shape rendering ─────────────────────────────────────────────────────
  if (el.type === "shape") {
    let shapeStyle = { ...boxStyle }

    if (el.shapeType === "circle") {
      shapeStyle.borderRadius = "50%"
    } else if (el.shapeType === "triangle") {
      shapeStyle.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)"
      shapeStyle.borderRadius = 0
    } else if (el.shapeType === "star") {
      shapeStyle.clipPath = "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
      shapeStyle.borderRadius = 0
    } else if (el.shapeType === "line" || el.shapeType === "divider") {
      // Thin horizontal element
      shapeStyle.borderRadius = el.style.borderRadius || 2
    }

    return (
      <div
        style={shapeStyle}
        onPointerDown={onPointerDown}
        onContextMenu={onContextMenu}
        tabIndex={0}
        aria-label={`Forma: ${el.shapeType}`}
      >
        {isSelected && !el.locked && <ResizeHandle onPointerDown={onResizePointerDown} />}
        {el.locked && isSelected && (
          <div className="absolute top-1 left-1"><Lock size={10} className="text-muted-foreground" /></div>
        )}
      </div>
    )
  }

  // ── Icon rendering ──────────────────────────────────────────────────────
  if (el.type === "icon") {
    const IconComp = ICON_COMPONENTS[el.iconName || "star"]
    const iconSize = Math.min(el.width, el.height) * 0.75

    return (
      <div
        style={{ ...boxStyle, display: "flex", alignItems: "center", justifyContent: "center" }}
        onPointerDown={onPointerDown}
        onContextMenu={onContextMenu}
        onDoubleClick={onDoubleClick}
        tabIndex={0}
        aria-label={`Ícono: ${el.iconName}`}
      >
        {IconComp && <IconComp size={iconSize} color={el.style.color} strokeWidth={2} />}
        {isSelected && !el.locked && <ResizeHandle onPointerDown={onResizePointerDown} />}
      </div>
    )
  }

  // ── Image rendering ─────────────────────────────────────────────────────
  if (el.type === "image") {
    return (
      <div
        style={boxStyle}
        onPointerDown={onPointerDown}
        onContextMenu={onContextMenu}
        onDoubleClick={onDoubleClick}
        role="img"
        aria-label="Imagen"
        tabIndex={0}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={el.content}
          alt="Imagen del flyer"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            borderRadius: el.style.borderRadius,
          }}
        />
        {isSelected && !el.locked && <ResizeHandle onPointerDown={onResizePointerDown} />}
      </div>
    )
  }

  // ── Text rendering ──────────────────────────────────────────────────────
  const textStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    fontSize: el.style.fontSize,
    fontFamily: el.style.fontFamily,
    fontWeight: el.style.fontWeight,
    fontStyle: el.style.fontStyle,
    textAlign: el.style.textAlign,
    color: el.style.color,
    textDecoration: el.style.textDecoration !== "none" ? el.style.textDecoration : undefined,
    textTransform: el.style.textTransform !== "none" ? el.style.textTransform as React.CSSProperties["textTransform"] : undefined,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: el.style.lineHeight,
    letterSpacing: el.style.letterSpacing,
    textShadow: el.style.textShadow !== "none" ? el.style.textShadow : undefined,
    padding: `${el.style.padding}px`,
    boxSizing: "border-box",
  }

  return (
    <div
      style={boxStyle}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      role="textbox"
      aria-label={`Texto: ${el.content.slice(0, 40)}`}
      tabIndex={0}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={el.content}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ ...textStyle, resize: "none", border: "none", outline: "none", background: "transparent", cursor: "text" }}
        />
      ) : (
        <div style={textStyle}>{el.content}</div>
      )}
      {isSelected && !el.locked && <ResizeHandle onPointerDown={onResizePointerDown} />}
      {el.locked && isSelected && (
        <div className="absolute top-1 left-1"><Lock size={10} className="text-muted-foreground" /></div>
      )}
    </div>
  )
})

// ─── Resize handle ────────────────────────────────────────────────────────────

function ResizeHandle({ onPointerDown }: { onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <div
      onPointerDown={onPointerDown}
      role="separator"
      aria-label="Redimensionar"
      style={{
        position: "absolute", right: 0, bottom: 0, width: 12, height: 12,
        background: "hsl(var(--primary))", borderRadius: "2px 0 4px 0",
        cursor: "nwse-resize", zIndex: 9999,
      }}
    />
  )
}
