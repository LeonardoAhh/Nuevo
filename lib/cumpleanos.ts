export const BIRTHDAY_LOOKAHEAD_DAYS = 90
export const BIRTHDAY_YEAR_DAYS = 366
export const BIRTHDAY_SEND_BATCH_LIMIT = 50
export const BIRTHDAY_IMPORT_LIMIT = 500
export const APP_TIME_ZONE = "America/Mexico_City"

export const BIRTHDAY_PERIODS = [
  { key: "hoy", label: "Hoy", minDays: 0, maxDays: 0 },
  { key: "estaSemana", label: "Próximos 7 días", minDays: 1, maxDays: 7 },
  { key: "esteMes", label: "De 8 a 30 días", minDays: 8, maxDays: 30 },
  {
    key: "proximamente",
    label: `De 31 a ${BIRTHDAY_LOOKAHEAD_DAYS} días`,
    minDays: 31,
    maxDays: BIRTHDAY_LOOKAHEAD_DAYS,
  },
] as const

export type BirthdayTable = "employees" | "nuevo_ingreso"

export function birthdayEntryKey(entry: { id: string; tabla: BirthdayTable }) {
  return `${entry.tabla}:${entry.id}`
}

export function normalizeBirthdayDate(
  raw: string,
  today = getTodayInTimeZone(),
): { iso: string } | { error: string } {
  const value = raw.trim()
  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  const dmyMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)

  const parts = isoMatch
    ? { year: Number(isoMatch[1]), month: Number(isoMatch[2]), day: Number(isoMatch[3]) }
    : dmyMatch
      ? { year: Number(dmyMatch[3]), month: Number(dmyMatch[2]), day: Number(dmyMatch[1]) }
      : null

  if (!parts) {
    return { error: `Formato no reconocido: "${value}". Usa YYYY-MM-DD o DD/MM/YYYY.` }
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
  const isRealDate =
    date.getUTCFullYear() === parts.year &&
    date.getUTCMonth() === parts.month - 1 &&
    date.getUTCDate() === parts.day

  if (!isRealDate) return { error: `Fecha inválida: "${value}".` }

  const earliestYear = today.year - 100
  const isFuture =
    parts.year > today.year ||
    (parts.year === today.year && parts.month > today.month) ||
    (parts.year === today.year && parts.month === today.month && parts.day > today.day)

  if (parts.year < earliestYear || isFuture) {
    return { error: `La fecha "${value}" está fuera del rango permitido.` }
  }

  return {
    iso: `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
  }
}

export function getTodayInTimeZone(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)

  return { year: value("year"), month: value("month"), day: value("day") }
}

export function getNextBirthday(fechaNacimiento: string, now = new Date()) {
  const [birthYear, birthMonth, birthDay] = fechaNacimiento.split("-").map(Number)
  const today = getTodayInTimeZone(now)
  const hasPassed =
    birthMonth < today.month || (birthMonth === today.month && birthDay < today.day)
  const occurrenceYear = today.year + (hasPassed ? 1 : 0)

  const todayUtc = Date.UTC(today.year, today.month - 1, today.day)
  const birthdayUtc = Date.UTC(occurrenceYear, birthMonth - 1, birthDay)
  const birthday = new Date(birthdayUtc)
  const pad = (value: number) => String(value).padStart(2, "0")

  return {
    fechaCumpleanios: `${birthday.getUTCFullYear()}-${pad(birthday.getUTCMonth() + 1)}-${pad(birthday.getUTCDate())}`,
    diasParaCumpleanios: Math.round((birthdayUtc - todayUtc) / 86_400_000),
    edad: occurrenceYear - birthYear,
  }
}
