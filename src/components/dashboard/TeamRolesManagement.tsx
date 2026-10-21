'use client';

import React, { useState } from 'react';
import { Empleado, RolDefinicion } from '@/types';
import { TODOS_LOS_PERMISOS } from '@/lib/permissions';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Users,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  Settings2,
  X,
  Save,
  Phone,
  Mail,
} from 'lucide-react';

interface Props {
  empleados: Empleado[];
  roles: Record<string, RolDefinicion>;
  puedeEditar: boolean;
}

export default function TeamRolesManagement({ empleados, roles, puedeEditar }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
  const [permisosDirectos, setPermisosDirectos] = useState<string[]>([]);
  const [permisosDenegados, setPermisosDenegados] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const empleadosFiltrados = empleados.filter((emp) => {
    const q = busqueda.toLowerCase();
    return (
      emp.nombre.toLowerCase().includes(q) ||
      (emp.email || '').toLowerCase().includes(q) ||
      (emp.rol || '').toLowerCase().includes(q)
    );
  });

  const handleToggleActivo = async (emp: Empleado) => {
    if (!puedeEditar) return;
    try {
      const nuevoEstado = emp.is_active === false ? true : false;
      await updateDoc(doc(db, 'empleados', emp.uid), {
        is_active: nuevoEstado,
      });
    } catch (e: any) {
      alert('Error al actualizar estado: ' + e.message);
    }
  };

  const handleCambiarRol = async (emp: Empleado, nuevoRol: string) => {
    if (!puedeEditar) return;
    try {
      await updateDoc(doc(db, 'empleados', emp.uid), {
        rol: nuevoRol,
        grupos: [nuevoRol.toLowerCase()],
      });
    } catch (e: any) {
      alert('Error al actualizar rol: ' + e.message);
    }
  };

  const abrirModalPermisos = (emp: Empleado) => {
    setEmpleadoSeleccionado(emp);
    setPermisosDirectos(emp.permisos_directos || []);
    setPermisosDenegados(emp.permisos_denegados || []);
  };

  const togglePermisoDirecto = (codename: string) => {
    if (permisosDirectos.includes(codename)) {
      setPermisosDirectos(permisosDirectos.filter((p) => p !== codename));
    } else {
      setPermisosDirectos([...permisosDirectos, codename]);
      setPermisosDenegados(permisosDenegados.filter((p) => p !== codename));
    }
  };

  const togglePermisoDenegado = (codename: string) => {
    if (permisosDenegados.includes(codename)) {
      setPermisosDenegados(permisosDenegados.filter((p) => p !== codename));
    } else {
      setPermisosDenegados([...permisosDenegados, codename]);
      setPermisosDirectos(permisosDirectos.filter((p) => p !== codename));
    }
  };

  const guardarPermisosEspeciales = async () => {
    if (!empleadoSeleccionado) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'empleados', empleadoSeleccionado.uid), {
        permisos_directos: permisosDirectos,
        permisos_denegados: permisosDenegados,
      });
      setEmpleadoSeleccionado(null);
    } catch (e: any) {
      alert('Error al guardar permisos: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-[#1C2F4D] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar miembros del equipo por nombre, correo o rol..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101C30] border border-[#1C2F4D] text-white placeholder-[#64748B] text-sm focus:outline-none focus:border-[#00E5A3]"
          />
        </div>
        <div className="text-xs text-[#94A3B8] font-semibold self-center">
          {empleadosFiltrados.length} miembro(s) registrado(s)
        </div>
      </div>

      {/* Grid de Personal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {empleadosFiltrados.map((emp) => {
          const activo = emp.is_active !== false;
          return (
            <div
              key={emp.uid}
              className={`glass-card rounded-2xl p-5 border transition-all ${
                activo ? 'border-[#1C2F4D] hover:border-[#28436D]' : 'border-[#FB7185]/30 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#172640] border border-[#28436D] flex items-center justify-center font-bold text-base text-[#00E5A3] flex-shrink-0">
                    {emp.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-white text-sm truncate">{emp.nombre}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                      <span className={`w-2 h-2 rounded-full ${activo ? 'bg-[#00E5A3]' : 'bg-[#FB7185]'}`} />
                      <span>{activo ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>
                </div>

                {puedeEditar && (
                  <button
                    onClick={() => abrirModalPermisos(emp)}
                    title="Configurar permisos RBAC"
                    className="p-2 rounded-xl bg-[#101C30] hover:bg-[#00E5A3]/10 text-[#94A3B8] hover:text-[#00E5A3] border border-[#1C2F4D] transition-colors cursor-pointer"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Datos de contacto */}
              <div className="space-y-1 text-xs text-[#94A3B8] py-2 border-t border-b border-[#1C2F4D]/60 my-3">
                {emp.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                )}
                {emp.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                    <span>{emp.telefono}</span>
                  </div>
                )}
              </div>

              {/* Controles de Rol y Estado */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {puedeEditar ? (
                  <select
                    value={emp.rol || 'Enfermera'}
                    onChange={(e) => handleCambiarRol(emp, e.target.value)}
                    className="py-1.5 px-2.5 rounded-lg bg-[#101C30] border border-[#1C2F4D] text-xs font-semibold text-white focus:outline-none focus:border-[#00E5A3] cursor-pointer"
                  >
                    <option value="Enfermera">Enfermera</option>
                    <option value="Enfermero">Enfermero</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                ) : (
                  <span className="text-xs font-semibold text-white">{emp.rol}</span>
                )}

                {puedeEditar && (
                  <button
                    onClick={() => handleToggleActivo(emp)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      activo
                        ? 'bg-[#FB7185]/10 text-[#FB7185] hover:bg-[#FB7185]/20'
                        : 'bg-[#00E5A3]/10 text-[#00E5A3] hover:bg-[#00E5A3]/20'
                    }`}
                  >
                    {activo ? 'Desactivar' : 'Reactivar'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Configuración de Permisos Directos RBAC */}
      {empleadoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-[#070C16]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full rounded-3xl p-6 sm:p-7 border border-[#1C2F4D] shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#1C2F4D] mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#00E5A3]/10 text-[#00E5A3]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Permisos Individuales RBAC</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Personalizando para: <span className="text-white font-semibold">{empleadoSeleccionado.nombre}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmpleadoSeleccionado(null)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#94A3B8] mb-3">
              Puedes otorgar concesiones directas individuales o bloquear permisos heredados de su rol ({empleadoSeleccionado.rol}).
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
              {TODOS_LOS_PERMISOS.map((permiso) => {
                const concedido = permisosDirectos.includes(permiso.codename);
                const denegado = permisosDenegados.includes(permiso.codename);

                return (
                  <div
                    key={permiso.codename}
                    className="p-3 rounded-xl bg-[#101C30] border border-[#1C2F4D] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{permiso.nombre}</div>
                      <div className="text-[10px] text-[#64748B] font-mono">{permiso.codename}</div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => togglePermisoDirecto(permiso.codename)}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                          concedido
                            ? 'bg-[#00E5A3] text-[#070C16]'
                            : 'bg-[#172640] text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        + Conceder
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePermisoDenegado(permiso.codename)}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                          denegado
                            ? 'bg-[#FB7185] text-white'
                            : 'bg-[#172640] text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        - Denegar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#1C2F4D] flex items-center justify-end gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setEmpleadoSeleccionado(null)}
                className="px-4 py-2.5 rounded-xl bg-[#101C30] hover:bg-[#172640] text-[#94A3B8] text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={guardarPermisosEspeciales}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00E5A3] text-[#070C16] text-xs font-bold shadow-md mint-glow cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
