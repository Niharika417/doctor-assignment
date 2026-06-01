// backend/src/services/ocrService.js
import Tesseract from 'tesseract.js';
import fs from 'fs';
import pdfParse from 'pdf-parse';

export class OCRService {
  async extractText(filePath, fileType) {
    try {
      if (fileType === 'application/pdf') {
        return await this.extractFromPDF(filePath);
      } else if (fileType.startsWith('image/')) {
        return await this.extractFromImage(filePath);
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw error;
    }
  }

  async extractFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  async extractFromImage(filePath) {
    const result = await Tesseract.recognize(filePath, 'eng', {
      logger: m => console.log(m)
    });
    return result.data.text;
  }
}

export default new OCRService();