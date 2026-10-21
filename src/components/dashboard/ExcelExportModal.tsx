'use client';

import React, { useState } from 'react';
import { Asistencia } from '@/types';
import { exportarAsistenciasAExcel, exportarAsistenciasACSV } from '@/lib/excel';
import {
  FileSpreadsheet,
  Calendar,
  CalendarDays,
  CalendarRange,
  Layers,
  FileText,
  X,
  Download,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  asistencias: Asistencia[];
}

export default function ExcelExportModal({ isOpen, onClose, asistencias }: Props) {
  const [rangoInicio, setRangoInicio] = useState('');
  const [rangoFin, setRangoFin] = useState('');
  const [mostrarRangoPersonalizado, setMostrarRangoPersonalizado] = useState(false);

  if (!isOpen) return null;

  const filtrarPorFechas = (inicio: Date, fin: Date) => {
    const inicioStr = inicio.toISOString().split('T')[0];
    const finStr = fin.toISOString().split('T')[0];

    return asistencias.filter((a) => {
      const fechaDoc = a.fecha_hora?.toDate
        ? a.fecha_hora.toDate().toISOString().split('T')[0]
        : a.fecha_local_str
        ? a.fecha_local_str.split('T')[0]
        : '';
      return fechaDoc >= inicioStr && fechaDoc <= finStr;
    });
  };

  const handleExportarHoy = () => {
    const hoy = new Date();
    const filtradas = filtrarPorFechas(hoy, hoy);
    exportarAsistenciasAExcel(filtradas, 'Hoy');
    onClose();
  };

  const handleExportarSemana = () => {
    const hoy = new Date();
    const primerDiaSemana = new Date(hoy);
    primerDiaSemana.setDate(hoy.getDate() - hoy.getDay());
    const filtradas = filtrarPorFechas(primerDiaSemana, hoy);
    exportarAsistenciasAExcel(filtradas, 'Esta_Semana');
    onClose();
  };

  const handleExportarMes = () => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const filtradas = filtrarPorFechas(primerDiaMes, hoy);
    exportarAsistenciasAExcel(filtradas, 'Este_Mes');
    onClose();
  };

  const handleExportarCompleto = () => {
    exportarAsistenciasAExcel(asistencias, 'Historial_Completo');
    onClose();
  };

  const handleExportarCsv = () => {
    exportarAsistenciasACSV(asistencias, 'Historial_CSV');
    onClose();
  };

  const handleExportarPersonalizado = () => {
    if (!rangoInicio || !rangoFin) {
      alert('Por favor selecciona las fechas de inicio y fin.');
      return;
    }
    const filtradas = asistencias.filter((a) => {
      const fechaDoc = a.fecha_hora?.toDate
        ? a.fecha_hora.toDate().toISOString().split('T')[0]
        : a.fecha_local_str
        ? a.fecha_local_str.split('T')[0]
        : '';
      return fechaDoc >= rangoInicio && fechaDoc <= rangoFin;
    });
    exportarAsistenciasAExcel(filtradas, `Rango_${rangoInicio}_al_${rangoFin}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070C16]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card max-w-lg w-full rounded-3xl p-6 sm:p-7 border border-[#1C2F4D] shadow-2xl animate-in fade-in zoom-in-95">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1C2F4D] mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00E5A3]/10 text-[#00E5A3] mint-glow">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Descargar Reporte Excel</h3>
              <p className="text-xs text-[#94A3B8]">Selecciona el periodo que deseas exportar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Opciones de exportación */}
        <div className="space-y-2.5">
          {/* Opción 1: Hoy */}
          <button
            onClick={handleExportarHoy}
            className="w-full p-3.5 rounded-2xl bg-[#101C30] hover:bg-[#172640] border border-[#1C2F4D] hover:border-[#00E5A3]/40 flex items-center justify-between transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#00E5A3]/10 text-[#00E5A3]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-[#00E5A3] transition-colors">
                  Asistencias de Hoy
                </div>
                <div className="text-[11px] text-[#94A3B8]">Fichajes registrados únicamente durante el día actual</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#00E5A3]/10 text-[#00E5A3]">HOY</span>
          </button>

          {/* Opción 2: Esta semana */}
          <button
            onClick={handleExportarSemana}
            className="w-full p-3.5 rounded-2xl bg-[#101C30] hover:bg-[#172640] border border-[#1C2F4D] hover:border-[#38BDF8]/40 flex items-center justify-between transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8]">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-[#38BDF8] transition-colors">
                  Esta Semana en Curso
                </div>
                <div className="text-[11px] text-[#94A3B8]">Registros desde el inicio de la semana hasta hoy</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#38BDF8]/10 text-[#38BDF8]">SEMANA</span>
          </button>

          {/* Opción 3: Este mes */}
          <button
            onClick={handleExportarMes}
            className="w-full p-3.5 rounded-2xl bg-[#101C30] hover:bg-[#172640] border border-[#1C2F4D] hover:border-[#FBBF24]/40 flex items-center justify-between transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#FBBF24]/10 text-[#FBBF24]">
                <CalendarRange className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-[#FBBF24] transition-colors">
                  Mes Actual
                </div>
                <div className="text-[11px] text-[#94A3B8]">Ideal para control mensual y nómina de turnos</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FBBF24]/10 text-[#FBBF24]">MES</span>
          </button>

          {/* Opción 4: Historial Completo */}
          <button
            onClick={handleExportarCompleto}
            className="w-full p-3.5 rounded-2xl bg-[#101C30] hover:bg-[#172640] border border-[#1C2F4D] hover:border-[#00E5A3]/40 flex items-center justify-between transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#00E5A3]/10 text-[#00E5A3]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-[#00E5A3] transition-colors">
                  Historial Histórico Completo (.xlsx)
                </div>
                <div className="text-[11px] text-[#94A3B8]">Todos los fichajes existentes en la base de datos</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#00E5A3]/10 text-[#00E5A3]">TODO</span>
          </button>

          {/* Opción 5: Formato CSV Universal */}
          <button
            onClick={handleExportarCsv}
            className="w-full p-3.5 rounded-2xl bg-[#101C30] hover:bg-[#172640] border border-[#1C2F4D] hover:border-[#38BDF8]/40 flex items-center justify-between transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8]">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-sm group-hover:text-[#38BDF8] transition-colors">
                  Formato CSV Universal (.csv)
                </div>
                <div className="text-[11px] text-[#94A3B8]">Texto tabular compatible con cualquier visor o sistema</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#38BDF8]/10 text-[#38BDF8]">CSV</span>
          </button>

          {/* Rango Personalizado Toggle */}
          <div className="pt-2">
            {!mostrarRangoPersonalizado ? (
              <button
                type="button"
                onClick={() => setMostrarRangoPersonalizado(true)}
                className="text-xs text-[#38BDF8] hover:underline font-semibold cursor-pointer"
              >
                + Elegir rango de fechas personalizado
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-[#101C30] border border-[#1C2F4D] space-y-3">
                <div className="text-xs font-bold text-white">Rango Personalizado:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-[#94A3B8] block mb-1">Desde:</label>
                    <input
                      type="date"
                      value={rangoInicio}
                      onChange={(e) => setRangoInicio(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#172640] border border-[#28436D] text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94A3B8] block mb-1">Hasta:</label>
                    <input
                      type="date"
                      value={rangoFin}
                      onChange={(e) => setRangoFin(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#172640] border border-[#28436D] text-white focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportarPersonalizado}
                  className="w-full py-2.5 rounded-xl bg-[#00E5A3] text-[#070C16] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md mint-glow"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar Rango Seleccionado
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
