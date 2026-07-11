import { camelCaseAttributes } from "framer-motion";

export interface Objetivo {
    numero: number;
    descripcion: string;
    resultado: string;
    porcentaje: string;
    comentarios: string;
}

export interface CumplimientoItem {
    descripcion: string;
    porcentaje: string;
    evalua: string;
    comentarios: string;
}

export interface Competencia {
    nombre: string;
    descripcion: string;
    calificacion: number; // 0-4
    comentarios: string;
}

export interface IncidenciaResumen {
    categoria: string;
    valor: number | null;
    notas: string | null;
    mes: string | null;
}

export type DesempenoTipo = "operativo" | "administrativo" | "jefe";

// ═══════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_OBJETIVOS_POR_TIPO: Record<DesempenoTipo, Objetivo[]> = {
    operativo: [
        {
            numero: 1,
            descripcion: "Datos cambian en base al puesto",
            resultado: "NA",
            porcentaje: "NA",
            comentarios: "",
        },
    ],
    administrativo: [
        {
            numero: 1,
            descripcion: "Datos cambian en base al puesto",
            resultado: "NA",
            porcentaje: "NA",
            comentarios: "",
        }
    ],
    jefe: [
        {
            numero: 1,
            descripcion: "Datos cambian en base al puesto",
            resultado: "NA",
            porcentaje: "NA",
            comentarios: "",
        }
    ],
};

export const DEFAULT_CUMPLIMIENTO: CumplimientoItem[] = [
    {
        descripcion:
            "Cumplir compromisos derivados de sus planes de seguimiento por desempeño.",
        porcentaje: "NA",
        evalua: "JEFE",
        comentarios: "",
    },
    {
        descripcion:
            "Cumplir con lineamientos de reglamento interior de trabajo y reglamento de seguridad y calidad.",
        porcentaje: "NA",
        evalua: "RH",
        comentarios: "",
    },
    {
        descripcion: "Cumplir con asistencia.",
        porcentaje: "NA",
        evalua: "RH",
        comentarios: "",
    },
    {
        descripcion: "Cumplir con puntualidad.",
        porcentaje: "NA",
        evalua: "JEFE",
        comentarios: "",
    },
    {
        descripcion: "No presentar más de dos permisos por mes.",
        porcentaje: "NA",
        evalua: "JEFE",
        comentarios: "",
    },
];

export const DEFAULT_CUMPLIMIENTO_JEFE: CumplimientoItem[] = [
    {
        descripcion: "Comunicar objetivos (Se evidencia con carta de objetivos firmada al inicio del año y mapa de tortuga actualizado)",
        porcentaje: "NA",
        evalua: "SGI",
        comentarios: "",
    },
    {
        descripcion: "Revisar / actualizar descriptivos de puesto (anual)",
        porcentaje: "NA",
        evalua: "RH",
        comentarios: "",
    },
    {
        descripcion: "Revisar / actualizar procedimientos e instrucciones de trabajo (anual)",
        porcentaje: "NA",
        evalua: "SGI",
        comentarios: "",
    },
    {
        descripcion: "Evaluar el desempeño de sus colaboradores a cargo y dar retroalimentación (semestral)",
        porcentaje: "NA",
        evalua: "RH",
        comentarios: "",
    },
    {
        descripcion: "Establecer planes con sus colaboradores de bajo desempeño y dar seguimiento (semestral)",
        porcentaje: "NA",
        evalua: "RH",
        comentarios: "",
    },
    {
        descripcion: "Realizar juntas periódicas y hacer minuta con compromisos calendarizados. (Bimestral)",
        porcentaje: "NA",
        evalua: "RH",
        comentarios: "",
    },
    {
        descripcion: "Cumplir compromisos derivados de las reuniones periódicas. (Bimestral)",
        porcentaje: "NA",
        evalua: "JEFE",
        comentarios: "",
    },
    {
        descripcion: "Lograr que el personal a su cargo cumpla los lineamientos de disciplina y los valores de la empresa.",
        porcentaje: "NA",
        evalua: "JEFE",
        comentarios: "",
    },
    {
        descripcion: "Cumplir con los programas de capacitación necesarios para su equipo de trabajo.",
        porcentaje: "NA",
        evalua: "RH",
        comentarios: "",
    },
    {
        descripcion: "Lograr objetivo de clima laboral",
        porcentaje: "NA",
        evalua: "RH",
        comentarios: "",
    },
];

export const DEFAULT_CUMPLIMIENTO_POR_TIPO: Record<DesempenoTipo, CumplimientoItem[]> = {
    operativo: DEFAULT_CUMPLIMIENTO,
    administrativo: DEFAULT_CUMPLIMIENTO,
    jefe: DEFAULT_CUMPLIMIENTO_JEFE,
};

export const DEFAULT_COMPETENCIAS: Competencia[] = [
    {
        nombre: "Flexibilidad y adaptación",
        descripcion:
            "Capacidad para trabajar con eficacia en situaciones variadas y/o inusuales, con personas o grupos diversos. Implica comprender y valorar posturas distintas a las propias, incluso puntos de vista encontrados, modificar su propio enfoque a medida que la situación cambiante lo requiera, y promover dichos cambios en su ámbito de actuación.",
        calificacion: 0,
        comentarios: "",
    },
    {
        nombre: "Respeto",
        descripcion:
            "Capacidad para dar a los otros y a uno mismo un trato digno, franco y tolerante, y comportarse de acuerdo con los valores morales, las buenas costumbres y las buenas prácticas profesionales, y para actuar con seguridad y congruencia entre el decir y el hacer.",
        calificacion: 0,
        comentarios: "",
    },
    {
        nombre: "Compromiso con la calidad",
        descripcion:
            "Implica la capacidad para construir relaciones basadas en una conducta honesta y veraz. Capacidad para actuar con velocidad y sentido de urgencia a fin de alcanzar los objetivos junto con altos niveles de desempeño en su puesto de trabajo. Capacidad para aplicar políticas y directrices recibidas de sus superiores con el propósito de obtener los resultados esperados. Implica un compromiso constante por mantenerse actualizado y aportar soluciones para alcanzar estándares de calidad esperados.",
        calificacion: 0,
        comentarios: "",
    },
    {
        nombre: "Trabajo en equipo",
        descripcion:
            "Capacidad para colaborar con los demás, formar parte de un grupo y trabajar con otras áreas de la organización con el propósito de alcanzar, en conjunto, la estrategia organizacional, subordinar los intereses personales a los objetivos grupales. Implica tener expectativas positivas respecto de los demás, comprender a los otros, y generar y mantener un buen clima de trabajo. Incluye su compromiso y participación en las reuniones de trabajo con otras áreas.",
        calificacion: 0,
        comentarios: "",
    },
];

// ═══════════════════════════════════════════════════════════════
// OBJETIVOS POR PUESTO
// ═══════════════════════════════════════════════════════════════

const _OBJETIVOS_OPERADOR_MAQUINA: Objetivo[] = [
    {
        numero: 1,
        descripcion:
            "Operar la máquina asignada cumpliendo los estándares de producción",
        resultado: "80%",
        porcentaje: "NA",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion:
            "Reportar fallas y anomalías de la máquina al supervisor de turno",
        resultado: "80%",
        porcentaje: "NA",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion:
            "Cumplir con los tiempos de ciclo y metas de producción por turno",
        resultado: "80%",
        porcentaje: "NA",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion:
            "Mantener limpieza y orden en el área de trabajo y máquina asignada",
        resultado: "100%",
        porcentaje: "NA",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion:
            "Seguir las instrucciones de trabajo y procedimientos de seguridad",
        resultado: "90%",
        porcentaje: "NA",
        comentarios: "",
    },
];


