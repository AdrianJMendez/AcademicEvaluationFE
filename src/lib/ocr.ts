// services/ocr.service.optimized.ts (versión mejorada)
import Tesseract from 'tesseract.js';

class OCRServiceOptimized {
  private static instance: OCRServiceOptimized;
  private worker: Tesseract.Worker | null = null;
  private isInitializing = false;

  private constructor() {}

  public static getInstance(): OCRServiceOptimized {
    if (!OCRServiceOptimized.instance) {
      OCRServiceOptimized.instance = new OCRServiceOptimized();
    }
    return OCRServiceOptimized.instance;
  }

  private async initWorker() {
    if (this.worker) return this.worker;
    
    if (this.isInitializing) {
      // Esperar a que se inicialice
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.initWorker();
    }
    
    this.isInitializing = true;
    
    try {
      this.worker = await Tesseract.createWorker('spa', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });
      
      // Configurar para mejor precisión
      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789áéíóúñÑ.,:;() -',
        preserve_interword_spaces: '1',
      });
      
    } finally {
      this.isInitializing = false;
    }
    
    return this.worker;
  }

  async scanImage(imageFile: File, preprocess?: boolean): Promise<string> {
    try {
      const worker = await this.initWorker();
      
      let imageUrl = URL.createObjectURL(imageFile);
      
      // Opcional: Preprocesamiento de imagen (se puede hacer con canvas)
      if (preprocess) {
        imageUrl = await this.preprocessImage(imageUrl);
      }
      
      const { data } = await worker.recognize(imageUrl);
      
      URL.revokeObjectURL(imageUrl);
      
      // Limpiar y formatear el texto
      const cleanedText = this.cleanText(data.text);

      console.log("OCR OUTPUT :: ", cleanedText);
      
      return cleanedText;
    } catch (error) {
      console.error('Error en OCR:', error);
      throw error;
    }
  }

  private async preprocessImage(imageUrl: string): Promise<string> {
    // Preprocesamiento de imagen para mejorar OCR
    // Ejemplo: convertir a escala de grises, aumentar contraste, etc.
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Aumentar contraste
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const threshold = 128;
            const value = avg > threshold ? 255 : 0;
            data[i] = value;     // R
            data[i + 1] = value; // G
            data[i + 2] = value; // B
          }
          
          ctx.putImageData(imageData, 0, 0);
          const processedUrl = canvas.toDataURL();
          resolve(processedUrl);
        } else {
          resolve(imageUrl);
        }
      };
      img.src = imageUrl;
    });
  }

  private cleanText(text: string): string {
    // Limpiar texto extraído
    return text
      .replace(/\n{3,}/g, '\n\n') // Eliminar múltiples saltos de línea
      .replace(/[^\w\sáéíóúñÑ.,:;()/-]/g, '') // Eliminar caracteres especiales
      .trim();
  }

  async terminateWorker() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export default OCRServiceOptimized.getInstance();