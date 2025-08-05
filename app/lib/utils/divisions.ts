// Utilidades para manejar divisiones por año académico

/**
 * Determina si un año tiene divisiones
 * 1° a 4° año: Sí tienen divisiones (A, B)
 * 5° y 6° año: No tienen divisiones
 */
export function yearHasDivisions(year: number): boolean {
  return year >= 1 && year <= 4;
}

/**
 * Obtiene las divisiones disponibles para un año
 */
export function getAvailableDivisions(year: number): string[] {
  if (!yearHasDivisions(year)) {
    return [];
  }
  return ["A", "B"];
}

/**
 * Valida si una división es válida para un año dado
 */
export function isValidDivisionForYear(
  year: number,
  division?: string
): boolean {
  if (!yearHasDivisions(year)) {
    // 5° y 6° año no deben tener división
    return !division || division === "";
  }

  // 1° a 4° año deben tener división A o B
  return division === "A" || division === "B";
}

/**
 * Formatea el nombre de una materia con año y división
 */
export function formatSubjectYearDivision(
  year: number,
  division?: string
): string {
  if (!yearHasDivisions(year)) {
    return `${year}° Año`;
  }

  if (!division) {
    return `${year}° Año`;
  }

  return `${year}° Año "${division}"`;
}

/**
 * Obtiene un mensaje descriptivo para las divisiones
 */
export function getDivisionDescription(year: number): string {
  if (!yearHasDivisions(year)) {
    return `${year}° Año no tiene divisiones`;
  }

  return `${year}° Año se divide en: A y B`;
}