const _OBJETIVOS_AUXILIAR_LIMPIEZA: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Lograr un 90% en el puntaje de inspecciones de calidad",
        resultado: "90%",
        porcentaje: "NA",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Mantener en 0 el número de quejas o incidencias",
        resultado: "0",
        porcentaje: "NA",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Mantener en 0 la tasa de no conformidades",
        resultado: "0",
        porcentaje: "NA",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Cumplir al 100% con el plan de trabajo",
        resultado: "100%",
        porcentaje: "NA",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Hacer uso correcto de equipos y productos químicos",
        resultado: "100%",
        porcentaje: "NA",
        comentarios: "",
    },
];


const _OBJETIVOS_INSPEC: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Igual o menor a 3 reclamaciones atribuibles a calidad",
        resultado: "3",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Realizar y mantener 5´S al 100% en su área de trabajo ",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Cumplimiento 100% con sus auditorías  LPA",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "No presentar hallazgos en auditorías de clientes o sistema de gestión ",
        resultado: "0",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "0 paros de líneas atribuibles a calidad",
        resultado: "0",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "100% de liberación de producto terminado en linea de producción ",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "100% de cumplimiento al procedimiento de control de producto no conforme",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },

];


const _OBJETIVOS_TECNICO_MOLDES: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Realizar mantenimientos preventivos y correctivos a los moldes de inyección asegurando un cumplimiento mínimo del 95% del plan mensual, garantizando la liberación de moldes en tiempo y forma según el programa.",
        resultado: "95%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Realizacion del 100% de check list de mantenimiento a cada preventivo, correctivo de moldes.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Atencion al 100% de incidencias atendidas mediante el RPS.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Portar el 100% de su equipo de EPP.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Realizar y mantener 5´S al 100% en su área de trabajo.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Asegurar el 100% de envio de evidencia fotografica del antes y despues de mantenimientos correctivos a moldes.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
];

const _OBJETIVOS_TECNICO_MANTENIMIENTO: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Gestión de incidencias al 100%",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Gestión de mantenimiento preventivos al 95%",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    }

];

const _OBJETIVOS_AUXILIAR_MANTENIMIENTO: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Gestión de incidencias al 100%",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Correcto llenado de check list al 100%",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: " Y orden y limpieza de las maquinas y equipos periféricos al 100%",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    }

];

const _OBJETIVOS_OPERADOR_ACABADOS: Objetivo[] = [
    {
        numero: 1,
        descripcion: "0 reclamos de cliente por inspecciones de material",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Realizar y mantener 5´S al 100% en su área de trabajo",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "0 % de tiempos muertos",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "90% de cumplimiento en los rate de inspección",
        resultado: "90%",
        porcentaje: "N/A",
        comentarios: "",
    }
];

const _OBJETIVOS_INGENIERO_CALIDAD: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Igual o menor a 9 de reclamos oficiales por mes por parte de cliente  ",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Igual o menor a 6 reclamaciones con el principal ofensor calidad",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "100% de cumplimeinto de reclamos en tiempo en portal de cliente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Igual o menor a 5 mil dolares por costos de terceria mensual",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Realizar y mantener 5´S al 100% en su área de trabajo",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "Asegurar la comunicación oportuna entre jefe y gerente de planta",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "Cumplimiento 100% con sus auditorías  LPA",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 9,
        descripcion: "Cumplimiento 100% con sus auditorías  Producto-Proceso programadas",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 10,
        descripcion: "No presentar hallazgos en auditorías de clientes o sistema de gestión",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
];

const _OBJETIVOS_METROLOGO: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Cumplimiento 100% con sus auditorías  LPA",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "No presentar hallazgos en auditorías de clientes o sistema de gestión",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Realizar y mantener 5´S al 100% en su área de trabajo",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Cumplir con el 100% del programa de calibración",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Cubrir con el 95 % del Time en las fechas establecidas",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "Cobertura del 100% de uso de equipos crÍticos",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "Elaboración del 100% de métodos de medición",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 9,
        descripcion: "Cumplimiento del 100% de R&R de equipos de medición",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 10,
        descripcion: "Cobertura de plantilla al 100% en equipos críticos    ",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
];


const _OBJETIVOS_AUXILIAR_ALMACEN: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Recibir y revisar el 100% de material, insumos y otros suministros que entran al almacén.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Preparar el 100% del producto para la entrega oportuna al cliente.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Elaborar inventarios al 100%",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Mantener las 5´s diariamente en el área de trabajo.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Realizar traspasos de manera oportuna al 100%.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
];

const _OBJETIVOS_AUXILIAR_TALLER_MOLDES: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Facilitar las herramientas y consumibles para realizar las tareas en taller",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Cumplir en tiempo y forma al 100% con los planes de mantenimiento para cubrir las necesidades de producción",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Ejecución de reportes diarios al 100% de estado de moldes",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Cumplir el 100% de las acciones Correctivas  derivadas de auditorias en las fechas acordadas",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Mantener vigente y actualizada al 100% la base de datos de talleres externos con su respectiva evaluación con el objetivo de conocer el alcance de c/u de ellos.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
];

const _OBJETIVOS_SUPERVISOR_PRODUCCION: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Captura completa de los reportes de producción",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Asegurar el trabajo de las máquinas de acuerdo al ciclo establecido al 100%",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Cumplimiento al programa de producción al 100%",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "No presentar hallazgos en auditorías de clientes o sistema de gestión",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
];

const _OBJETIVOS_ALMACENISTA_MATERIA_PRIMA: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Recibir y revisar el 100% de material, insumos y otros suministros que entran al almacén.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Preparar el 100% del producto para la entrega oportuna al cliente.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Elaborar inventarios al 100%.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Mantener las 5´s diariamente en el área de trabajo.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Realizar traspasos de manera oportuna al 100%.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
];

const _OBJETIVOS_AUXILIAR_BASCULA: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Realizar los pesajes al 100% de la produccion por turno",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Asegurar el 100% de entrega de piezas al area de Almacen",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Asegurar cantidad de producción al 100%",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Realizar el 100% de traspasos con el kardex correspondientes en el RPS",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    }
];

const _OBJETIVOS_AUXILIAR_SUPERVISOR: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Realizar paros de máquinas cuando se detecten 5 piezas consecutivas",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Evitar paro de máquina porque los productos no cumplen los lineamientos",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Asegurar cantidad de producción al 100%",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Llenado del reporte de producción correctamente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Asegurar el 100% de la capacitacion al personal operativo a pie de maquina, llenando el formato correspondiente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "Relevar en maquina el 100% (comidas, sanitarios, falta de personal)",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "Asegurar al 100% contar con el material para entregar a linea de produccion",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 9,
        descripcion: "Evitar al 100% acumulaciones y rechazos",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
];

const _OBJETIVOS_CAPTURISTA_RPS: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Realizar la captura al 100% de los trasnpasos del material entregado a los diferentes almacenes.",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Relevar en maquina el 100% cuando se solicite el apoyo",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Asegurar cantidad de producción al 100%",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Aplicación de 5¨S en su area de trabajo",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    }
];

