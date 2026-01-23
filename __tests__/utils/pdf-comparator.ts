/**
 * PDF Comparator for Visual Regression Tests
 *
 * Converts PDF pages to images and compares them using pixelmatch.
 * Supports configurable threshold for acceptable pixel differences.
 */

import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import {
  getGoldenPath,
  saveGolden,
  readGolden,
  saveDiffImage,
  UPDATE_GOLDENS,
  ComparisonResult,
} from './golden-manager';

// Dynamic import for pdf-to-img (ESM module)
let pdfToImg: typeof import('pdf-to-img') | null = null;

async function getPdfToImg() {
  if (!pdfToImg) {
    pdfToImg = await import('pdf-to-img');
  }
  return pdfToImg;
}

export interface PDFComparisonOptions {
  /** Maximum allowed pixel difference percentage (0-100). Default: 0.1 */
  threshold?: number;
  /** DPI for PDF rendering. Default: 150 */
  dpi?: number;
  /** Page number to compare (1-indexed). Default: 1 */
  page?: number;
}

export interface PDFComparisonResult extends ComparisonResult {
  pageCount?: number;
}

/**
 * Convert a PDF buffer to an array of PNG images
 */
export async function pdfToImages(
  pdfBuffer: Buffer,
  dpi: number = 150
): Promise<Buffer[]> {
  const { pdf } = await getPdfToImg();
  const document = await pdf(pdfBuffer, { scale: dpi / 72 });

  const images: Buffer[] = [];
  for await (const page of document) {
    images.push(page);
  }

  return images;
}

/**
 * Compare two PNG images using pixelmatch
 */
export function compareImages(
  img1Buffer: Buffer,
  img2Buffer: Buffer,
  threshold: number = 0.1
): { matches: boolean; diffPercentage: number; diffPixels: number; diffImage?: Buffer } {
  const img1 = PNG.sync.read(img1Buffer);
  const img2 = PNG.sync.read(img2Buffer);

  // Check dimensions match
  if (img1.width !== img2.width || img1.height !== img2.height) {
    return {
      matches: false,
      diffPercentage: 100,
      diffPixels: -1,
      diffImage: undefined,
    };
  }

  const { width, height } = img1;
  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 } // Per-pixel threshold for pixelmatch
  );

  const totalPixels = width * height;
  const diffPercentage = (diffPixels / totalPixels) * 100;

  return {
    matches: diffPercentage <= threshold,
    diffPercentage,
    diffPixels,
    diffImage: PNG.sync.write(diff),
  };
}

/**
 * Compare a generated PDF against a golden reference
 */
export async function comparePDF(
  template: 'classic' | 'modern' | 'executive',
  testName: string,
  pdfBuffer: Buffer,
  options: PDFComparisonOptions = {}
): Promise<PDFComparisonResult> {
  const { threshold = 0.1, dpi = 150, page = 1 } = options;
  const goldenFilename = `${testName}-page${page}.png`;

  try {
    // Convert PDF to images
    const images = await pdfToImages(pdfBuffer, dpi);

    if (images.length === 0) {
      return {
        matches: false,
        message: 'PDF has no pages',
        pageCount: 0,
      };
    }

    if (page > images.length) {
      return {
        matches: false,
        message: `Page ${page} does not exist (PDF has ${images.length} pages)`,
        pageCount: images.length,
      };
    }

    const actualImage = images[page - 1];
    const goldenImage = readGolden('pdf', template, goldenFilename);

    // If no golden exists or UPDATE_GOLDENS is set
    if (!goldenImage || UPDATE_GOLDENS) {
      saveGolden('pdf', template, goldenFilename, actualImage);
      return {
        matches: true,
        message: UPDATE_GOLDENS
          ? `Golden updated: ${goldenFilename}`
          : `Golden created: ${goldenFilename}`,
        pageCount: images.length,
      };
    }

    // Compare images
    const result = compareImages(goldenImage, actualImage, threshold);

    if (!result.matches && result.diffImage) {
      const diffPath = saveDiffImage(template, goldenFilename, result.diffImage);
      return {
        matches: false,
        diffPercentage: result.diffPercentage,
        diffPixels: result.diffPixels,
        message: `PDF differs by ${result.diffPercentage.toFixed(2)}% (${result.diffPixels} pixels). Diff saved to: ${diffPath}`,
        pageCount: images.length,
      };
    }

    return {
      matches: true,
      diffPercentage: result.diffPercentage,
      diffPixels: result.diffPixels,
      message: `PDF matches golden (${result.diffPercentage.toFixed(4)}% difference)`,
      pageCount: images.length,
    };
  } catch (error) {
    return {
      matches: false,
      message: `Error comparing PDF: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Compare all pages of a PDF against golden references
 */
export async function comparePDFAllPages(
  template: 'classic' | 'modern' | 'executive',
  testName: string,
  pdfBuffer: Buffer,
  options: Omit<PDFComparisonOptions, 'page'> = {}
): Promise<PDFComparisonResult[]> {
  const { dpi = 150 } = options;
  const images = await pdfToImages(pdfBuffer, dpi);
  const results: PDFComparisonResult[] = [];

  for (let i = 0; i < images.length; i++) {
    const result = await comparePDF(template, testName, pdfBuffer, {
      ...options,
      page: i + 1,
    });
    results.push(result);
  }

  return results;
}
