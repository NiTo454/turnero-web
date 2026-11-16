const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_DIMENSION = 1280;
const TARGET_SIZE = 400 * 1024;

function loadImage(file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo abrir la imagen. Prueba con otra fotografía.'));
    };
    image.src = objectUrl;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo preparar la fotografía.'));
      },
      'image/jpeg',
      quality
    );
  });
}

export async function prepararFotoEvidencia(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('La fotografía supera 20 MB. Elige una imagen más pequeña.');
  }

  const { image, objectUrl } = await loadImage(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    let width = Math.max(1, Math.round(image.naturalWidth * scale));
    let height = Math.max(1, Math.round(image.naturalHeight * scale));

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('No se pudo preparar la fotografía en este navegador.');

      context.drawImage(image, 0, 0, width, height);
      const blob = await canvasToJpeg(canvas, Math.max(0.5, 0.78 - attempt * 0.07));
      if (blob.size <= TARGET_SIZE) {
        return new File([blob], `evidencia_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
      }

      width = Math.max(1, Math.round(width * 0.8));
      height = Math.max(1, Math.round(height * 0.8));
    }

    throw new Error('No se pudo reducir la fotografía al tamaño permitido. Elige otra imagen.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
