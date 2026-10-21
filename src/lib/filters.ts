import { Asistencia } from '@/types';

/**
 * Normaliza un texto removiendo acentos, mayúsculas y espacios duplicados
 * para que búsquedas como "maria", "maría", "MARIA" encuentren siempre el resultado.
 */
export function normalizarTexto(texto: string = ''): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Extrae la fecha en formato YYYY-MM-DD en la ZONA HORARIA LOCAL del usuario,
 * evitando el desfase de medianoche causado por UTC en turnos nocturnos.
 */
export function obtenerFechaLocalIso(fechaVal: any): string {
  if (!fechaVal) return '';

  let d: Date;
  if (fechaVal.toDate && typeof fechaVal.toDate === 'function') {
    d = fechaVal.toDate();
  } else if (fechaVal.seconds) {
    d = new Date(fechaVal.seconds * 1000);
  } else if (typeof fechaVal === 'string') {
    d = new Date(fechaVal);
  } else if (fechaVal instanceof Date) {
    d = fechaVal;
  } else {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export interface CriteriosFiltro {
  busqueda?: string;
  tipo?: 'TODOS' | 'ENTRADA' | 'SALIDA';
  turno?: 'TODOS' | '8 horas' | '12 horas' | '24 horas' | string;
  fechaInicio?: string;
  fechaFin?: string;
  soloValidosGps?: boolean;
}

/**
 * Filtrado multi-criterio ultra-optimizado en una sola pasada O(N)
 */
export function filtrarAsistencias(
  asistencias: Asistencia[],
  criterios: CriteriosFiltro
): Asistencia[] {
  const {
    busqueda,
    tipo = 'TODOS',
    turno = 'TODOS',
    fechaInicio,
    fechaFin,
    soloValidosGps = false,
  } = criterios;

  const terminoBusqueda = busqueda ? normalizarTexto(busqueda) : '';

  return asistencias.filter((a) => {
    // 1. Filtro por tipo de movimiento (ENTRADA / SALIDA)
    if (tipo !== 'TODOS' && a.tipo !== tipo) {
      return false;
    }

    // 2. Filtro por turno
    if (turno !== 'TODOS' && a.turno !== turno) {
      return false;
    }

    // 3. Filtro por validez de GPS
    if (soloValidosGps) {
      const precision = a.ubicacion_gps?.precision_metros;
      if (!precision || precision > 45) return false;
    }

    // 4. Filtro por fechas con zona horaria local segura
    if (fechaInicio || fechaFin) {
      const fechaDoc = obtenerFechaLocalIso(a.fecha_hora || a.fecha_local_str);
      if (fechaInicio && fechaDoc < fechaInicio) return false;
      if (fechaFin && fechaDoc > fechaFin) return false;
    }

    // 5. Búsqueda insensible a acentos en nombre, rol, paciente(s) y entidad
    if (terminoBusqueda) {
      const nombreNorm = normalizarTexto(a.empleado_nombre);
      const rolNorm = normalizarTexto(a.empleado_rol);
      const pacienteNorm = normalizarTexto(a.paciente);
      const entidadNorm = normalizarTexto(a.entidad_federativa);

      const coincide =
        nombreNorm.includes(terminoBusqueda) ||
        rolNorm.includes(terminoBusqueda) ||
        pacienteNorm.includes(terminoBusqueda) ||
        entidadNorm.includes(terminoBusqueda);

      if (!coincide) return false;
    }

    return true;
  });
}
