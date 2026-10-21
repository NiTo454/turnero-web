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
    console.warn('NEXT_PUBLIC_DRIVE_WEBHOOK_URL no está configurada.');
    return {
      id: '',
      url: typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:') ? fileOrBase64 : '',
      drive_url: '',
    };
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
        const res = reader.result as string;
        resolve(res.includes(',') ? res.split(',')[1] : res);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBase64);
    });
    if (!filename) {
      finalName = fileOrBase64.name || finalName;
    }
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    // Usamos text/plain para evitar problemas de preflight CORS en Apps Script de Google
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body: JSON.stringify({
      base64: base64String,
      filename: finalName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script respondió con HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.status === 'success') {
    return {
      id: data.id || '',
      url: data.url || '',
      drive_url: data.drive_url || '',
    };
  } else {
    throw new Error(data.message || 'Error desconocido al subir fotografía a Drive');
  }
}
