'use client';

import React from 'react';
import { X, Globe, User, Code2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop sutil */}
      <div className="absolute inset-0 bg-[#070C16]/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-sm bg-[#0B1322] sm:rounded-3xl rounded-t-3xl border-t border-[#F43F5E]/20 sm:border border-[#1C2F4D] shadow-2xl p-6 pb-8 sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (solo móvil) */}
        <div className="sm:hidden w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

        {/* Botón cerrar (solo desktop) */}
        <button
          onClick={onClose}
          className="hidden sm:flex absolute top-4 right-4 p-1.5 rounded-xl text-[#64748B] hover:text-white hover:bg-[#1C2F4D] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge </> SINTAXIS LAB_ */}
        <div className="flex justify-center mb-5">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#111A2C] border border-[#F43F5E]/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
            <Code2 className="w-4 h-4 text-[#F43F5E]" />
            <span className="font-black text-white text-sm tracking-widest">SINTAXIS</span>
            <span className="font-black text-[#F43F5E] text-sm tracking-widest">LAB_</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-2 mb-5">
          {['v1.0.0', 'NEXT.JS', 'FIREBASE', 'GPS_ALTA_PRECISIÓN', 'TURNERO_MÉDICO'].map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-lg bg-[#131D2E] border border-[#1C2F4D] text-white/60 text-[10px] font-bold tracking-wider font-mono"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Descripción estilo código */}
        <div className="rounded-2xl bg-[#0F172A] border border-[#1C2F4D] p-4 mb-5 space-y-2.5">
          <p className="text-[#FB923C] text-[11px] font-bold font-mono text-center">
            // Impulsamos tu negocio con soluciones tecnológicas y creativas
          </p>
          <p className="text-white/60 text-xs text-center leading-relaxed">
            Sistema inteligente de control de asistencias con evidencia fotográfica,
            geolocalización satelital de alta precisión y reportes ejecutivos para el{' '}
            <span className="text-[#00E5A3] font-semibold">Dr. Issac</span>.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <a
            href="https://sintaxis-lab-xuse.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-[#F43F5E] text-white text-sm font-bold hover:bg-[#F43F5E]/10 transition-colors"
          >
            <Globe className="w-4 h-4 text-[#F43F5E]" />
            Sintaxis Lab
          </a>
          <a
            href="https://mi-web-bay.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 h-11 rounded-2xl border border-[#FACC15] text-white text-sm font-bold hover:bg-[#FACC15]/10 transition-colors"
          >
            <User className="w-4 h-4 text-[#FACC15]" />
            Nicolás H.
          </a>
        </div>

        {/* Créditos */}
        <div className="text-center space-y-1 mb-5">
          <p className="text-white/40 text-[11px] font-semibold tracking-widest">
            © 2026 NICOLÁS HERNÁNDEZ
          </p>
          <p className="text-[#F43F5E] text-[10px] font-black tracking-[0.2em]">
            CREADO POR SINTAXIS LAB
          </p>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="w-full h-11 rounded-2xl bg-[#FACC15] text-black font-bold text-sm hover:bg-[#FDE047] transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
