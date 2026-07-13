
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
// DEFAULTS & CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const UMBRAL_CALIFICACION_APROBATORIA = 80;

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

export enum CumplimientoOperativoIndex {
    Compromisos = 0,
    Reglamento = 1,
    Asistencia = 2,
    Puntualidad = 3,
    Permisos = 4,
}

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
