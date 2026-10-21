'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Asistencia, Empleado } from '@/types';
import Navbar from '@/components/dashboard/Navbar';
import LiveAttendanceMonitor from '@/components/dashboard/LiveAttendanceMonitor';
import GlobalHistoryTable from '@/components/dashboard/GlobalHistoryTable';
import TeamRolesManagement from '@/components/dashboard/TeamRolesManagement';
import ExcelExportModal from '@/components/dashboard/ExcelExportModal';
import BottomNav from '@/components/dashboard/BottomNav';
import PersonalAttendanceView from '@/components/dashboard/PersonalAttendanceView';
import {
  Activity,
  History,
  Users,
  FileSpreadsheet,
  PlusCircle,
  X,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, empleado, loading, esAdmin, tienePermiso, roles } = useAuth();
  const router = useRouter();

  // Estados de datos
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Estados de navegación interna
  const [tabActiva, setTabActiva] = useState<'monitor' | 'historial' | 'equipo'>('monitor');
  const [modalExcelAbierto, setModalExcelAbierto] = useState(false);

  // Modal para foto de evidencia
  const [fotoModal, setFotoModal] = useState<{ url: string; title: string } | null>(null);

  // Redirección si no está autenticado o falta perfil
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (empleado && !empleado.perfil_completado) {
        router.push('/completar-perfil');
      }
    }
  }, [user, empleado, loading, router]);

  // Escuchar asistencias en tiempo real
  useEffect(() => {
    if (!user) return;

    try {
      // Obtenemos las asistencias ordenadas por fecha más reciente
      const q = query(
        collection(db, 'asistencias'),
        orderBy('fecha_hora', 'desc'),
        limit(500)
      );

      const unsubAsistencias = onSnapshot(
        q,
        (snapshot) => {
          const list: Asistencia[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as any) });
          });
          setAsistencias(list);
          setIsDataLoading(false);
        },
        (error) => {
          console.warn('Error con índice de asistencias, fallback a colección cruda:', error);
          // Fallback en caso de que falte un índice compuesto en Firestore
          const unsubFallback = onSnapshot(collection(db, 'asistencias'), (snapshot) => {
            const list: Asistencia[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...(docSnap.data() as any) });
            });
            // Ordenar en memoria
            list.sort((a, b) => {
              const timeA = a.fecha_hora?.seconds ? a.fecha_hora.seconds * 1000 : new Date(a.fecha_local_str || 0).getTime();
              const timeB = b.fecha_hora?.seconds ? b.fecha_hora.seconds * 1000 : new Date(b.fecha_local_str || 0).getTime();
              return timeB - timeA;
            });
            setAsistencias(list);
            setIsDataLoading(false);
          });
          return () => unsubFallback();
        }
      );

      return () => unsubAsistencias();
    } catch (e) {
      console.error(e);
      setIsDataLoading(false);
    }
  }, [user]);

  // Escuchar lista de empleados
  useEffect(() => {
    if (!user) return;

    const unsubEmpleados = onSnapshot(collection(db, 'empleados'), (snapshot) => {
      const list: Empleado[] = [];
      snapshot.forEach((d) => {
        list.push({ uid: d.id, ...(d.data() as any) });
      });
      setEmpleados(list);
    });

    return () => unsubEmpleados();
  }, [user]);

  const puedeVerHistorial = esAdmin || tienePermiso('reportes.ver_historial');
  const puedeExportar = esAdmin || tienePermiso('reportes.exportar_excel');
  const puedeVerPersonal = esAdmin || tienePermiso('personal.ver_todos');
  const puedeEditarRoles = esAdmin || tienePermiso('personal.editar_roles');

  // Determinar si el usuario tiene privilegios para acceder al panel de administración
  const esVistaAdmin = esAdmin || puedeVerPersonal || puedeVerHistorial;

  // Asistencias propias del usuario autenticado
  const asistenciasPropias = React.useMemo(() => {
    return asistencias.filter((a) => a.empleado_uid === user?.uid);
  }, [asistencias, user]);

  if (loading || (!user && !isDataLoading)) {
    return (
      <div className="min-h-screen bg-[#070C16] flex flex-col items-center justify-center text-[#94A3B8] gap-3">
        <div className="w-10 h-10 border-3 border-[#00E5A3] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wider uppercase text-[#00E5A3]">
          Iniciando Turnero...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070C16] text-[#F8FAFC]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 sm:pb-8 space-y-6">
        {!esVistaAdmin ? (
          /* VISTA PERSONAL: Solo turnos propios para enfermeras/empleados sin permisos de administración */
          <PersonalAttendanceView
            asistenciasPropias={asistenciasPropias}
            empleado={empleado}
            onOpenPhoto={(url, title) => setFotoModal({ url, title })}
          />
        ) : (
          /* PANEL ADMINISTRATIVO: Visible únicamente si tiene permisos de gestión */
          <>
            {/* Barra de Acciones y Pestañas */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-[#1C2F4D] pb-4">
              {/* Navegación por Pestañas */}
              <div className="flex items-center gap-1.5 bg-[#101C30] p-1.5 rounded-2xl border border-[#1C2F4D] overflow-x-auto">
                {puedeVerPersonal && (
                  <button
                    onClick={() => setTabActiva('monitor')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      tabActiva === 'monitor'
                        ? 'bg-[#00E5A3] text-[#070C16] shadow-sm'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Monitor del Día</span>
                  </button>
                )}

                {puedeVerHistorial && (
                  <button
                    onClick={() => setTabActiva('historial')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      tabActiva === 'historial'
                        ? 'bg-[#00E5A3] text-[#070C16] shadow-sm'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Historial Global ({asistencias.length})</span>
                  </button>
                )}

                {puedeVerPersonal && (
                  <button
                    onClick={() => setTabActiva('equipo')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      tabActiva === 'equipo'
                        ? 'bg-[#00E5A3] text-[#070C16] shadow-sm'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Equipo y Roles ({empleados.length})</span>
                  </button>
                )}
              </div>

              {/* Acciones Rápidas */}
              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                {puedeExportar && (
                  <button
                    onClick={() => setModalExcelAbierto(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#101C30] hover:bg-[#172640] border border-[#1C2F4D] hover:border-[#00E5A3]/40 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#00E5A3]" />
                    <span>Descargar Excel</span>
                  </button>
                )}

                <button
                  onClick={() => router.push('/fichar')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5A3] to-[#38BDF8] text-[#070C16] text-xs font-bold shadow-md mint-glow hover:opacity-95 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nuevo Fichaje</span>
                </button>
              </div>
            </div>

            {/* Contenido según la pestaña activa */}
            {tabActiva === 'monitor' && puedeVerPersonal && (
              <LiveAttendanceMonitor
                asistencias={asistencias}
                empleados={empleados}
                onOpenPhoto={(url, title) => setFotoModal({ url, title })}
              />
            )}

            {tabActiva === 'historial' && puedeVerHistorial && (
              <GlobalHistoryTable
                asistencias={asistencias}
                onOpenPhoto={(url, title) => setFotoModal({ url, title })}
              />
            )}

            {tabActiva === 'equipo' && puedeVerPersonal && (
              <TeamRolesManagement
                empleados={empleados}
                roles={roles}
                puedeEditar={puedeEditarRoles}
              />
            )}
          </>
        )}
      </main>

      {/* Barra de Navegación Inferior para Teléfonos Móviles */}
      <BottomNav
        tabActiva={tabActiva}
        onCambiarTab={setTabActiva}
        puedeVerHistorial={puedeVerHistorial}
        puedeVerPersonal={puedeVerPersonal}
        puedeExportar={puedeExportar}
        onOpenExcel={() => setModalExcelAbierto(true)}
      />

      {/* Modal de Exportación a Excel */}
      <ExcelExportModal
        isOpen={modalExcelAbierto}
        onClose={() => setModalExcelAbierto(false)}
        asistencias={asistencias}
      />

      {/* Modal Lightbox para Evidencia Fotográfica */}
      {fotoModal && (
        <div className="fixed inset-0 z-50 bg-[#070C16]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full rounded-3xl p-6 border border-[#1C2F4D] relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2F4D] mb-4">
              <div>
                <h4 className="font-bold text-white text-base">Evidencia de Asistencia</h4>
                <p className="text-xs text-[#94A3B8]">Personal: {fotoModal.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={fotoModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-[#101C30] text-[#38BDF8] hover:bg-[#38BDF8]/20 transition-colors"
                  title="Abrir en pestaña nueva"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setFotoModal(null)}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fotoModal.url}
                alt={fotoModal.title}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
