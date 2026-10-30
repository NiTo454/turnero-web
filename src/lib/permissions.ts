import { Empleado, PermisoDefinicion, RolDefinicion } from '@/types';

export const PERMISOS = {
  // Asistencia
  FICHAJE: 'asistencia.fichar',
  VER_TURNOS_PROPIOS: 'asistencia.ver_propios',
  EDITAR_ASISTENCIAS: 'asistencia.editar_registros',
  ELIMINAR_ASISTENCIAS: 'asistencia.eliminar_registros',

  // Reportes
  VER_HISTORIAL_GLOBAL: 'reportes.ver_historial',
  EXPORTAR_EXCEL: 'reportes.exportar_excel',
  EXPORTAR_DRIVE: 'reportes.exportar_drive',

  // Personal
  VER_PERSONAL: 'personal.ver_todos',
  EDITAR_ROLES: 'personal.editar_roles',
  GESTIONAR_USUARIOS: 'personal.gestionar',
  DESACTIVAR_USUARIOS: 'personal.desactivar',

  // Configuración
  CONFIG_SISTEMA: 'config.sistema',
  VER_LOGS: 'config.ver_logs',
} as const;

export const TODOS_LOS_PERMISOS: PermisoDefinicion[] = [
  { codename: PERMISOS.FICHAJE, nombre: 'Registrar Entrada/Salida', modulo: 'asistencia' },
  { codename: PERMISOS.VER_TURNOS_PROPIOS, nombre: 'Ver Turnos Propios', modulo: 'asistencia' },
  { codename: PERMISOS.EDITAR_ASISTENCIAS, nombre: 'Editar registros de asistencia', modulo: 'asistencia' },
  { codename: PERMISOS.ELIMINAR_ASISTENCIAS, nombre: 'Eliminar registros de asistencia', modulo: 'asistencia' },
  { codename: PERMISOS.VER_HISTORIAL_GLOBAL, nombre: 'Ver Historial Global', modulo: 'reportes' },
  { codename: PERMISOS.EXPORTAR_EXCEL, nombre: 'Exportar a Excel', modulo: 'reportes' },
  { codename: PERMISOS.EXPORTAR_DRIVE, nombre: 'Exportar a Drive', modulo: 'reportes' },
  { codename: PERMISOS.VER_PERSONAL, nombre: 'Ver Personal Completo', modulo: 'personal' },
  { codename: PERMISOS.EDITAR_ROLES, nombre: 'Editar Roles de Usuarios', modulo: 'personal' },
  { codename: PERMISOS.GESTIONAR_USUARIOS, nombre: 'Gestionar Usuarios', modulo: 'personal' },
  { codename: PERMISOS.DESACTIVAR_USUARIOS, nombre: 'Desactivar Usuarios', modulo: 'personal' },
  { codename: PERMISOS.CONFIG_SISTEMA, nombre: 'Configuración del Sistema', modulo: 'config' },
  { codename: PERMISOS.VER_LOGS, nombre: 'Ver Registros del Sistema', modulo: 'config' },
];

export const ROLES_DEFAULT: Record<string, RolDefinicion> = {
  enfermera: {
    id: 'enfermera',
    nombre: 'Enfermera',
    permisos: [PERMISOS.FICHAJE, PERMISOS.VER_TURNOS_PROPIOS],
  },
  enfermero: {
    id: 'enfermero',
    nombre: 'Enfermero',
    permisos: [PERMISOS.FICHAJE, PERMISOS.VER_TURNOS_PROPIOS],
  },
  doctor: {
    id: 'doctor',
    nombre: 'Doctor',
    permisos: [
      PERMISOS.FICHAJE,
      PERMISOS.VER_TURNOS_PROPIOS,
      PERMISOS.VER_HISTORIAL_GLOBAL,
      PERMISOS.EXPORTAR_EXCEL,
      PERMISOS.EXPORTAR_DRIVE,
      PERMISOS.VER_PERSONAL,
    ],
  },
  administrador: {
    id: 'administrador',
    nombre: 'Administrador',
    permisos: [
      PERMISOS.FICHAJE,
      PERMISOS.VER_TURNOS_PROPIOS,
      PERMISOS.EDITAR_ASISTENCIAS,
      PERMISOS.ELIMINAR_ASISTENCIAS,
      PERMISOS.VER_HISTORIAL_GLOBAL,
      PERMISOS.EXPORTAR_EXCEL,
      PERMISOS.EXPORTAR_DRIVE,
      PERMISOS.VER_PERSONAL,
      PERMISOS.EDITAR_ROLES,
      PERMISOS.GESTIONAR_USUARIOS,
      PERMISOS.DESACTIVAR_USUARIOS,
      PERMISOS.CONFIG_SISTEMA,
      PERMISOS.VER_LOGS,
    ],
  },
};

/**
 * Calcula los permisos efectivos de un empleado combinando:
 * (Permisos de Roles + Permisos Directos Concedidos) - Permisos Denegados
 */
export function calcularPermisosEfectivos(
  empleado: Empleado | null,
  rolesDb?: Record<string, RolDefinicion>
): Set<string> {
  if (!empleado) return new Set();

  // Si es Doctor o Administrador en rol string, tiene acceso completo o de admin
  const rolLower = (empleado.rol || '').toLowerCase();
  const grupos = empleado.grupos || [rolLower];
  const mapaRoles = { ...ROLES_DEFAULT, ...(rolesDb || {}) };

  const permisosEfectivos = new Set<string>();

  // 1. Permisos heredados de roles/grupos
  for (const grupo of grupos) {
    const rolDef = mapaRoles[grupo.toLowerCase()];
    if (rolDef?.permisos) {
      for (const p of rolDef.permisos) {
        permisosEfectivos.add(p);
      }
    }
  }

  // Si el string rol tiene 'doctor' o 'administrador'
  if (rolLower.includes('doctor') && !permisosEfectivos.has(PERMISOS.VER_HISTORIAL_GLOBAL)) {
    for (const p of ROLES_DEFAULT.doctor.permisos) {
      permisosEfectivos.add(p);
    }
  }
  if (rolLower.includes('admin')) {
    for (const p of ROLES_DEFAULT.administrador.permisos) {
      permisosEfectivos.add(p);
    }
  }

  // 2. Permisos directos adicionales concedidos
  if (Array.isArray(empleado.permisos_directos)) {
    for (const p of empleado.permisos_directos) {
      permisosEfectivos.add(p);
    }
  }

  // 3. Permisos denegados (excepciones individuales)
  if (Array.isArray(empleado.permisos_denegados)) {
    for (const p of empleado.permisos_denegados) {
      permisosEfectivos.delete(p);
    }
  }

  return permisosEfectivos;
}

export function tienePermiso(
  empleado: Empleado | null,
  codename: string,
  rolesDb?: Record<string, RolDefinicion>
): boolean {
  if (!empleado) return false;
  const efectivos = calcularPermisosEfectivos(empleado, rolesDb);
  return efectivos.has(codename);
}
