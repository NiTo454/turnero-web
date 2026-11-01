import { Empleado } from '@/types';

const FIRESTORE_ADMIN_UIDS = [
  'QQWmSygBaGSZsUDFMVtWsqMZ5cE2',
  'QZn49VMQN3RgsA8pWYKuRzKaEgs1',
] as const;

export function isFirestoreAdmin(
  uid: string | null | undefined,
  empleado: Empleado | null
): boolean {
  if (!uid) return false;
  if (FIRESTORE_ADMIN_UIDS.some((adminUid) => adminUid === uid)) return true;
  if (!empleado || empleado.uid !== uid || empleado.is_active !== true) return false;

  return (
    empleado.rol.toLowerCase() === 'administrador' ||
    empleado.grupos?.some((grupo) => grupo.toLowerCase() === 'administrador') === true
  );
}
