export interface CatalogoJerarquia {
  [departamento: string]: {
    areas: string[];
    puestos: string[];
  }
}

//ACTUALIZADO
export const CATALOGO_ORGANIZACIONAL: CatalogoJerarquia = {
  "PRODUCCIÓN": {
    areas: ["PRODUCCIÓN 1ER TURNO",
      "PRODUCCIÓN 2DO TURNO",
      "PRODUCCIÓN 3ER TURNO",
      "PRODUCCIÓN 4TO TURNO",
      "PRODUCCIÓN ADMINISTRATIVO",
      "PRODUCCIÓN MONTAJE"],
    puestos: ["GERENTE DE PRODUCCIÓN",
      "JEFE DE PRODUCCIÓN",
      "ASISTENTE DE PRODUCCIÓN A",
      "ASISTENTE DE PRODUCCIÓN B",
      "PLANEADOR DE PRODUCCIÓN",
      "SUPERVISOR DE PRODUCCIÓN A",
      "SUPERVISOR DE PRODUCCIÓN B",
      "SUPERVISOR DE PRODUCCIÓN C",
      "SUPERVISOR DE PRODUCCIÓN D",
      "OPERADOR DE MÁQUINA A",
      "OPERADOR DE MÁQUINA B",
      "OPERADOR DE MÁQUINA C",
      "OPERADOR DE MÁQUINA D",
      "AUXILIAR DE SCRAP A",
      "AUXILIAR DE SCRAP B",
      "AUXILIAR DE BÁSCULA A",
      "AUXILIAR DE BÁSCULA B",
      "AUXILIAR DE SUPERVISOR A",
      "AUXILIAR DE SUPERVISOR B",
      "CHECK LIST A",
      "CHECK LIST B",
      "MATERIALISTA A",
      "MATERIALISTA B",
      "PREPARADOR A",
      "PREPARADOR B",
      "CAPTURISTA RPS A",
      "CAPTURISTA RPS B",
      "JEFE DE PROCESO",
      "INGENIERO DE PROCESO A",
      "INGENIERO DE PROCESO B",
      "INGENIERO DE PROCESO C",
      "INGENIERO DE PROCESO D",
      "SUPERVISOR DE MONTAJE",
      "MONTADOR DE MOLDES A",
      "MONTADOR DE MOLDES B",
      "MONTADOR DE MOLDES C",
      "MONTADOR DE MOLDES D"]
  },//ACTUALIZADO
  "CALIDAD": {
    areas: ["A. CALIDAD 1ER TURNO",
      "A. CALIDAD 2DO TURNO",
      "CALIDAD ADMINISTRATIVO",
      "RESIDENTES DE CALIDAD"
    ],
    puestos: ["GERENTE DE CALIDAD",
      "JEFE DE CALIDAD",
      "AUXILIAR DE CALIDAD",
      "INGENIERO DE CALIDAD A",
      "INGENIERO DE CALIDAD B",
      "INGENIERO DE CALIDAD C",
      "INSPECTOR DE CALIDAD A",
      "INSPECTOR DE CALIDAD B",
      "INSPECTOR DE CALIDAD C",
      "INSPECTOR DE CALIDAD D",
      "INSPECTOR RECIBO",
      "INGENIERO DE CALIDAD PROCESOS A",
      "INGENIERO DE CALIDAD PROCESOS B",
      "OPERADOR DE ACABADOS - GP12 A",
      "OPERADOR DE ACABADOS - GP12 B",
      "OPERADOR DE ACABADOS - GP12 C",
      "OPERADOR DE ACABADOS - GP12 D",
      "RESIDENTE DE CALIDAD A",
      "RESIDENTE DE CALIDAD B",
      "RESIDENTE DE CALIDAD C",
      "SUPERVISOR DE ACABADOS - GP12 A",
      "SUPERVISOR DE ACABADOS - GP12 B",
      "SUPERVISOR DE ACABADOS - GP12 C"]
  },//ACTUALIZADO
  "MANTENIMIENTO": {
    areas: ["MANTENIMIENTO"],
    puestos: ["AUXILIAR ADMINISTRATIVO DE MANTENIMIENTO",
      "AUXILIAR DE MANTENIMIENTO A",
      "AUXILIAR DE MANTENIMIENTO B",
      "AUXILIAR DE MANTENIMIENTO C",
      "JEFE DE MANTENIMIENTO",
      "TÉCNICO DE MANTENIMIENTO A",
      "TÉCNICO DE MANTENIMIENTO B",
      "TÉCNICO DE MANTENIMIENTO C",
      "TÉCNICO DE MANTENIMIENTO D",
      "TECNICO DE MANTENIMIENTO DE EDIFICIOS A",
      "TÉCNICO ESPECIALISTA DE MANTENIMIENTO A",
      "TÉCNICO ESPECIALISTA DE MANTENIMIENTO B"]
  },//ACTUALIZADO
  "ALMACÉN": {
    areas: ["ALMACÉN"],
    puestos: ["ALMACENISTA DE MATERIA PRIMA",
      "AUXILIAR ADMINISTRATIVO DE ALMACÉN A",
      "AUXILIAR ADMINISTRATIVO DE ALMACÉN B",
      "AUXILIAR ADMINISTRATIVO DE ALMACÉN C",
      "AUXILIAR DE ALMACÉN A",
      "AUXILIAR DE ALMACÉN B",
      "AUXILIAR DE ALMACÉN C",
      "AUXILIAR DE ALMACÉN D",
      "CHOFER A",
      "CHOFER B",
      "CHOFER C",
      "JEFE DE ALMACÉN"]
  },//ACTUALIZADO
  "RECURSOS HUMANOS": {
    areas: ["RECURSOS HUMANOS"],
    puestos: ["JEFE DE RECURSOS HUMANOS",
      "AUXILIAR DE LIMPIEZA A",
      "AUXILIAR DE LIMPIEZA B",
      "ANALISTA DE CAPACITACIÓN",
      "ANALISTA DE RECLUTAMIENTO Y SELECCIÓN A",
      "ANALISTA DE RECLUTAMIENTO Y SELECCIÓN B",
      "ANALISTA DE SEGURIDAD E HIGIENE",
      "ANALISTA DE RECURSOS HUMANOS",
      "ASISTENTE DE RECURSOS HUMANOS",
      "COORDINADOR DE RECLUTAMIENTO Y SELECCIÓN"]
  },//ACTUALIZADO
  "TALLER DE MOLDES": {
    areas: ["MOLDES"],
    puestos: ["AUXILIAR ADMINISTRATIVO DE TALLER DE MOLDES",
      "JEFE DE TALLER DE MOLDES",
      "TÉCNICO DE MOLDES A",
      "TÉCNICO DE MOLDES B",
      "TÉCNICO DE MOLDES C",
      "TÉCNICO DE MOLDES D",
      "TÉCNICO DE MOLDES E"]
  },//ACTUALIZADO
  "SGI": {
    areas: ["SGI"],
    puestos: ["COORDINADOR DEL SGI",
      "AUXILIAR DEL SGI A",
      "AUXILIAR DEL SGI B",
      "AUXILIAR DEL SGI C"]
  },//ACTUALIZADO
  "METROLOGÍA": {
    areas: ["METROLOGÍA"],
    puestos: ["JEFE DE METROLOGÍA",
      "SUPERVISOR DE METROLOGÍA",
      "METRÓLOGO A",
      "METRÓLOGO B",
      "METRÓLOGO C",
      "AUXILIAR DE METROLOGÍA"]
  },//ACTUALIZADO
  "PROYECTOS": {
    areas: ["PROYECTOS"],
    puestos: ["GERENTE DE PROYECTOS",
      "AUXILIAR DE PROYECTOS",
      "LIDER DE COTIZACIONES",
      "INGENIERO DE PROYECTOS A",
      "INGENIERO DE PROYECTOS B",
      "INGENIERO DE PROYECTOS D",
      "LIDER DE PROYECTOS A",
      "LIDER DE PROYECTOS B",
      "LÍDER DE PROYECTOS C"]
  },//ACTUALIZADO
  "SISTEMAS": {
    areas: ["SISTEMAS"],
    puestos: ["COORDINADOR DE RPS",
      "AUXILIAR PROGRAMADOR"]
  },//ACTUALIZADO
  "LOGISTICA": {
    areas: ["LOGISTICA"],
    puestos: ["JEFE DE LOGISTICA",
      "SUPERVISOR DE LOGISTICA"]
  },//ACTUALIZADO
  "GERENCIA DE PLANTA": {
    areas: ["GERENCIA DE PLANTA"],
    puestos: ["GERENTE DE PLANTA"]
  } //ACTUALIZADO
}

