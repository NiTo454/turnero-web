'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { Empleado, RolDefinicion } from '@/types';
import { ROLES_DEFAULT, calcularPermisosEfectivos, tienePermiso as checkPermiso } from '@/lib/permissions';

interface AuthContextType {
  user: User | null;
  empleado: Empleado | null;
  roles: Record<string, RolDefinicion>;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  tienePermiso: (codename: string) => boolean;
  esAdmin: boolean;
  permisosEfectivos: Set<string>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  empleado: null,
  roles: ROLES_DEFAULT,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  tienePermiso: () => false,
  esAdmin: false,
  permisosEfectivos: new Set(),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [roles, setRoles] = useState<Record<string, RolDefinicion>>(ROLES_DEFAULT);
  const [loading, setLoading] = useState(true);

  // 1. Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setEmpleado(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Escuchar catálogo de roles en Firestore
  useEffect(() => {
    try {
      const unsubRoles = onSnapshot(collection(db, 'roles'), (snapshot) => {
        const rolesCargados: Record<string, RolDefinicion> = { ...ROLES_DEFAULT };
        snapshot.forEach((d) => {
          const data = d.data() as Partial<RolDefinicion>;
          if (data.nombre && Array.isArray(data.permisos)) {
            rolesCargados[d.id] = {
              id: d.id,
              nombre: data.nombre,
              permisos: data.permisos,
            };
          }
        });
        setRoles(rolesCargados);
      }, (err) => {
        console.warn('Uso de roles por defecto (sin colección remota):', err.message);
      });

      return () => unsubRoles();
    } catch (e) {
      console.warn('Error inicializando listener de roles:', e);
    }
  }, []);

  // 3. Escuchar documento del empleado actual en Firestore
  useEffect(() => {
    if (!user) {
      setEmpleado(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, 'empleados', user.uid);
    const unsubscribeDoc = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setEmpleado(docSnap.data() as Empleado);
        } else {
          setEmpleado(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error al escuchar datos de empleado:', error);
        setLoading(false);
      }
    );

    return () => unsubscribeDoc();
  }, [user]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Error al iniciar sesión con Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setEmpleado(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  const permisosEfectivos = calcularPermisosEfectivos(empleado, roles);

  const tienePermisoFn = (codename: string) => {
    return checkPermiso(empleado, codename, roles);
  };

  // esAdmin = el empleado tiene AL MENOS UNO de los permisos de gestión.
  // Se calcula 100% desde permisosEfectivos (roles + directos - denegados),
  // sin importar el nombre del rol. Así es extensible sin tocar código.
  const esAdmin =
    permisosEfectivos.has('personal.ver_todos') ||
    permisosEfectivos.has('personal.editar_roles') ||
    permisosEfectivos.has('personal.gestionar') ||
    permisosEfectivos.has('reportes.ver_historial');

  return (
    <AuthContext.Provider
      value={{
        user,
        empleado,
        roles,
        loading,
        signInWithGoogle,
        signOut,
        tienePermiso: tienePermisoFn,
        esAdmin,
        permisosEfectivos,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
