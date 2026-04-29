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
      "AUXILIAR DE MANTENIMIENTO C",
      "JEFE DE MANTENIMIENTO",
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
      "JEFE DE ALMACÉN"]
  },//ACTUALIZADO
  "RECURSOS HUMANOS": {
    areas: ["RECURSOS HUMANOS"],
    puestos: ["JEFE DE RECURSOS HUMANOS",
      "AUXILIAR DE RECURSOS HUMANOS",
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
//ACTUALIZADO
export const TURNOS = [
  "1",
  "2",
  "3",
  "4",
  "Mixto"
]
//ACTUALIZADO
export const JEFES_DE_AREA = [
  "AGUILLON RANGEL LIZBETH",
  "BONILLA HERNANDEZ ADRIANA BEATRIZ",
  "BRAVO GARCIA JESUS FERNANDO",
  "CABRERO BOO MANUEL ALBERTO",
  "CENOBIO HERNANDEZ JORGE ALBERTO",
  "ESQUIVEL MATA ARIADNA NAYELY",
  "GARCIA JUAREZ XICOTENCATL",
  "GOMEZ SANCHEZ CARLOS ARIEL",
  "GOMEZ SANCHEZ CESAR",
  "HERNANDEZ GUDIÑO NOEMI",
  "HERNANDEZ RUIZ MIGUEL ANGEL",
  "PEREZ BAUTISTA EDGAR",
  "SALINAS ORTIZ ANA ERIKA",
  "TERRAZAS MARTINEZ JAIME",
  "VIÑOLAS GONZALEZ JOSE LUIS"
]
//ACTUALIZADO
export const ESCOLARIDAD = [
  "PRIMARIA",
  "SECUNDARIA",
  "PREPARATORIA",
  "TECNICO",
  "LICENCIATURA",
  "INGENIERIA",
  "MAESTRIA",
  "DOCTORADO"
]

export const JEFES_DE_AREA_POR_DEPARTAMENTO: { [departamento: string]: string[] } = {
  "PRODUCCIÓN": [
    "GOMEZ SANCHEZ CARLOS ARIEL ",
  ],
  "CALIDAD": [
    "CENOBIO HERNANDEZ JORGE ALBERTO",
  ],
  "MANTENIMIENTO": [
    "BRAVO GARCIA JESUS FERNANDO",
  ],
  "ALMACÉN": [
    "GARCIA JUAREZ XICOTENCATL",
  ],
  "RECURSOS HUMANOS": [
    "HERNANDEZ GUDIÑO NOEMI",
  ],
  "TALLER DE MOLDES": [
    "GOMEZ SANCHEZ CESAR",
  ],
  "SGI": [
    "AGUILLON RANGEL LIZBETH",
  ],
  "METROLOGÍA": [
    "ESQUIVEL MATA ARIADNA NAYELY",
  ],
  "PROYECTOS": [
    "SALINAS ORTIZ ANA ERIKA",
  ],
  "SISTEMAS": [
    "CABRERO BOO MANUEL ALBERTO",
  ],
}

export const TIPO_DESEMPENO_POR_PUESTO = {
  jefe: [
    "GERENTE",
    "JEFE",
    "SUPERVISOR",
    "COORDINADOR",
    "LIDER",
    "DIRECTOR",
    "GERENTE DE",
    "JEFE DE",
    "SUPERVISOR DE",
    "COORDINADOR DE",
    "LÍDER DE",
  ],
  administrativo: [
    "ADMINISTRATIVO",
    "AUXILIAR ADMINISTRATIVO",
    "CAPTURISTA",
    "ANALISTA",
    "ASISTENTE",
    "SECRETARIA",
    "PROGRAMADOR",
    "AUXILIAR DE RECURSOS HUMANOS",
    "AUXILIAR DE CONTABILIDAD",
  ],
  operativo: [
    "OPERADOR",
    "AUXILIAR",
    "MATERIALISTA",
    "PREPARADOR",
    "MONTADOR",
    "TÉCNICO",
    "INSPECTOR",
    "METRÓLOGO",
    "CHOFER",
    "RESIDENTE",
    "AUXILIAR DE MANTENIMIENTO",
  ],
} as const

export type TipoDesempeno = keyof typeof TIPO_DESEMPENO_POR_PUESTO

export function getTipoDesempenoByPuesto(puesto: string): TipoDesempeno {
  const normalized = puesto.toUpperCase().trim()

  const matchList = (tipo: TipoDesempeno) =>
    TIPO_DESEMPENO_POR_PUESTO[tipo].some((keyword) => normalized.includes(keyword))

  if (matchList("jefe") && !normalized.includes("AUXILIAR ADMINISTRATIVO")) {
    return "jefe"
  }

  if (matchList("administrativo")) {
    return "administrativo"
  }

  return "operativo"
}

export const PERIODOS_DESEMPENO = {
  semestrales: ["ENERO-JUNIO", "JULIO-DICIEMBRE"] as const,
  mensuales: [
    "ENERO-FEBRERO",
    "MARZO-ABRIL",
    "MAYO-JUNIO",
    "JULIO-AGOSTO",
    "SEPTIEMBRE-OCTUBRE",
    "NOVIEMBRE-DICIEMBRE",
  ] as const,
} as const

export type DesempenoPeriodo = (typeof PERIODOS_DESEMPENO)[keyof typeof PERIODOS_DESEMPENO][number]

export const SECCIONES_PONDERACION_DESEMPENO = {
  operativo: [
    { nombre: "Primera parte", peso: 40, descripcion: "Evaluación de objetivos productivos y operativos." },
    { nombre: "Segunda parte", peso: 30, descripcion: "Evaluación de cumplimiento de responsabilidades y reglamentos." },
    { nombre: "Tercera parte", peso: 30, descripcion: "Evaluación de competencias y compromisos." },
  ] as const,
  administrativo: [
    { nombre: "Primera parte", peso: 40, descripcion: "Evaluación de metas administrativas y de gestión." },
    { nombre: "Segunda parte", peso: 30, descripcion: "Evaluación de cumplimiento de procesos y comunicación." },
    { nombre: "Tercera parte", peso: 30, descripcion: "Evaluación de competencias y resultados internos." },
  ] as const,
  jefe: [
    { nombre: "Primera parte", peso: 40, descripcion: "Evaluación de liderazgo, seguimiento y resultados del equipo." },
    { nombre: "Segunda parte", peso: 30, descripcion: "Evaluación de gestión de recursos y cumplimiento de metas." },
    { nombre: "Tercera parte", peso: 30, descripcion: "Evaluación de competencias directivas y comunicación." },
  ] as const,
} as const
