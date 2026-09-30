/**
 * Utilidad de compresión y optimización automática de imágenes en el cliente (Browser).
 * Convierte cualquier formato (JPEG, PNG, HEIC, BMP) a formato WebP ultraligero
 * manteniendo la nitidez visual y reduciendo el peso de megabytes a kilobytes.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 a 1 (ej: 0.82)
}

export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // SVGs no se deben rasterizar a WebP
  if (file.type === 'image/svg+xml') {
    return file;
  }

  const { maxWidth = 1600, maxHeight = 1200, quality = 0.84 } = options;

  return new Promise((resolve) => {
    // Si no estamos en el navegador, retornar el archivo original
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calcular escalado proporcional si excede las dimensiones máximas
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Suavizado bicúbico de alta fidelidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a WebP
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Si el archivo resultante es más grande que el original (raro), mantener el original
            if (blob.size >= file.size && file.type === 'image/webp') {
              resolve(file);
              return;
            }

            const cleanBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const compressedFilename = `${cleanBase}.webp`;

            const compressedFile = new File([blob], compressedFilename, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
