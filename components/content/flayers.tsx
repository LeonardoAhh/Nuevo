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
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronUp,
  ChevronDown,
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
import { Badge } from "@/components/ui/badge"
import { useFlayerHistory } from "@/lib/hooks/useFlayerHistory"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ElementStyle {
  fontSize: number
  fontFamily: string
  fontWeight: string
  fontStyle: string
  textAlign: "left" | "center" | "right"
  color: string
  backgroundColor: string
  opacity: number
  borderRadius: number
  lineHeight: number
  letterSpacing: number
  textShadow: string
}

interface FlayerElement {
  id: string
  type: "text" | "image"
  x: number
  y: number
  width: number
  height: number
  content: string
  zIndex: number
  style: ElementStyle
  locked?: boolean
}

interface FlayerInfo {
  folio: string
  curso: string
  instructor: string
  sala: string
  turno1: string
  fechaTurno1: string
  turno2: string
  fechaTurno2: string
  turno3: string
  fechaTurno3: string
  turno4: string
  fechaTurno4: string
  horarioEspecial: string
}

interface FlayerState {
  elements: FlayerElement[]
  canvasBg: string
  canvasBgImage: string | null
}

interface SavedFlayer {
  name: string
  date: string
  state: FlayerState
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 816   // US Letter 8.5" @ 96dpi
const CANVAS_H = 1056  // US Letter 11"  @ 96dpi
const GRID_SIZE = 20
const SNAP_THRESHOLD = 8
const STORAGE_KEY = "flayer-saves"
const GALLERY_KEY = "flayer-gallery"

const FONTS = [
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Roboto", value: "Roboto, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
  { label: "Oswald", value: "Oswald, sans-serif" },
]

const DEFAULT_STYLE: ElementStyle = {
  fontSize: 18,
  fontFamily: "Inter, sans-serif",
  fontWeight: "normal",
  fontStyle: "normal",
  textAlign: "left",
  color: "#1a1a1a",
  backgroundColor: "transparent",
  opacity: 1,
  borderRadius: 0,
  lineHeight: 1.4,
  letterSpacing: 0,
  textShadow: "none",
}

const TEXT_SHADOWS = [
  { label: "Ninguna", value: "none" },
  { label: "Sutil", value: "1px 1px 2px rgba(0,0,0,0.3)" },
  { label: "Media", value: "2px 2px 4px rgba(0,0,0,0.5)" },
  { label: "Fuerte", value: "3px 3px 6px rgba(0,0,0,0.7)" },
  { label: "Glow", value: "0 0 8px rgba(59,130,246,0.8)" },
  { label: "Contorno", value: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" },
]

// ─── Templates ────────────────────────────────────────────────────────────────

interface FlayerTemplate {
  name: string
  preview: string
  bg: string
  elements: FlayerElement[]
}

const TEMPLATES: FlayerTemplate[] = [
  // ── 1. Convocatoria Oficial ─────────────────────────────────────────────
  {
    name: "Convocatoria Oficial",
    preview: "📜",
    bg: "#faf7f2",
    elements: [
      // Badge top
      {
        id: "co-badge",
        type: "text",
        x: 40,
        y: 30,
        width: 250,
        height: 32,
        content: "  CONVOCATORIA OFICIAL",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 11, fontWeight: "bold", color: "#c9a96e", letterSpacing: 3, backgroundColor: "#1b2a4a", borderRadius: 4, lineHeight: 2.4, textAlign: "center" },
      },
      // Decorative circle top-right
      {
        id: "co-circle",
        type: "text",
        x: 660,
        y: -40,
        width: 180,
        height: 180,
        content: "",
        zIndex: 1,
        style: { ...DEFAULT_STYLE, backgroundColor: "#1b2a4a", borderRadius: 60, opacity: 0.85 },
      },
      // Title line 1
      {
        id: "co-title1",
        type: "text",
        x: 40,
        y: 80,
        width: 560,
        height: 55,
        content: "Curso",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 42, fontWeight: "bold", color: "#1b2a4a", fontFamily: "'Playfair Display', serif" },
      },
      // Title line 2 (course name - italic/gold)
      {
        id: "co-title2",
        type: "text",
        x: 40,
        y: 130,
        width: 560,
        height: 70,
        content: "Sistema de Gestión\nIntegral",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 38, fontWeight: "bold", fontStyle: "italic", color: "#c9a96e", fontFamily: "'Playfair Display', serif", lineHeight: 1.2 },
      },
      // Subtitle program line
      {
        id: "co-program",
        type: "text",
        x: 40,
        y: 210,
        width: 500,
        height: 24,
        content: "PROGRAMA DE CAPACITACIÓN INTERNA  ·  2026",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 11, color: "#6b7280", letterSpacing: 2 },
      },
      // Gold separator bar
      {
        id: "co-bar",
        type: "text",
        x: 40,
        y: 240,
        width: 100,
        height: 5,
        content: "",
        zIndex: 2,
        style: { ...DEFAULT_STYLE, backgroundColor: "#c9a96e", borderRadius: 3 },
      },
      // Description box
      {
        id: "co-desc",
        type: "text",
        x: 60,
        y: 270,
        width: 690,
        height: 70,
        content: "Se convoca a todo el personal a participar en el Curso de Sistema de Gestión Integral. Favor de identificar el turno y fecha correspondiente a su jornada de trabajo.",
        zIndex: 2,
        style: { ...DEFAULT_STYLE, fontSize: 14, color: "#4b5563", lineHeight: 1.6, fontStyle: "italic" },
      },
      // "FECHAS Y HORARIOS" section header
      {
        id: "co-section",
        type: "text",
        x: 40,
        y: 355,
        width: 250,
        height: 20,
        content: "FECHAS Y HORARIOS",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 11, fontWeight: "bold", color: "#6b7280", letterSpacing: 3 },
      },
      // Horizontal line under section
      {
        id: "co-hline",
        type: "text",
        x: 40,
        y: 380,
        width: 736,
        height: 1,
        content: "",
        zIndex: 2,
        style: { ...DEFAULT_STYLE, backgroundColor: "#d1d5db" },
      },
      // Turn 1 card
      {
        id: "co-t1-badge",
        type: "text",
        x: 430,
        y: 400,
        width: 130,
        height: 28,
        content: "  1ER TURNO",
        zIndex: 4,
        style: { ...DEFAULT_STYLE, fontSize: 11, fontWeight: "bold", color: "#ffffff", backgroundColor: "#1b2a4a", borderRadius: 4, lineHeight: 2.2, textAlign: "center" },
      },
      {
        id: "co-t1-card",
        type: "text",
        x: 420,
        y: 430,
        width: 340,
        height: 130,
        content: "📅  Lunes 23 de Febrero\n     2026  ·  Sesión vespertina\n\n14:00 P.M  —  15:00 P.M     60 min",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 15, color: "#1b2a4a", backgroundColor: "#ffffff", borderRadius: 12, lineHeight: 1.7 },
      },
      // Turn 3 card
      {
        id: "co-t3-badge",
        type: "text",
        x: 60,
        y: 400,
        width: 130,
        height: 28,
        content: "  3ER TURNO",
        zIndex: 4,
        style: { ...DEFAULT_STYLE, fontSize: 11, fontWeight: "bold", color: "#ffffff", backgroundColor: "#c9a96e", borderRadius: 4, lineHeight: 2.2, textAlign: "center" },
      },
      {
        id: "co-t3-card",
        type: "text",
        x: 50,
        y: 430,
        width: 340,
        height: 130,
        content: "📅  Lunes 23 de Febrero\n     2026  ·  Sesión matutina\n\n6:00 A.M  —  7:00 A.M       60 min",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 15, color: "#1b2a4a", backgroundColor: "#ffffff", borderRadius: 12, lineHeight: 1.7 },
      },
      // Turn 4 card
      {
        id: "co-t4-badge",
        type: "text",
        x: 60,
        y: 590,
        width: 130,
        height: 28,
        content: "  4TO TURNO",
        zIndex: 4,
        style: { ...DEFAULT_STYLE, fontSize: 11, fontWeight: "bold", color: "#ffffff", backgroundColor: "#c9a96e", borderRadius: 4, lineHeight: 2.2, textAlign: "center" },
      },
      {
        id: "co-t4-card",
        type: "text",
        x: 50,
        y: 620,
        width: 340,
        height: 130,
        content: "📅  Lunes 23 de Febrero\n     2026  ·  Sesión vespertina\n\n13:00 P.M  —  14:00 P.M    60 min",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 15, color: "#1b2a4a", backgroundColor: "#ffffff", borderRadius: 12, lineHeight: 1.7 },
      },
      // Turn 2 card
      {
        id: "co-t2-badge",
        type: "text",
        x: 430,
        y: 590,
        width: 130,
        height: 28,
        content: "  2DO TURNO",
        zIndex: 4,
        style: { ...DEFAULT_STYLE, fontSize: 11, fontWeight: "bold", color: "#ffffff", backgroundColor: "#1b2a4a", borderRadius: 4, lineHeight: 2.2, textAlign: "center" },
      },
      {
        id: "co-t2-card",
        type: "text",
        x: 420,
        y: 620,
        width: 340,
        height: 130,
        content: "📅  Miércoles 25 de Febrero\n     2026  ·  Sesión vespertina\n\n13:00 P.M  —  14:00 P.M    60 min",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 15, color: "#1b2a4a", backgroundColor: "#ffffff", borderRadius: 12, lineHeight: 1.7 },
      },
      // Footer warning bar
      {
        id: "co-footer-bg",
        type: "text",
        x: 0,
        y: 790,
        width: 816,
        height: 80,
        content: "",
        zIndex: 2,
        style: { ...DEFAULT_STYLE, backgroundColor: "#1b2a4a" },
      },
      {
        id: "co-footer-text",
        type: "text",
        x: 40,
        y: 800,
        width: 736,
        height: 60,
        content: "⚠  Asistencia obligatoria. Cada colaborador deberá presentarse puntualmente en el turno que le corresponde. En caso de algún impedimento, notificar a su supervisor con anticipación para ser reasignado a otra sesión disponible. Se tomará lista de asistencia.",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 11, color: "#d1d5db", lineHeight: 1.6, textAlign: "center" },
      },
    ],
  },

  // ── 2. Capacitación Programada ──────────────────────────────────────────
  {
    name: "Capacitación Programada",
    preview: "🎓",
    bg: "#ffffff",
    elements: [
      // Dark header background
      {
        id: "cp-header-bg",
        type: "text",
        x: 0,
        y: 0,
        width: 816,
        height: 260,
        content: "",
        zIndex: 1,
        style: { ...DEFAULT_STYLE, backgroundColor: "#1e293b" },
      },
      // Badge
      {
        id: "cp-badge",
        type: "text",
        x: 258,
        y: 20,
        width: 300,
        height: 32,
        content: "📋  CAPACITACIÓN PROGRAMADA",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 12, fontWeight: "bold", color: "#1e293b", backgroundColor: "#fbbf24", borderRadius: 16, textAlign: "center", lineHeight: 2.2 },
      },
      // Course title
      {
        id: "cp-title",
        type: "text",
        x: 40,
        y: 65,
        width: 736,
        height: 55,
        content: "DIAGRAMA DE TORTUGA",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 36, fontWeight: "bold", color: "#ffffff", textAlign: "center", fontFamily: "Montserrat, sans-serif", letterSpacing: 2 },
      },
      // Subtitle
      {
        id: "cp-subtitle",
        type: "text",
        x: 40,
        y: 115,
        width: 736,
        height: 28,
        content: "Análisis de Procesos & Mejora Continua",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 16, color: "#94a3b8", textAlign: "center", fontStyle: "italic" },
      },
      // Instructor section
      {
        id: "cp-instructor-label",
        type: "text",
        x: 290,
        y: 160,
        width: 236,
        height: 18,
        content: "Instructor",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 12, color: "#94a3b8", textAlign: "center" },
      },
      {
        id: "cp-instructor-name",
        type: "text",
        x: 230,
        y: 178,
        width: 356,
        height: 28,
        content: "ING. NOMBRE DEL INSTRUCTOR",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 16, fontWeight: "bold", color: "#ffffff", textAlign: "center" },
      },
      // Info pills row
      {
        id: "cp-date-pill",
        type: "text",
        x: 120,
        y: 218,
        width: 160,
        height: 42,
        content: "      19\n  FEBRERO 2026",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 13, fontWeight: "bold", color: "#ffffff", backgroundColor: "#334155", borderRadius: 8, textAlign: "center", lineHeight: 1.4 },
      },
      {
        id: "cp-time-pill",
        type: "text",
        x: 310,
        y: 218,
        width: 190,
        height: 42,
        content: "  ⏱  9:00 - 10:00\n      HORARIO",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 13, fontWeight: "bold", color: "#ffffff", backgroundColor: "#16a34a", borderRadius: 8, textAlign: "center", lineHeight: 1.4 },
      },
      {
        id: "cp-room-pill",
        type: "text",
        x: 530,
        y: 218,
        width: 190,
        height: 42,
        content: "  📍 Sala de Capacitación 1\n         UBICACIÓN",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 13, fontWeight: "bold", color: "#ffffff", backgroundColor: "#7c3aed", borderRadius: 8, textAlign: "center", lineHeight: 1.4 },
      },
      // Participants section
      {
        id: "cp-participants-title",
        type: "text",
        x: 40,
        y: 290,
        width: 350,
        height: 30,
        content: "👥  Lista de Participantes",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 18, fontWeight: "bold", color: "#1e293b" },
      },
      // Table header
      {
        id: "cp-table-header",
        type: "text",
        x: 40,
        y: 330,
        width: 736,
        height: 30,
        content: "ID         NOMBRE                            PUESTO                              TURNO        FECHA",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 11, fontWeight: "bold", color: "#ffffff", backgroundColor: "#1e293b", borderRadius: 4, lineHeight: 2.4, fontFamily: "'Roboto', sans-serif", letterSpacing: 0.5 },
      },
      // Table rows placeholder
      {
        id: "cp-table-rows",
        type: "text",
        x: 40,
        y: 365,
        width: 736,
        height: 320,
        content: "1428     Corona Arce Liliana                Jefe de Logística                   MIXTO    19/02/2026\n\n2010     García Arce Stephanie              Planeador de Producción          MIXTO    19/02/2026\n\n2476     Vargas Aguilar Karen               Aux. Adm. Taller de Moldes     MIXTO    19/02/2026\n\n3536     Liévano Hernández María         Asistente de Producción A       MIXTO    19/02/2026\n\n3537     Gutiérrez López Adriana           Asistente de Producción A       MIXTO    19/02/2026\n\n3853     León Torres María Vanessa      Analista de Seg. e Higiene       MIXTO    19/02/2026",
        zIndex: 2,
        style: { ...DEFAULT_STYLE, fontSize: 12, color: "#374151", lineHeight: 1.5, fontFamily: "'Roboto', sans-serif" },
      },
      // Footer
      {
        id: "cp-footer-bg",
        type: "text",
        x: 0,
        y: 1010,
        width: 816,
        height: 46,
        content: "",
        zIndex: 1,
        style: { ...DEFAULT_STYLE, backgroundColor: "#1e293b" },
      },
      {
        id: "cp-footer-text",
        type: "text",
        x: 40,
        y: 1016,
        width: 736,
        height: 30,
        content: "⭐ Departamento de Capacitación · Documento generado para control interno",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 11, color: "#94a3b8", textAlign: "center", lineHeight: 2.2 },
      },
    ],
  },

  // ── 3. Auditoría de Proceso en Capas ────────────────────────────────────
  {
    name: "Auditoría de Proceso",
    preview: "📊",
    bg: "#ffffff",
    elements: [
      // Logo placeholder top-left
      {
        id: "ap-logo",
        type: "text",
        x: 40,
        y: 30,
        width: 200,
        height: 30,
        content: "VIÑOPLASTIC",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 18, fontWeight: "bold", color: "#1b2a4a", fontFamily: "Montserrat, sans-serif" },
      },
      // Folio box top-right
      {
        id: "ap-folio-box",
        type: "text",
        x: 690,
        y: 22,
        width: 90,
        height: 50,
        content: "FOLIO\n   4",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 14, fontWeight: "bold", color: "#1b2a4a", textAlign: "center", borderRadius: 8, backgroundColor: "#f0f4ff", lineHeight: 1.6 },
      },
      // Blue header bar with title
      {
        id: "ap-header-bg",
        type: "text",
        x: 40,
        y: 90,
        width: 736,
        height: 44,
        content: "",
        zIndex: 2,
        style: { ...DEFAULT_STYLE, backgroundColor: "#1e3a5f", borderRadius: 6 },
      },
      {
        id: "ap-header-title",
        type: "text",
        x: 50,
        y: 95,
        width: 700,
        height: 36,
        content: "📋 AUDITORÍAS DE PROCESO EN CAPAS",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 18, fontWeight: "bold", color: "#ffffff", lineHeight: 2 },
      },
      // Date sub-bar
      {
        id: "ap-date-bar",
        type: "text",
        x: 40,
        y: 140,
        width: 736,
        height: 30,
        content: "  📅  lunes 19 de enero, 2026",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 13, color: "#ffffff", backgroundColor: "#3b82f6", borderRadius: 4, lineHeight: 2 },
      },
      // Time slot 1
      {
        id: "ap-time1",
        type: "text",
        x: 40,
        y: 185,
        width: 200,
        height: 22,
        content: "🕐  11:00 - 12:00",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 13, color: "#6b7280" },
      },
      // Column headers
      {
        id: "ap-cols1",
        type: "text",
        x: 40,
        y: 210,
        width: 736,
        height: 22,
        content: "EMPLEADO                                                                          DEPARTAMENTO",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 11, fontWeight: "bold", color: "#1e3a5f", letterSpacing: 1 },
      },
      // Separator line
      {
        id: "ap-sep1",
        type: "text",
        x: 40,
        y: 234,
        width: 736,
        height: 2,
        content: "",
        zIndex: 2,
        style: { ...DEFAULT_STYLE, backgroundColor: "#e5e7eb" },
      },
      // Employees block 1
      {
        id: "ap-emp1",
        type: "text",
        x: 40,
        y: 245,
        width: 736,
        height: 200,
        content: "GALLARDO DÍAZ CIUNELY YETZABEL                                               CALIDAD\nVARGAS AGUILLON ROSA MARÍA                                                       CALIDAD\nLIRA REYNOSO JOSHUA SHADDAY                                                      CALIDAD\nDÍAZ GUTIÉRREZ JOSÉ GUADALUPE                                                  PRODUCCIÓN\nLUCAS ESPINDOLA CRISTOBAL                                                            CALIDAD\nRODRÍGUEZ VEGA OCIEL ALEJANDRO                                               CALIDAD",
        zIndex: 2,
        style: { ...DEFAULT_STYLE, fontSize: 12, color: "#374151", lineHeight: 2, fontFamily: "'Roboto', sans-serif" },
      },
      // Time slot 2
      {
        id: "ap-time2",
        type: "text",
        x: 40,
        y: 465,
        width: 200,
        height: 22,
        content: "🕐  6:00 - 7:00",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 13, color: "#6b7280" },
      },
      // Column headers 2
      {
        id: "ap-cols2",
        type: "text",
        x: 40,
        y: 490,
        width: 736,
        height: 22,
        content: "EMPLEADO                                                                          DEPARTAMENTO",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 11, fontWeight: "bold", color: "#1e3a5f", letterSpacing: 1 },
      },
      {
        id: "ap-sep2",
        type: "text",
        x: 40,
        y: 514,
        width: 736,
        height: 2,
        content: "",
        zIndex: 2,
        style: { ...DEFAULT_STYLE, backgroundColor: "#e5e7eb" },
      },
      // Employees block 2
      {
        id: "ap-emp2",
        type: "text",
        x: 40,
        y: 525,
        width: 736,
        height: 240,
        content: "MARTÍNEZ COBOS OMAR                                                               PRODUCCIÓN\nOCHOA ORTUÑO JOSÉ MA.                                                                  PRODUCCIÓN\nSILVA CARMONA MARIAN ITZEL                                                          CALIDAD\nHERNÁNDEZ DE LA CRUZ GUADALUPE                                               CALIDAD\nVALLADARES MARTÍNEZ CRISTIAN                                                      CALIDAD\nSANTA CRUZ GALVEZ CHRISTIAN                                                        CALIDAD\nCARRILLO MADRIGAL HERMILO                                                           CALIDAD",
        zIndex: 2,
        style: { ...DEFAULT_STYLE, fontSize: 12, color: "#374151", lineHeight: 2, fontFamily: "'Roboto', sans-serif" },
      },
      // Time slot 3
      {
        id: "ap-time3",
        type: "text",
        x: 40,
        y: 780,
        width: 200,
        height: 22,
        content: "🕐  17:00 - 18:00",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 13, color: "#6b7280" },
      },
      // Column headers 3
      {
        id: "ap-cols3",
        type: "text",
        x: 40,
        y: 805,
        width: 736,
        height: 22,
        content: "EMPLEADO                                                                          DEPARTAMENTO",
        zIndex: 3,
        style: { ...DEFAULT_STYLE, fontSize: 11, fontWeight: "bold", color: "#1e3a5f", letterSpacing: 1 },
      },
      {
        id: "ap-sep3",
        type: "text",
        x: 40,
        y: 829,
        width: 736,
        height: 2,
        content: "",
        zIndex: 2,
        style: { ...DEFAULT_STYLE, backgroundColor: "#e5e7eb" },
      },
      // Employees block 3
      {
        id: "ap-emp3",
        type: "text",
        x: 40,
        y: 840,
        width: 736,
        height: 200,
        content: "URIAS SÁNCHEZ ARMANDO                                                             PRODUCCIÓN\nFLORES DOMINGUEZ CORAL ESTEFANIA                                              CALIDAD\nLÓPEZ CARRILLO JONATHAN EDUARDO                                              CALIDAD\nQUEZADA GUILLEN JULIO EVEREST                                                    CALIDAD\nVÁZQUEZ FLORES ERICK                                                                    PRODUCCIÓN\nZARRABAL DÍAZ JORGE JAVIER                                                          CALIDAD",
        zIndex: 2,
        style: { ...DEFAULT_STYLE, fontSize: 12, color: "#374151", lineHeight: 2, fontFamily: "'Roboto', sans-serif" },
      },
    ],
  },

  // ── 4. Vacío ────────────────────────────────────────────────────────────
  {
    name: "Vacío",
    preview: "📄",
    bg: "#ffffff",
    elements: [],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return crypto.randomUUID()
}

