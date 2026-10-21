'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { UbicacionGPS } from '@/types';

export interface GeolocationState {
  gps: UbicacionGPS | null;
  isLoading: boolean;
  isCalibrating: boolean;
  error: string | null;
  mejoraMargen: number; // Margen de error actual en metros
  intentos: number;
  recalibrar: () => void;
}

export function useHighAccuracyGeolocation(): GeolocationState {
  const [gps, setGps] = useState<UbicacionGPS | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mejoraMargen, setMejoraMargen] = useState<number>(999);
  const [intentos, setIntentos] = useState<number>(0);

  const watchIdRef = useRef<number | null>(null);
  const mejorPrecisionRef = useRef<number>(Infinity);
  const timerCalibracionRef = useRef<NodeJS.Timeout | null>(null);

  const detenerWatch = () => {
    if (watchIdRef.current !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const iniciarGeolocalizacion = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setError('Este dispositivo o navegador no soporta geolocalización satelital.');
      setIsLoading(false);
      setIsCalibrating(false);
      return;
    }

    detenerWatch();
    setIsLoading(true);
    setIsCalibrating(true);
    setError(null);
    mejorPrecisionRef.current = Infinity;
    setIntentos(0);

    // Opciones de MÁXIMA PRECISIÓN:
    // maximumAge: 0 obliga al GPS del teléfono a no usar caché antigua de Wi-Fi/torre
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 25000,
      maximumAge: 0,
    };

    // 1. Obtención continua mediante watchPosition para esperar a que los satélites fijen la señal
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = pos.coords.accuracy;
        setIntentos((prev) => prev + 1);
        setMejoraMargen(accuracy);

        // Si la nueva señal es más precisa que la anterior, actualizamos
        if (accuracy < mejorPrecisionRef.current) {
          mejorPrecisionRef.current = accuracy;

          let calidad: 'EXCELENTE' | 'ALTA' | 'MEDIA' | 'BAJA' = 'BAJA';
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

          // Si logramos precisión satelital de menos de 10 metros, consideramos calibrado óptimo
          if (accuracy <= 10) {
            setIsCalibrating(false);
          }
        }
      },
      (err) => {
        console.warn('Error GPS:', err);
        let mensaje = 'No se pudo obtener la ubicación GPS.';
        if (err.code === 1) {
          mensaje = 'Permiso de ubicación denegado. Actívalo en los ajustes de tu navegador o teléfono.';
        } else if (err.code === 2) {
          mensaje = 'Señal de GPS no disponible. Asegúrate de tener activada la ubicación en el teléfono.';
        } else if (err.code === 3) {
          mensaje = 'Tiempo de espera agotado buscando satélites. Reintentando calibración...';
        }
        setError(mensaje);
        setIsLoading(false);
        setIsCalibrating(false);
      },
      options
    );

    watchIdRef.current = watchId;

    // Temporizador de calibración: después de 8 segundos, si ya tenemos una ubicación aceptable, detenemos la animación de calibración
    if (timerCalibracionRef.current) clearTimeout(timerCalibracionRef.current);
    timerCalibracionRef.current = setTimeout(() => {
      setIsCalibrating(false);
      setIsLoading(false);
    }, 8000);
  }, []);

  useEffect(() => {
    iniciarGeolocalizacion();

    return () => {
      detenerWatch();
      if (timerCalibracionRef.current) clearTimeout(timerCalibracionRef.current);
    };
  }, [iniciarGeolocalizacion]);

  return {
    gps,
    isLoading,
    isCalibrating,
    error,
    mejoraMargen,
    intentos,
    recalibrar: iniciarGeolocalizacion,
  };
}
