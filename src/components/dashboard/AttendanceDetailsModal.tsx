'use client';

import { Asistencia } from '@/types';
import { formatFechaHora } from '@/lib/excel';
import { Clock3, ExternalLink, MapPin, X } from 'lucide-react';

interface Props {
  asistencia: Asistencia;
  onClose: () => void;
  onOpenPhoto: (url: string, title: string) => void;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#101C30] border border-[#1C2F4D] p-3">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B]">{label}</div>
      <div className="mt-1 text-sm text-white break-words">{value || '—'}</div>
    </div>
  );
}

export default function AttendanceDetailsModal({ asistencia, onClose, onOpenPhoto }: Props) {
  const { fecha, hora } = formatFechaHora(asistencia.fecha_hora || asistencia.fecha_local_str);
  const foto = asistencia.foto_url || asistencia.foto_drive_url;

  return (
    <div className="fixed inset-0 z-[70] bg-[#070C16]/85 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-asistencia-titulo"
        className="glass-card w-full max-w-xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#38BDF8]/40 p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6"
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 id="detalle-asistencia-titulo" className="text-lg font-bold text-white">
              Detalles de asistencia
            </h2>
            <p className="mt-1 text-sm text-[#94A3B8]">{asistencia.empleado_nombre}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalles"
            className="min-w-11 min-h-11 -mr-2 -mt-2 rounded-xl text-[#94A3B8] hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Detail label="Movimiento" value={asistencia.tipo} />
          <Detail label="Fecha" value={fecha} />
          <div className="rounded-xl bg-[#101C30] border border-[#38BDF8]/30 p-3 flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#38BDF8]/10 flex items-center justify-center text-[#38BDF8]">
              <Clock3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B]">
                Hora local
              </div>
              <time
                dateTime={asistencia.fecha_local_str || undefined}
                className="mt-0.5 block text-lg font-bold font-mono text-white"
              >
                {hora}
              </time>
            </div>
          </div>
          <Detail label="Personal y rol" value={`${asistencia.empleado_nombre} · ${asistencia.empleado_rol}`} />
          <Detail label="Turno" value={asistencia.turno} />
          <Detail label="Pacientes" value={asistencia.paciente} />
          <Detail label="Entidad federativa" value={asistencia.entidad_federativa} />
        </div>

        {asistencia.asistencia_manual && (
          <section className="mt-4 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/30 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FBBF24]">
              Asistencia asistida
            </h3>
            <p className="mt-2 text-sm text-white break-words">
              {asistencia.motivo_registro_manual || 'No se indicó un motivo.'}
            </p>
            {asistencia.registrada_por_nombre && (
              <p className="mt-2 text-xs text-[#94A3B8]">
                Registrada por: {asistencia.registrada_por_nombre}
              </p>
            )}
          </section>
        )}

        <section className="mt-4 rounded-xl bg-[#101C30] border border-[#1C2F4D] p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Ubicación GPS</h3>
          {asistencia.ubicacion_gps ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-white break-all">
                {asistencia.ubicacion_gps.latitud}, {asistencia.ubicacion_gps.longitud}
                <span className="block mt-1 text-[#94A3B8]">
                  Precisión ±{asistencia.ubicacion_gps.precision_metros} m · {asistencia.ubicacion_gps.calidad_gps}
                </span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${asistencia.ubicacion_gps.latitud},${asistencia.ubicacion_gps.longitud}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 px-3 rounded-lg bg-[#00E5A3]/10 border border-[#00E5A3]/30 text-xs font-semibold text-[#00E5A3]"
              >
                <MapPin className="w-4 h-4" />
                Abrir mapa
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#94A3B8]">Este registro no tiene ubicación GPS.</p>
          )}
        </section>

        <section className="mt-4 rounded-xl bg-[#101C30] border border-[#1C2F4D] p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
            Fotografía de evidencia
          </h3>
          {foto ? (
            <button
              type="button"
              onClick={() => onOpenPhoto(foto, asistencia.empleado_nombre)}
              aria-label={`Ampliar fotografía de evidencia de ${asistencia.empleado_nombre}`}
              className="mt-3 block w-full overflow-hidden rounded-xl border border-[#1C2F4D] bg-[#070C16]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto}
                alt={`Evidencia de asistencia de ${asistencia.empleado_nombre}`}
                className="max-h-72 sm:max-h-96 w-full object-contain"
              />
              <span className="block border-t border-[#1C2F4D] py-2 text-xs font-semibold text-[#38BDF8]">
                Toca la imagen para ampliarla
              </span>
            </button>
          ) : (
            <p className="mt-2 text-sm text-[#94A3B8]">
              Este registro no tiene fotografía de evidencia.
            </p>
          )}
        </section>

        {asistencia.actualizado_por_nombre && (
          <p className="mt-4 text-xs text-[#64748B]">
            Última modificación por {asistencia.actualizado_por_nombre}
          </p>
        )}
      </section>
    </div>
  );
}
