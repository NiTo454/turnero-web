'use client';

import { FormEvent, useState } from 'react';
import { Asistencia } from '@/types';
import { X, ImagePlus } from 'lucide-react';
import { subirFotoAGoogleDrive } from '@/lib/drive';

interface Props {
  asistencia: Asistencia;
  isSaving: boolean;
  onClose: () => void;
  onSave: (changes: AttendanceChanges) => Promise<void>;
}

export interface AttendanceChanges {
  tipo: 'ENTRADA' | 'SALIDA';
  turno: string;
  pacientes: string[];
  paciente: string;
  total_pacientes: number;
  entidad_federativa: string;
  fecha_hora: Date;
  fecha_local_str: string;
  foto_url?: string;
  foto_drive_url?: string;
  foto_drive_id?: string;
}

function toLocalDateTime(value: Asistencia['fecha_hora'] | string | undefined): string {
  let date: Date;
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    date = new Date(value);
  } else {
    date = new Date();
  }

  if (Number.isNaN(date.getTime())) date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export default function EditAttendanceModal({
  asistencia,
  isSaving,
  onClose,
  onSave,
}: Props) {
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>(asistencia.tipo);
  const [turno, setTurno] = useState(asistencia.turno);
  const [pacientes, setPacientes] = useState(
    (asistencia.pacientes?.length ? asistencia.pacientes : [asistencia.paciente]).join('\n')
  );
  const [entidad, setEntidad] = useState(asistencia.entidad_federativa || '');
  const [fechaHora, setFechaHora] = useState(
    toLocalDateTime(asistencia.fecha_hora || asistencia.fecha_local_str)
  );
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState(asistencia.foto_url || asistencia.foto_drive_url || '');
  const [eliminarFoto, setEliminarFoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pacientesLimpios = pacientes.split('\n').map((paciente) => paciente.trim()).filter(Boolean);
    if (pacientesLimpios.length === 0) {
      setError('Agrega al menos un paciente.');
      return;
    }

    const fechaActualizada = new Date(fechaHora);
    if (Number.isNaN(fechaActualizada.getTime())) {
      setError('La fecha y hora no son válidas.');
      return;
    }

    setError(null);
    try {
      let camposFoto: Pick<AttendanceChanges, 'foto_url' | 'foto_drive_url' | 'foto_drive_id'> = {};
      if (fotoFile) {
        const driveFoto = await subirFotoAGoogleDrive(fotoFile);
        camposFoto = {
          foto_url: driveFoto.url || fotoPreview,
          foto_drive_url: driveFoto.drive_url,
          foto_drive_id: driveFoto.id,
        };
      } else if (eliminarFoto) {
        camposFoto = { foto_url: '', foto_drive_url: '', foto_drive_id: '' };
      }

      await onSave({
        tipo,
        turno,
        pacientes: pacientesLimpios,
        paciente: pacientesLimpios.join(' • '),
        total_pacientes: pacientesLimpios.length,
        entidad_federativa: entidad.trim(),
        fecha_hora: fechaActualizada,
        fecha_local_str: fechaActualizada.toISOString(),
        ...camposFoto,
      });
    } catch (saveError) {
      console.error('Error al editar asistencia:', saveError);
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el registro.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#070C16]/85 backdrop-blur-md flex items-center justify-center p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-asistencia-titulo"
        className="glass-card max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-3xl border border-[#38BDF8]/40 relative"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          aria-label="Cerrar edición"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#94A3B8] hover:text-white disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 id="editar-asistencia-titulo" className="text-lg font-bold text-white mb-1">
          Editar asistencia
        </h2>
        <p className="text-xs text-[#94A3B8] mb-5">
          {asistencia.empleado_nombre} · No se modifican la evidencia fotográfica ni la ubicación GPS.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-[#94A3B8]">
              Movimiento
              <select
                value={tipo}
                onChange={(event) => setTipo(event.target.value as 'ENTRADA' | 'SALIDA')}
                className="mt-1.5 w-full rounded-xl bg-[#101C30] border border-[#1C2F4D] p-2.5 text-sm text-white"
              >
                <option value="ENTRADA">Entrada</option>
                <option value="SALIDA">Salida</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-[#94A3B8]">
              Turno
              <select
                value={turno}
                onChange={(event) => setTurno(event.target.value)}
                className="mt-1.5 w-full rounded-xl bg-[#101C30] border border-[#1C2F4D] p-2.5 text-sm text-white"
              >
                <option value="8 horas">8 horas</option>
                <option value="12 horas">12 horas</option>
                <option value="24 horas">24 horas</option>
              </select>
            </label>
          </div>

          <label className="block text-xs font-semibold text-[#94A3B8]">
            Fecha y hora
            <input
              type="datetime-local"
              required
              value={fechaHora}
              onChange={(event) => setFechaHora(event.target.value)}
              className="mt-1.5 w-full rounded-xl bg-[#101C30] border border-[#1C2F4D] p-2.5 text-sm text-white"
            />
          </label>

          <label className="block text-xs font-semibold text-[#94A3B8]">
            Pacientes (uno por línea)
            <textarea
              required
              rows={4}
              value={pacientes}
              onChange={(event) => setPacientes(event.target.value)}
              className="mt-1.5 w-full rounded-xl bg-[#101C30] border border-[#1C2F4D] p-3 text-sm text-white"
            />
          </label>

          <label className="block text-xs font-semibold text-[#94A3B8]">
            Entidad federativa
            <input
              type="text"
              value={entidad}
              onChange={(event) => setEntidad(event.target.value)}
              className="mt-1.5 w-full rounded-xl bg-[#101C30] border border-[#1C2F4D] p-2.5 text-sm text-white"
            />
          </label>

          <div className="rounded-xl bg-[#101C30] border border-[#1C2F4D] p-3">
            <div className="text-xs font-semibold text-[#94A3B8] mb-2">
              Fotografía de evidencia
            </div>
            {fotoPreview && !eliminarFoto ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoPreview}
                  alt="Vista previa de evidencia"
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFotoFile(null);
                    setFotoPreview('');
                    setEliminarFoto(true);
                  }}
                  className="min-h-11 px-3 rounded-lg text-xs text-[#FB7185] border border-[#FB7185]/30"
                >
                  Quitar foto
                </button>
              </div>
            ) : (
              <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 text-xs font-semibold text-[#38BDF8]">
                <ImagePlus className="w-4 h-4" />
                {eliminarFoto ? 'Elegir otra foto' : 'Agregar fotografía'}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setFotoFile(file);
                    setEliminarFoto(false);
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') setFotoPreview(reader.result);
                    };
                    reader.onerror = () => setError('No se pudo leer la fotografía seleccionada.');
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            )}
          </div>

          {error && <p role="alert" className="text-sm text-[#FB7185]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-sm font-semibold text-[#94A3B8] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-[#38BDF8] text-[#070C16] text-sm font-bold disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
