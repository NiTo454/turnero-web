'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserCheck, Phone, User, HeartPulse, CheckCircle2, Shield, ArrowRight } from 'lucide-react';

export default function CompletarPerfilPage() {
  const { user, empleado, loading } = useAuth();
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState<'Enfermera' | 'Enfermero'>('Enfermera');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user?.displayName && !nombre) {
      setNombre(user.displayName);
    }
    if (empleado?.perfil_completado) {
      router.push('/');
    }
  }, [user, empleado, loading, router, nombre]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!nombre.trim()) {
      setErrorMsg('Por favor ingresa tu nombre completo.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const rolSeguro = rol === 'Enfermero' ? 'Enfermero' : 'Enfermera';
      const userDocRef = doc(db, 'empleados', user.uid);

      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          nombre: nombre.trim(),
          email: user.email || '',
          foto: user.photoURL || '',
          telefono: telefono.trim(),
          rol: rolSeguro,
          is_active: true,
          grupos: [rolSeguro.toLowerCase()],
          permisos_directos: [],
          perfil_completado: true,
          actualizado_en: serverTimestamp(),
          creado_en: serverTimestamp(),
        },
        { merge: true }
      );

      router.push('/');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error al guardar el perfil: ' + err.message);
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070C16] flex items-center justify-center text-[#94A3B8]">
        <div className="w-8 h-8 border-2 border-[#00E5A3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 bg-[#070C16]">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#00E5A3]/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative w-full max-w-lg">
        <div className="glass-card rounded-3xl p-8 sm:p-10 border border-[#1C2F4D] relative shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#00E5A3]/10 border border-[#00E5A3]/30 flex items-center justify-center mint-glow text-[#00E5A3]">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Completar Perfil Clínico</h1>
              <p className="text-xs text-[#94A3B8]">Configura tu información para el registro de turnos</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/30 text-sm text-[#FB7185]">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Nombre */}
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                Nombre Completo Oficial
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Lic. Ana Sofía Morales"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-white placeholder-[#64748B] focus:outline-none focus:border-[#00E5A3] transition-colors text-sm"
                />
              </div>
            </div>

            {/* Campo Teléfono */}
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                Teléfono de Contacto (WhatsApp)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. +52 55 1234 5678"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-white placeholder-[#64748B] focus:outline-none focus:border-[#00E5A3] transition-colors text-sm"
                />
              </div>
            </div>

            {/* Selector de Rol */}
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                Rol Clínico Principal
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRol('Enfermera')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    rol === 'Enfermera'
                      ? 'bg-[#00E5A3]/10 border-[#00E5A3] mint-glow'
                      : 'bg-[#101C30] border-[#1C2F4D] hover:border-[#28436D]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <HeartPulse className={`w-6 h-6 ${rol === 'Enfermera' ? 'text-[#00E5A3]' : 'text-[#64748B]'}`} />
                    {rol === 'Enfermera' && <CheckCircle2 className="w-5 h-5 text-[#00E5A3]" />}
                  </div>
                  <div className="font-bold text-white text-sm">Enfermera</div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">Atención y turnos</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRol('Enfermero')}
                  className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    rol === 'Enfermero'
                      ? 'bg-[#38BDF8]/10 border-[#38BDF8] cyan-glow'
                      : 'bg-[#101C30] border-[#1C2F4D] hover:border-[#28436D]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Shield className={`w-6 h-6 ${rol === 'Enfermero' ? 'text-[#38BDF8]' : 'text-[#64748B]'}`} />
                    {rol === 'Enfermero' && <CheckCircle2 className="w-5 h-5 text-[#38BDF8]" />}
                  </div>
                  <div className="font-bold text-white text-sm">Enfermero</div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">Atención y turnos</div>
                </button>
              </div>
            </div>

            {/* Botón de Guardado */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#00E5A3] to-[#38BDF8] text-[#070C16] font-bold text-base shadow-xl hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSaving ? 'Guardando información...' : 'Confirmar y Comenzar'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
