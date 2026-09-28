// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de Tipos de Cursos
// ─────────────────────────────────────────────────────────────────────────────

export const TIPOS_CURSOS = [
  "INDUCCIÓN",
  "EHS",
  "TÉCNICOS",
  "CALIDAD",
  "SGI",
  "EXTERNO",
  "SIN TIPO",
  "PRODUCCIÓN",
  "ALMACÉN",
] as const

export type TipoCurso = typeof TIPOS_CURSOS[number]

// Mapeo explícito de nombre de curso -> tipo de curso
// EDITAR AQUÍ: agregar cada curso con su tipo
export const CURSOS_POR_TIPO: Record<string, TipoCurso> = {
  // INDUCCIÓN
  "INDUCCIÓN A LA EMPRESA": "INDUCCIÓN",
  "SEGURIDAD Y PREVENCIÓN DE ACCIDENTES": "INDUCCIÓN",
  "ASPECTOS E IMPACTOS AMBIENTALES": "INDUCCIÓN",
  "FAMILIAS DEL PRODUCTO": "INDUCCIÓN",
  "SISTEMA DE GESTIÓN INTEGRAL": "INDUCCIÓN",
  "ALERTAS DE CALIDAD Y CATÁLOGO DE FALLAS": "INDUCCIÓN",
  "METODOLOGÍA 5S": "INDUCCIÓN",
  "REPORTE DE PRODUCCIÓN": "INDUCCIÓN",
  "INSTRUCCIONES DE TRABAJO": "INDUCCIÓN",
  "NOM-036-1-STPS-2018": "EHS",
  "OPERADORES DE MÁQUINA": "PRODUCCIÓN",
  "SEPARACIÓN DE RESIDUOS": "EHS",
  "AUDITORÍAS DE PROCESO EN CAPAS": "SGI",
  "ESTRUCTURA DEL SGI Y DOCUMENTOS": "SGI",
  "CORE TOOLS": "EXTERNO",
  "INTERPRETACIÓN DE PLANOS": "EXTERNO",
  "KEYENCE": "EXTERNO",
  "MANEJO DE MATERIAL NO CONFORME": "CALIDAD",
  "PROCESO DE LIBREACIÓN DE MATERIA PRIMA": "CALIDAD",
  "TRAZABILIDAD DEL PRODUCTO": "CALIDAD",
  "VALIDACIÓN DE ARRANQUE": "CALIDAD",
  "NOM-035-STPS-2018": "EHS",
  "INTRODUCCIÓN A LA METROLOGÍA Y MANEJO DE EQUIPOS DE MEDICIÓN": "EXTERNO",
  "DIAGRAMA DE TORTUGA": "SGI",
  "CONTROL DE CONTRATISTAS": "EHS",
  "NOM-005-STPS-1998": "EHS",
  "FORMACIÓN DE INSTRUCTORES INTERNOS": "EXTERNO",
  "IT-ASC-019": "CALIDAD",
  "IT-PRO-009": "SGI",
  "MATRIZ DE RIESGOS": "SGI",
  "METODO PEPS": "ALMACÉN",
  "MI-GER-001": "SGI",
  "MINITAB": "EXTERNO",
  "NOM-002-STPS-2010": "EHS",
  "NOM-004-STPS-1999": "EHS",
  "NOM-027-STPS-2008": "EHS",
  "OPERACIÓN SEGURA DE MONTACARGAS": "EXTERNO",
  "VDA 6.3": "EXTERNO",
  "VDA 6.5": "EXTERNO",
  "APQP": "EXTERNO",
  "PPAP": "EXTERNO",
  "FMEA": "EXTERNO",
}

/**Obtiene el tipo de curso a partir del nombre del curso usando mapeo explícito.*/
export function getTipoCursoByName(nombreCurso: string): TipoCurso {
  const normalized = nombreCurso.toUpperCase().trim()

  // Primero buscar coincidencia exacta
  if (normalized in CURSOS_POR_TIPO) {
    return CURSOS_POR_TIPO[normalized]
  }

  // Buscar coincidencia parcial
  for (const [key, tipo] of Object.entries(CURSOS_POR_TIPO)) {
    if (normalized.includes(key.toUpperCase())) {
      return tipo
    }
  }

  // Default
  return "SIN TIPO"
}
