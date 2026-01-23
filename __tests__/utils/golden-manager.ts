/**
 * Golden Image/File Manager for Visual Regression Tests
 *
 * Manages golden (reference) files for comparing test outputs.
 * Supports updating goldens when intentional changes are made.
 */

import fs from 'fs';
import path from 'path';

const GOLDEN_DIR = path.join(__dirname, '../golden');
const UPDATE_GOLDENS = process.env.UPDATE_GOLDENS === 'true';

export interface ComparisonResult {
  matches: boolean;
  diffPercentage?: number;
  diffPixels?: number;
  message: string;
}

/**
 * Get the path to a golden file
 */
export function getGoldenPath(
  type: 'pdf' | 'docx' | 'html',
  template: 'classic' | 'modern' | 'executive',
  filename: string
): string {
  return path.join(GOLDEN_DIR, type, template, filename);
}

/**
 * Check if a golden file exists
 */
export function goldenExists(
  type: 'pdf' | 'docx' | 'html',
  template: 'classic' | 'modern' | 'executive',
  filename: string
): boolean {
  return fs.existsSync(getGoldenPath(type, template, filename));
}

/**
 * Read a golden file
 */
export function readGolden(
  type: 'pdf' | 'docx' | 'html',
  template: 'classic' | 'modern' | 'executive',
  filename: string
): Buffer | null {
  const goldenPath = getGoldenPath(type, template, filename);
  if (!fs.existsSync(goldenPath)) {
    return null;
  }
  return fs.readFileSync(goldenPath);
}

/**
 * Read a golden file as string
 */
export function readGoldenText(
  type: 'pdf' | 'docx' | 'html',
  template: 'classic' | 'modern' | 'executive',
  filename: string
): string | null {
  const buffer = readGolden(type, template, filename);
  return buffer ? buffer.toString('utf-8') : null;
}

/**
 * Save or update a golden file
 */
export function saveGolden(
  type: 'pdf' | 'docx' | 'html',
  template: 'classic' | 'modern' | 'executive',
  filename: string,
  content: Buffer | string
): void {
  const goldenPath = getGoldenPath(type, template, filename);
  const dir = path.dirname(goldenPath);

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(goldenPath, content);
  console.log(`[Golden] Saved: ${goldenPath}`);
}

/**
 * Compare actual output with golden file
 * Returns true if they match, or updates golden if UPDATE_GOLDENS is set
 */
export function compareWithGolden(
  type: 'pdf' | 'docx' | 'html',
  template: 'classic' | 'modern' | 'executive',
  filename: string,
  actualContent: Buffer | string
): ComparisonResult {
  const golden = readGolden(type, template, filename);

  // If no golden exists
  if (!golden) {
    if (UPDATE_GOLDENS) {
      saveGolden(type, template, filename, actualContent);
      return {
        matches: true,
        message: `Golden file created: ${filename}`,
      };
    }
    return {
      matches: false,
      message: `No golden file exists for ${filename}. Run with UPDATE_GOLDENS=true to create it.`,
    };
  }

  // If UPDATE_GOLDENS is set, always update
  if (UPDATE_GOLDENS) {
    saveGolden(type, template, filename, actualContent);
    return {
      matches: true,
      message: `Golden file updated: ${filename}`,
    };
  }

  // Compare
  const actualBuffer = typeof actualContent === 'string'
    ? Buffer.from(actualContent)
    : actualContent;

  if (golden.equals(actualBuffer)) {
    return {
      matches: true,
      message: 'Output matches golden file',
    };
  }

  return {
    matches: false,
    message: `Output differs from golden file: ${filename}`,
  };
}

/**
 * Save a diff image for debugging failed comparisons
 */
export function saveDiffImage(
  template: 'classic' | 'modern' | 'executive',
  filename: string,
  diffBuffer: Buffer
): string {
  const diffDir = path.join(GOLDEN_DIR, 'diffs', template);
  if (!fs.existsSync(diffDir)) {
    fs.mkdirSync(diffDir, { recursive: true });
  }

  const diffPath = path.join(diffDir, `diff-${filename}`);
  fs.writeFileSync(diffPath, diffBuffer);
  return diffPath;
}

/**
 * Clean up diff images after successful tests
 */
export function cleanupDiffs(): void {
  const diffDir = path.join(GOLDEN_DIR, 'diffs');
  if (fs.existsSync(diffDir)) {
    fs.rmSync(diffDir, { recursive: true, force: true });
  }
}

export { UPDATE_GOLDENS };
