'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subirFotoAGoogleDrive } from '@/lib/drive';
import { UbicacionGPS } from '@/types';
import confetti from 'canvas-confetti';
import {
  Clock,
  MapPin,
  Camera,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  UploadCloud,
  Navigation,
  Sparkles,
  RotateCw,
  Radio,
} from 'lucide-react';
import { useHighAccuracyGeolocation } from '@/hooks/useHighAccuracyGeolocation';

const ENTIDADES_MEXICO = [
  'Ciudad de México (CDMX)',
  'Estado de México',
  'Jalisco',
  'Nuevo León',
  'Puebla',
  'Querétaro',
  'Guanajuato',
  'Veracruz',
  'Yucatán',
  'Quintana Roo',
  'Baja California',
  'Chihuahua',
  'Coahuila',
  'Sonora',
  'Sinaloa',
  'Michoacán',
  'Morelos',
  'Hidalgo',
  'San Luis Potosí',
  'Aguascalientes',
  'Tamaulipas',
  'Tabasco',
  'Chiapas',
  'Oaxaca',
  'Guerrero',
  'Nayarit',
  'Colima',
  'Durango',
  'Zacatecas',
  'Tlaxcala',
  'Campeche',
  'Baja California Sur',
];

export default function FichajePage() {
  const { user, empleado, loading } = useAuth();
  const router = useRouter();

  // Estados del Formulario
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [turno, setTurno] = useState<string>('12 horas');
  const [pacientes, setPacientes] = useState<string[]>(['']);
  const [entidad, setEntidad] = useState<string>('Ciudad de México (CDMX)');

  // Hook de GPS Satelital de Alta Precisión Progresivo
  const {
    gps,
    isLoading: isLoadingGps,
    isCalibrating,
    error: gpsError,
    mejoraMargen,
    recalibrar: obtenerUbicacion,
  } = useHighAccuracyGeolocation();

  // Foto
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Proceso de guardado
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savingStep, setSavingStep] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Manejadores de pacientes
  const handlePacienteChange = (index: number, val: string) => {
    const updated = [...pacientes];
    updated[index] = val;
    setPacientes(updated);
  };

  const handleAddPaciente = () => {
    setPacientes([...pacientes, '']);
  };

  const handleRemovePaciente = (index: number) => {
    if (pacientes.length <= 1) {
      setPacientes(['']);
      return;
    }
    setPacientes(pacientes.filter((_, i) => i !== index));
  };

  // Manejo de la foto
  const handleFotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Guardar Fichaje
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const pacientesLimpios = pacientes.map((p) => p.trim()).filter((p) => p.length > 0);
    if (pacientesLimpios.length === 0) {
      setFormError('Por favor ingresa al menos el nombre de un paciente.');
      return;
    }

    if (!gps) {
      setFormError('Se requiere ubicación GPS válida para registrar la asistencia.');
      obtenerUbicacion();
      return;
    }

    if (!fotoFile && !fotoPreview) {
      setFormError('La foto de evidencia es obligatoria.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Subir a Google Drive
      setSavingStep('Subiendo evidencia fotográfica a Google Drive...');
      let driveData = { id: '', url: '', drive_url: '' };
      try {
        if (fotoFile) {
          driveData = await subirFotoAGoogleDrive(fotoFile);
        } else if (fotoPreview) {
          driveData = await subirFotoAGoogleDrive(fotoPreview);
        }
      } catch (err: any) {
        console.warn('Advertencia subiendo foto a Drive:', err);
      }

      // 2. Guardar en Firestore
      setSavingStep('Registrando asistencia en Firestore...');
      const nombreOficial = empleado?.nombre || user?.displayName || 'Personal de Salud';
      const emailOficial = empleado?.email || user?.email || '';
      const rolOficial = empleado?.rol || 'Enfermera';
      const pacienteString = pacientesLimpios.join(' • ');

      await addDoc(collection(db, 'asistencias'), {
        empleado_uid: user?.uid,
        empleado_nombre: nombreOficial,
        empleado_email: emailOficial,
        empleado_rol: rolOficial,
        empleado_foto_perfil: user?.photoURL || '',
        tipo: tipo,
        turno: turno,
        paciente: pacienteString,
        pacientes: pacientesLimpios,
        total_pacientes: pacientesLimpios.length,
        entidad_federativa: entidad,
        ubicacion_gps: {
          latitud: gps.latitud,
          longitud: gps.longitud,
          precision_metros: Number(gps.precision_metros.toFixed(1)),
          calidad_gps: gps.calidad_gps,
        },
        gps_valido: gps.precision_metros <= 45,
        foto_url: driveData.url || fotoPreview || '',
        foto_drive_url: driveData.drive_url || '',
        foto_drive_id: driveData.id || '',
        fecha_hora: serverTimestamp(),
        fecha_local_str: new Date().toISOString(),
      });

      // Animación de confeti de celebración
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00E5A3', '#38BDF8', '#FBBF24'],
      });

      // Feedback háptico en móviles
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
      }

      setSavingStep('¡Asistencia registrada con éxito!');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setFormError('Error al guardar asistencia: ' + (err.message || err));
      setIsSaving(false);
    }
  };

  const precisionBadge = () => {
    if (isLoadingGps) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] text-xs font-semibold animate-pulse">
          <Navigation className="w-3.5 h-3.5 animate-spin" />
          Buscando satélites GPS...
        </span>
      );
    }
    if (isCalibrating) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-[#FBBF24] text-xs font-semibold animate-pulse">
          <Radio className="w-3.5 h-3.5 animate-pulse text-[#00E5A3]" />
          Optimizando señal (±{mejoraMargen.toFixed(1)}m)...
        </span>
      );
    }
    if (gpsError) {
      return (
        <button
          type="button"
          onClick={obtenerUbicacion}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FB7185]/10 text-[#FB7185] text-xs font-semibold hover:bg-[#FB7185]/20 cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Reintentar GPS
        </button>
      );
    }
    if (gps) {
      const colorCls =
        gps.calidad_gps === 'EXCELENTE'
          ? 'bg-[#00E5A3]/10 text-[#00E5A3] border-[#00E5A3]/30'
          : gps.calidad_gps === 'ALTA'
          ? 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30'
          : 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/30';

      return (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${colorCls}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Precisión {gps.calidad_gps} (±{gps.precision_metros.toFixed(1)}m)
          </span>
          <button
            type="button"
            onClick={obtenerUbicacion}
            title="Recalibrar señal satelital"
            className="p-1 rounded-lg bg-[#101C30] hover:bg-[#172640] border border-[#1C2F4D] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="min-h-screen bg-[#070C16] text-[#F8FAFC] pb-16">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 glass-panel border-b border-[#1C2F4D] px-4 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm font-semibold text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Panel</span>
          </button>
          <div className="text-right">
            <div className="text-xs text-[#94A3B8]">Personal de Turno</div>
            <div className="text-sm font-bold text-white">
              {empleado?.nombre || user?.displayName || 'Usuario'}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-[#00E5A3]" />
            Registrar Asistencia
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Fichaje oficial con geolocalización satelital y evidencia de servicio.
          </p>
        </div>

        {/* Modal de Progreso al Guardar */}
        {isSaving && (
          <div className="fixed inset-0 z-50 bg-[#070C16]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card max-w-sm w-full p-8 rounded-3xl border border-[#00E5A3]/40 text-center mint-glow animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#00E5A3]/10 border border-[#00E5A3]/30 flex items-center justify-center text-[#00E5A3]">
                <UploadCloud className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Procesando Fichaje</h3>
              <p className="text-sm text-[#94A3B8] mb-4">{savingStep}</p>
              <div className="w-full bg-[#101C30] rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#00E5A3] to-[#38BDF8] h-full w-full animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de Error */}
        {formError && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FB7185]/10 border border-[#FB7185]/30 text-sm text-[#FB7185] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selector ENTRADA / SALIDA */}
          <div className="glass-card rounded-2xl p-2 border border-[#1C2F4D] grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo('ENTRADA')}
              className={`py-3.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                tipo === 'ENTRADA'
                  ? 'bg-[#00E5A3] text-[#070C16] shadow-lg mint-glow'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#101C30]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              ENTRADA
            </button>
            <button
              type="button"
              onClick={() => setTipo('SALIDA')}
              className={`py-3.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                tipo === 'SALIDA'
                  ? 'bg-[#FB7185] text-[#070C16] shadow-lg coral-glow'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#101C30]'
              }`}
            >
              <Clock className="w-4 h-4" />
              SALIDA
            </button>
          </div>

          {/* Tarjeta de GPS */}
          <div className="glass-card rounded-2xl p-5 border border-[#1C2F4D]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <MapPin className="w-4 h-4 text-[#00E5A3]" />
                Ubicación Satelital GPS
              </div>
              {precisionBadge()}
            </div>

            {gps ? (
              <div className="text-xs text-[#94A3B8] space-y-1">
                <div>
                  Coordenadas:{' '}
                  <span className="font-mono text-white">
                    {gps.latitud.toFixed(5)}, {gps.longitud.toFixed(5)}
                  </span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${gps.latitud},${gps.longitud}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-[#38BDF8] hover:underline pt-1 text-[11px]"
                >
                  Ver en Google Maps ↗
                </a>

                {gps.precision_metros > 40 && (
                  <div className="mt-2.5 p-2 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 text-[11px] text-[#FBBF24] flex items-start gap-1.5">
                    <span className="font-bold">Consejo:</span>
                    <span>Para precisión satelital menor a 15m, asegúrate de activar la ubicación precisa en los ajustes de tu navegador o acércate a una ventana.</span>
                  </div>
                )}
              </div>
            ) : gpsError ? (
              <div className="text-xs text-[#FB7185]">{gpsError}</div>
            ) : (
              <div className="text-xs text-[#94A3B8]">Conectando con satélites GPS...</div>
            )}
          </div>

          {/* Duración del Turno (Chips táctiles) y Entidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-[#1C2F4D]">
              <label className="block text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">
                Duración del Turno
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['8 horas', '12 horas', '24 horas'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTurno(t)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      turno === t
                        ? 'bg-[#00E5A3] text-[#070C16] shadow-md mint-glow'
                        : 'bg-[#101C30] text-[#94A3B8] hover:text-white border border-[#1C2F4D]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-[#1C2F4D]">
              <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                Entidad Federativa
              </label>
              <select
                value={entidad}
                onChange={(e) => setEntidad(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-white focus:outline-none focus:border-[#00E5A3] text-sm"
              >
                {ENTIDADES_MEXICO.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paciente(s) Atendido(s) */}
          <div className="glass-card rounded-2xl p-5 border border-[#1C2F4D]">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Paciente(s) Atendido(s)
              </label>
              <button
                type="button"
                onClick={handleAddPaciente}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00E5A3]/10 text-[#00E5A3] text-xs font-semibold hover:bg-[#00E5A3]/20 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Agregar Paciente
              </button>
            </div>

            <div className="space-y-3">
              {pacientes.map((paciente, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={paciente}
                    onChange={(e) => handlePacienteChange(idx, e.target.value)}
                    placeholder={`Nombre del paciente #${idx + 1}`}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#00E5A3]"
                  />
                  {pacientes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePaciente(idx)}
                      className="p-2.5 rounded-xl bg-[#FB7185]/10 text-[#FB7185] hover:bg-[#FB7185]/20 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Evidencia Fotográfica */}
          <div className="glass-card rounded-2xl p-5 border border-[#1C2F4D]">
            <label className="block text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">
              Fotografía de Evidencia (Obligatoria)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFotoSelected}
              className="hidden"
            />

            {fotoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-[#1C2F4D] max-h-72 flex items-center justify-center bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fotoPreview} alt="Evidencia de fichaje" className="w-full h-auto max-h-72 object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setFotoFile(null);
                    setFotoPreview(null);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-[#FB7185] text-[#070C16] shadow-lg cursor-pointer hover:opacity-90"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-[#1C2F4D] hover:border-[#00E5A3] rounded-2xl flex flex-col items-center justify-center gap-2.5 text-[#94A3B8] hover:text-white transition-colors cursor-pointer bg-[#101C30]/50"
              >
                <div className="p-3 rounded-2xl bg-[#00E5A3]/10 text-[#00E5A3]">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold">Tomar o subir foto de evidencia</div>
                <div className="text-xs text-[#64748B]">Selfie o comprobante del consultorio / clínica</div>
              </button>
            )}
          </div>

          {/* Botón Principal para Fichar */}
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-4 rounded-2xl font-bold text-base shadow-2xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
              tipo === 'ENTRADA'
                ? 'bg-gradient-to-r from-[#00E5A3] to-[#38BDF8] text-[#070C16] mint-glow'
                : 'bg-gradient-to-r from-[#FB7185] to-[#E11D48] text-white coral-glow'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirmar Registro de {tipo}</span>
          </button>
        </form>
      </div>
    </main>
  );
}
