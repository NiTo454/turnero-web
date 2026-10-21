'use client';

import React, { useState, useMemo } from 'react';
import { Asistencia } from '@/types';
import { formatFechaHora } from '@/lib/excel';
import { filtrarAsistencias } from '@/lib/filters';
import {
  Search,
  MapPin,
  ExternalLink,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  LogIn,
  LogOut,
  SlidersHorizontal,
  X,
} from 'lucide-react';

interface Props {
  asistencias: Asistencia[];
  onOpenPhoto: (url: string, title: string) => void;
}

export default function GlobalHistoryTable({ asistencias, onOpenPhoto }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ENTRADA' | 'SALIDA'>('TODOS');
  const [filtroTurno, setFiltroTurno] = useState<string>('TODOS');
  const [soloValidosGps, setSoloValidosGps] = useState<boolean>(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false);
  const elementosPorPagina = 15;

  const hayFiltrosActivos =
    busqueda || filtroTipo !== 'TODOS' || filtroTurno !== 'TODOS' || soloValidosGps || fechaInicio || fechaFin;

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroTipo('TODOS');
    setFiltroTurno('TODOS');
    setSoloValidosGps(false);
    setFechaInicio('');
    setFechaFin('');
    setPaginaActual(1);
  };

  const asistenciasFiltradas = useMemo(() => {
    return filtrarAsistencias(asistencias, {
      busqueda,
      tipo: filtroTipo,
      turno: filtroTurno,
      fechaInicio,
      fechaFin,
      soloValidosGps,
    });
  }, [asistencias, busqueda, filtroTipo, filtroTurno, fechaInicio, fechaFin, soloValidosGps]);

  const totalPaginas = Math.ceil(asistenciasFiltradas.length / elementosPorPagina) || 1;
  const elementosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * elementosPorPagina;
    return asistenciasFiltradas.slice(inicio, inicio + elementosPorPagina);
  }, [asistenciasFiltradas, paginaActual]);

  return (
    <div className="space-y-3">

      {/* ── BARRA DE FILTROS ── */}
      <div className="glass-card rounded-2xl border border-[#1C2F4D] overflow-hidden">

        {/* Fila superior: búsqueda + toggle filtros */}
        <div className="flex gap-2 p-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
              placeholder="Buscar personal, paciente, rol..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#00E5A3] transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              filtrosExpandidos || hayFiltrosActivos
                ? 'bg-[#00E5A3]/10 border-[#00E5A3]/40 text-[#00E5A3]'
                : 'bg-[#101C30] border-[#1C2F4D] text-[#94A3B8]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {hayFiltrosActivos && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A3] inline-block" />
            )}
          </button>
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              title="Limpiar filtros"
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/30 text-[#FB7185] cursor-pointer hover:bg-[#FB7185]/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Panel expandible de filtros avanzados */}
        {filtrosExpandidos && (
          <div className="px-3 pb-3 border-t border-[#1C2F4D]/60 pt-3 space-y-3">

            {/* Tipo de movimiento */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#64748B] font-semibold w-14 shrink-0">Tipo</span>
              <div className="flex items-center bg-[#101C30] p-1 rounded-xl border border-[#1C2F4D] gap-0.5">
                {(['TODOS', 'ENTRADA', 'SALIDA'] as const).map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => { setFiltroTipo(tipo); setPaginaActual(1); }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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

            {/* Turno */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#64748B] font-semibold w-14 shrink-0">Turno</span>
              <select
                value={filtroTurno}
                onChange={(e) => { setFiltroTurno(e.target.value); setPaginaActual(1); }}
                className="flex-1 px-3 py-2 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-white text-xs focus:outline-none focus:border-[#00E5A3]"
              >
                <option value="TODOS">Todos los turnos</option>
                <option value="8 horas">8 horas</option>
                <option value="12 horas">12 horas</option>
                <option value="24 horas">24 horas</option>
              </select>
            </div>

            {/* Rango de fechas */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#64748B] font-semibold w-14 shrink-0">Desde</span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => { setFechaInicio(e.target.value); setPaginaActual(1); }}
                className="flex-1 px-3 py-2 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-white text-xs focus:outline-none focus:border-[#00E5A3]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#64748B] font-semibold w-14 shrink-0">Hasta</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => { setFechaFin(e.target.value); setPaginaActual(1); }}
                className="flex-1 px-3 py-2 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-white text-xs focus:outline-none focus:border-[#00E5A3]"
              />
            </div>

            {/* GPS Preciso */}
            <button
              type="button"
              onClick={() => { setSoloValidosGps(!soloValidosGps); setPaginaActual(1); }}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                soloValidosGps
                  ? 'bg-[#00E5A3]/10 text-[#00E5A3] border-[#00E5A3]/40'
                  : 'bg-[#101C30] text-[#94A3B8] border-[#1C2F4D] hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Solo con GPS Preciso (≤45m)
              <span className={`ml-auto w-4 h-4 rounded border flex items-center justify-center text-[10px] ${soloValidosGps ? 'bg-[#00E5A3] border-[#00E5A3] text-[#070C16]' : 'border-[#1C2F4D]'}`}>
                {soloValidosGps ? '✓' : ''}
              </span>
            </button>
          </div>
        )}

        {/* Contador de resultados */}
        <div className="px-3 py-2 border-t border-[#1C2F4D]/40 text-[11px] text-[#64748B] flex items-center justify-between">
          <span>
            <span className="text-white font-semibold">{asistenciasFiltradas.length}</span> registros
            {hayFiltrosActivos && <span className="text-[#00E5A3] ml-1">• filtrado</span>}
          </span>
          {asistencias.length !== asistenciasFiltradas.length && (
            <span>de {asistencias.length} total</span>
          )}
        </div>
      </div>

      {/* ── VISTA MÓVIL: CARDS ── */}
      <div className="sm:hidden space-y-2">
        {elementosPaginados.length === 0 ? (
          <div className="glass-card rounded-2xl border border-[#1C2F4D] py-12 text-center text-[#64748B] text-sm">
            No se encontraron registros.
          </div>
        ) : (
          elementosPaginados.map((item, idx) => {
            const numFila = (paginaActual - 1) * elementosPorPagina + idx + 1;
            const { fecha, hora } = formatFechaHora(item.fecha_hora || item.fecha_local_str);
            const esEntrada = item.tipo === 'ENTRADA';
            const foto = item.foto_url || item.foto_drive_url;

            return (
              <div
                key={item.id || idx}
                className={`glass-card rounded-2xl border p-3.5 space-y-2.5 ${
                  esEntrada ? 'border-[#00E5A3]/20' : 'border-[#FB7185]/20'
                }`}
              >
                {/* Fila 1: número + badge tipo + fecha */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#64748B] w-5 text-right shrink-0">{numFila}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        esEntrada
                          ? 'bg-[#00E5A3]/10 text-[#00E5A3] border border-[#00E5A3]/30'
                          : 'bg-[#FB7185]/10 text-[#FB7185] border border-[#FB7185]/30'
                      }`}
                    >
                      {esEntrada ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                      {item.tipo}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-white">{fecha}</div>
                    <div className="text-[11px] text-[#94A3B8] font-mono flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {hora}
                    </div>
                  </div>
                </div>

                {/* Fila 2: nombre + rol */}
                <div className="flex items-center gap-2 pl-7">
                  <div className="w-7 h-7 rounded-full bg-[#101C30] border border-[#1C2F4D] flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{item.empleado_nombre}</div>
                    <div className="text-[11px] text-[#94A3B8]">{item.empleado_rol} · {item.turno}</div>
                  </div>
                </div>

                {/* Fila 3: paciente si hay */}
                {item.paciente && (
                  <div className="pl-7 text-[11px] text-[#38BDF8] truncate">
                    👤 {item.paciente}
                  </div>
                )}

                {/* Fila 4: GPS + foto */}
                <div className="flex items-center justify-between pl-7 pt-1 border-t border-[#1C2F4D]/40">
                  {item.ubicacion_gps ? (
                    <a
                      href={`https://www.google.com/maps?q=${item.ubicacion_gps.latitud},${item.ubicacion_gps.longitud}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#94A3B8] hover:text-[#00E5A3] text-[11px]"
                    >
                      <MapPin className="w-3 h-3 text-[#00E5A3]" />
                      ±{Math.round(item.ubicacion_gps.precision_metros ?? 0)}m
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-[#64748B]">Sin GPS</span>
                  )}

                  {foto ? (
                    <button
                      type="button"
                      onClick={() => onOpenPhoto(foto, item.empleado_nombre)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-[#00E5A3] text-[11px] font-semibold hover:bg-[#00E5A3]/10 transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Foto
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#64748B]">Sin foto</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── VISTA DESKTOP: TABLA ── */}
      <div className="hidden sm:block glass-card rounded-2xl border border-[#1C2F4D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#101C30] border-b border-[#1C2F4D] text-[#94A3B8] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Personal</th>
                <th className="py-3 px-4">Movimiento</th>
                <th className="py-3 px-4">Turno</th>
                <th className="py-3 px-4">Pacientes</th>
                <th className="py-3 px-4">Ubicación GPS</th>
                <th className="py-3 px-4 text-center">Evidencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2F4D]/50 text-white">
              {elementosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#94A3B8]">
                    No se encontraron asistencias con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                elementosPaginados.map((item, idx) => {
                  const numFila = (paginaActual - 1) * elementosPorPagina + idx + 1;
                  const { fecha, hora } = formatFechaHora(item.fecha_hora || item.fecha_local_str);
                  const esEntrada = item.tipo === 'ENTRADA';
                  const foto = item.foto_url || item.foto_drive_url;

                  return (
                    <tr key={item.id || idx} className="hover:bg-[#101C30]/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#64748B]">{numFila}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold">{fecha}</div>
                        <div className="text-[11px] text-[#94A3B8] font-mono">{hora}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold truncate max-w-[150px]">{item.empleado_nombre}</div>
                        <div className="text-[11px] text-[#94A3B8]">{item.empleado_rol}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            esEntrada
                              ? 'bg-[#00E5A3]/10 text-[#00E5A3] border border-[#00E5A3]/30'
                              : 'bg-[#FB7185]/10 text-[#FB7185] border border-[#FB7185]/30'
                          }`}
                        >
                          {esEntrada ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                          {item.tipo}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[#94A3B8]">{item.turno}</td>
                      <td className="py-3 px-4 max-w-[200px] truncate" title={item.paciente}>
                        <span className="text-[#38BDF8]">{item.paciente || '—'}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.ubicacion_gps ? (
                          <a
                            href={`https://www.google.com/maps?q=${item.ubicacion_gps.latitud},${item.ubicacion_gps.longitud}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#94A3B8] hover:text-[#00E5A3]"
                          >
                            <MapPin className="w-3 h-3 text-[#00E5A3]" />
                            <span>±{Math.round(item.ubicacion_gps.precision_metros ?? 0)}m</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-[#64748B]">Sin GPS</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {foto ? (
                          <button
                            type="button"
                            onClick={() => onOpenPhoto(foto, item.empleado_nombre)}
                            className="p-1.5 rounded-lg bg-[#101C30] hover:bg-[#00E5A3]/20 text-[#00E5A3] border border-[#1C2F4D] transition-colors cursor-pointer"
                            title="Ver fotografía de evidencia"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[#64748B] text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="py-3 px-4 border-t border-[#1C2F4D] flex items-center justify-between text-xs text-[#94A3B8]">
            <div>
              Mostrando {elementosPaginados.length} de {asistenciasFiltradas.length} registros
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-[#101C30] border border-[#1C2F4D] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white">
                Pág. {paginaActual} de {totalPaginas}
              </span>
              <button
                disabled={paginaActual === totalPaginas}
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                className="p-1.5 rounded-lg bg-[#101C30] border border-[#1C2F4D] disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Paginación móvil (debajo de las cards) */}
      {totalPaginas > 1 && (
        <div className="sm:hidden flex items-center justify-between px-1 text-xs text-[#94A3B8]">
          <button
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#101C30] border border-[#1C2F4D] disabled:opacity-40 cursor-pointer text-white font-semibold"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <span className="font-semibold text-white">
            {paginaActual} / {totalPaginas}
          </span>
          <button
            disabled={paginaActual === totalPaginas}
            onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#101C30] border border-[#1C2F4D] disabled:opacity-40 cursor-pointer text-white font-semibold"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
