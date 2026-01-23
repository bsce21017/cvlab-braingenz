/**
 * Unit Conversion Utilities for Template Styling
 *
 * Provides consistent conversions between different measurement systems used by:
 * - HTML/CSS (pixels)
 * - PDF (@react-pdf/renderer uses points)
 * - DOCX (uses twips and half-points)
 *
 * All templates should define their base measurements in points (pt) and use
 * these converters to get the appropriate values for each format.
 */

/**
 * Convert points to DOCX twips
 * 1 twip = 1/20 of a point
 *
 * @param pt - Value in points
 * @returns Value in twips (for DOCX spacing, margins, etc.)
 */
export function ptToTwip(pt: number): number {
  return Math.round(pt * 20);
}

/**
 * Convert points to DOCX half-points
 * DOCX uses half-points for font sizes
 * 1 half-point = 1/2 of a point
 *
 * @param pt - Value in points
 * @returns Value in half-points (for DOCX font sizes)
 */
export function ptToHalfPt(pt: number): number {
  return Math.round(pt * 2);
}

/**
 * Convert points to CSS pixels
 * Standard conversion: 1pt = 1.333px (at 96 DPI)
 *
 * @param pt - Value in points
 * @returns Value in pixels (for HTML/CSS)
 */
export function ptToPx(pt: number): number {
  return Math.round(pt * 1.333);
}

/**
 * Convert pixels to points
 * Inverse of ptToPx
 *
 * @param px - Value in pixels
 * @returns Value in points
 */
export function pxToPt(px: number): number {
  return Math.round(px / 1.333);
}

/**
 * Convert inches to twips
 * 1 inch = 1440 twips
 *
 * @param inches - Value in inches
 * @returns Value in twips
 */
export function inchesToTwip(inches: number): number {
  return Math.round(inches * 1440);
}

/**
 * Convert inches to points
 * 1 inch = 72 points
 *
 * @param inches - Value in inches
 * @returns Value in points
 */
export function inchesToPt(inches: number): number {
  return inches * 72;
}

/**
 * Convert millimeters to points
 * 1mm = 2.835 points
 *
 * @param mm - Value in millimeters
 * @returns Value in points
 */
export function mmToPt(mm: number): number {
  return Math.round(mm * 2.835);
}

/**
 * Convert points to millimeters
 *
 * @param pt - Value in points
 * @returns Value in millimeters
 */
export function ptToMm(pt: number): number {
  return pt / 2.835;
}

/**
 * A4 page dimensions in various units
 */
export const A4_DIMENSIONS = {
  // In millimeters
  mm: { width: 210, height: 297 },
  // In points (for PDF)
  pt: { width: 595.28, height: 841.89 },
  // In pixels (at 96 DPI)
  px: { width: 794, height: 1123 },
  // In inches
  inches: { width: 8.27, height: 11.69 },
};

/**
 * US Letter page dimensions in various units
 */
export const LETTER_DIMENSIONS = {
  // In inches
  inches: { width: 8.5, height: 11 },
  // In points
  pt: { width: 612, height: 792 },
  // In twips
  twip: { width: 12240, height: 15840 },
  // In pixels (at 96 DPI)
  px: { width: 816, height: 1056 },
};
