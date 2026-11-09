export interface EmployeeDayCountRow {
  numero_empleado: string
  dia: number
  cantidad: number
}

export interface EmployeeDayCountMonthImport {
  mes: string
  empleados: number
  registros: EmployeeDayCountRow[]
  totalCount: number
}

export interface EmployeeDayCountImport {
  meses: EmployeeDayCountMonthImport[]
  registrosEmpleadoMes: number
  totalCount: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number)
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
}

function parseCount(value: unknown, employeeNumber: string, day: string): number {
  const isNumericString = typeof value === "string" && /^\d+$/.test(value)
  if ((!isNumericString && typeof value !== "number") || !Number.isSafeInteger(Number(value))) {
    throw new Error(`El día ${day} del empleado ${employeeNumber} debe tener un conteo entero válido.`)
  }

  const count = Number(value)
  if (count < 0) {
    throw new Error(`El día ${day} del empleado ${employeeNumber} no puede tener un conteo negativo.`)
  }
  if (count > 2_147_483_647) {
    throw new Error(`El conteo del día ${day} para el empleado ${employeeNumber} excede el límite permitido.`)
  }
  return count
}

export function parseEmployeeDayCountJson(json: string): EmployeeDayCountImport {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error("JSON inválido. Revisa el formato del archivo.")
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("El archivo debe ser un arreglo JSON con al menos un empleado.")
  }

  const months = new Map<string, {
    employees: Set<string>
    registros: EmployeeDayCountRow[]
    totalCount: number
  }>()
  const employeeMonths = new Set<string>()
  let totalCount = 0

  for (const [index, rawRecord] of parsed.entries()) {
    if (!isRecord(rawRecord)) {
      throw new Error(`El registro ${index + 1} debe ser un objeto JSON.`)
    }

    const numeroEmpleado = rawRecord.numero_empleado
    const mes = rawRecord.mes
    if (typeof numeroEmpleado !== "string" || !numeroEmpleado.trim()) {
      throw new Error(`El registro ${index + 1} requiere un numero_empleado de texto.`)
    }
    if (typeof mes !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
      throw new Error(`El mes del registro ${index + 1} debe usar el formato YYYY-MM.`)
    }

    const employee = numeroEmpleado.trim()
    const employeeMonth = `${mes}\0${employee}`
    if (employeeMonths.has(employeeMonth)) {
      throw new Error(`El empleado ${employee} aparece más de una vez en ${mes}.`)
    }
    employeeMonths.add(employeeMonth)

    let month = months.get(mes)
    if (!month) {
      month = { employees: new Set<string>(), registros: [], totalCount: 0 }
      months.set(mes, month)
    }
    month.employees.add(employee)

    for (const [day, rawCount] of Object.entries(rawRecord)) {
      if (day === "numero_empleado" || day === "mes") continue
      if (!/^(?:[1-9]|[12]\d|3[01])$/.test(day)) {
        throw new Error(`La propiedad "${day}" del empleado ${employee} no es un día válido.`)
      }

      const count = parseCount(rawCount, employee, day)
      if (count === 0) continue
      if (Number(day) > daysInMonth(mes)) {
        throw new Error(`El día ${day} no existe en ${mes}.`)
      }

      month.registros.push({ numero_empleado: employee, dia: Number(day), cantidad: count })
      month.totalCount += count
      totalCount += count
      if (!Number.isSafeInteger(month.totalCount) || !Number.isSafeInteger(totalCount)) {
        throw new Error("La suma de registros del archivo excede el límite permitido.")
      }
    }
  }

  const meses = [...months.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([mes, month]) => ({
      mes,
      empleados: month.employees.size,
      registros: month.registros,
      totalCount: month.totalCount,
    }))

  return {
    meses,
    registrosEmpleadoMes: employeeMonths.size,
    totalCount,
  }
}
