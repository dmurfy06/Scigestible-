'use client';

import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  success: boolean;
  error?: string;
}

export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pageCount = pdf.numPages;
    const pageTexts: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      pageTexts.push(pageText);
    }

    const text = pageTexts.join('\n\n').trim();

    if (!text) {
      return {
        text: '',
        pageCount,
        success: false,
        error: 'No text could be extracted. The PDF may be a scanned image — try a text-based PDF.',
      };
    }

    return { text, pageCount, success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('PDF extraction error:', errorMessage);
    return {
      text: '',
      pageCount: 0,
      success: false,
      error: `Failed to read PDF: ${errorMessage}`,
    };
  }
}
