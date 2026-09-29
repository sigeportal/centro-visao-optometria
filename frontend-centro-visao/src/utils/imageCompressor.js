/**
 * Utilitário de compressão e recorte quadrado de imagem para avatares (Usuário e Paciente).
 * Reduz imagens pesadas (5-10MB) para ~30-50KB no formato WebP (com fallback para JPEG).
 */

/**
 * Comprime e recorta uma imagem para avatar quadrado centralizado (1:1).
 *
 * @param {File|Blob|string} fileOrBlob - Arquivo de imagem, Blob ou string Data URL
 * @param {Object} [options]
 * @param {number} [options.maxSize=400] - Resolução máxima (largura e altura em px)
 * @param {number} [options.quality=0.85] - Qualidade de compressão (0 a 1)
 * @param {string} [options.preferredMimeType='image/webp'] - Tipo MIME preferencial
 * @returns {Promise<{ base64: string, dataUrl: string, rawBase64: string, mimeType: string, sizeBytes: number, width: number, height: number }>}
 */
export async function compressImage(fileOrBlob, options = {}) {
  const {
    maxSize = 400,
    quality = 0.85,
    preferredMimeType = 'image/webp',
  } = options;

  if (!fileOrBlob) {
    throw new Error('Nenhum arquivo ou imagem fornecido para compressão.');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    let objectUrl = null;

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    img.onload = () => {
      try {
        const { naturalWidth, naturalHeight } = img;
        if (!naturalWidth || !naturalHeight) {
          cleanup();
          reject(new Error('Imagem inválida ou dimensões zeradas.'));
          return;
        }

        // 1. Corte centralizado quadrado (1:1 aspect ratio)
        const cropSize = Math.min(naturalWidth, naturalHeight);
        const cropX = Math.round((naturalWidth - cropSize) / 2);
        const cropY = Math.round((naturalHeight - cropSize) / 2);

        // 2. Redimensionamento para resolução máxima (padrão 400x400 px)
        const targetSize = Math.min(cropSize, maxSize);

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          reject(new Error('Não foi possível obter contexto 2D do Canvas.'));
          return;
        }

        // Suavização para renderização nítida
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Preenche fundo branco limpo para evitar bordas pretas em JPEG ou canais alfa indesejados
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetSize, targetSize);

        // Desenha corte quadrado centralizado
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropSize,
          cropSize,
          0,
          0,
          targetSize,
          targetSize
        );

        // 3. Exporta como image/webp com qualidade 0.85 (com fallback para image/jpeg)
        let mimeType = preferredMimeType;
        let dataUrl = canvas.toDataURL(mimeType, quality);

        // Fallback para JPEG se o navegador não suportar exportação WebP no canvas
        if (!dataUrl.startsWith(`data:${preferredMimeType}`)) {
          mimeType = 'image/jpeg';
          dataUrl = canvas.toDataURL(mimeType, quality);
        }

        // Cálculo do tamanho aproximado em bytes
        const rawBase64 = dataUrl.split(',')[1] || '';
        const sizeBytes = Math.round((rawBase64.length * 3) / 4);

        cleanup();
        resolve({
          base64: dataUrl,
          dataUrl,
          rawBase64,
          mimeType,
          sizeBytes,
          width: targetSize,
          height: targetSize,
        });
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Falha ao carregar a imagem selecionada.'));
    };

    if (typeof fileOrBlob === 'string') {
      img.src = fileOrBlob;
    } else if (fileOrBlob instanceof Blob) {
      objectUrl = URL.createObjectURL(fileOrBlob);
      img.src = objectUrl;
    } else {
      reject(new Error('Formato de entrada não suportado para imagem.'));
    }
  });
}

/**
 * Formata bytes em formato legível (ex: "38 KB", "1.2 MB").
 *
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Retorna URL completa da foto tratando caminhos relativos da API, data URLs e URLs absolutas.
 *
 * @param {string} photoPath
 * @returns {string}
 */
export function resolvePhotoUrl(photoPath) {
  if (!photoPath || typeof photoPath !== 'string') return '';
  const trimmed = photoPath.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:9000';
  const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanPath}`;
}
