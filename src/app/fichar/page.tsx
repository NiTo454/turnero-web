'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subirFotoAGoogleDrive } from '@/lib/drive';
import { IncidenciaAsistencia } from '@/types';
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
  Navigation,
  Sparkles,
  RotateCw,
  Radio,
  Send,
  X,
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
    permissionState,
    mejoraMargen,
    recalibrar: obtenerUbicacion,
  } = useHighAccuracyGeolocation();

  // Foto
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Proceso de guardado
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [asistenciaGuardada, setAsistenciaGuardada] = useState(false);
  const [savingStep, setSavingStep] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [intentosReporteFallidos, setIntentosReporteFallidos] = useState(0);
  const [mostrarModalIncidencia, setMostrarModalIncidencia] = useState(false);
  const [modalUbicacionDismissed, setModalUbicacionDismissed] = useState(false);
  const mostrarModalUbicacion =
    (permissionState === 'denied' || permissionState === 'unsupported') && !modalUbicacionDismissed;
  const [motivoIncidencia, setMotivoIncidencia] = useState('');
  const [errorIncidencia, setErrorIncidencia] = useState<string | null>(null);
  const [incidenciaEnviada, setIncidenciaEnviada] = useState(false);
  const [enviandoIncidencia, setEnviandoIncidencia] = useState(false);
  const incidenciaEnviadaRef = useRef(false);
  const incidenciaEnProcesoRef = useRef(false);

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

  const registrarIntentoFallido = (motivo: string) => {
    const totalIntentos = intentosReporteFallidos + 1;
    setIntentosReporteFallidos(totalIntentos);
    setMotivoIncidencia(motivo);
    if (totalIntentos >= 3 && !incidenciaEnviada) setMostrarModalIncidencia(true);
  };

  const handleEnviarIncidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (incidenciaEnviadaRef.current || incidenciaEnProcesoRef.current) return;
    const motivo = motivoIncidencia.trim();
    if (!user || !motivo) {
      setErrorIncidencia('Describe brevemente el problema para que el administrador pueda ayudarte.');
      return;
    }

    setErrorIncidencia(null);
    incidenciaEnProcesoRef.current = true;
    setEnviandoIncidencia(true);
    try {
      const pacientesLimpios = pacientes.map((p) => p.trim()).filter(Boolean);
      let fotoIncidencia = { id: '', url: '', drive_url: '' };
      if (fotoFile || fotoPreview) {
        try {
          fotoIncidencia = await subirFotoAGoogleDrive(fotoFile || fotoPreview!);
        } catch (photoError) {
          console.error('Error al subir fotografía de la solicitud:', photoError);
          throw new Error('No se pudo subir la fotografía. Verifica tu conexión e inténtalo de nuevo.');
        }
      }

      const incidencia: Omit<IncidenciaAsistencia, 'id' | 'creado_en'> = {
        empleado_uid: user.uid,
        empleado_nombre: empleado?.nombre || user.displayName || 'Personal de Salud',
        empleado_email: empleado?.email || user.email || '',
        empleado_rol: empleado?.rol || 'Enfermera',
        tipo,
        turno,
        pacientes: pacientesLimpios,
        entidad_federativa: entidad,
        intentos: intentosReporteFallidos,
        motivo,
        error_ubicacion: gpsError || 'No se pudo completar el registro de asistencia.',
        ...(gps ? { ubicacion_gps: gps } : {}),
        ...(fotoIncidencia.url || fotoPreview
          ? { foto_url: fotoIncidencia.url || fotoPreview! }
          : {}),
        ...(fotoIncidencia.drive_url ? { foto_drive_url: fotoIncidencia.drive_url } : {}),
        ...(fotoIncidencia.id ? { foto_drive_id: fotoIncidencia.id } : {}),
        estado: 'PENDIENTE',
        fecha_local_str: new Date().toISOString(),
      };

      await addDoc(collection(db, 'incidencias_asistencia'), {
        ...incidencia,
        creado_en: serverTimestamp(),
      });
      incidenciaEnviadaRef.current = true;
      setIncidenciaEnviada(true);
      setMostrarModalIncidencia(false);
      setTimeout(() => router.replace('/'), 1000);
    } catch (error) {
      console.error('Error al enviar solicitud de asistencia:', error);
      setErrorIncidencia('No se pudo enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      incidenciaEnProcesoRef.current = false;
      setEnviandoIncidencia(false);
    }
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
      const motivo = gpsError || 'Aún no se ha obtenido una ubicación GPS válida.';
      setFormError(`${motivo} Pulsa “Obtener ubicación” y vuelve a intentar.`);
      registrarIntentoFallido(motivo);
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
      } catch (err) {
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

      setSavingStep('¡Asistencia registrada con éxito!');
      setIntentosReporteFallidos(0);
      setIsSaving(false);
      setAsistenciaGuardada(true);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00E5A3', '#38BDF8', '#FBBF24'],
        });
      } catch (feedbackError) {
        console.warn('No se pudo mostrar la animación de confirmación:', feedbackError);
      }

      try {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([40, 60, 40]);
        }
      } catch (feedbackError) {
        console.warn('No se pudo activar la respuesta háptica:', feedbackError);
      }

      setTimeout(() => {
        router.replace('/');
      }, 1200);
    } catch (err) {
      console.error(err);
      const detalle = err instanceof Error ? err.message : String(err);
      const motivo = 'Error al guardar asistencia: ' + detalle;
      setFormError(motivo);
      registrarIntentoFallido(motivo);
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
        {(isSaving || asistenciaGuardada) && (
          <div className="fixed inset-0 z-50 bg-[#070C16]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card max-w-sm w-full p-8 rounded-3xl border border-[#00E5A3]/40 text-center mint-glow animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#00E5A3]/10 border border-[#00E5A3]/30 flex items-center justify-center text-[#00E5A3]">
                <CheckCircle2 className={`w-8 h-8 ${asistenciaGuardada ? '' : 'animate-bounce'}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {asistenciaGuardada ? '¡Asistencia registrada!' : 'Procesando Fichaje'}
              </h3>
              <p className="text-sm text-[#94A3B8] mb-4">{savingStep}</p>
              {asistenciaGuardada ? (
                <button
                  type="button"
                  onClick={() => router.replace('/')}
                  className="w-full min-h-12 rounded-xl bg-[#00E5A3] text-[#070C16] font-bold text-sm"
                >
                  Volver al inicio
                </button>
              ) : (
                <div className="w-full bg-[#101C30] rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#00E5A3] to-[#38BDF8] h-full w-full animate-pulse" />
                </div>
              )}
            </div>
          </div>
        )}

        {mostrarModalUbicacion && (
          <div className="fixed inset-0 z-[60] bg-[#070C16]/85 backdrop-blur-md flex items-center justify-center p-4">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-ubicacion-titulo"
              className="glass-card max-w-md w-full p-6 rounded-3xl border border-[#FBBF24]/40 relative"
            >
              <button
                type="button"
                onClick={() => setModalUbicacionDismissed(true)}
                aria-label="Cerrar aviso de ubicación"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 mb-4 rounded-2xl bg-[#FBBF24]/10 border border-[#FBBF24]/30 flex items-center justify-center text-[#FBBF24]">
                <MapPin className="w-6 h-6" />
              </div>
              <h2 id="modal-ubicacion-titulo" className="text-lg font-bold text-white mb-2">
                Permite el acceso a tu ubicación
              </h2>
              <p className="text-sm text-[#94A3B8] mb-4">
                {gpsError || 'Para registrar tu asistencia necesitamos que autorices la ubicación del dispositivo.'}
              </p>
              <div className="text-xs text-[#94A3B8] bg-[#101C30] border border-[#1C2F4D] rounded-xl p-3 mb-5">
                Revisa que la ubicación esté activada en el dispositivo y permite el acceso para este sitio desde los ajustes del navegador (normalmente, el icono junto a la dirección web). En iPhone, también puedes revisar Ajustes &gt; Privacidad y seguridad &gt; Localización y permitirla para Safari. Si cambiaste el permiso, vuelve a intentar aquí. El sitio debe abrirse mediante HTTPS.
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalUbicacionDismissed(true);
                  obtenerUbicacion();
                }}
                className="w-full py-3 rounded-xl bg-[#00E5A3] text-[#070C16] font-bold text-sm"
              >
                Volver a solicitar ubicación
              </button>
            </section>
          </div>
        )}

        {mostrarModalIncidencia && (
          <div className="fixed inset-0 z-[60] bg-[#070C16]/85 backdrop-blur-md flex items-center justify-center p-4">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-incidencia-titulo"
              className="glass-card max-w-md w-full p-6 rounded-3xl border border-[#FB7185]/40 relative"
            >
              <button
                type="button"
                onClick={() => setMostrarModalIncidencia(false)}
                disabled={enviandoIncidencia}
                aria-label="Cerrar solicitud de asistencia"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[#94A3B8] hover:text-white disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 mb-4 rounded-2xl bg-[#FB7185]/10 border border-[#FB7185]/30 flex items-center justify-center text-[#FB7185]">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 id="modal-incidencia-titulo" className="text-lg font-bold text-white mb-2">
                Solicitar ayuda al administrador
              </h2>
              <p className="text-sm text-[#94A3B8] mb-4">
                Ya fallaron {intentosReporteFallidos} intentos. Cuéntanos qué ocurrió; enviaremos el error técnico y tus datos del turno para que el administrador pueda registrar tu asistencia.
              </p>
              <form onSubmit={handleEnviarIncidencia} className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-[#94A3B8] mb-2">
                    Fotografía de evidencia (opcional)
                  </div>
                  {fotoPreview ? (
                    <div className="flex items-center gap-3 rounded-xl bg-[#101C30] border border-[#1C2F4D] p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fotoPreview}
                        alt="Vista previa de la fotografía de asistencia"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <span className="text-xs text-[#00E5A3] flex-1">Foto lista para enviar</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFotoFile(null);
                          setFotoPreview(null);
                        }}
                        className="px-3 py-2 rounded-lg text-xs text-[#FB7185] border border-[#FB7185]/30"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full min-h-11 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-sm font-semibold text-[#38BDF8]"
                    >
                      Tomar o elegir fotografía
                    </button>
                  )}
                </div>
                <label className="block text-xs font-semibold text-[#94A3B8]">
                  ¿Qué problema tuviste?
                  <textarea
                    required
                    rows={4}
                    maxLength={1000}
                    value={motivoIncidencia}
                    onChange={(event) => setMotivoIncidencia(event.target.value)}
                    placeholder="Describe el problema, por ejemplo: Safari no muestra el permiso de ubicación."
                    className="mt-2 w-full resize-y rounded-xl bg-[#101C30] border border-[#1C2F4D] p-3 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#FB7185]"
                  />
                </label>
                {errorIncidencia && (
                  <p role="alert" className="text-sm text-[#FB7185]">{errorIncidencia}</p>
                )}
                <button
                  type="submit"
                  disabled={incidenciaEnviada || enviandoIncidencia}
                  className="w-full min-h-12 py-3 rounded-xl bg-[#FB7185] text-[#070C16] font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {enviandoIncidencia ? 'Enviando solicitud...' : 'Enviar al administrador'}
                </button>
              </form>
            </section>
          </div>
        )}

        {/* Mensaje de Error */}
        {formError && (
          <div className="mb-6 p-4 rounded-2xl bg-[#FB7185]/10 border border-[#FB7185]/30 text-sm text-[#FB7185] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}
        {incidenciaEnviada && (
          <div className="fixed inset-0 z-[70] bg-[#070C16]/85 backdrop-blur-md flex items-center justify-center p-4">
            <section
              role="status"
              aria-live="polite"
              className="glass-card max-w-sm w-full p-7 rounded-3xl border border-[#00E5A3]/40 text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#00E5A3]/10 border border-[#00E5A3]/30 flex items-center justify-center text-[#00E5A3]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-white">Solicitud enviada</h2>
              <p className="mt-2 mb-5 text-sm text-[#94A3B8]">
                El administrador recibió el motivo del problema. Volviendo al inicio para evitar enviar reportes duplicados…
              </p>
              <button
                type="button"
                onClick={() => router.replace('/')}
                className="w-full min-h-12 rounded-xl bg-[#00E5A3] text-[#070C16] font-bold text-sm"
              >
                Volver al inicio
              </button>
            </section>
          </div>
        )}
        {intentosReporteFallidos >= 3 && !incidenciaEnviada && (
          <button
            type="button"
            onClick={() => setMostrarModalIncidencia(true)}
            className="mb-6 w-full p-3 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/30 text-sm font-semibold text-[#FB7185]"
          >
            Enviar al administrador el motivo de los {intentosReporteFallidos} intentos fallidos
          </button>
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
              <div className="space-y-3">
                <div className="text-xs text-[#FB7185]">{gpsError}</div>
                <button
                  type="button"
                  onClick={obtenerUbicacion}
                  disabled={isLoadingGps}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-xs font-semibold text-white disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoadingGps ? 'animate-spin' : ''}`} />
                  {isLoadingGps ? 'Obteniendo ubicación...' : 'Volver a intentar'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-[#94A3B8]">
                  {isLoadingGps ? 'Obteniendo ubicación del dispositivo...' : 'Solicita permiso de ubicación para registrar tu asistencia.'}
                </div>
                <button
                  type="button"
                  onClick={obtenerUbicacion}
                  disabled={isLoadingGps}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#00E5A3]/10 border border-[#00E5A3]/30 text-xs font-semibold text-[#00E5A3] disabled:opacity-50"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {isLoadingGps ? 'Obteniendo ubicación...' : 'Obtener ubicación'}
                </button>
              </div>
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
