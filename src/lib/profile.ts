import { Empleado } from '@/types';

export function tienePerfilCompleto(
  empleado: Empleado | null,
  uid: string | null | undefined
): boolean {
  return Boolean(
    empleado &&
      uid &&
      empleado.uid === uid &&
      empleado.perfil_completado === true &&
      typeof empleado.nombre === 'string' &&
      empleado.nombre.trim() &&
      typeof empleado.email === 'string' &&
      empleado.email.trim() &&
      typeof empleado.rol === 'string' &&
      empleado.rol.trim()
  );
}
