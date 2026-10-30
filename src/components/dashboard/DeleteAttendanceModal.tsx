'use client';

import { useState } from 'react';
import { Asistencia } from '@/types';
import { AlertTriangle, X } from 'lucide-react';
import { formatFechaHora } from '@/lib/excel';

interface Props {
  asistencia: Asistencia;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteAttendanceModal({
  asistencia,
  isDeleting,
  onClose,
  onConfirm,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const { fecha, hora } = formatFechaHora(asistencia.fecha_hora || asistencia.fecha_local_str);

  const confirmarEliminacion = async () => {
    setError(null);
    try {
      await onConfirm();
    } catch (deleteError) {
      console.error('Error al eliminar asistencia:', deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No se pudo eliminar la asistencia. Verifica tu conexión y tus permisos.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-[#070C16]/85 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="eliminar-asistencia-titulo"
        aria-describedby="eliminar-asistencia-descripcion"
        className="glass-card w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-[#FB7185]/40 p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-[#FB7185]/10 border border-[#FB7185]/30 flex items-center justify-center text-[#FB7185]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="eliminar-asistencia-titulo" className="text-base sm:text-lg font-bold text-white">
              Eliminar asistencia
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
              Esta acción es permanente y no se puede deshacer.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Cancelar eliminación"
            className="p-2 -mr-2 -mt-2 rounded-lg text-[#94A3B8] hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          id="eliminar-asistencia-descripcion"
          className="mt-5 rounded-xl bg-[#101C30] border border-[#1C2F4D] p-4 text-sm"
        >
          <div className="font-bold text-white break-words">{asistencia.empleado_nombre}</div>
          <div className="mt-1 text-xs text-[#94A3B8]">
            {asistencia.tipo} · {fecha} · {hora}
          </div>
          {asistencia.paciente && (
            <div className="mt-2 text-xs text-[#38BDF8] break-words">
              Pacientes: {asistencia.paciente}
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-[#FB7185]">{error}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="order-2 sm:order-1 min-h-12 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-sm font-semibold text-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmarEliminacion}
            disabled={isDeleting}
            className="order-1 sm:order-2 min-h-12 rounded-xl bg-[#FB7185] text-[#070C16] text-sm font-bold disabled:opacity-50"
          >
            {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </section>
    </div>
  );
}
