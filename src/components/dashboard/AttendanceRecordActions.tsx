'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';

interface Props {
  recordName: string;
  onView: () => void;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function AttendanceRecordActions({
  recordName,
  onView,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onView}
        aria-label={`Ver detalles de asistencia de ${recordName}`}
        title="Ver detalles"
        className="inline-flex min-h-11 flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#101C30] border border-[#1C2F4D] text-xs font-semibold text-white hover:border-[#38BDF8]/40"
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Detalles</span>
      </button>
      {canEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar asistencia de ${recordName}`}
          title="Editar asistencia"
          className="inline-flex min-h-11 flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-xs font-semibold hover:bg-[#38BDF8]/20"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Editar</span>
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Eliminar asistencia de ${recordName}`}
          title="Eliminar asistencia"
          className="inline-flex min-h-11 flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FB7185]/10 border border-[#FB7185]/30 text-xs font-semibold hover:bg-[#FB7185]/20"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Eliminar</span>
        </button>
      )}
    </div>
  );
}