function snapToGrid(v: number, gridSize: number): number {
  return Math.round(v / gridSize) * gridSize
}

/** Compress an image file to a maximum dimension, returns base64. */
function compressImage(
  file: File,
  maxDim = 1200,
  quality = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new window.Image()
      img.onerror = reject
      img.onload = () => {
        let w = img.width
        let h = img.height
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/webp", quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ─── Mobile Tab type ──────────────────────────────────────────────────────────

type MobileTab = "info" | "canvas" | "properties"

// ─── Announcer for a11y ──────────────────────────────────────────────────────

function useAnnounce() {
  const [msg, setMsg] = useState("")
  const announce = useCallback((text: string) => {
    setMsg("")
    requestAnimationFrame(() => setMsg(text))
  }, [])
  return { msg, announce }
}

// ─── Main Component ──────────────────────────────────────────────────────────

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

  // Keep a ref to the latest state so async callbacks never go stale
  const stateRef = useRef(flayerState)
  stateRef.current = flayerState

  // Convenience updaters – always read from ref to avoid stale closures
  const setElements = useCallback(
    (fn: (prev: FlayerElement[]) => FlayerElement[]) => {
      const latest = stateRef.current
      setFlayerState({
        ...latest,
        elements: fn(latest.elements),
      })
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
  const [saveName, setSaveName] = useState("")

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

  // ── Gallery (saved images for re-use) ──────────────────────────────────
  const [gallery, setGallery] = useState<string[]>([])
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GALLERY_KEY)
      if (saved) setGallery(JSON.parse(saved))
    } catch {
      /* ignore */
    }
  }, [])

  const addToGallery = useCallback(
    (dataUrl: string) => {
      setGallery((prev) => {
        const next = [dataUrl, ...prev].slice(0, 20)
        try {
          localStorage.setItem(GALLERY_KEY, JSON.stringify(next))
        } catch {
          /* quota */
        }
        return next
      })
    },
    [],
  )

  // ── Refs ────────────────────────────────────────────────────────────────
  const dragging = useRef<{
    id: string
    ox: number
    oy: number
  } | null>(null)
  const resizing = useRef<{
    id: string
    startX: number
    startY: number
    startW: number
    startH: number
  } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // ── Responsiveness ─────────────────────────────────────────────────────
  const [scale, setScale] = useState(1)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const recalc = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (wrapperRef.current) {
        const avail = wrapperRef.current.clientWidth - 32
        setScale(Math.min(1, avail / CANVAS_W))
      }
    }
    recalc()
    window.addEventListener("resize", recalc)
    return () => window.removeEventListener("resize", recalc)
  }, [])

  // ── Accessibility announcer ────────────────────────────────────────────
  const { msg: a11yMsg, announce } = useAnnounce()

  // ── Memoised sorted elements ───────────────────────────────────────────
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
      id: uid(),
      type: "text",
      x: 60,
      y: 60,
      width: 300,
      height: 50,
      content: "Texto de ejemplo",
      zIndex: elements.length + 1,
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
        const el: FlayerElement = {
          id: uid(),
          type: "image",
          x: 60,
          y: 60,
          width: w,
          height: h,
          content: src,
          zIndex: elements.length + 1,
          style: { ...DEFAULT_STYLE, backgroundColor: "transparent" },
        }
        setElements((prev) => [...prev, el])
        setSelectedId(el.id)
        announce("Imagen añadida")
      }
      img.src = src
    },
    [elements.length, setElements, announce],
  )

  const addImage = useCallback(
    async (file: File) => {
      const src = await compressImage(file)
      addToGallery(src)
      addImageFromData(src)
    },
    [addToGallery, addImageFromData],
  )

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    setElements((prev) => prev.filter((e) => e.id !== selectedId))
    setSelectedId(null)
    announce("Elemento eliminado")
  }, [selectedId, setElements, announce])

  const duplicateSelected = useCallback(() => {
    if (!selected) return
    const dup: FlayerElement = {
      ...structuredClone(selected),
      id: uid(),
      x: selected.x + 20,
      y: selected.y + 20,
      zIndex: elements.length + 1,
    }
    setElements((prev) => [...prev, dup])
    setSelectedId(dup.id)
    announce("Elemento duplicado")
  }, [selected, elements.length, setElements, announce])

  const updateElement = useCallback(
    (id: string, patch: Partial<FlayerElement>) => {
      setElements((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      )
    },
    [setElements],
  )

  const updateStyle = useCallback(
    (id: string, patch: Partial<ElementStyle>) => {
      setElements((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, style: { ...e.style, ...patch } } : e,
        ),
      )
    },
    [setElements],
  )

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
    if (info.horarioEspecial)
      lines.push(`Horario especial: ${info.horarioEspecial}`)
    if (lines.length === 0) return

    const el: FlayerElement = {
      id: uid(),
      type: "text",
      x: 60,
      y: 80,
      width: 650,
      height: lines.length * 32 + 20,
      content: lines.join("\n"),
      zIndex: elements.length + 1,
      style: {
        ...DEFAULT_STYLE,
        fontSize: 20,
        fontFamily: "Inter, sans-serif",
      },
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
      if (editingId === id) return
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      const el = elements.find((el) => el.id === id)!
      const offset = getCanvasOffset()
      dragging.current = {
        id,
        ox: (e.clientX - offset.left) / scale - el.x,
        oy: (e.clientY - offset.top) / scale - el.y,
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
      resizing.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        startW: el.width,
        startH: el.height,
      }
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
          const snappedX = snapToGrid(x, GRID_SIZE)
          const snappedY = snapToGrid(y, GRID_SIZE)
          if (Math.abs(x - snappedX) < SNAP_THRESHOLD) x = snappedX
          if (Math.abs(y - snappedY) < SNAP_THRESHOLD) y = snappedY
        }
        updateElement(id, { x, y })
      }
      if (resizing.current) {
        const { id, startX, startY, startW, startH } = resizing.current
        const dw = (e.clientX - startX) / scale
        const dh = (e.clientY - startY) / scale
        updateElement(id, {
          width: Math.max(40, startW + dw),
          height: Math.max(20, startH + dh),
        })
      }
    },
    [scale, snapEnabled, getCanvasOffset, updateElement],
  )

  const onCanvasPointerUp = useCallback(() => {
    dragging.current = null
    resizing.current = null
  }, [])

  // ── Background image ──────────────────────────────────────────────────

  const onBgImageChange = useCallback(
    async (file: File) => {
      const src = await compressImage(file, 1600, 0.85)
      setCanvasBgImage(src)
    },
    [setCanvasBgImage],
  )

  // ── Print ─────────────────────────────────────────────────────────────

  const handlePrint = useCallback(() => window.print(), [])

  // ── Export as image ────────────────────────────────────────────────────

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
            // Skip cross-origin link elements that cause SecurityError
            if (node.tagName === "LINK" && (node as HTMLLinkElement).href?.includes("fonts.googleapis")) {
              return false
            }
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

  // ── Save / Load (localStorage) ─────────────────────────────────────────

  const getSaves = useCallback((): SavedFlayer[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    } catch {
      return []
    }
  }, [])

  const [saves, setSaves] = useState<SavedFlayer[]>([])
  useEffect(() => setSaves(getSaves()), [getSaves])

  const saveFlayer = useCallback(() => {
    const name = saveName.trim() || `Flayer ${new Date().toLocaleDateString()}`
    const entry: SavedFlayer = {
      name,
      date: new Date().toISOString(),
      state: structuredClone(flayerState),
    }
    const list = [entry, ...getSaves()].slice(0, 20)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    } catch {
      /* quota */
    }
    setSaves(list)
    setSaveName("")
    announce(`"${name}" guardado`)
  }, [saveName, flayerState, getSaves, announce])

  const loadFlayer = useCallback(
    (s: SavedFlayer) => {
      setFlayerState(structuredClone(s.state))
      setSelectedId(null)
      setShowSaves(false)
      announce(`"${s.name}" cargado`)
    },
    [setFlayerState, announce],
  )

  const deleteSave = useCallback(
    (index: number) => {
      const list = getSaves().filter((_, i) => i !== index)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
      } catch {
        /* */
      }
      setSaves(list)
      announce("Guardado eliminado")
    },
    [getSaves, announce],
  )

  // ── Templates ──────────────────────────────────────────────────────────

  const applyTemplate = useCallback(
    (t: FlayerTemplate) => {
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

  // ── Keyboard shortcuts ─────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      if (isInput) return

      // Ctrl shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault()
            undo()
            return
          case "y":
            e.preventDefault()
            redo()
            return
          case "d":
            e.preventDefault()
            duplicateSelected()
            return
          case "s":
            e.preventDefault()
            saveFlayer()
            return
        }
      }

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && editingId !== selectedId) {
          e.preventDefault()
          deleteSelected()
        }
        return
      }

      // Escape
      if (e.key === "Escape") {
        setSelectedId(null)
        setEditingId(null)
        return
      }

      // Arrow keys to move element
      if (selectedId && editingId !== selectedId) {
        const step = e.shiftKey ? 10 : 1
        const el = elements.find((el) => el.id === selectedId)
        if (!el) return
        switch (e.key) {
          case "ArrowUp":
            e.preventDefault()
            updateElement(selectedId, {
              y: Math.max(0, el.y - step),
            })
            return
          case "ArrowDown":
            e.preventDefault()
            updateElement(selectedId, {
              y: Math.min(CANVAS_H - 20, el.y + step),
            })
            return
          case "ArrowLeft":
            e.preventDefault()
            updateElement(selectedId, {
              x: Math.max(0, el.x - step),
            })
            return
          case "ArrowRight":
            e.preventDefault()
            updateElement(selectedId, {
              x: Math.min(CANVAS_W - 20, el.x + step),
            })
            return
        }
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [
    undo,
    redo,
    duplicateSelected,
    saveFlayer,
    deleteSelected,
    selectedId,
    editingId,
    elements,
    updateElement,
  ])

  // ─── Render ────────────────────────────────────────────────────────────

  // Info panel content (shared between desktop sidebar and mobile tab)
  const infoPanel = (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Información del flyer
      </p>
      <div className="space-y-2">
        <Label htmlFor="f-folio" className="text-xs">
          Folio
        </Label>
        <Input
          id="f-folio"
          placeholder="Ej. CAP-2024-001"
          value={info.folio}
          onChange={(e) => setInfo((p) => ({ ...p, folio: e.target.value }))}
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-curso" className="text-xs">
          Nombre del curso
        </Label>
        <Input
          id="f-curso"
          placeholder="Ej. Seguridad Industrial"
          value={info.curso}
          onChange={(e) => setInfo((p) => ({ ...p, curso: e.target.value }))}
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-instructor" className="text-xs">
          Instructor
        </Label>
        <Input
          id="f-instructor"
          placeholder="Nombre del instructor"
          value={info.instructor}
          onChange={(e) =>
            setInfo((p) => ({ ...p, instructor: e.target.value }))
          }
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-sala" className="text-xs">
          Sala / Lugar
        </Label>
        <Input
          id="f-sala"
          placeholder="Ej. Sala A"
          value={info.sala}
          onChange={(e) => setInfo((p) => ({ ...p, sala: e.target.value }))}
          className="h-8 text-sm"
        />
      </div>
      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Horarios por turno
      </p>
      {(["turno1", "turno2", "turno3", "turno4"] as const).map((t, i) => {
        const fechaKey = `fechaTurno${i + 1}` as keyof FlayerInfo
        return (
          <div key={t} className="space-y-1">
            <Label htmlFor={`f-${t}`} className="text-xs">
              Turno {i + 1}
            </Label>
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
        <Label htmlFor="f-horario" className="text-xs">
          Horario especial
        </Label>
        <Input
          id="f-horario"
          placeholder="Ej. Sábado 08:00 - 12:00"
          value={info.horarioEspecial}
          onChange={(e) =>
            setInfo((p) => ({ ...p, horarioEspecial: e.target.value }))
          }
          className="h-8 text-sm"
        />
      </div>
      <Button className="w-full" size="sm" onClick={insertInfo}>
        <Plus size={14} className="mr-1" /> Insertar info al flyer
      </Button>
    </div>
  )

  // Properties panel content (shared)
  const propertiesPanel = (
    <>
      {!selected ? (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm gap-2 py-12">
          <Palette size={28} className="opacity-30" />
          <p>Selecciona un elemento para editar sus propiedades</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Propiedades — {selected.type === "text" ? "Texto" : "Imagen"}
          </p>

          {/* Text properties */}
          {selected.type === "text" && (
            <>
              {/* Font family */}
              <div className="space-y-1">
                <Label className="text-xs">Tipografía</Label>
                <Select
                  value={selected.style.fontFamily}
                  onValueChange={(v) =>
                    updateStyle(selected.id, { fontFamily: v })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((f) => (
                      <SelectItem
                        key={f.value}
                        value={f.value}
                        style={{ fontFamily: f.value }}
                      >
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Tamaño</Label>
                  <span className="text-xs text-muted-foreground">
                    {selected.style.fontSize}px
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    aria-label="Reducir tamaño"
                    onClick={() =>
                      updateStyle(selected.id, {
                        fontSize: Math.max(8, selected.style.fontSize - 2),
                      })
                    }
                  >
                    <Minus size={10} />
                  </Button>
                  <Slider
                    min={8}
                    max={120}
                    step={1}
                    value={[selected.style.fontSize]}
                    onValueChange={([v]) =>
                      updateStyle(selected.id, { fontSize: v })
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    aria-label="Aumentar tamaño"
                    onClick={() =>
                      updateStyle(selected.id, {
                        fontSize: Math.min(120, selected.style.fontSize + 2),
                      })
                    }
                  >
                    <Plus size={10} />
                  </Button>
                </div>
              </div>

              {/* Bold / Italic / Align */}
              <div className="space-y-1">
                <Label className="text-xs">Estilo y alineación</Label>
                <div className="flex gap-1 flex-wrap">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          selected.style.fontWeight === "bold"
                            ? "default"
                            : "outline"
                        }
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Negrita"
                        aria-pressed={selected.style.fontWeight === "bold"}
                        onClick={() =>
                          updateStyle(selected.id, {
                            fontWeight:
                              selected.style.fontWeight === "bold"
                                ? "normal"
                                : "bold",
                          })
                        }
                      >
                        <Bold size={12} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Negrita</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          selected.style.fontStyle === "italic"
                            ? "default"
                            : "outline"
                        }
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Cursiva"
                        aria-pressed={selected.style.fontStyle === "italic"}
                        onClick={() =>
                          updateStyle(selected.id, {
                            fontStyle:
                              selected.style.fontStyle === "italic"
                                ? "normal"
                                : "italic",
                          })
                        }
                      >
                        <Italic size={12} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Cursiva</TooltipContent>
                  </Tooltip>
                  {(
                    [
                      ["left", AlignLeft, "Izquierda"],
                      ["center", AlignCenter, "Centrar"],
                      ["right", AlignRight, "Derecha"],
                    ] as const
                  ).map(([align, Icon, label]) => (
                    <Tooltip key={align}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={
                            selected.style.textAlign === align
                              ? "default"
                              : "outline"
                          }
                          size="icon"
                          className="h-7 w-7"
                          aria-label={label}
                          aria-pressed={selected.style.textAlign === align}
                          onClick={() =>
                            updateStyle(selected.id, {
                              textAlign: align as "left" | "center" | "right",
                            })
                          }
                        >
                          <Icon size={12} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Text colour */}
              <div className="space-y-1">
                <Label htmlFor="prop-text-color" className="text-xs">
                  Color de texto
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    id="prop-text-color"
                    type="color"
                    value={selected.style.color}
                    onChange={(e) =>
                      updateStyle(selected.id, { color: e.target.value })
                    }
                    className="w-8 h-8 cursor-pointer rounded border border-input"
                  />
                  <span className="text-xs text-muted-foreground">
                    {selected.style.color}
                  </span>
                </div>
              </div>

              {/* Line height */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Interlineado</Label>
                  <span className="text-xs text-muted-foreground">
                    {selected.style.lineHeight.toFixed(1)}
                  </span>
                </div>
                <Slider
                  min={0.8}
                  max={3}
                  step={0.1}
                  value={[selected.style.lineHeight]}
                  onValueChange={([v]) =>
                    updateStyle(selected.id, { lineHeight: v })
                  }
                />
              </div>

              {/* Letter spacing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Espaciado de letras</Label>
                  <span className="text-xs text-muted-foreground">
                    {selected.style.letterSpacing}px
                  </span>
                </div>
                <Slider
                  min={-2}
                  max={20}
                  step={0.5}
                  value={[selected.style.letterSpacing]}
                  onValueChange={([v]) =>
                    updateStyle(selected.id, { letterSpacing: v })
                  }
                />
              </div>

              {/* Text shadow */}
              <div className="space-y-1">
                <Label className="text-xs">Sombra de texto</Label>
                <Select
                  value={selected.style.textShadow}
                  onValueChange={(v) =>
                    updateStyle(selected.id, { textShadow: v })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEXT_SHADOWS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Background colour */}
          <div className="space-y-1">
            <Label htmlFor="prop-bg-color" className="text-xs">
              Color de fondo del elemento
            </Label>
            <div className="flex items-center gap-2">
              <input
                id="prop-bg-color"
                type="color"
                value={
                  selected.style.backgroundColor === "transparent"
                    ? "#ffffff"
                    : selected.style.backgroundColor
                }
                onChange={(e) =>
                  updateStyle(selected.id, {
                    backgroundColor: e.target.value,
                  })
                }
                className="w-8 h-8 cursor-pointer rounded border border-input"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  updateStyle(selected.id, {
                    backgroundColor: "transparent",
                  })
                }
              >
                Transparente
              </Button>
            </div>
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Opacidad</Label>
              <span className="text-xs text-muted-foreground">
                {Math.round(selected.style.opacity * 100)}%
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[selected.style.opacity]}
              onValueChange={([v]) =>
                updateStyle(selected.id, { opacity: v })
              }
            />
          </div>

          {/* Border radius */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Redondez</Label>
              <span className="text-xs text-muted-foreground">
                {selected.style.borderRadius}px
              </span>
            </div>
            <Slider
              min={0}
              max={60}
              step={1}
              value={[selected.style.borderRadius]}
              onValueChange={([v]) =>
                updateStyle(selected.id, { borderRadius: v })
              }
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Ancho</Label>
              <Input
                type="number"
                value={Math.round(selected.width)}
                onChange={(e) =>
                  updateElement(selected.id, {
                    width: Number(e.target.value) || selected.width,
                  })
                }
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Alto</Label>
              <Input
                type="number"
                value={Math.round(selected.height)}
                onChange={(e) =>
                  updateElement(selected.id, {
                    height: Number(e.target.value) || selected.height,
                  })
                }
                className="h-7 text-xs"
              />
            </div>
          </div>

          <Separator />

          {/* Z order */}
          <div className="space-y-1">
            <Label className="text-xs">Orden (capas)</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={bringForward}
              >
                <ChevronUp size={12} className="mr-1" /> Al frente
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={sendBackward}
              >
                <ChevronDown size={12} className="mr-1" /> Atrás
              </Button>
            </div>
          </div>

          <Separator />

          {/* Duplicate & Delete */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={duplicateSelected}
            >
              <Copy size={13} className="mr-1" /> Duplicar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={deleteSelected}
            >
              <Trash2 size={13} className="mr-1" /> Eliminar
            </Button>
          </div>
        </div>
      )}
    </>
  )

  // Canvas view (shared)
  const canvasView = (
    <div
      ref={wrapperRef}
      className="flex-1 min-w-0 overflow-auto bg-muted/40 flex items-start justify-center p-4"
      onClick={() => setSelectedId(null)}
    >
      <div id="flayer-print-root">
        <div
          id="flayer-canvas-print"
          ref={canvasRef}
          role="application"
          aria-label="Editor de flyer - Canvas de diseño"
          className="relative shadow-xl overflow-hidden select-none"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            backgroundColor: canvasBg,
            backgroundImage: canvasBgImage
              ? `url(${canvasBgImage})`
              : undefined,
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
          {/* Snap grid overlay */}
          {showGrid && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={CANVAS_W}
              height={CANVAS_H}
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id="grid"
                  width={GRID_SIZE}
                  height={GRID_SIZE}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                    fill="none"
                    stroke="rgba(0,0,0,0.08)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}

          {/* Center guides */}
          {showGrid && (
            <>
              <div
                className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-400/30 pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute top-1/2 left-0 right-0 h-px bg-blue-400/30 pointer-events-none"
                aria-hidden="true"
              />
            </>
          )}

          {/* Empty state */}
          {sortedElements.length === 0 && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center gap-3"
              aria-hidden="true"
            >
              <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center">
                <Layers size={32} className="text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground/60 text-lg font-medium">
                Canvas vacío
              </p>
              <p className="text-muted-foreground/40 text-sm max-w-[300px]">
                Añade texto, imágenes o usa una plantilla para comenzar
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
              onDoubleClick={() =>
                el.type === "text" && setEditingId(el.id)
              }
              onBlur={() => setEditingId(null)}
              onChange={(content) => updateElement(el.id, { content })}
            />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Roboto:wght@400;700&family=Playfair+Display:wght@400;700&family=Montserrat:wght@400;700&family=Oswald:wght@400;700&display=swap"
      />

      {/* Print + screen styles */}
      <style>{`
        @media print {
          /* Override global visibility:hidden from globals.css */
          #flayer-print-root,
          #flayer-print-root *,
          #flayer-canvas-print,
          #flayer-canvas-print * {
            visibility: visible !important;
          }

          /* Hide toolbar, sidebars and other UI */
          .no-print { display: none !important; }

          /* Position canvas at top-left, full page */
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

      {/* a11y live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {a11yMsg}
      </div>

      <TooltipProvider>
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
          {/* ── Toolbar ── */}
          <div className="no-print flex items-center gap-1.5 px-2 sm:px-4 py-2 border-b bg-background flex-shrink-0 overflow-x-auto">
            {/* Sidebar toggles (desktop only) */}
            <div className="hidden md:flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={leftOpen ? "Cerrar panel izquierdo" : "Abrir panel izquierdo"}
                    onClick={() => setLeftOpen((v) => !v)}
                  >
                    {leftOpen ? (
                      <PanelLeftClose size={15} />
                    ) : (
                      <PanelLeftOpen size={15} />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {leftOpen ? "Cerrar info" : "Abrir info"}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Add elements */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={addText}>
                  <Type size={15} className="mr-1" />{" "}
                  <span className="hidden sm:inline">Texto</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Añadir texto</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <ImageIcon size={15} className="mr-1" />{" "}
                      <span className="hidden sm:inline">Imagen</span>
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && addImage(e.target.files[0])
                    }
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent>Añadir imagen</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload size={15} className="mr-1" />{" "}
                      <span className="hidden sm:inline">Logo</span>
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && addImage(e.target.files[0])
                    }
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent>Añadir logo</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {/* Background */}
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="flex items-center gap-1 cursor-pointer border rounded-md px-2 py-1 text-sm hover:bg-accent transition-colors">
                  <Palette size={15} />
                  <span className="hidden sm:inline">Fondo</span>
                  <input
                    type="color"
                    value={canvasBg}
                    onChange={(e) => setCanvasBg(e.target.value)}
                    className="w-6 h-5 cursor-pointer rounded border-0 p-0"
                    aria-label="Color de fondo del flyer"
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent>Color de fondo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <ImageIcon size={15} className="mr-1" />{" "}
                      <span className="hidden lg:inline">Fondo imagen</span>
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && onBgImageChange(e.target.files[0])
                    }
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent>Imagen de fondo</TooltipContent>
            </Tooltip>

            {canvasBgImage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCanvasBgImage(null)}
              >
                <RefreshCw size={14} className="mr-1" />{" "}
                <span className="hidden sm:inline">Quitar fondo</span>
              </Button>
            )}

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {/* Grid & Snap */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showGrid ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  aria-label={showGrid ? "Ocultar cuadrícula" : "Mostrar cuadrícula"}
                  aria-pressed={showGrid}
                  onClick={() => setShowGrid((v) => !v)}
                >
                  <Grid3X3 size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Cuadrícula</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={snapEnabled ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  aria-label={snapEnabled ? "Desactivar snap" : "Activar snap"}
                  aria-pressed={snapEnabled}
                  onClick={() => setSnapEnabled((v) => !v)}
                >
                  <Magnet size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Snap a cuadrícula</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {/* Undo / Redo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canUndo}
                  aria-label="Deshacer"
                  onClick={() => undo()}
                >
                  <Undo2 size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deshacer (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canRedo}
                  aria-label="Rehacer"
                  onClick={() => redo()}
                >
                  <Redo2 size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rehacer (Ctrl+Y)</TooltipContent>
            </Tooltip>

            {/* Delete selected */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!selectedId}
                  aria-label="Eliminar seleccionado"
                  onClick={deleteSelected}
                >
                  <Trash2 size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar (Del)</TooltipContent>
            </Tooltip>

            {/* Duplicate */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!selectedId}
                  aria-label="Duplicar seleccionado"
                  onClick={duplicateSelected}
                >
                  <Copy size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicar (Ctrl+D)</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {/* Templates */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplates((v) => !v)}
                >
                  <LayoutTemplate size={15} className="mr-1" />{" "}
                  <span className="hidden lg:inline">Plantillas</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Plantillas prediseñadas</TooltipContent>
            </Tooltip>

            {/* Gallery */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGallery((v) => !v)}
                >
                  <FileImage size={15} className="mr-1" />{" "}
                  <span className="hidden lg:inline">Galería</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Galería de imágenes</TooltipContent>
            </Tooltip>

            {/* Shortcuts help */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Atajos de teclado"
                  onClick={() => setShowShortcuts((v) => !v)}
                >
                  <Keyboard size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atajos de teclado</TooltipContent>
            </Tooltip>

            {/* ── Right side actions ── */}
            <div className="ml-auto flex items-center gap-1.5">
              {/* Save */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaves((v) => !v)}
                  >
                    <FolderOpen size={15} className="mr-1" />{" "}
                    <span className="hidden sm:inline">Archivos</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Guardar / Cargar</TooltipContent>
              </Tooltip>

              {/* Export */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("png")}
                  >
                    <Download size={15} className="mr-1" />{" "}
                    <span className="hidden sm:inline">PNG</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar como PNG</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("jpeg")}
                  >
                    <Download size={15} className="mr-1" />{" "}
                    <span className="hidden sm:inline">JPG</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar como JPG</TooltipContent>
              </Tooltip>

              {/* Print */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="sm" onClick={handlePrint}>
                    <Printer size={15} className="mr-1" />{" "}
                    <span className="hidden sm:inline">Imprimir</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Imprimir / PDF</TooltipContent>
              </Tooltip>

              {/* Right panel toggle (desktop) */}
              <div className="hidden md:block">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={rightOpen ? "Cerrar panel de propiedades" : "Abrir panel de propiedades"}
                      onClick={() => setRightOpen((v) => !v)}
                    >
                      {rightOpen ? (
                        <PanelRightClose size={15} />
                      ) : (
                        <PanelRightOpen size={15} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {rightOpen ? "Cerrar propiedades" : "Abrir propiedades"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* ── Shortcut overlay ── */}
          {showShortcuts && (
            <div className="no-print border-b bg-background px-4 py-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Atajos de teclado
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowShortcuts(false)}
                  aria-label="Cerrar atajos"
                >
                  <X size={14} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                {[
                  ["Ctrl+Z", "Deshacer"],
                  ["Ctrl+Y", "Rehacer"],
                  ["Ctrl+D", "Duplicar"],
                  ["Ctrl+S", "Guardar"],
                  ["Del", "Eliminar"],
                  ["Esc", "Deseleccionar"],
                  ["Flechas", "Mover ±1px"],
                  ["Shift+Flechas", "Mover ±10px"],
                  ["Doble clic", "Editar texto"],
                ].map(([key, desc]) => (
                  <span key={key}>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      {key}
                    </kbd>{" "}
                    {desc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Templates bar ── */}
          {showTemplates && (
            <div className="no-print border-b bg-background px-4 py-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Plantillas
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowTemplates(false)}
                  aria-label="Cerrar plantillas"
                >
                  <X size={14} />
                </Button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    className="flex flex-col items-center gap-1 min-w-[100px] p-3 border rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => applyTemplate(t)}
                  >
                    <span className="text-2xl">{t.preview}</span>
                    <span className="text-xs font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Gallery bar ── */}
          {showGallery && (
            <div className="no-print border-b bg-background px-4 py-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Galería de imágenes
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowGallery(false)}
                  aria-label="Cerrar galería"
                >
                  <X size={14} />
                </Button>
              </div>
              {gallery.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Las imágenes que subas aparecerán aquí para reusar.
                </p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {gallery.map((src, i) => (
                    <button
                      key={i}
                      className="flex-shrink-0 w-16 h-16 rounded border overflow-hidden hover:ring-2 ring-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                      onClick={() => addImageFromData(src)}
                      aria-label={`Insertar imagen ${i + 1} de la galería`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Save/Load bar ── */}
          {showSaves && (
            <div className="no-print border-b bg-background px-4 py-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Guardar / Cargar
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowSaves(false)}
                  aria-label="Cerrar guardados"
                >
                  <X size={14} />
                </Button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Input
                  placeholder="Nombre del flyer..."
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="h-8 text-sm flex-1 max-w-xs"
                  onKeyDown={(e) => e.key === "Enter" && saveFlayer()}
                />
                <Button size="sm" onClick={saveFlayer}>
                  <Save size={14} className="mr-1" /> Guardar
                </Button>
              </div>
              {saves.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No hay flyers guardados.
                </p>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {saves.map((s, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 flex items-center gap-2 border rounded-lg px-3 py-2 min-w-[180px]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {s.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(s.date).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => loadFlayer(s)}
                        aria-label={`Cargar "${s.name}"`}
                      >
                        <FolderOpen size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteSave(i)}
                        aria-label={`Eliminar "${s.name}"`}
                      >
                        <Trash size={13} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Body ── */}
          {isMobile ? (
            /* ── Mobile layout: Tab-based ── */
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Tab content */}
              <div className="flex-1 min-h-0 overflow-auto">
                {mobileTab === "info" && (
                  <div className="p-3">{infoPanel}</div>
                )}
                {mobileTab === "canvas" && canvasView}
                {mobileTab === "properties" && (
                  <div className="p-3">{propertiesPanel}</div>
                )}
              </div>

              {/* Bottom tab bar */}
              <nav
                className="no-print flex border-t bg-background shrink-0"
                role="tablist"
                aria-label="Paneles del editor"
              >
                {(
                  [
                    ["info", "Info", Type],
                    ["canvas", "Canvas", Layers],
                    ["properties", "Props", Palette],
                  ] as const
                ).map(([tab, label, Icon]) => (
                  <button
                    key={tab}
                    role="tab"
                    aria-selected={mobileTab === tab}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                      mobileTab === tab
                        ? "text-primary border-t-2 border-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setMobileTab(tab)}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          ) : (
            /* ── Desktop layout: 3-column ── */
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Left panel */}
              {leftOpen && (
                <aside
                  className="no-print w-64 shrink-0 border-r overflow-y-auto p-3 bg-background animate-in slide-in-from-left-2 duration-200"
                  aria-label="Panel de información del flyer"
                >
                  {infoPanel}
                </aside>
              )}

              {/* Canvas */}
              {canvasView}

              {/* Right panel */}
              {rightOpen && (
                <aside
                  className="no-print w-64 shrink-0 border-l overflow-y-auto p-3 bg-background animate-in slide-in-from-right-2 duration-200"
                  aria-label="Panel de propiedades"
                >
                  {propertiesPanel}
                </aside>
              )}
            </div>
          )}
        </div>
      </TooltipProvider>
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
}: CanvasElementProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const boxStyle: React.CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    zIndex: el.zIndex,
    opacity: el.style.opacity,
    borderRadius: el.style.borderRadius,
    backgroundColor: el.style.backgroundColor,
    outline: isSelected
      ? "2px solid hsl(var(--primary))"
      : "2px solid transparent",
    outlineOffset: 2,
    cursor: "grab",
    overflow: "hidden",
    userSelect: "none",
  }

  if (el.type === "image") {
    return (
      <div
        style={boxStyle}
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        role="img"
        aria-label="Elemento de imagen en el canvas"
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
        {isSelected && <ResizeHandle onPointerDown={onResizePointerDown} />}
      </div>
    )
  }

  // Text element
  const textStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    fontSize: el.style.fontSize,
    fontFamily: el.style.fontFamily,
    fontWeight: el.style.fontWeight,
    fontStyle: el.style.fontStyle,
    textAlign: el.style.textAlign,
    color: el.style.color,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: el.style.lineHeight,
    letterSpacing: el.style.letterSpacing,
    textShadow: el.style.textShadow,
    padding: "4px 6px",
    boxSizing: "border-box",
  }

  return (
    <div
      style={boxStyle}
      onPointerDown={onPointerDown}
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
          aria-label="Editar texto del elemento"
          style={{
            ...textStyle,
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            cursor: "text",
          }}
        />
      ) : (
        <div style={textStyle}>{el.content}</div>
      )}
      {isSelected && <ResizeHandle onPointerDown={onResizePointerDown} />}
    </div>
  )
})

function ResizeHandle({
  onPointerDown,
}: {
  onPointerDown: (e: React.PointerEvent) => void
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      role="separator"
      aria-label="Redimensionar elemento"
      style={{
        position: "absolute",
        right: 0,
        bottom: 0,
        width: 14,
        height: 14,
        background: "hsl(var(--primary))",
        borderRadius: "3px 0 4px 0",
        cursor: "nwse-resize",
        zIndex: 9999,
      }}
    />
  )
}