// Normaliza un puesto para comparar (UPPER, sin acentos, espacios colapsados).
function normalizePuestoKey(puesto: string): string {
  return puesto
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// Mapa puesto normalizado → departamento, derivado de CATALOGO_ORGANIZACIONAL.
const PUESTO_A_DEPARTAMENTO: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const [departamento, { puestos }] of Object.entries(CATALOGO_ORGANIZACIONAL)) {
    for (const p of puestos) {
      map[normalizePuestoKey(p)] = departamento
    }
  }
  return map
})()

export const DEPARTAMENTO_SIN_ASIGNAR = "SIN DEPARTAMENTO"

/**
 * Devuelve el departamento de un puesto según `CATALOGO_ORGANIZACIONAL`.
 * Si el puesto no está en el catálogo, devuelve `DEPARTAMENTO_SIN_ASIGNAR`.
 */
export function getDepartamentoByPuesto(puesto: string | null | undefined): string {
  if (!puesto) return DEPARTAMENTO_SIN_ASIGNAR
  return PUESTO_A_DEPARTAMENTO[normalizePuestoKey(puesto)] ?? DEPARTAMENTO_SIN_ASIGNAR
}

/**
 * Normaliza un nombre de departamento para comparación tolerante a
 * acentos, mayúsculas y espacios sobrantes.
 */
export function normalizeDepartamento(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}