const _OBJETIVOS_CHECK_LIST: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Realizar paros de máquinas cuando se detecten 5 piezas consecutivas",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Evitar paro de máquina porque los productos no cumplen los lineamientos",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Asegurar cantidad de producción al 100%",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Cumplimiento del 100% del llenado del check list",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Cumplimiento del 100% los arranques y reactivaciones en tiempo y forma",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    }
];

const _OBJETIVOS_MATERIALISTA: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Evitar al 100% paros de maquina por falta de suministro de resina",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Evitar paro de máquina porque la resina no cumple con los lineamientos",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Asegurar cantidad de producción al 100%",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Realizar al 100% cambios de resina en tiempo y forma",
        resultado: "100%",
        porcentaje: "N/A",
        comentarios: "",
    }
];

const _OBJETIVOS_MONTADOR_MOLDES: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "No presentar hallazgos en auditorias de clientes o sistema de gestion",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Cumplimiento del programa de produccion al 98% en montaje y desmontaje de moldes",
        resultado: "98%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Verificar y validar el 100% de la hoja de moldeo de produccion de acuerdo a los requerimientos y especificaciones",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Realizar el 100% de los check list de montaje y desmontaje de moldes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Realizar y mantener 5´S al 100% en su área de trabajo",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_PREPARADOR: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Evitar al 100% paros de maquina por falta de suministro de insumos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Evitar paro de máquina porque los productos no cumplen los lineamientos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Asegurar cantidad de producción al 100%",
        resultado: "100%    ",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Aplicación de 5¨S en su area de trabajo",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Realizar la entrega del 100% de la produccion del dia al area de bahia en tiempo y  forma",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_AUXILIAR_SCRAP: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Cumplimiento al 100% del material separado para envio a moler",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Evitar paro de máquina porque los productos no cumplen los lineamientos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Aplicacion de 5¨S en su area de trabajo",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Llenado del control de ingreso de scrap y pesajes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Portar el 100% de su equipo de EPP y uniforme diariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_TECNICO_EDIFICIOS: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Gestion de incidencias al 100%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Correcto llenado de check list al 100%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Y orden y limpieza en compresores y taller de soldadura al 100%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_TECNICO_ESPECIALISTA_MANTENIMIENTO: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Gestión de incidencias al 100%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Gestión de mantenimiento preventivos al 95%",
        resultado: "95%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_COORDINADOR_RPS: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Implementacion  de Modulos Faltantes en 2026",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "30 minutos maximo de Tiempo de solucion de problemas RPS",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_SGI: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Mantenimiento de Sistema Integral 95%",
        resultado: "95%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Cumplimiento de auditorias internas 100%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Revision y seguimiento de planes de accion 95%",
        resultado: "95%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Atención auditorias de clientes 100%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_GERENTE_CALIDAD: Objetivo[] = [
    {
        numero: 1,
        descripcion: " Costos de la no calidad máximo 4500 usd/mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "No. De reclamos por parte del cliente no mayor a 3 mensuales",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Pago a tercerias por contenciones  de 0 pesos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Asegurar la comunicación oportuna entre jefe y gerente de planta ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Cumplimiento 100% con sus auditorias  LPA",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Cumplimiento 100% con sus auditorias  Producto-Proceso programadas",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "No presentar hallazgos en auditorias de clientes o sistema de gestion ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_COORDINADOR_RECLUTAMIENTO: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Cubrir las vacantes en un máximo de 15 días promedio por mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Cumplir  mínimo el 70% del perfil requerido por el puesto de las personas contratadas por mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Integrar el 100% de expedientes completos y con la información correcta en los documentos de contratación y registros internos.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Cumplimiento de 13 ingresos por mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Realizar la medición de indicadores mensuales máximo el día 9 de cada mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Definir acciones correctivas en caso de incumplimiento a los objetivos mensuales de reclutamiento y completarlas conforme las fechas definidas",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "Medir costos de reclutamiento de fuentes de reclutamiento",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_GERENTE_PLANTA: Objetivo[] = [
    {
        numero: 1,
        descripcion: "58% Eficiencia de planta OEE",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "100% revisiones de la Dirección",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "No conformidades Mayores en Auditorias BSI",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: " 85% Cumplimiento Objetivos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Costo de la no Calidad Inferior a $4k usd mensuales",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_GERENTE_PRODUCCION: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Cumplimiento del programa de produccion al 98%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Mermas de proceso de 11500 ppm",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Eficiencia de proceso al 85%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Cumplimiento 100% con sus auditorias  LPA",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "No presentar hallazgos en auditorias de clientes o sistema de gestion",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_GERENTE_PROYECTOS: Objetivo[] = [
    {
        numero: 1,
        descripcion: "No presentar hallazgos en auditorias de clientes o sistema de gestion",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Cumplimiento 100% con sus auditorias  LPA",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Cumplimiento de tiempos del proyecto (PPAP Liberado) 94%/mes",
        resultado: "94%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Tiempo de cambio de ingeniería maximo 20 días",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_INGENIERO_PROCESO: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "No presentar hallazgos en auditorías de clientes o sistema de gestión",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Asegurar el arranque de máquinas de manera adecuada al 100%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_JEFE_ALMACEN: Objetivo[] = [
    {
        numero: 1,
        descripcion: "No presentar hallazgos en auditorias de clientes o sistema de gestion",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Exactitud en inventarios PT y MP del 98%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "0 Discrepancias entre lo entregado y los documentos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Estadía de transportes en carga y descarga de 2 h. máximo",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Cumplimiento 100% con sus auditorias  LPA",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_LOGISTICA: Objetivo[] = [
    {
        numero: 1,
        descripcion: "100% Entregas a Tiempo",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "98% satisfaccion del cliente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "No conformidades Mayores en Auditorias de SGC",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_JEFE_MANTENIMIENTO: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Cumplimiento de manttos correctivos a maquinaria , equipos  y edificios al 95%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Cumplimiento de manttos preventivos a maquinaria , equipos  y edificios al 100%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "No presentar hallazgos en auditorias de clientes o sistema de gestion",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Asegurar la comunicación oportuna entre jefe y gerente de planta",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Cumplimiento del 100% con sus auditorias  LPA programadas",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_JEFE_PROCESO: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Supervisar y gestionar procesos de producción al 85 % (arranques, productividad, ciclos, parámetros de proceso, etc.)",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Supervisar y gestionar scrap de procesos de producción 11500 ppm",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Supervisar y gestionar al 58% OEE de producción.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Validar el 100% de pruebas de proyectos nuevos (desde arranque de moldes nuevos hasta su liberación total).",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Coordinar el 100% pruebas de resina, cambios de ingeniería, moldes, etc.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "El 100% de monitoreo del proceso de inyección (parámetros)",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "El 100 % de monitoreo de equipo periférico del proceso de producción (deshumidificadores, termorreguladores, temperatura de molde, etc.)",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_JEFE_PRODUCCION: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Supervisar y gestionar procesos de producción al 85 % (arranques, productividad, ciclos, parámetros de proceso, etc.)",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Supervisar y gestionar scrap de procesos de producción 11500 ppm.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Supervisar y gestionar al 58% OEE de producción.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Validar el 100% de pruebas de proyectos nuevos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Coordinar el 100% pruebas de resina, cambios de ingenieria, moldes, etc.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "El 100% de control y supervisión del talento humano que forma parte del equipo de trabajo de producción.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "Aplicar el 100 % de la metodología de 5's en producción.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "Conocer e implementar al 100% la matriz de aspectos ambientales (RG-SEG-006).",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_JEFE_RECURSOS_HUMANOS: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Cubrir las vacantes en un máximo de 15 días promedio por mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Cumplir el 90% del plan de capacitación mensual definido",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Cumplir al menos el 90% promedio en las calificaciones de los cursos impartidos durante el mes.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Mantener una rotación máxima de 11% mensual",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Mantener un % de asistencia del 96% mínimo mensual",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Tener máximo 2 accidentes por mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "Tener 0 errores en el proceso de prenómina",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "Cumplir el 100% de actividades del check list de cumplimiento legal programadas por mes.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 9,
        descripcion: "Cumplir el 100% de los planes de formación del área de Recursos Humanos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 10,
        descripcion: "Seguimiento al envío de requerimientos REPSE por parte de los proveedores de servicio de RRHH",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_JEFE_TALLER_MOLDES: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Cumplimiento de manttos preventivos a moldes del 100%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "No presentar hallazgos en auditorias de clientes o sistema de gestion",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Asegurar la comunicación oportuna entre jefe y gerente de planta",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Cumplimiento 100% con sus auditorias  LPA",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Mantener vigente y actualizada al 100% la base de datos de talleres externos con su respectiva evaluacion con el objetivo de conocer el alcance de c/u de ellos.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_SUPERVISOR_ACABADOS: Objetivo[] = [
    {
        numero: 1,
        descripcion: "95% de cumplimiento de entrega de material por ventanas",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "100% de cumplimiento en rotación de actividades para personal",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Realizar y mantener 5´S al 100% en su área de trabajo",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Cumplimiento 100% con sus auditorias  LPA",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "No presentar hallazgos en auditorias de clientes o sistema de gestión",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_SUPERVISOR_MONTAJE: Objetivo[] = [
    {
        numero: 1,
        descripcion: "No presentar hallazgos en auditorias de clientes o sistema de gestion",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Cumplimiento del programa de produccion al 98% en montaje y desmontaje de moldes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Verificar y validar el 100% de la hoja de moldeo de produccion de acuerdo a los requerimientos y especificaciones",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Realizar el 100% de los check list de montaje y desmontaje de moldes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Realizar y mantener 5´S al 100% en su área de trabajo",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_ANALISTA_CAPACITACION: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Cumplimiento de la matriz de habilidades de todos los ocupantes de los puestos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Cumplir el 90% del plan de capacitación mensual definido",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Cumplir al menos el 90% en la eficiencia de capacitación por mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Aplicar las evaluaciones de categorías a las personas correspondientes, según la frecuencia definida para cada categoría, de manera mensual",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Mantener los registros de capacitación actualizados al 100% de manera semanal, conforme el avance del programa mensual de capacitación",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Cumplir con el 100% de documentos legales requeridos por la autoridad laboral conforme al programa mensual",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "Realizar la medición de indicadores mensuales máximo el día 9 de cada mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "Cumplir el 100% del programa de comunicación interna definido por mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 9,
        descripcion: "Definir acciones correctivas en caso de incumplimiento a los objetivos mensuales de capacitación y completarlas conforme las fechas definidas.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 10,
        descripcion: "Entregar las evaluaciones mensuales del personal de nuevo ingreso máximo 1 día después del cumplimiento de los meses 1 y 2 y 1 semana antes para el mes 3",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_ASISTENTE_PRODUCCION: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Supervisar y coordinar la realización del docuemento OEE mensualmente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Supervisar y actualizar documentos de producción (mapa de tortuga, FODA, matriz de riesgos, carta de indicadores)",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Gestionar los reportes de 8D´S del área de producción desde junta de apertura hasta su cierre",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "No presentar hallazgos en auditorías de clientes o sistema de gestión",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_ANALISTA_RECLUTAMIENTO: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Cubrir las vacantes en un máximo de 15 días promedio por mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Cumplir  mínimo el 70% del perfil requerido por el puesto de las personas contratadas por mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Integrar el 100% de expedientes completos y con la información correcta en los documentos de contratación y registros internos.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Cumplimiento de 13 ingresos por mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_ANALISTA_RECURSOS_HUMANOS: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Tasa de Rotación 3er turno",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Tiempo de resolución de solicitudes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Índice de Satisfacción del Colaborador",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Tasa de ausentismo del 3er turno ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Objetivo menor a 3 incidentes por mes- Número Incidentes de incumplimiento de RIT o de seguridad y calidad",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "100% de cumplimiento en entrega de RG-REC-048",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "100% de cumplimiento en entrega de evaluaciones de desempeño de nuevos ingreso y semestrales",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "Cumplir el 90% del plan de capacitación mensual definido",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_ANALISTA_SEGURIDAD_HIGIENE: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Tasa de Cumplimiento Normativo -Cumplir el 100% del programa de seguridad definido por mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Emitir un informe semanal de los hallazgos de seguridad, salud y medio ambiente y dar seguimiento para el cierre de hallazgos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Emitir un informe semanal del cumplimiento al uso de EPP por áreas",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Emitir un informe mensual de la auditoría de 5´s y difundir resultados a todo el personal",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Emitir un informe mensual del cumplimiento de objetivos de medio ambiente y comunicarlo a todos los trabajadores",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Elaborar y completar un plan de acciones correctivas por cada accidente ocurrido durante cada mes  y dar seguimiento para el cierre de acciones",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "Realizar la medición de indicadores mensuales máximo el día 9 de cada mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "Definir acciones correctivas en caso de incumplimiento a los objetivos mensuales de seguridad e higiene y completarlas conforme las fechas definidas",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 9,
        descripcion: "Porcentaje de Cumplimiento del Plan de Capacitación en los cursos de seguridad e higiene",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 10,
        descripcion: "Cumplir el 100% del programa de comunicación interna definido por mes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_ASISTENTE_RECURSOS_HUMANOS: Objetivo[] = [
    {
        numero: 1,
        descripcion: "100% de cumplimiento en captura de Incidencias",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Número de Ajustes en Nómina",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "100% de cumplimiento de entrega en tiempo y forma ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Tiempo de resolución de solicitudes",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Seguimiento al cumplimiento de la aplicación de sanciones y retardos en base a la política de asistencia",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Índice de Satisfacción del Colaborador",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "100% de recibos firmados de prestaciones (prima vacacional, aguinaldo y PTU) máximo una semana después del cierre de cada nómina",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "100% de finiquitos escaneados máximo una semana después del cierre de cada nómina y el regreso de cheques no entregados (15 dias)",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 9,
        descripcion: "100% de entrega de tarjetas de vales de despensa antes del depósito de cada mes y regresar las tarjetas no entregadas",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 10,
        descripcion: "No contar con incidencias en falta de suministros",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_AUXILIAR_ADMINISTRATIVO_ALMACEN: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Elaborar el 100% de las facturas generadas diariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Control y archivos de documentos de PEPS, traspasos, ingresos de materiales, materia prima",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Controlar inventarios y registro de los traspasos al 100% diariamente ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Portar el 100% de su equipo de EPP, asi como su uniformidad diariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Cumplir el 100% de las acciones Correctivas  derivadas de auditorias en las fechas acordadas",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_AUXILIAR_ADMINISTRATIVO_MANTENIMIENTO: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Entregar indicadores en tiempo y forma al área del SGI",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Asegurar el control de las refacciones en general. Incluyendo las refacciones que no estan dentro del inventario",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "No presentar hallazgos en auditorías de clientes o sistema de gestión",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_AUXILIAR_METROLOGIA: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Cumplimiento 100% con sus auditorías  LPA",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "No presentar hallazgos en auditorías de clientes o sistema de gestión",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Realizar y mantener 5´S al 100% en su área de trabajo",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Cumplir con el 100% del programa de calibración",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Cubrir con el 95 % del Time en las fechas establecidas",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "Cobertura del 100% de uso de equipos crÍticos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "Elaboración del 100% de métodos de medición",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 9,
        descripcion: "Cumplimiento del 100% de R&R de equipos de medición",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 10,
        descripcion: "Cobertura de plantilla al 100% en equipos críticos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_AUXILIAR_PROYECTOS: Objetivo[] = [
    {
        numero: 1,
        descripcion: "100%  Cumplimiento de envío de timing actualizado a cliente semanalmente (viernes o sábado)",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "100% Seguimiento de proyecto llámese transferencia o fabricación de molde, ECN o Refurbish. Envío de minutas, respuestas a cliente, seguimiento de tryouts, etc.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "100% Seguimiento y difusión semanal  de la   Actividad de seguimiento en el área  de proyectos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "100 % Aprobación de PPAP en el tiempo comprometido con cliente y entrega de proyecto liberado",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "0% de faltas en juntas programadas con cliente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "0% de retrasos en timing de proyectos provocado por falta de seguimiento de Viñoplastic",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_AUXILIAR_SGI: Objetivo[] = [
    {
        numero: 1,
        descripcion: "100% en cambios de documentación mensual",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Cierre de planes de acción por auditorías internas/externas",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Seguimiento al programa de auditorías producto-proceso, materia prima y producto terminado y LPA´S ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "100% en capacitaciones de inducción",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Seguimiento a acciones correctivas por 8D´S",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_AUXILIAR_PROGRAMADOR: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Implementacion  de Modulos Faltantes en 2026",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "30 minutos maximo de Tiempo de solucion de problemas RPS",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const _OBJETIVOS_SUPERVISOR_LOGISTICA: Objetivo[] = [
    {
        numero: 1,
        descripcion: "100% Entregas a Tiempo",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "98% satisfaccion del cliente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "No conformidades Mayores en Auditorias de SGC",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_INGENIERO_PROYECTOS: Objetivo[] = [
    {
        numero: 1,
        descripcion: "100%  Cumplimiento de envío de timing actualizado a cliente semanalmente (viernes o sábado)",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "100% Seguimiento de proyecto llámese transferencia o fabricación de molde, ECN o Refurbish. Envío de minutas, respuestas a cliente, seguimiento de tryouts, etc.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "100% Seguimiento y difusión semanal  de la   Actividad de seguimiento en el área  de proyectos.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "100 % Aprobación de PPAP en el tiempo comprometido con cliente y entrega de proyecto liberado.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "0% de faltas en juntas programadas con cliente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "0% de retrasos en timing de proyectos provocado por falta de seguimiento de Viñoplastic.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_RECIBO: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Cumplimiento 100% con sus auditorías  LPA",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "No presentar hallazgos en auditorías de clientes o sistema de gestión ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Realizar y mantener 5´S al 100% en su área de trabajo ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Liberación e identificación del 100% de materia prima",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Envio del 100% de certificados/Reportes de calidad a cliente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "Liberación del material dentro de las primeras 20 hrs",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "Cumplimiento del 100% de pruebas de Melt flow ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 9,
        descripcion: "Igual o menor a 30 días de permanencia de materiales en cuarentena",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 10,
        descripcion: "100 % de realización de pruebas de flamabilidad ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_PLANEADOR_PRODUCCION: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Programar los herramentales que tenemos en los tracking o programas de producción de los diferentes clientes en tiempo y forma ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Planear la totalidad de los números de parte que se tienen en los tracking o programas de producción ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Programar las pruebas solictadas por el área de proyectos (cambio de ingeniería, cambio de resina, master batch, doe´s, etc)",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Realizar estudio de capacidad mensualmente, respecto a la carga de trabajo demandada por los diferentes clientes ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "No presentar hallazgos en auditorías de clientes o sistema de gestión",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente ",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_LIDER_COTIZACIONES: Objetivo[] = [
    {
        numero: 1,
        descripcion: "100%  Cumplimiento de envío de timing actualizado a cliente semanalmente (viernes o sábado)",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "100% Seguimiento de proyecto llámese transferencia o fabricación de molde, ECN o Refurbish. Envío de minutas, respuestas a cliente, seguimiento de tryouts, etc.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "100% Seguimiento y difusión semanal  de la   Actividad de seguimiento en el área  de proyectos.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "100 % Aprobación de PPAP en el tiempo comprometido con cliente y entrega de proyecto liberado",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "0% de faltas en juntas programadas con cliente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "0% de retrasos en timing de proyectos provocado por falta de seguimiento de Viñoplastic.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_LIDER_PROYECTOS: Objetivo[] = [
    {
        numero: 1,
        descripcion: "100%  Cumplimiento de envío de timing actualizado a cliente semanalmente (viernes o sábado)",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "100% Seguimiento de proyecto llámese transferencia o fabricación de molde, ECN o Refurbish. Envío de minutas, respuestas a cliente, seguimiento de tryouts, etc.",
        resultado: "",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "100% Seguimiento y difusión semanal  de la   Actividad de seguimiento en el área  de proyectos.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "100 % Aprobación de PPAP en el tiempo comprometido con cliente y entrega de proyecto liberado",
        resultado: "",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "0% de faltas en juntas programadas con cliente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "0% de retrasos en timing de proyectos provocado por falta de seguimiento de Viñoplastic.",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];


const _OBJETIVOS_AUXILIAR_CALIDAD: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Igual o menor a 3 reclamaciones atribuibles a calidad",
        resultado: "3",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Realizar y mantener 5´S al 100% en su área de trabajo",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Cumplimiento 100% con sus auditorías  LPA",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "No presentar hallazgos en auditorías de clientes o sistema de gestión",
        resultado: "0",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "0 paros de líneas atribuibles a calidad",
        resultado: "0",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "100% de liberación de producto terminado en linea de producción",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "100% de cumplimiento al procedimiento de control de producto no conforme",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

const _OBJETIVOS_RESIDENTE_CALIDAD: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Igual o menor a 3 reclamaciones atribuibles a contención NOK de residente",
        resultado: "3",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Realizar y mantener 5´S al 100% en su área de trabajo",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad diariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
];

const OBJETIVOS_AUXILIAR_DE_SUPERVISOR: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Realizar paros de máquinas cuando se detecten 5 piezas consecutivas",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 2,
        descripcion: "Evitar paro de máquina porque los productos no cumplen los lineamientos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 3,
        descripcion: "Asegurar cantidad de producción al 100%",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Llenado del reporte de producción correctamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Portar el 100% de su equipo de EPP y uniformidad dirariamente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 6,
        descripcion: "Asegurar el 100% de la capacitacion al personal operativo a pie de maquina, llenando el formato correspondiente",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 7,
        descripcion: "Relevar en maquina el 100% (comidas, sanitarios, falta de personal)",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 8,
        descripcion: "Asegurar al 100% contar con el material para entregar a linea de produccion",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 9,
        descripcion: "Evitar al 100% acumulaciones y rechazos",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];

export const _OBJETIVOS_CHOFER: Objetivo[] = [
    {
        numero: 1,
        descripcion: "Cumplir con limpieza de unidades",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },{
         numero: 2,
        descripcion: "Cumplir con el llenado de check list de unidades",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },{
        numero: 3,
        descripcion: "Cumplir con el mantenimiento de unidades",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 4,
        descripcion: "Planificar tiempos y movimientos de rutas",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    },
    {
        numero: 5,
        descripcion: "Cumplimiento a normas de seguridad y regulaciones",
        resultado: "100%",
        porcentaje: "",
        comentarios: "",
    }
];


export const OBJETIVOS_POR_PUESTO: Record<string, Objetivo[]> = {
    /*GERENCIAS*/
    "GERENTE DE PLANTA": _OBJETIVOS_GERENTE_PLANTA,
    "GERENTE DE PRODUCCIÓN": _OBJETIVOS_GERENTE_PRODUCCION,
    "GERENTE DE PROYECTOS": _OBJETIVOS_GERENTE_PROYECTOS,
    /*PRODUCCIÓN */
    "JEFE DE PROCESO": _OBJETIVOS_JEFE_PROCESO,
    "JEFE DE PRODUCCIÓN": _OBJETIVOS_JEFE_PRODUCCION,
    "ASISTENTE DE PRODUCCIÓN A": _OBJETIVOS_ASISTENTE_PRODUCCION,
    "ASISTENTE DE PRODUCCIÓN B": _OBJETIVOS_ASISTENTE_PRODUCCION,
    "OPERADOR DE MÁQUINA A": _OBJETIVOS_OPERADOR_MAQUINA,
    "OPERADOR DE MÁQUINA B": _OBJETIVOS_OPERADOR_MAQUINA,
    "OPERADOR DE MÁQUINA C": _OBJETIVOS_OPERADOR_MAQUINA,
    "OPERADOR DE MÁQUINA D": _OBJETIVOS_OPERADOR_MAQUINA,
    "AUXILIAR DE BÁSCULA A": _OBJETIVOS_AUXILIAR_BASCULA,
    "AUXILIAR DE BÁSCULA B": _OBJETIVOS_AUXILIAR_BASCULA,
    "AUXILIAR DE SUPERVISOR A": _OBJETIVOS_AUXILIAR_SUPERVISOR,
    "AUXILIAR DE SUPERVISOR B": _OBJETIVOS_AUXILIAR_SUPERVISOR,
    "CAPTURISTA RPS A": _OBJETIVOS_CAPTURISTA_RPS,
    "CAPTURISTA RPS B": _OBJETIVOS_CAPTURISTA_RPS,
    "CHECK LIST A": _OBJETIVOS_CHECK_LIST,
    "CHECK LIST B": _OBJETIVOS_CHECK_LIST,
    "MATERIALISTA A": _OBJETIVOS_MATERIALISTA,
    "MATERIALISTA B": _OBJETIVOS_MATERIALISTA,
    "PREPARADOR A": _OBJETIVOS_PREPARADOR,
    "PREPARADOR B": _OBJETIVOS_PREPARADOR,
    "AUXILIAR DE SCRAP A": _OBJETIVOS_AUXILIAR_SCRAP,
    "AUXILIAR DE SCRAP B": _OBJETIVOS_AUXILIAR_SCRAP,
    "SUPERVISOR DE MONTAJE": _OBJETIVOS_SUPERVISOR_MONTAJE,
    "MONTADOR DE MOLDES A": _OBJETIVOS_MONTADOR_MOLDES,
    "MONTADOR DE MOLDES B": _OBJETIVOS_MONTADOR_MOLDES,
    "MONTADOR DE MOLDES C": _OBJETIVOS_MONTADOR_MOLDES,
    "MONTADOR DE MOLDES D": _OBJETIVOS_MONTADOR_MOLDES,
    "SUPERVISOR DE PRODUCCIÓN A": _OBJETIVOS_SUPERVISOR_PRODUCCION,
    "SUPERVISOR DE PRODUCCIÓN B": _OBJETIVOS_SUPERVISOR_PRODUCCION,
    "SUPERVISOR DE PRODUCCIÓN C": _OBJETIVOS_SUPERVISOR_PRODUCCION,
    "SUPERVISOR DE PRODUCCIÓN D": _OBJETIVOS_SUPERVISOR_PRODUCCION,
    "INGENIERO DE PROCESO A": _OBJETIVOS_INGENIERO_PROCESO,
    "INGENIERO DE PROCESO B": _OBJETIVOS_INGENIERO_PROCESO,
    "INGENIERO DE PROCESO C": _OBJETIVOS_INGENIERO_PROCESO,
    "INGENIERO DE PROCESO D": _OBJETIVOS_INGENIERO_PROCESO,
    "PLANEADOR DE PRODUCCIÓN": _OBJETIVOS_PLANEADOR_PRODUCCION,
    /*CALIDAD */
    "GERENTE DE CALIDAD": _OBJETIVOS_GERENTE_CALIDAD,
    "INSPECTOR DE CALIDAD A": _OBJETIVOS_INSPEC,
    "INSPECTOR DE CALIDAD B": _OBJETIVOS_INSPEC,
    "INSPECTOR DE CALIDAD C": _OBJETIVOS_INSPEC,
    "INSPECTOR DE CALIDAD D": _OBJETIVOS_INSPEC,
    "INSPECTOR RECIBO": _OBJETIVOS_RECIBO,
    "INGENIERO DE CALIDAD A": _OBJETIVOS_INGENIERO_CALIDAD,
    "INGENIERO DE CALIDAD B": _OBJETIVOS_INGENIERO_CALIDAD,
    "INGENIERO DE CALIDAD C": _OBJETIVOS_INGENIERO_CALIDAD,
    "INGENIERO DE CALIDAD D": _OBJETIVOS_INGENIERO_CALIDAD,
    "METRÓLOGO A": _OBJETIVOS_METROLOGO,
    "METRÓLOGO B": _OBJETIVOS_METROLOGO,
    "METRÓLOGO C": _OBJETIVOS_METROLOGO,
    "METRÓLOGO D": _OBJETIVOS_METROLOGO,
    "AUXILIAR DE METROLOGÍA": _OBJETIVOS_AUXILIAR_METROLOGIA,
    "AUXILIAR DE CALIDAD": _OBJETIVOS_AUXILIAR_CALIDAD,
    "SUPERVISOR DE ACABADOS - GP12 A": _OBJETIVOS_SUPERVISOR_ACABADOS,
    "SUPERVISOR DE ACABADOS - GP12 B": _OBJETIVOS_SUPERVISOR_ACABADOS,
    "SUPERVISOR DE ACABADOS - GP12 C": _OBJETIVOS_SUPERVISOR_ACABADOS,
    "SUPERVISOR DE ACABADOS - GP12 D": _OBJETIVOS_SUPERVISOR_ACABADOS,
    "OPERADOR DE ACABADOS - GP12 A": _OBJETIVOS_OPERADOR_ACABADOS,
    "OPERADOR DE ACABADOS - GP12 B": _OBJETIVOS_OPERADOR_ACABADOS,
    "OPERADOR DE ACABADOS - GP12 C": _OBJETIVOS_OPERADOR_ACABADOS,
    "OPERADOR DE ACABADOS - GP12 D": _OBJETIVOS_OPERADOR_ACABADOS,
    "RESIDENTE DE CALIDAD A": _OBJETIVOS_RESIDENTE_CALIDAD,
    "RESIDENTE DE CALIDAD B": _OBJETIVOS_RESIDENTE_CALIDAD,
    "RESIDENTE DE CALIDAD C": _OBJETIVOS_RESIDENTE_CALIDAD,
    "RESIDENTE DE CALIDAD D": _OBJETIVOS_RESIDENTE_CALIDAD,
    /*TALLER DE MOLDES*/
    "JEFE DE TALLER DE MOLDES": _OBJETIVOS_JEFE_TALLER_MOLDES,
    "TÉCNICO DE MOLDES A": _OBJETIVOS_TECNICO_MOLDES,
    "TÉCNICO DE MOLDES B": _OBJETIVOS_TECNICO_MOLDES,
    "TÉCNICO DE MOLDES C": _OBJETIVOS_TECNICO_MOLDES,
    "TÉCNICO DE MOLDES D": _OBJETIVOS_TECNICO_MOLDES,
    "TÉCNICO DE MOLDES E": _OBJETIVOS_TECNICO_MOLDES,
    "AUXILIAR ADMINISTRATIVO DE TALLER DE MOLDES": _OBJETIVOS_AUXILIAR_TALLER_MOLDES,
    /*MANTENIMIENTO*/
    "JEFE DE MANTENIMIENTO": _OBJETIVOS_JEFE_MANTENIMIENTO,
    "AUXILIAR ADMINISTRATIVO DE MANTENIMIENTO": _OBJETIVOS_AUXILIAR_ADMINISTRATIVO_MANTENIMIENTO,
    "TÉCNICO DE MANTENIMIENTO A": _OBJETIVOS_TECNICO_MANTENIMIENTO,
    "TÉCNICO DE MANTENIMIENTO B": _OBJETIVOS_TECNICO_MANTENIMIENTO,
    "TÉCNICO DE MANTENIMIENTO C": _OBJETIVOS_TECNICO_MANTENIMIENTO,
    "TÉCNICO DE MANTENIMIENTO D": _OBJETIVOS_TECNICO_MANTENIMIENTO,
    "TÉCNICO DE MANTENIMIENTO E": _OBJETIVOS_TECNICO_MANTENIMIENTO,
    "AUXILIAR DE MANTENIMIENTO A": _OBJETIVOS_AUXILIAR_MANTENIMIENTO,
    "AUXILIAR DE MANTENIMIENTO B": _OBJETIVOS_AUXILIAR_MANTENIMIENTO,
    "AUXILIAR DE MANTENIMIENTO C": _OBJETIVOS_AUXILIAR_MANTENIMIENTO,
    "TECNICO DE MANTENIMIENTO DE EDIFICIOS A": _OBJETIVOS_TECNICO_EDIFICIOS,
    "TECNICO DE MANTENIMIENTO DE EDIFICIOS B": _OBJETIVOS_TECNICO_EDIFICIOS,
    "TÉCNICO ESPECIALISTA DE MANTENIMIENTO A": _OBJETIVOS_TECNICO_ESPECIALISTA_MANTENIMIENTO,
    "TÉCNICO ESPECIALISTA DE MANTENIMIENTO B": _OBJETIVOS_TECNICO_ESPECIALISTA_MANTENIMIENTO,
    /*ALMACÉN*/
    "JEFE DE ALMACÉN": _OBJETIVOS_JEFE_ALMACEN,
    "AUXILIAR ADMINISTRATIVO DE ALMACÉN A": _OBJETIVOS_AUXILIAR_ADMINISTRATIVO_ALMACEN,
    "AUXILIAR ADMINISTRATIVO DE ALMACÉN B": _OBJETIVOS_AUXILIAR_ADMINISTRATIVO_ALMACEN,
    "AUXILIAR ADMINISTRATIVO DE ALMACÉN C": _OBJETIVOS_AUXILIAR_ADMINISTRATIVO_ALMACEN,
    "AUXILIAR ADMINISTRATIVO DE ALMACÉN D": _OBJETIVOS_AUXILIAR_ADMINISTRATIVO_ALMACEN,
    "ALMACENISTA DE MATERIA PRIMA": _OBJETIVOS_ALMACENISTA_MATERIA_PRIMA,
    "AUXILIAR DE ALMACÉN A": _OBJETIVOS_AUXILIAR_ALMACEN,
    "AUXILIAR DE ALMACÉN B": _OBJETIVOS_AUXILIAR_ALMACEN,
    "AUXILIAR DE ALMACÉN C": _OBJETIVOS_AUXILIAR_ALMACEN,
    "AUXILIAR DE ALMACÉN D": _OBJETIVOS_AUXILIAR_ALMACEN,
    "AUXILIAR DE ALMACÉN E": _OBJETIVOS_AUXILIAR_ALMACEN,
    "CHOFER A": _OBJETIVOS_CHOFER,
    "CHOFER B": _OBJETIVOS_CHOFER,
    "CHOFER C": _OBJETIVOS_CHOFER,
    /* SISTEMAS */
    "COORDINADOR DE RPS": _OBJETIVOS_COORDINADOR_RPS,
    "AUXILIAR PROGRAMADOR": _OBJETIVOS_AUXILIAR_PROGRAMADOR,
    /* SGI */
    "COORDINADOR DEL SGI": _OBJETIVOS_SGI,
    "AUXILIAR DEL SGI A": _OBJETIVOS_AUXILIAR_SGI,
    "AUXILIAR DEL SGI B": _OBJETIVOS_AUXILIAR_SGI,
    "AUXILIAR DEL SGI C": _OBJETIVOS_AUXILIAR_SGI,
    "AUXILIAR DEL SGI D": _OBJETIVOS_AUXILIAR_SGI,
    /* RECURSOS HUMANOS */
    "JEFE DE RECURSOS HUMANOS": _OBJETIVOS_JEFE_RECURSOS_HUMANOS,
    "COORDINADOR DE RECLUTAMIENTO Y SELECCIÓN": _OBJETIVOS_COORDINADOR_RECLUTAMIENTO,
    "ANALISTA DE CAPACITACIÓN": _OBJETIVOS_ANALISTA_CAPACITACION,
    "ANALISTA DE RECLUTAMIENTO Y SELECCIÓN A": _OBJETIVOS_ANALISTA_RECLUTAMIENTO,
    "ANALISTA DE RECLUTAMIENTO Y SELECCIÓN B": _OBJETIVOS_ANALISTA_RECLUTAMIENTO,
    "ANALISTA DE RECLUTAMIENTO Y SELECCIÓN C": _OBJETIVOS_ANALISTA_RECLUTAMIENTO,
    "ANALISTA DE RECLUTAMIENTO Y SELECCIÓN D": _OBJETIVOS_ANALISTA_RECLUTAMIENTO,
    "ANALISTA DE RECURSOS HUMANOS": _OBJETIVOS_ANALISTA_RECURSOS_HUMANOS,
    "ANALISTA DE SEGURIDAD E HIGIENE": _OBJETIVOS_ANALISTA_SEGURIDAD_HIGIENE,
    "ASISTENTE DE RECURSOS HUMANOS": _OBJETIVOS_ASISTENTE_RECURSOS_HUMANOS,
    "AUXILIAR DE LIMPIEZA A": _OBJETIVOS_AUXILIAR_LIMPIEZA,
    "AUXILIAR DE LIMPIEZA B": _OBJETIVOS_AUXILIAR_LIMPIEZA,
    /* LOGISTICA */
    "JEFE DE LOGISTICA": _OBJETIVOS_LOGISTICA,
    "SUPERVISOR DE LOGISTICA": _OBJETIVOS_SUPERVISOR_LOGISTICA,
    /* PROYECTOS */
    "AUXILIAR DE PROYECTOS": _OBJETIVOS_AUXILIAR_PROYECTOS,
    "INGENIERO DE PROYECTOS A": _OBJETIVOS_INGENIERO_PROYECTOS,
    "INGENIERO DE PROYECTOS B": _OBJETIVOS_INGENIERO_PROYECTOS,
    "INGENIERO DE PROYECTOS C": _OBJETIVOS_INGENIERO_PROYECTOS,
    "INGENIERO DE PROYECTOS D": _OBJETIVOS_INGENIERO_PROYECTOS,
    "LIDER DE PROYECTOS A": _OBJETIVOS_LIDER_PROYECTOS,
    "LIDER DE PROYECTOS B": _OBJETIVOS_LIDER_PROYECTOS,
    "LÍDER DE PROYECTOS C": _OBJETIVOS_LIDER_PROYECTOS,
    "LIDER DE PROYECTOS C": _OBJETIVOS_LIDER_PROYECTOS,
    "LIDER DE PROYECTOS D": _OBJETIVOS_LIDER_PROYECTOS,
    "LIDER DE COTIZACIONES": _OBJETIVOS_LIDER_COTIZACIONES,
};



// ═══════════════════════════════════════════════════════════════
// CÁLCULOS DE PONDERACIÓN
// ═══════════════════════════════════════════════════════════════

export interface ResultadoPonderacion {
    promedioParte1: number;
    ponderadoParte1: number;
    promedioParte2: number;
    ponderadoParte2: number;
    promedioParte3: number;
    ponderadoParte3: number;
    calificacionFinal: number;
}

/**
 * Esta funcion calcula la calificacion final de desempeño.
 * Divide la evaluacion en tres partes, cada una con un "peso" especifico (ponderacion):
 * 1. Objetivos (Vale el 40%)
 * 2. Cumplimiento de responsabilidades (Vale el 30%)
 * 3. Competencias (Vale el 30%)
 */
export function calcularPonderacion(data: DesempenoData): ResultadoPonderacion {
    // --- Parte 1: Objetivos (40% de la nota final) ---

    // 1. Extraemos los porcentajes de la lista de objetivos.
    // Convertimos el texto a numeros con parseFloat y filtramos cualquier valor que no sea un numero valido.
    const objVals = data.objetivos
        .map((o) => parseFloat(o.porcentaje))
        .filter((v) => !isNaN(v));

    // 2. Calculamos el promedio de los objetivos.
    // Si la persona tiene objetivos (length > 0), los sumamos todos (reduce) y dividimos entre la cantidad.
    // Si no tiene objetivos, asignamos un 0 para evitar errores de division entre cero.
    const promedioParte1 =
        objVals.length > 0
            ? objVals.reduce((s, v) => s + v, 0) / objVals.length
            : 0;

    // 3. Aplicamos la ponderacion del 40%.
    // Multiplicamos el promedio por 0.4 y redondeamos el resultado a un numero entero.
    const ponderadoParte1 = Math.round(promedioParte1 * 0.4);

    // --- Parte 2: Cumplimiento de Responsabilidades (30% de la nota final) ---

    // 1. Funcion auxiliar para interpretar los datos de cumplimiento.
    // Sirve para traducir texto a calificaciones numericas o pasar numeros directos.
    const parseCumplimiento = (val: string): number | null => {
        // Limpiamos el texto de espacios extra y lo pasamos a mayusculas
        const upper = val.toUpperCase().trim();
        if (upper === "CUMPLE") return 100; // "CUMPLE" equivale a un 100% perfecto
        if (upper === "NO CUMPLE") return 0; // "NO CUMPLE" equivale a un 0%
        if (upper === "NA" || upper === "") return null; // Si no aplica o esta vacio, se ignora

        // Si no es texto, intentamos leerlo como un numero normal
        const num = parseFloat(val);
        return isNaN(num) ? null : num; // Si la lectura falla, retornamos nulo
    };

    // 2. Aplicamos la funcion traductora a todas las responsabilidades.
    // Luego, filtramos (eliminamos) todos los resultados nulos o "NA" para que no afecten el calculo.
    const cumpVals = data.cumplimiento_responsabilidades
        .map((c) => parseCumplimiento(c.porcentaje))
        .filter((v): v is number => v !== null);

    // 3. Calculamos el promedio del cumplimiento.
    const promedioParte2 =
        cumpVals.length > 0
            ? cumpVals.reduce((s, v) => s + v, 0) / cumpVals.length
            : 0;

    // 4. Aplicamos la ponderacion del 30%.
    // Multiplicamos por 0.3 y redondeamos a un entero.
    const ponderadoParte2 = Math.round(promedioParte2 * 0.3);

    // --- Parte 3: Competencias (30% de la nota final) ---

    // 1. Extraemos las competencias y las convertimos a porcentaje base 100.
    // Primero descartamos las que tienen calificacion 0 (probablemente aun no evaluadas).
    // Se asume que las competencias se califican del 1 al 4. Al dividir entre 4 y multiplicar por 100,
    // una nota de 4 se convierte en 100%, una de 2 en 50%, etc.
    const compVals = data.competencias
        .filter((c) => c.calificacion > 0)
        .map((c) => (c.calificacion / 4) * 100);

    // 2. Calculamos el promedio de las competencias.
    const promedioParte3 =
        compVals.length > 0
            ? compVals.reduce((s, v) => s + v, 0) / compVals.length
            : 0;

    // 3. Aplicamos la ponderacion final del 30%.
    // Multiplicamos por 0.3 y redondeamos a un entero.
    const ponderadoParte3 = Math.round(promedioParte3 * 0.3);

    // --- Resultado Final ---

    // Devolvemos un objeto estructurado.
    // Incluye los promedios puros de cada seccion (redondeados), los puntos aportados por cada seccion ya ponderada,
    // y la calificacion global sumando las tres partes (que maximo dara 100 puntos).
    return {
        promedioParte1: Math.round(promedioParte1),
        ponderadoParte1,
        promedioParte2: Math.round(promedioParte2),
        ponderadoParte2,
        promedioParte3: Math.round(promedioParte3),
        ponderadoParte3,
        calificacionFinal: ponderadoParte1 + ponderadoParte2 + ponderadoParte3,
    };
}

// ═══════════════════════════════════════════════════════════════
// DATA INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface DesempenoData {
    numero_empleado: string;
    nombre: string;
    puesto: string;
    evaluador_nombre: string;
    evaluador_puesto: string;
    tipo: DesempenoTipo;
    periodo: string;
    objetivos: Objetivo[];
    cumplimiento_responsabilidades: CumplimientoItem[];
    competencias: Competencia[];
    compromisos: string;
    fecha_revision: string;
    observaciones: string;
    calificacion_final: number;
    incidencias?: IncidenciaResumen[];
}
