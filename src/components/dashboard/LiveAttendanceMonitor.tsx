'use client';

import React, { useState, useMemo } from 'react';
import { Asistencia, Empleado, IncidenciaAsistencia } from '@/types';
import { formatFechaHora } from '@/lib/excel';
import AttendanceRecordActions from '@/components/dashboard/AttendanceRecordActions';
import {
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Calendar,
  Sparkles,
  HeartPulse,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { obtenerFechaLocalIso } from '@/lib/filters';

interface Props {
  asistencias: Asistencia[];
  empleados: Empleado[];
  incidencias: IncidenciaAsistencia[];
  incidenciasError: string | null;
  puedeEditarAsistencias: boolean;
  puedeEliminarAsistencias: boolean;
  onDarAsistencia: (incidencia: IncidenciaAsistencia) => Promise<void>;
  onViewAttendance: (asistencia: Asistencia) => void;
  onEditAttendance: (asistencia: Asistencia) => void;
  onDeleteAttendance: (asistencia: Asistencia) => void;
  onOpenPhoto: (url: string, title: string) => void;
}

/** Genera un enlace de WhatsApp con mensaje prellenado */
function whatsappLink(telefono: string, nombre: string): string {
  // Limpia el número: quita espacios, guiones, paréntesis
  const numero = telefono.replace(/[\s\-()]/g, '');
  // Si no empieza con +, asumimos México (+52)
  const e164 = numero.startsWith('+') ? numero : `+52${numero}`;
  const msg = encodeURIComponent(
    `Hola ${nombre} 👋, te recordamos que aún no has registrado tu asistencia en el sistema de turnos del consultorio. Por favor, ficha tu entrada cuando puedas. ¡Gracias!`
  );
  return `https://wa.me/${e164.replace('+', '')}?text=${msg}`;
}

export default function LiveAttendanceMonitor({
  asistencias,
  empleados,
  incidencias,
  incidenciasError,
  puedeEditarAsistencias,
  puedeEliminarAsistencias,
  onDarAsistencia,
  onViewAttendance,
  onEditAttendance,
  onDeleteAttendance,
  onOpenPhoto,
}: Props) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'LLEGARON' | 'FALTAN'>('TODOS');
  const [incidenciaEnProceso, setIncidenciaEnProceso] = useState<string | null>(null);
  const [errorAccionIncidencia, setErrorAccionIncidencia] = useState<string | null>(null);

  React.useEffect(() => {
    setFechaSeleccionada(obtenerFechaLocalIso(new Date()));
  }, []);

  const asistenciasDelDia = useMemo(() => {
    return asistencias.filter((a) => {
      const fechaDoc = obtenerFechaLocalIso(a.fecha_hora || a.fecha_local_str);
      return fechaDoc === fechaSeleccionada;
    });
  }, [asistencias, fechaSeleccionada]);

  const uidsQueFicharon = useMemo(() => {
    return new Set(asistenciasDelDia.map((a) => a.empleado_uid));
  }, [asistenciasDelDia]);

  const personalFaltante = useMemo(() => {
    return empleados.filter((emp) => emp.is_active !== false && !uidsQueFicharon.has(emp.uid));
  }, [empleados, uidsQueFicharon]);

  const entradasHoy = asistenciasDelDia.filter((a) => a.tipo === 'ENTRADA').length;
  const salidasHoy = asistenciasDelDia.filter((a) => a.tipo === 'SALIDA').length;
  const incidenciasPendientes = incidencias.filter((incidencia) => incidencia.estado === 'PENDIENTE');

  return (
    <div className="space-y-6">
      {(incidenciasPendientes.length > 0 || incidenciasError) && (
        <section className="glass-card rounded-2xl p-5 border border-[#FB7185]/30">
          <h2 className="font-bold text-white text-base mb-4 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#FB7185]" />
            Solicitudes de ayuda ({incidenciasPendientes.length})
          </h2>
          {incidenciasError && (
            <p role="alert" className="mb-3 text-sm text-[#FB7185]">{incidenciasError}</p>
          )}
          {errorAccionIncidencia && (
            <p role="alert" className="mb-3 text-sm text-[#FB7185]">{errorAccionIncidencia}</p>
          )}
          <div className="space-y-3">
            {incidenciasPendientes.map((incidencia) => (
              <article
                key={incidencia.id}
                className="rounded-xl bg-[#101C30] border border-[#1C2F4D] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  {(incidencia.foto_url || incidencia.foto_drive_url) && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPhoto(
                          incidencia.foto_url || incidencia.foto_drive_url!,
                          `Evidencia de ${incidencia.empleado_nombre}`
                        )
                      }
                      className="mb-3 block overflow-hidden rounded-xl border border-[#1C2F4D]"
                      aria-label={`Ver foto enviada por ${incidencia.empleado_nombre}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={incidencia.foto_url || incidencia.foto_drive_url}
                        alt={`Foto de evidencia enviada por ${incidencia.empleado_nombre}`}
                        className="h-24 w-32 object-cover"
                      />
                    </button>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-white">{incidencia.empleado_nombre}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#FB7185]/10 border border-[#FB7185]/30 text-[#FB7185] text-[10px] font-bold">
                      {incidencia.tipo}
                    </span>
                    <span className="text-xs text-[#94A3B8]">Turno {incidencia.turno}</span>
                  </div>
                  <p className="text-sm text-white break-words">{incidencia.motivo}</p>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    {incidencia.error_ubicacion} · {incidencia.intentos} intentos · {incidencia.empleado_email}
                  </p>
                  <p className="mt-1 text-xs text-[#38BDF8]">
                    Pacientes: {incidencia.pacientes.length > 0 ? incidencia.pacientes.join(', ') : 'Sin información'}
                    {' · '}{incidencia.entidad_federativa}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={incidenciaEnProceso !== null}
                  onClick={async () => {
                    setIncidenciaEnProceso(incidencia.id);
                    setErrorAccionIncidencia(null);
                    try {
                      await onDarAsistencia(incidencia);
                    } catch (error) {
                      console.error('Error al registrar asistencia asistida:', error);
                      setErrorAccionIncidencia(
                        error instanceof Error ? error.message : 'No se pudo registrar la asistencia.'
                      );
                    } finally {
                      setIncidenciaEnProceso(null);
                    }
                  }}
                  className="shrink-0 px-4 py-2.5 rounded-xl bg-[#00E5A3] text-[#070C16] text-xs font-bold disabled:opacity-50"
                >
                  {incidenciaEnProceso === incidencia.id ? 'Registrando...' : 'Dar asistencia'}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Selector de Fecha y Filtros */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-[#1C2F4D] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#00E5A3]/10 text-[#00E5A3]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#94A3B8] font-semibold uppercase">Fecha a Monitorear</div>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center bg-[#101C30] p-1.5 rounded-xl border border-[#1C2F4D] self-start md:self-auto">
          {(['TODOS', 'LLEGARON', 'FALTAN'] as const).map((filtro) => (
            <button
              key={filtro}
              onClick={() => setFiltroEstado(filtro)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filtroEstado === filtro
                  ? filtro === 'FALTAN'
                    ? 'bg-[#FBBF24] text-[#070C16] shadow-sm'
                    : 'bg-[#00E5A3] text-[#070C16] shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              {filtro === 'TODOS' ? 'Todos' : filtro === 'LLEGARON' ? 'Llegaron' : `Faltan (${personalFaltante.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas de Estadísticas — clickeables para filtrar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total fichajes → muestra TODOS */}
        <button
          type="button"
          onClick={() => setFiltroEstado('TODOS')}
          className={`glass-card rounded-2xl p-4 border text-left transition-all cursor-pointer active:scale-95 ${
            filtroEstado === 'TODOS'
              ? 'border-[#00E5A3]/60 ring-1 ring-[#00E5A3]/30 bg-[#00E5A3]/5'
              : 'border-[#1C2F4D] hover:border-[#00E5A3]/30'
          }`}
        >
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1">
            <span>Fichajes Registrados</span>
            <Sparkles className={`w-4 h-4 ${filtroEstado === 'TODOS' ? 'text-[#00E5A3]' : 'text-[#64748B]'}`} />
          </div>
          <div className="text-2xl font-extrabold text-white">{asistenciasDelDia.length}</div>
          <div className={`text-[11px] mt-1 font-semibold ${filtroEstado === 'TODOS' ? 'text-[#00E5A3]' : 'text-[#64748B]'}`}>
            {filtroEstado === 'TODOS' ? '▸ Viendo todos' : 'Toca para ver todos'}
          </div>
        </button>

        {/* Entradas → filtra LLEGARON */}
        <button
          type="button"
          onClick={() => setFiltroEstado('LLEGARON')}
          className={`glass-card rounded-2xl p-4 border text-left transition-all cursor-pointer active:scale-95 ${
            filtroEstado === 'LLEGARON'
              ? 'border-[#00E5A3]/60 ring-1 ring-[#00E5A3]/30 bg-[#00E5A3]/5'
              : 'border-[#1C2F4D] hover:border-[#00E5A3]/30'
          }`}
        >
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1">
            <span>Entradas</span>
            <CheckCircle2 className={`w-4 h-4 ${filtroEstado === 'LLEGARON' ? 'text-[#00E5A3]' : 'text-[#64748B]'}`} />
          </div>
          <div className="text-2xl font-extrabold text-[#00E5A3]">{entradasHoy}</div>
          <div className={`text-[11px] mt-1 font-semibold ${filtroEstado === 'LLEGARON' ? 'text-[#00E5A3]' : 'text-[#64748B]'}`}>
            {filtroEstado === 'LLEGARON' ? '▸ Viendo entradas' : 'Toca para ver entradas'}
          </div>
        </button>

        {/* Salidas → filtra LLEGARON (muestra movimientos) */}
        <button
          type="button"
          onClick={() => setFiltroEstado('TODOS')}
          className={`glass-card rounded-2xl p-4 border text-left transition-all cursor-pointer active:scale-95 border-[#1C2F4D] hover:border-[#FB7185]/30`}
        >
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1">
            <span>Salidas</span>
            <Clock className="w-4 h-4 text-[#64748B]" />
          </div>
          <div className="text-2xl font-extrabold text-[#FB7185]">{salidasHoy}</div>
          <div className="text-[11px] mt-1 font-semibold text-[#64748B]">Toca para ver todos</div>
        </button>

        {/* Personal pendiente → filtra FALTAN */}
        <button
          type="button"
          onClick={() => setFiltroEstado('FALTAN')}
          className={`glass-card rounded-2xl p-4 border text-left transition-all cursor-pointer active:scale-95 ${
            filtroEstado === 'FALTAN'
              ? 'border-[#FBBF24]/60 ring-1 ring-[#FBBF24]/30 bg-[#FBBF24]/5'
              : 'border-[#FBBF24]/20 hover:border-[#FBBF24]/50'
          }`}
        >
          <div className="flex items-center justify-between text-[#94A3B8] text-xs mb-1">
            <span>Personal Pendiente</span>
            <Users className={`w-4 h-4 ${filtroEstado === 'FALTAN' ? 'text-[#FBBF24]' : 'text-[#64748B]'}`} />
          </div>
          <div className="text-2xl font-extrabold text-[#FBBF24]">{personalFaltante.length}</div>
          <div className={`text-[11px] mt-1 font-semibold ${filtroEstado === 'FALTAN' ? 'text-[#FBBF24]' : 'text-[#64748B]'}`}>
            {filtroEstado === 'FALTAN' ? '▸ Viendo pendientes' : 'Toca para ver quiénes faltan'}
          </div>
        </button>
      </div>


      {/* ── VISTA: FALTAN ── */}
      {filtroEstado === 'FALTAN' && (
        <div className="glass-card rounded-2xl p-5 border border-[#FBBF24]/20">
          <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FBBF24]" />
            Personal que aún no ha registrado asistencia hoy
            <span className="ml-auto text-sm font-semibold text-[#FBBF24] bg-[#FBBF24]/10 border border-[#FBBF24]/30 px-2.5 py-0.5 rounded-full">
              {personalFaltante.length}
            </span>
          </h3>

          {personalFaltante.length === 0 ? (
            <div className="text-center py-8 text-[#94A3B8] text-sm flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-[#00E5A3]" />
              ¡Excelente! Todo el personal activo ha registrado su asistencia hoy.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {personalFaltante.map((emp) => {
                const tieneWhatsapp = !!emp.telefono;
                const waLink = tieneWhatsapp ? whatsappLink(emp.telefono!, emp.nombre) : null;

                return (
                  <div
                    key={emp.uid}
                    className="p-3.5 rounded-xl bg-[#101C30] border border-[#FBBF24]/15 hover:border-[#FBBF24]/40 transition-colors"
                  >
                    {/* Info del empleado */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#172640] border border-[#28436D] flex items-center justify-center font-bold text-sm text-[#FBBF24] shrink-0">
                        {emp.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white text-sm truncate">{emp.nombre}</div>
                        <div className="text-xs text-[#94A3B8]">{emp.rol}</div>
                      </div>
                    </div>

                    {/* Acciones: llamar + WhatsApp */}
                    {tieneWhatsapp ? (
                      <div className="flex gap-2 mt-3">
                        {/* Llamar */}
                        <a
                          href={`tel:${emp.telefono}`}
                          title={`Llamar a ${emp.nombre}`}
                          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl bg-[#172640] border border-[#1C2F4D] hover:border-[#38BDF8]/40 hover:bg-[#38BDF8]/10 text-[#38BDF8] text-xs font-semibold transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Llamar
                        </a>
                        {/* WhatsApp */}
                        <a
                          href={waLink!}
                          target="_blank"
                          rel="noreferrer"
                          title={`Enviar recordatorio por WhatsApp a ${emp.nombre}`}
                          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl bg-[#172640] border border-[#1C2F4D] hover:border-[#25D366]/40 hover:bg-[#25D366]/10 text-[#25D366] text-xs font-semibold transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      </div>
                    ) : (
                      <div className="mt-3 text-[11px] text-[#64748B] text-center py-1.5 rounded-lg bg-[#0F1929] border border-[#1C2F4D]/50">
                        Sin número registrado
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── VISTA: LLEGARON / TODOS ── */}
      {filtroEstado !== 'FALTAN' && (
        <div className="glass-card rounded-2xl p-5 border border-[#1C2F4D]">
          <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#00E5A3]" />
            Movimientos Registrados ({asistenciasDelDia.length})
          </h3>

          {asistenciasDelDia.length === 0 ? (
            <div className="text-center py-10 text-[#94A3B8] text-sm">
              No hay registros de asistencias para la fecha seleccionada.
            </div>
          ) : (
            <div className="space-y-3">
              {asistenciasDelDia.map((asistencia) => {
                const { hora } = formatFechaHora(asistencia.fecha_hora || asistencia.fecha_local_str);
                const esEntrada = asistencia.tipo === 'ENTRADA';
                const foto = asistencia.foto_url || asistencia.foto_drive_url;

                return (
                  <div
                    key={asistencia.id}
                    className="p-4 rounded-xl bg-[#101C30]/80 border border-[#1C2F4D] hover:border-[#28436D] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      {foto ? (
                        <button
                          type="button"
                          onClick={() => onOpenPhoto(foto, asistencia.empleado_nombre)}
                          className="relative group w-12 h-12 rounded-xl overflow-hidden border border-[#1C2F4D] flex-shrink-0 cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={foto}
                            alt="Evidencia"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        </button>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#172640] border border-[#28436D] flex items-center justify-center font-bold text-base text-[#00E5A3] flex-shrink-0">
                          {asistencia.empleado_nombre.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{asistencia.empleado_nombre}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              esEntrada
                                ? 'bg-[#00E5A3]/10 text-[#00E5A3] border border-[#00E5A3]/30'
                                : 'bg-[#FB7185]/10 text-[#FB7185] border border-[#FB7185]/30'
                            }`}
                          >
                            {asistencia.tipo}
                          </span>
                          {asistencia.asistencia_manual && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-[#FBBF24] text-[10px] font-bold">
                              ASISTENCIA ASISTIDA
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#94A3B8] mt-0.5">
                          {asistencia.empleado_rol} • Turno {asistencia.turno}
                        </div>
                        <div className="text-xs text-[#38BDF8] mt-0.5 flex items-center gap-1">
                          <HeartPulse className="w-3.5 h-3.5" />
                          <span>Pacientes: {asistencia.paciente}</span>
                        </div>
                        {asistencia.motivo_registro_manual && (
                          <div className="text-[11px] text-[#FBBF24] mt-1">
                            Motivo de asistencia manual: {asistencia.motivo_registro_manual}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1C2F4D]/50 flex sm:flex-col justify-between items-center sm:items-end">
                      <div className="font-mono text-sm font-bold text-white">{hora}</div>
                      {asistencia.ubicacion_gps && (
                        <a
                          href={`https://www.google.com/maps?q=${asistencia.ubicacion_gps.latitud},${asistencia.ubicacion_gps.longitud}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-[#00E5A3] transition-colors mt-1"
                        >
                          <MapPin className="w-3 h-3 text-[#00E5A3]" />
                          <span>±{asistencia.ubicacion_gps.precision_metros}m</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <AttendanceRecordActions
                      recordName={asistencia.empleado_nombre}
                      onView={() => onViewAttendance(asistencia)}
                      canEdit={puedeEditarAsistencias}
                      canDelete={puedeEliminarAsistencias}
                      onEdit={() => onEditAttendance(asistencia)}
                      onDelete={() => onDeleteAttendance(asistencia)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
