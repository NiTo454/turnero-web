'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Activity, ShieldCheck, Stethoscope, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { user, empleado, signInWithGoogle, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (empleado && !empleado.perfil_completado) {
        router.push('/completar-perfil');
      } else {
        router.push('/');
      }
    }
  }, [user, empleado, loading, router]);

  const handleLogin = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      // El useEffect redirigirá automáticamente al cambiar el estado de auth
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('La ventana de Google fue cerrada antes de completar el acceso.');
      } else if (err.code === 'auth/configuration-not-found' || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        setErrorMsg('Falta configurar las credenciales de Firebase en el archivo .env.local.');
      } else {
        setErrorMsg(err.message || 'Error al iniciar sesión con Google.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 bg-[#070C16] overflow-hidden">
      {/* Luces y resplandores de fondo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#00E5A3]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#38BDF8]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Tarjeta principal Glassmorphism */}
        <div className="glass-card rounded-3xl p-8 sm:p-10 border border-[#1C2F4D]/80 relative overflow-hidden">
          {/* Acento superior degradado */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00E5A3] via-[#38BDF8] to-[#00E5A3]" />

          {/* Emblema Clínico */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#101C30] to-[#172640] border border-[#28436D] flex items-center justify-center shadow-2xl mint-glow">
                <Stethoscope className="w-10 h-10 text-[#00E5A3]" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#00E5A3] text-[#070C16] shadow-md">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <h1 className="mt-5 text-3xl font-extrabold text-white tracking-wide text-center">
              Turnero
            </h1>
            
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5A3]/10 border border-[#00E5A3]/25 text-[#00E5A3] text-xs font-semibold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#00E5A3] animate-pulse" />
              Sistema Médico • Dr. Issac
            </div>

            <p className="mt-3 text-center text-sm text-[#94A3B8] max-w-xs leading-relaxed">
              Control y supervisión de turnos de enfermería y personal clínico.
            </p>
          </div>

          {/* Alerta de Error si ocurre */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/30 flex items-start gap-3 text-sm text-[#FB7185]">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botón de Inicio con Google */}
          <button
            onClick={handleLogin}
            disabled={isSubmitting || loading}
            className="w-full relative group flex items-center justify-center gap-3.5 px-6 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {/* SVG Logo oficial de Google */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>

            <span>{isSubmitting ? 'Iniciando sesión...' : 'Continuar con Google'}</span>
          </button>

          {/* Información y Seguridad */}
          <div className="mt-8 pt-6 border-t border-[#1C2F4D]/60 flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#00E5A3]" />
              <span>Autenticación Segura</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>PWA Web 2.0</span>
            </div>
          </div>
        </div>

        {/* Footer institucional */}
        <p className="mt-6 text-center text-xs text-[#64748B]">
          © 2026 Consultorio Médico Dr. Issac • Todos los derechos reservados.
        </p>
      </div>
    </main>
  );
}
