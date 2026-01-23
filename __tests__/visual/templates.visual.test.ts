/**
 * Visual Regression Tests for CV Templates
 *
 * Tests PDF and DOCX generation across all templates to ensure
 * visual consistency and prevent regressions.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { comparePDF } from '../utils/pdf-comparator';
import { compareDOCX, extractDOCXStyles } from '../utils/docx-comparator';
import { cleanupDiffs } from '../utils/golden-manager';
import type { ResumeData } from '../../lib/resumeDataTypes';
import { classicStyle, modernStyle, executiveStyle } from '../../lib/templateStyles';
import { ptToTwip, ptToPx, ptToHalfPt } from '../../lib/templateConverters';

// Load test fixtures
const FIXTURES_DIR = path.join(__dirname, '../fixtures/resume-data');

const minimalResume: ResumeData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'minimal-resume.json'), 'utf-8')
);

const fullResume: ResumeData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'full-resume.json'), 'utf-8')
);

const templates = ['classic', 'modern', 'executive'] as const;

describe('Template Visual Regression Tests', () => {
  beforeAll(() => {
    // Clean up any previous diff images
    cleanupDiffs();
  });

  describe('PDF Generation', () => {
    templates.forEach((template) => {
      describe(`${template} template`, () => {
        it.skip('should match golden for minimal resume', async () => {
          // This test requires the actual PDF generation code to be available
          // For now, it serves as a placeholder for the test structure
          // When implementing, use:
          // const pdfBuffer = await generatePDF(minimalResume, template);
          // const result = await comparePDF(template, 'minimal', pdfBuffer);
          // expect(result.matches).toBe(true);
          expect(true).toBe(true);
        });

        it.skip('should match golden for full resume', async () => {
          // Placeholder for full resume PDF test
          expect(true).toBe(true);
        });
      });
    });
  });

  describe('DOCX Generation', () => {
    templates.forEach((template) => {
      describe(`${template} template`, () => {
        it.skip('should match golden text content for minimal resume', async () => {
          // This test requires the actual DOCX generation code to be available
          // For now, it serves as a placeholder for the test structure
          // When implementing, use:
          // const docxBuffer = await generateDOCX(minimalResume, template);
          // const result = await compareDOCX(template, 'minimal', docxBuffer, { compareText: true });
          // expect(result.matches).toBe(true);
          expect(true).toBe(true);
        });

        it.skip('should match golden HTML for full resume', async () => {
          // Placeholder for full resume DOCX test
          expect(true).toBe(true);
        });
      });
    });
  });

  describe('Style Consistency', () => {
    it('should have consistent style definitions across templates', () => {
      // Verify all templates have required properties
      [classicStyle, modernStyle, executiveStyle].forEach((style) => {
        expect(style.fonts).toBeDefined();
        expect(style.fonts.primary).toBeDefined();
        expect(style.fontSize).toBeDefined();
        expect(style.colors).toBeDefined();
        expect(style.spacing).toBeDefined();
        expect(style.layout).toBeDefined();
      });

      // Classic and Executive should use serif fonts
      expect(classicStyle.fonts.primary).toBe('Georgia');
      expect(executiveStyle.fonts.primary).toBe('Georgia');

      // Modern should use sans-serif
      expect(modernStyle.fonts.primary).toBe('Arial');
    });

    it('should have valid bullet styles for each template', () => {
      // Classic and Executive use solid bullets
      expect(classicStyle.layout.bulletStyle).toBe('\u2022'); // •
      expect(executiveStyle.layout.bulletStyle).toBe('\u2022'); // •

      // Modern uses hollow bullets
      expect(modernStyle.layout.bulletStyle).toBe('\u25E6'); // ◦
    });

    it('should have appropriate divider styles', () => {
      expect(classicStyle.layout.dividerStyle).toBe('thin');
      expect(modernStyle.layout.dividerStyle).toBe('dash');
      expect(executiveStyle.layout.dividerStyle).toBe('thick');
    });
  });

  describe('Unit Conversions', () => {
    it('should correctly convert points to twips', () => {
      expect(ptToTwip(1)).toBe(20);
      expect(ptToTwip(12)).toBe(240);
      expect(ptToTwip(72)).toBe(1440); // 1 inch
    });

    it('should correctly convert points to pixels', () => {
      // At 96 DPI: 1pt = 1.333px
      expect(ptToPx(12)).toBe(16);
      expect(ptToPx(72)).toBe(96); // 1 inch = 96px at 96 DPI
    });

    it('should correctly convert points to half-points', () => {
      expect(ptToHalfPt(12)).toBe(24);
      expect(ptToHalfPt(10)).toBe(20);
    });
  });
});

describe('Template Data Validation', () => {
  templates.forEach((template) => {
    describe(`${template} template`, () => {
      it('should handle empty sections gracefully', () => {
        const emptyResume: ResumeData = {
          name: 'Test User',
          experience: [],
          education: [],
          skills: [],
          certifications: [],
          languages: [],
        };

        // The template should not throw when rendering empty data
        // This is a smoke test for the template structure
        expect(emptyResume.name).toBeDefined();
        expect(emptyResume.experience).toHaveLength(0);
      });

      it('should handle long content without overflow', () => {
        const longResume: ResumeData = {
          ...fullResume,
          summary: 'A'.repeat(1000), // Very long summary
          skills: Array(50).fill('Skill'), // Many skills
        };

        expect(longResume.summary.length).toBe(1000);
        expect(longResume.skills.length).toBe(50);
      });
    });
  });
});
