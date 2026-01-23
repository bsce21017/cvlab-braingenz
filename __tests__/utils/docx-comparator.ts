/**
 * DOCX Comparator for Visual Regression Tests
 *
 * Extracts and compares DOCX content structure and text.
 * Uses mammoth for HTML conversion and adm-zip for raw XML access.
 */

import AdmZip from 'adm-zip';
import mammoth from 'mammoth';
import {
  getGoldenPath,
  saveGolden,
  readGoldenText,
  UPDATE_GOLDENS,
  ComparisonResult,
} from './golden-manager';

export interface DOCXComparisonOptions {
  /** Compare raw XML structure. Default: false */
  compareXml?: boolean;
  /** Compare extracted text only. Default: true */
  compareText?: boolean;
  /** Compare HTML conversion. Default: true */
  compareHtml?: boolean;
}

export interface DOCXContent {
  text: string;
  html: string;
  xml?: string;
}

/**
 * Extract content from a DOCX buffer
 */
export async function extractDOCXContent(
  docxBuffer: Buffer,
  includeXml: boolean = false
): Promise<DOCXContent> {
  // Extract text using mammoth
  const textResult = await mammoth.extractRawText({ buffer: docxBuffer });
  const htmlResult = await mammoth.convertToHtml({ buffer: docxBuffer });

  let xml: string | undefined;
  if (includeXml) {
    const zip = new AdmZip(docxBuffer);
    const documentXml = zip.getEntry('word/document.xml');
    if (documentXml) {
      xml = documentXml.getData().toString('utf-8');
    }
  }

  return {
    text: textResult.value,
    html: htmlResult.value,
    xml,
  };
}

/**
 * Normalize text for comparison (remove extra whitespace, normalize line endings)
 */
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Calculate text similarity percentage
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 100;
  if (str1.length === 0 || str2.length === 0) return 0;

  // Simple character-level similarity
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] === longer[i]) {
      matches++;
    }
  }

  return (matches / longer.length) * 100;
}

/**
 * Compare two DOCX documents
 */
export async function compareDOCX(
  template: 'classic' | 'modern' | 'executive',
  testName: string,
  docxBuffer: Buffer,
  options: DOCXComparisonOptions = {}
): Promise<ComparisonResult> {
  const {
    compareXml = false,
    compareText = true,
    compareHtml = true,
  } = options;

  try {
    const content = await extractDOCXContent(docxBuffer, compareXml);
    const results: string[] = [];
    let allMatch = true;

    // Compare text content
    if (compareText) {
      const textFilename = `${testName}.txt`;
      const normalizedText = normalizeText(content.text);
      const goldenText = readGoldenText('docx', template, textFilename);

      if (!goldenText || UPDATE_GOLDENS) {
        saveGolden('docx', template, textFilename, normalizedText);
        results.push(UPDATE_GOLDENS ? 'Text golden updated' : 'Text golden created');
      } else {
        const normalizedGolden = normalizeText(goldenText);
        if (normalizedText === normalizedGolden) {
          results.push('Text content matches');
        } else {
          allMatch = false;
          const similarity = calculateSimilarity(normalizedText, normalizedGolden);
          results.push(`Text differs (${similarity.toFixed(1)}% similar)`);
        }
      }
    }

    // Compare HTML conversion
    if (compareHtml) {
      const htmlFilename = `${testName}.html`;
      const goldenHtml = readGoldenText('docx', template, htmlFilename);

      if (!goldenHtml || UPDATE_GOLDENS) {
        saveGolden('docx', template, htmlFilename, content.html);
        results.push(UPDATE_GOLDENS ? 'HTML golden updated' : 'HTML golden created');
      } else {
        if (content.html === goldenHtml) {
          results.push('HTML content matches');
        } else {
          allMatch = false;
          const similarity = calculateSimilarity(content.html, goldenHtml);
          results.push(`HTML differs (${similarity.toFixed(1)}% similar)`);
        }
      }
    }

    // Compare XML structure
    if (compareXml && content.xml) {
      const xmlFilename = `${testName}.xml`;
      const goldenXml = readGoldenText('docx', template, xmlFilename);

      if (!goldenXml || UPDATE_GOLDENS) {
        saveGolden('docx', template, xmlFilename, content.xml);
        results.push(UPDATE_GOLDENS ? 'XML golden updated' : 'XML golden created');
      } else {
        if (content.xml === goldenXml) {
          results.push('XML structure matches');
        } else {
          allMatch = false;
          results.push('XML structure differs');
        }
      }
    }

    return {
      matches: allMatch,
      message: results.join('; '),
    };
  } catch (error) {
    return {
      matches: false,
      message: `Error comparing DOCX: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Extract and return DOCX styling information
 */
export async function extractDOCXStyles(docxBuffer: Buffer): Promise<{
  fonts: string[];
  colors: string[];
  sizes: string[];
}> {
  const zip = new AdmZip(docxBuffer);
  const stylesEntry = zip.getEntry('word/styles.xml');
  const documentEntry = zip.getEntry('word/document.xml');

  const fonts = new Set<string>();
  const colors = new Set<string>();
  const sizes = new Set<string>();

  const xmlContent = [
    stylesEntry?.getData().toString('utf-8') || '',
    documentEntry?.getData().toString('utf-8') || '',
  ].join('\n');

  // Extract font names
  const fontMatches = xmlContent.match(/w:ascii="([^"]+)"/g);
  if (fontMatches) {
    fontMatches.forEach((match) => {
      const font = match.match(/w:ascii="([^"]+)"/)?.[1];
      if (font) fonts.add(font);
    });
  }

  // Extract colors
  const colorMatches = xmlContent.match(/w:val="([0-9A-Fa-f]{6})"/g);
  if (colorMatches) {
    colorMatches.forEach((match) => {
      const color = match.match(/w:val="([0-9A-Fa-f]{6})"/)?.[1];
      if (color) colors.add(color);
    });
  }

  // Extract font sizes
  const sizeMatches = xmlContent.match(/w:sz w:val="(\d+)"/g);
  if (sizeMatches) {
    sizeMatches.forEach((match) => {
      const size = match.match(/w:sz w:val="(\d+)"/)?.[1];
      if (size) sizes.add(size);
    });
  }

  return {
    fonts: Array.from(fonts),
    colors: Array.from(colors),
    sizes: Array.from(sizes),
  };
}
