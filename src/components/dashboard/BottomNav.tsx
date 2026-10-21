'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, History, Users, Clock, FileSpreadsheet } from 'lucide-react';

interface Props {
  tabActiva: 'monitor' | 'historial' | 'equipo';
  onCambiarTab: (tab: 'monitor' | 'historial' | 'equipo') => void;
  puedeVerHistorial: boolean;
  puedeVerPersonal: boolean;
  puedeExportar: boolean;
  onOpenExcel: () => void;
}

export default function BottomNav({
  tabActiva,
  onCambiarTab,
  puedeVerHistorial,
  puedeVerPersonal,
  puedeExportar,
  onOpenExcel,
}: Props) {
  return (
    <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 pb-safe">
      <div className="mx-3 mb-3 glass-panel rounded-3xl border border-[#1C2F4D]/80 shadow-2xl px-3 py-2 flex items-center justify-around backdrop-blur-xl bg-[#0B1322]/90">
        {/* Tab Monitor (Solo administradores / doctores con permiso) */}
        {puedeVerPersonal ? (
          <button
            onClick={() => onCambiarTab('monitor')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-2xl transition-all cursor-pointer ${
              tabActiva === 'monitor' ? 'text-[#00E5A3]' : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-bold">Monitor</span>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-1 p-1.5 rounded-2xl text-[#00E5A3]">
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-bold">Mi Turno</span>
          </div>
        )}

        {/* Tab Historial */}
        {puedeVerHistorial && (
          <button
            onClick={() => onCambiarTab('historial')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-2xl transition-all cursor-pointer ${
              tabActiva === 'historial' ? 'text-[#00E5A3]' : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-bold">Historial</span>
          </button>
        )}

        {/* Botón Central FICHAR */}
        <Link
          href="/fichar"
          className="relative -top-4 flex flex-col items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#00E5A3] to-[#38BDF8] text-[#070C16] shadow-xl mint-glow active:scale-95 transition-transform"
        >
          <Clock className="w-6 h-6 stroke-[2.5]" />
          <span className="sr-only">Fichar Asistencia</span>
        </Link>

        {/* Tab Equipo */}
        {puedeVerPersonal && (
          <button
            onClick={() => onCambiarTab('equipo')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-2xl transition-all cursor-pointer ${
              tabActiva === 'equipo' ? 'text-[#00E5A3]' : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold">Equipo</span>
          </button>
        )}

        {/* Botón Excel */}
        {puedeExportar && (
          <button
            onClick={onOpenExcel}
            className="flex flex-col items-center gap-1 p-1.5 rounded-2xl text-[#64748B] hover:text-[#00E5A3] transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-[10px] font-bold">Excel</span>
          </button>
        )}
      </div>
    </div>
  );
}
