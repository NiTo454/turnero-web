import * as XLSX from 'xlsx';
import { Asistencia } from '@/types';

export function formatFechaHora(val: any): { fecha: string; hora: string } {
  let date: Date;
  if (!val) {
    date = new Date();
  } else if (val.toDate && typeof val.toDate === 'function') {
    date = val.toDate();
  } else if (typeof val === 'string') {
    date = new Date(val);
  } else if (val instanceof Date) {
    date = val;
  } else if (val.seconds) {
    date = new Date(val.seconds * 1000);
  } else {
    date = new Date();
  }

  const fecha = date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const hora = date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return { fecha, hora };
}

export function exportarAsistenciasAExcel(
  asistencias: Asistencia[],
  periodoNombre: string = 'Historial_Completo'
) {
  if (asistencias.length === 0) {
    alert('No hay registros de asistencias para exportar.');
    return;
  }

  // Filas del archivo
  const rows = asistencias.map((asistencia, index) => {
    const { fecha, hora } = formatFechaHora(asistencia.fecha_hora || asistencia.fecha_local_str);
    const gps = asistencia.ubicacion_gps;
    const gpsCoordStr = gps ? `${gps.latitud?.toFixed(5) ?? 0}, ${gps.longitud?.toFixed(5) ?? 0}` : 'Sin GPS';
    const gpsPrecStr = gps ? `±${gps.precision_metros?.toFixed(1) ?? 0}m (${gps.calidad_gps || 'N/A'})` : 'N/A';

    return {
      '#': index + 1,
      'FECHA': fecha,
      'HORA': hora,
      'PERSONAL DE SALUD': asistencia.empleado_nombre || 'Desconocido',
      'ROL': asistencia.empleado_rol || 'Personal',
      'MOVIMIENTO': asistencia.tipo || 'ENTRADA',
      'TURNO': asistencia.turno || '8 horas',
      'CANT. PACIENTES': asistencia.total_pacientes || (asistencia.pacientes?.length ?? 1),
      'PACIENTE(S) ATENDIDO(S)': asistencia.paciente || (asistencia.pacientes ? asistencia.pacientes.join(' • ') : ''),
      'ENTIDAD FEDERATIVA': asistencia.entidad_federativa || 'Sin dato',
      'COORDENADAS GPS': gpsCoordStr,
      'PRECISIÓN GPS': gpsPrecStr,
      'FOTO EN GOOGLE DRIVE': asistencia.foto_drive_url || asistencia.foto_url || 'Sin foto',
    };
  });

  // Crear libro y hoja
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Ajustar ancho de columnas
  worksheet['!cols'] = [
    { wch: 6 },  // #
    { wch: 12 }, // FECHA
    { wch: 14 }, // HORA
    { wch: 28 }, // PERSONAL
    { wch: 14 }, // ROL
    { wch: 14 }, // MOVIMIENTO
    { wch: 12 }, // TURNO
    { wch: 16 }, // CANT. PACIENTES
    { wch: 35 }, // PACIENTES
    { wch: 22 }, // ENTIDAD
    { wch: 24 }, // COORDENADAS
    { wch: 18 }, // PRECISIÓN
    { wch: 45 }, // FOTO DRIVE
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencias');

  // Descargar archivo
  const fechaHoy = new Date().toISOString().split('T')[0];
  const filename = `Turnero_${periodoNombre}_${fechaHoy}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export function exportarAsistenciasACSV(
  asistencias: Asistencia[],
  periodoNombre: string = 'Historial_Completo'
) {
  if (asistencias.length === 0) {
    alert('No hay registros de asistencias para exportar.');
    return;
  }

  const rows = asistencias.map((asistencia, index) => {
    const { fecha, hora } = formatFechaHora(asistencia.fecha_hora || asistencia.fecha_local_str);
    const gps = asistencia.ubicacion_gps;
    const gpsCoordStr = gps ? `${gps.latitud?.toFixed(5) ?? 0}, ${gps.longitud?.toFixed(5) ?? 0}` : 'Sin GPS';

    return {
      '#': index + 1,
      'FECHA': fecha,
      'HORA': hora,
      'PERSONAL': asistencia.empleado_nombre || '',
      'ROL': asistencia.empleado_rol || '',
      'MOVIMIENTO': asistencia.tipo || '',
      'TURNO': asistencia.turno || '',
      'PACIENTES': asistencia.paciente || '',
      'ENTIDAD': asistencia.entidad_federativa || '',
      'GPS': gpsCoordStr,
      'FOTO_DRIVE': asistencia.foto_drive_url || asistencia.foto_url || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  // Generar blob con BOM UTF-8 para compatibilidad con Excel en español
  const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fechaHoy = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `Turnero_${periodoNombre}_${fechaHoy}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
