export interface DriveUploadResult {
  id: string;
  url: string;
  drive_url: string;
}

export async function subirFotoAGoogleDrive(
  fileOrBase64: File | string,
  filename?: string
): Promise<DriveUploadResult> {
  const webhookUrl = process.env.NEXT_PUBLIC_DRIVE_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('No está configurada la conexión para subir fotografías. Contacta al administrador.');
  }

  let base64String = '';
  let finalName = filename || `asistencia_${Date.now()}.jpg`;

  if (typeof fileOrBase64 === 'string') {
    // Si viene con el prefijo "data:image/jpeg;base64,...", lo limpiamos
    base64String = fileOrBase64.includes(',') ? fileOrBase64.split(',')[1] : fileOrBase64;
  } else {
    base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('No se pudo leer la fotografía seleccionada.'));
          return;
        }
        const res = reader.result;
        resolve(res.includes(',') ? res.split(',')[1] : res);
      };
      reader.onerror = () => reject(new Error('No se pudo leer la fotografía seleccionada.'));
      reader.readAsDataURL(fileOrBase64);
    });
    if (!filename) {
      finalName = fileOrBase64.name || finalName;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: JSON.stringify({
        base64: base64String,
        filename: finalName,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`El servicio de fotografías respondió con HTTP ${response.status}.`);
    }

    let data: { status?: string; id?: string; url?: string; drive_url?: string; message?: string };
    try {
      data = await response.json();
    } catch {
      throw new Error('El servicio de fotografías devolvió una respuesta no válida.');
    }

    if (!data || typeof data !== 'object') {
      throw new Error('El servicio de fotografías devolvió una respuesta no válida.');
    }
    if (data.status !== 'success') {
      throw new Error(data.message || 'El servicio no pudo guardar la fotografía.');
    }
    const isUsableUrl = (value?: string): value is string =>
      typeof value === 'string' && value.length <= 2048 && /^https?:\/\//i.test(value);
    const url = isUsableUrl(data.url) ? data.url : isUsableUrl(data.drive_url) ? data.drive_url : '';
    if (!url) {
      throw new Error('La fotografía se recibió, pero el servicio no devolvió un enlace válido.');
    }
    const driveUrl = isUsableUrl(data.drive_url) ? data.drive_url : url;

    return {
      id: data.id || '',
      url,
      drive_url: driveUrl,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('La carga de la fotografía tardó demasiado. Verifica tu conexión e inténtalo de nuevo.');
    }
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con el servicio de fotografías. Verifica tu conexión e inténtalo de nuevo.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
