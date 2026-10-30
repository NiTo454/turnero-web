export interface UbicacionGPS {
  latitud: number;
  longitud: number;
  precision_metros: number;
  calidad_gps: 'EXCELENTE' | 'ALTA' | 'MEDIA' | 'BAJA';
}

export interface Asistencia {
  id?: string;
  empleado_uid: string;
  empleado_nombre: string;
  empleado_email: string;
  empleado_rol: string;
  empleado_foto_perfil?: string;
  tipo: 'ENTRADA' | 'SALIDA';
  turno: '8 horas' | '12 horas' | '24 horas' | string;
  paciente: string;
  pacientes: string[];
  total_pacientes: number;
  entidad_federativa: string;
  ubicacion_gps?: UbicacionGPS;
  gps_valido: boolean;
  asistencia_manual?: boolean;
  motivo_registro_manual?: string;
  registrada_por_uid?: string;
  registrada_por_nombre?: string;
  actualizado_en?: unknown;
  actualizado_por_uid?: string;
  actualizado_por_nombre?: string;
  foto_url?: string;
  foto_drive_url?: string;
  foto_drive_id?: string;
  fecha_hora?: any;
  fecha_local_str?: string;
}

export interface IncidenciaAsistencia {
  id: string;
  empleado_uid: string;
  empleado_nombre: string;
  empleado_email: string;
  empleado_rol: string;
  tipo: 'ENTRADA' | 'SALIDA';
  turno: string;
  pacientes: string[];
  entidad_federativa: string;
  intentos: number;
  motivo: string;
  error_ubicacion: string;
  ubicacion_gps?: UbicacionGPS;
  foto_url?: string;
  foto_drive_url?: string;
  foto_drive_id?: string;
  estado: 'PENDIENTE' | 'ATENDIDA';
  fecha_local_str: string;
  creado_en?: unknown;
}

export interface Empleado {
  uid: string;
  nombre: string;
  email: string;
  foto?: string;
  telefono?: string;
  rol: string;
  is_active?: boolean;
  grupos?: string[];
  permisos_directos?: string[];
  permisos_denegados?: string[];
  perfil_completado?: boolean;
  creado_en?: any;
  actualizado_en?: any;
}

export interface PermisoDefinicion {
  codename: string;
  nombre: string;
  modulo: string;
}

export interface RolDefinicion {
  id: string;
  nombre: string;
  permisos: string[];
}
