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
  ubicacion_gps: UbicacionGPS;
  gps_valido: boolean;
  foto_url?: string;
  foto_drive_url?: string;
  foto_drive_id?: string;
  fecha_hora?: any;
  fecha_local_str?: string;
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
