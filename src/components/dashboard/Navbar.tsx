'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Clock, Stethoscope, Code2 } from 'lucide-react';
import AboutModal from './AboutModal';

export default function Navbar() {
  const { user, empleado, signOut, esAdmin } = useAuth();
  const [aboutAbierto, setAboutAbierto] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-40 glass-panel border-b border-[#1C2F4D]/70 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Marca Dr. Issac */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#101C30] to-[#172640] border border-[#28436D] flex items-center justify-center mint-glow group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5 text-[#00E5A3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-wide">Turnero</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E5A3]/10 border border-[#00E5A3]/30 text-[#00E5A3]">
                  DR. ISSAC
                </span>
              </div>
              <div className="text-[11px] text-[#94A3B8]">Panel de Control Clínico</div>
            </div>
          </Link>

          {/* Acciones del Usuario */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botón para fichar */}
            <Link
              href="/fichar"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5A3] to-[#38BDF8] text-[#070C16] font-bold text-xs sm:text-sm shadow-md hover:opacity-95 active:scale-95 transition-all mint-glow cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Fichar Turno</span>
              <span className="sm:hidden">Fichar</span>
            </Link>

            {/* Información del perfil */}
            <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-[#1C2F4D]">
              {user?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-9 h-9 rounded-full border border-[#00E5A3]/40 object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#172640] border border-[#28436D] flex items-center justify-center font-bold text-xs text-[#00E5A3]">
                  {(empleado?.nombre || user?.displayName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left text-xs">
                <div className="font-semibold text-white truncate max-w-[140px]">
                  {empleado?.nombre || user?.displayName || 'Usuario'}
                </div>
                <div className="text-[#94A3B8] text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A3]" />
                  {empleado?.rol || 'Personal'}
                  {esAdmin && <span className="text-[#38BDF8] font-bold">• Admin</span>}
                </div>
              </div>
            </div>

            {/* Botón Acerca de — sutil, esquina superior */}
            <button
              onClick={() => setAboutAbierto(true)}
              title="Acerca de · Sintaxis Lab"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#101C30] hover:bg-[#F43F5E]/10 text-[#64748B] hover:text-[#F43F5E] border border-[#1C2F4D] hover:border-[#F43F5E]/30 transition-colors cursor-pointer text-[11px] font-bold font-mono"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Acerca de</span>
            </button>

            {/* Botón Cerrar Sesión */}
            <button
              onClick={signOut}
              title="Cerrar Sesión"
              className="p-2 rounded-xl bg-[#101C30] hover:bg-[#FB7185]/10 text-[#94A3B8] hover:text-[#FB7185] border border-[#1C2F4D] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Modal Acerca de */}
      <AboutModal isOpen={aboutAbierto} onClose={() => setAboutAbierto(false)} />
    </>
  );
}
