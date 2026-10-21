'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Asistencia, Empleado } from '@/types';
import { formatFechaHora } from '@/lib/excel';
import {
  Clock,
  CheckCircle2,
  Calendar,
  MapPin,
  ExternalLink,
  Image as ImageIcon,
  HeartPulse,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  asistenciasPropias: Asistencia[];
  empleado: Empleado | null;
  onOpenPhoto: (url: string, title: string) => void;
}

export default function PersonalAttendanceView({
  asistenciasPropias,
  empleado,
  onOpenPhoto,
}: Props) {
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ENTRADA' | 'SALIDA'>('TODOS');

  // Último fichaje registrado
  const ultimoFichaje = asistenciasPropias[0] || null;
  const esUltimaEntrada = ultimoFichaje?.tipo === 'ENTRADA';

  // Asistencias filtradas del usuario
  const filtradas = useMemo(() => {
    if (filtroTipo === 'TODOS') return asistenciasPropias;
    return asistenciasPropias.filter((a) => a.tipo === filtroTipo);
  }, [asistenciasPropias, filtroTipo]);

  // Contadores personales
  const totalEntradas = asistenciasPropias.filter((a) => a.tipo === 'ENTRADA').length;
  const totalSalidas = asistenciasPropias.filter((a) => a.tipo === 'SALIDA').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Tarjeta de Bienvenida y Estado de Turno */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#1C2F4D] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00E5A3]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#101C30] to-[#172640] border border-[#28436D] flex items-center justify-center font-bold text-2xl text-[#00E5A3] mint-glow flex-shrink-0">
              {(empleado?.nombre || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#00E5A3]/10 border border-[#00E5A3]/30 text-[#00E5A3] text-xs font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{empleado?.rol || 'Personal Clínico'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                Hola, {empleado?.nombre || 'Colega'}
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Panel de control de turnos y asistencias personales
              </p>
            </div>
          </div>

          {/* Botón Destacado para Fichar */}
          <Link
            href="/fichar"
            className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#00E5A3] to-[#38BDF8] text-[#070C16] font-extrabold text-sm shadow-xl mint-glow hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Clock className="w-5 h-5 stroke-[2.5]" />
            <span>Registrar Entrada / Salida</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Resumen de Último Fichaje */}
        {ultimoFichaje && (
          <div className="mt-6 pt-5 border-t border-[#1C2F4D]/70 flex flex-wrap items-center justify-between gap-3 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <span className="text-[#64748B]">Último movimiento:</span>
              <span
                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  esUltimaEntrada
                    ? 'bg-[#00E5A3]/10 text-[#00E5A3] border border-[#00E5A3]/30'
                    : 'bg-[#FB7185]/10 text-[#FB7185] border border-[#FB7185]/30'
                }`}
              >
                {ultimoFichaje.tipo}
              </span>
              <span className="text-white font-mono">
                {formatFechaHora(ultimoFichaje.fecha_hora || ultimoFichaje.fecha_local_str).fecha} •{' '}
                {formatFechaHora(ultimoFichaje.fecha_hora || ultimoFichaje.fecha_local_str).hora}
              </span>
            </div>

            <div className="text-[11px] text-[#38BDF8] flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Paciente(s): {ultimoFichaje.paciente}</span>
            </div>
          </div>
        )}
      </div>

      {/* Métricas Personales */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-card rounded-2xl p-4 border border-[#1C2F4D]">
          <div className="text-xs text-[#94A3B8]">Mis Fichajes</div>
          <div className="text-2xl font-extrabold text-white mt-1">{asistenciasPropias.length}</div>
          <div className="text-[11px] text-[#00E5A3] mt-0.5">Historial acumulado</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-[#1C2F4D]">
          <div className="text-xs text-[#94A3B8]">Mis Entradas</div>
          <div className="text-2xl font-extrabold text-[#00E5A3] mt-1">{totalEntradas}</div>
          <div className="text-[11px] text-[#94A3B8] mt-0.5">Inicios de turno</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-[#1C2F4D]">
          <div className="text-xs text-[#94A3B8]">Mis Salidas</div>
          <div className="text-2xl font-extrabold text-[#FB7185] mt-1">{totalSalidas}</div>
          <div className="text-[11px] text-[#94A3B8] mt-0.5">Cierres de turno</div>
        </div>
      </div>

      {/* Historial de Turnos Propios */}
      <div className="glass-card rounded-2xl p-5 border border-[#1C2F4D] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#00E5A3]" />
            <h3 className="font-bold text-white text-base">Mis Registros de Asistencia</h3>
          </div>

          {/* Filtros Tipo */}
          <div className="flex items-center bg-[#101C30] p-1 rounded-xl border border-[#1C2F4D]">
            {(['TODOS', 'ENTRADA', 'SALIDA'] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroTipo === tipo
                    ? tipo === 'ENTRADA'
                      ? 'bg-[#00E5A3] text-[#070C16]'
                      : tipo === 'SALIDA'
                      ? 'bg-[#FB7185] text-[#070C16]'
                      : 'bg-white text-slate-900'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>

        {filtradas.length === 0 ? (
          <div className="text-center py-12 text-[#94A3B8] text-sm">
            <Clock className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
            No tienes registros de asistencias en este filtro.
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map((asistencia) => {
              const { fecha, hora } = formatFechaHora(
                asistencia.fecha_hora || asistencia.fecha_local_str
              );
              const esEntrada = asistencia.tipo === 'ENTRADA';
              const foto = asistencia.foto_url || asistencia.foto_drive_url;

              return (
                <div
                  key={asistencia.id}
                  className="p-4 rounded-xl bg-[#101C30]/70 border border-[#1C2F4D] hover:border-[#28436D] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                        esEntrada
                          ? 'bg-[#00E5A3]/10 text-[#00E5A3] border border-[#00E5A3]/30'
                          : 'bg-[#FB7185]/10 text-[#FB7185] border border-[#FB7185]/30'
                      }`}
                    >
                      {asistencia.tipo}
                    </span>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {fecha} • <span className="font-mono text-xs">{hora}</span>
                      </div>
                      <div className="text-[#38BDF8] mt-0.5">
                        Paciente(s): {asistencia.paciente}
                      </div>
                      <div className="text-[#64748B] text-[11px]">
                        Turno: {asistencia.turno} {asistencia.entidad_federativa ? `• ${asistencia.entidad_federativa}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {asistencia.ubicacion_gps && (
                      <a
                        href={`https://www.google.com/maps?q=${asistencia.ubicacion_gps.latitud},${asistencia.ubicacion_gps.longitud}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#94A3B8] hover:text-[#00E5A3] transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#00E5A3]" />
                        <span>±{asistencia.ubicacion_gps.precision_metros}m</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {foto && (
                      <button
                        type="button"
                        onClick={() => onOpenPhoto(foto, asistencia.empleado_nombre)}
                        className="p-1.5 rounded-lg bg-[#101C30] hover:bg-[#00E5A3]/20 text-[#00E5A3] border border-[#1C2F4D] transition-colors cursor-pointer"
                        title="Ver comprobante"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
