/**
 * Formata uma imagem no padrão de story do Instagram
 * com fundo em degradê verde UK Imóveis (amarelo-esverdeado → verde-oliva)
 */

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const GRADIENT_TOP = '#AFA03C'; // Amarelo-esverdeado (topo)
const GRADIENT_BOTTOM = '#465028'; // Verde-oliva escuro (base)
const MARGEM_PERCENT = 0.9; // 90% da largura
const JPEG_QUALITY = 0.95;

export async function formatImageAsStory(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Não foi possível obter contexto do canvas'));
        return;
      }

      // 1. Fundo com degradê vertical (topo → base)
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, GRADIENT_TOP);
      gradient.addColorStop(1, GRADIENT_BOTTOM);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Redimensionar imagem para 90% da largura mantendo proporção
      const novoWidth = Math.floor(CANVAS_WIDTH * MARGEM_PERCENT);
      const proporcao = img.height / img.width;
      const novoHeight = Math.floor(novoWidth * proporcao);

      // 3. Centralizar no canvas
      const xOffset = (CANVAS_WIDTH - novoWidth) / 2;
      const yOffset = (CANVAS_HEIGHT - novoHeight) / 2;

      ctx.drawImage(img, xOffset, yOffset, novoWidth, novoHeight);

      // 4. Exportar como JPEG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erro ao gerar imagem'));
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Erro ao carregar imagem'));
    };

    img.src = url;
  });
}
