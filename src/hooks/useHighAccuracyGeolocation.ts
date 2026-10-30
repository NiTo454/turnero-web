'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { UbicacionGPS } from '@/types';

export type GeolocationPermissionState = PermissionState | 'unknown' | 'unsupported';

export interface GeolocationState {
  gps: UbicacionGPS | null;
  isLoading: boolean;
  isCalibrating: boolean;
  error: string | null;
  permissionState: GeolocationPermissionState;
  mejoraMargen: number;
  intentos: number;
  recalibrar: () => void;
}

export function useHighAccuracyGeolocation(): GeolocationState {
  const [gps, setGps] = useState<UbicacionGPS | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<GeolocationPermissionState>('unknown');
  const [mejoraMargen, setMejoraMargen] = useState<number>(999);
  const [intentos, setIntentos] = useState<number>(0);

  const watchIdRef = useRef<number | null>(null);
  const mejorPrecisionRef = useRef<number>(Infinity);
  const timerCalibracionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const permissionChangeHandlerRef = useRef<(() => void) | null>(null);

  const detenerWatch = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerCalibracionRef.current) {
      clearTimeout(timerCalibracionRef.current);
      timerCalibracionRef.current = null;
    }
  }, []);

  const iniciarGeolocalizacion = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setPermissionState('unsupported');
      setError('Este dispositivo o navegador no soporta geolocalización.');
      return;
    }

    if (!window.isSecureContext) {
      setPermissionState('unsupported');
      setError('La ubicación requiere que abras el sitio mediante una conexión segura HTTPS.');
      return;
    }

    detenerWatch();
    setIsLoading(true);
    setIsCalibrating(false);
    setError(null);
    setIntentos(0);
    mejorPrecisionRef.current = Infinity;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 10000,
    };

    const actualizarPosicion = (pos: GeolocationPosition) => {
      const accuracy = pos.coords.accuracy;
      setPermissionState('granted');
      setError(null);
      setIntentos((prev) => prev + 1);
      setMejoraMargen(accuracy);

      if (accuracy >= mejorPrecisionRef.current) return;
      mejorPrecisionRef.current = accuracy;

      let calidad: UbicacionGPS['calidad_gps'] = 'BAJA';
      if (accuracy <= 12) calidad = 'EXCELENTE';
      else if (accuracy <= 25) calidad = 'ALTA';
      else if (accuracy <= 45) calidad = 'MEDIA';

      setGps({
        latitud: pos.coords.latitude,
        longitud: pos.coords.longitude,
        precision_metros: accuracy,
        calidad_gps: calidad,
      });
      setIsLoading(false);

      if (accuracy <= 10) {
        setIsCalibrating(false);
        detenerWatch();
      }
    };

    const manejarError = (err: GeolocationPositionError) => {
      console.warn('Error GPS:', err);
      let mensaje = 'No se pudo obtener la ubicación.';
      if (err.code === 1) {
        mensaje = 'Permiso de ubicación denegado. Actívalo en los ajustes de Safari o de tu navegador.';
        setPermissionState('denied');
      } else if (err.code === 2) {
        mensaje = 'La ubicación no está disponible. Activa Localización en los ajustes del dispositivo e inténtalo de nuevo.';
      } else if (err.code === 3) {
        mensaje = 'Se agotó el tiempo buscando la ubicación. Inténtalo de nuevo con buena señal y la ubicación del dispositivo activada.';
      }
      setError(mensaje);
      setIsLoading(false);
      setIsCalibrating(false);
      detenerWatch();
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        actualizarPosicion(position);
        if (position.coords.accuracy <= 10) return;
        setIsCalibrating(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
          actualizarPosicion,
          (watchError) => {
            if (watchError.code === 1) manejarError(watchError);
          },
          options
        );
        timerCalibracionRef.current = setTimeout(() => {
          setIsCalibrating(false);
          detenerWatch();
        }, 8000);
      },
      manejarError,
      options
    );
  }, [detenerWatch]);

  useEffect(() => {
    let active = true;
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      queueMicrotask(() => {
        if (!active) return;
        setPermissionState('unsupported');
        setError('Este dispositivo o navegador no soporta geolocalización.');
      });
      return () => {
        active = false;
      };
    }

    if (!navigator.permissions?.query) {
      return () => {
        active = false;
        detenerWatch();
      };
    }

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((permission) => {
        if (!active) return;
        permissionStatusRef.current = permission;
        const syncPermission = () => {
          setPermissionState(permission.state);
          if (permission.state === 'denied') {
            setError('Permiso de ubicación denegado. Actívalo en los ajustes de Safari o de tu navegador.');
          } else if (permission.state === 'granted') {
            setError(null);
          }
        };
        permissionChangeHandlerRef.current = syncPermission;
        permission.addEventListener('change', syncPermission);
        syncPermission();
        if (permission.state === 'granted') iniciarGeolocalizacion();
      })
      .catch(() => {
        if (active) setPermissionState('unknown');
      });

    return () => {
      active = false;
      if (permissionStatusRef.current && permissionChangeHandlerRef.current) {
        permissionStatusRef.current.removeEventListener('change', permissionChangeHandlerRef.current);
      }
      permissionStatusRef.current = null;
      permissionChangeHandlerRef.current = null;
      detenerWatch();
    };
  }, [detenerWatch, iniciarGeolocalizacion]);

  return {
    gps,
    isLoading,
    isCalibrating,
    error,
    permissionState,
    mejoraMargen,
    intentos,
    recalibrar: iniciarGeolocalizacion,
  };
}
