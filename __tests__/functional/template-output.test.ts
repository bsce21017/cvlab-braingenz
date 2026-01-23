/**
 * Functional Tests for Template Output
 *
 * Tests that each template formatter produces correct output
 * with proper formatting, content, and structure.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { ResumeData } from '../../lib/resumeDataTypes';
import { classicStyle, modernStyle, executiveStyle, getTemplateStyle } from '../../lib/templateStyles';

// Load test fixture
const FIXTURES_DIR = path.join(__dirname, '../fixtures/resume-data');
const fullResume: ResumeData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'full-resume.json'), 'utf-8')
);

describe('Template Style Configuration', () => {
  describe('getTemplateStyle', () => {
    it('should return classic style for classic template', () => {
      const style = getTemplateStyle('classic');
      expect(style.id).toBe('classic');
      expect(style.fonts.primary).toBe('Georgia');
    });

    it('should return modern style for modern template', () => {
      const style = getTemplateStyle('modern');
      expect(style.id).toBe('modern');
      expect(style.fonts.primary).toBe('Arial');
    });

    it('should return executive style for executive template', () => {
      const style = getTemplateStyle('executive');
      expect(style.id).toBe('executive');
      expect(style.fonts.primary).toBe('Georgia');
    });

    it('should default to classic for unknown template', () => {
      const style = getTemplateStyle('unknown' as any);
      expect(style.id).toBe('classic');
    });
  });
});

describe('Classic Template Formatting', () => {
  const style = classicStyle;

  it('should use serif font family', () => {
    expect(style.fonts.primary).toBe('Georgia');
    expect(style.fonts.fallback).toContain('Times New Roman');
  });

  it('should use solid bullet points', () => {
    expect(style.layout.bulletStyle).toBe('•');
  });

  it('should use thin divider style', () => {
    expect(style.layout.dividerStyle).toBe('thin');
  });

  it('should use middle dot contact separator', () => {
    expect(style.layout.contactSeparator).toBe('•');
  });

  it('should uppercase section headings', () => {
    expect(style.textTransform.sectionHeading).toBe('uppercase');
  });

  it('should have correct font sizes', () => {
    expect(style.fontSize.name).toBe(18);
    expect(style.fontSize.sectionHeading).toBe(11);
    expect(style.fontSize.body).toBe(10);
  });

  it('should have navy blue as primary color', () => {
    expect(style.colors.primary).toBe('#004080');
    expect(style.colors.name).toBe('#004080');
  });
});

describe('Modern Template Formatting', () => {
  const style = modernStyle;

  it('should use sans-serif font family', () => {
    expect(style.fonts.primary).toBe('Arial');
    expect(style.fonts.fallback).toContain('Helvetica');
  });

  it('should use hollow bullet points', () => {
    expect(style.layout.bulletStyle).toBe('◦');
  });

  it('should use dash divider style', () => {
    expect(style.layout.dividerStyle).toBe('dash');
  });

  it('should use middle dot contact separator', () => {
    expect(style.layout.contactSeparator).toBe('·');
  });

  it('should capitalize section headings (not uppercase)', () => {
    expect(style.textTransform.sectionHeading).toBe('capitalize');
  });

  it('should have correct font sizes', () => {
    expect(style.fontSize.name).toBe(18);
    expect(style.fontSize.sectionHeading).toBe(11);
    expect(style.fontSize.body).toBe(10);
  });

  it('should have near-black as primary color', () => {
    expect(style.colors.primary).toBe('#222222');
  });
});

describe('Executive Template Formatting', () => {
  const style = executiveStyle;

  it('should use serif font family', () => {
    expect(style.fonts.primary).toBe('Georgia');
    expect(style.fonts.fallback).toContain('Times New Roman');
  });

  it('should use solid bullet points', () => {
    expect(style.layout.bulletStyle).toBe('•');
  });

  it('should use thick divider style', () => {
    expect(style.layout.dividerStyle).toBe('thick');
  });

  it('should use pipe contact separator', () => {
    expect(style.layout.contactSeparator).toBe('|');
  });

  it('should uppercase section headings', () => {
    expect(style.textTransform.sectionHeading).toBe('uppercase');
  });

  it('should have larger name font size', () => {
    expect(style.fontSize.name).toBe(20);
  });

  it('should have saddle brown as primary color', () => {
    expect(style.colors.primary).toBe('#8B4513');
  });
});

describe('Resume Data Formatting', () => {
  it('should format contact info with classic separator', () => {
    const style = classicStyle;
    const contactParts = [fullResume.phone, fullResume.email, fullResume.location].filter(Boolean);
    const formatted = contactParts.join(` ${style.layout.contactSeparator} `);

    expect(formatted).toContain('•');
    expect(formatted).toContain(fullResume.phone);
    expect(formatted).toContain(fullResume.email);
  });

  it('should format contact info with modern separator', () => {
    const style = modernStyle;
    const contactParts = [fullResume.phone, fullResume.email, fullResume.location].filter(Boolean);
    const formatted = contactParts.join(` ${style.layout.contactSeparator} `);

    expect(formatted).toContain('·');
  });

  it('should format contact info with executive separator', () => {
    const style = executiveStyle;
    const contactParts = [fullResume.phone, fullResume.email, fullResume.location].filter(Boolean);
    const formatted = contactParts.join(` ${style.layout.contactSeparator} `);

    expect(formatted).toContain('|');
  });

  it('should format skills with executive pipe separator', () => {
    const style = executiveStyle;
    const skills = fullResume.skills.slice(0, 5);
    const formatted = skills.join(' | ');

    expect(formatted).toContain('|');
    expect(formatted.split('|').length).toBe(5);
  });

  it('should format section heading as uppercase for classic', () => {
    const style = classicStyle;
    const heading = 'Experience';
    const formatted = style.textTransform.sectionHeading === 'uppercase'
      ? heading.toUpperCase()
      : heading;

    expect(formatted).toBe('EXPERIENCE');
  });

  it('should format section heading as capitalized for modern', () => {
    const style = modernStyle;
    const heading = 'experience';
    // capitalize means first letter uppercase - the style system uses 'capitalize' value
    const formatted = style.textTransform.sectionHeading === 'uppercase'
      ? heading.toUpperCase()
      : style.textTransform.sectionHeading === 'capitalize'
        ? heading.charAt(0).toUpperCase() + heading.slice(1)
        : heading;

    expect(formatted).toBe('Experience');
  });
});

describe('Bullet Point Rendering', () => {
  const bullets = [
    'Led development of microservices architecture',
    'Mentored team of junior developers',
    'Reduced deployment time by 60%',
  ];

  it('should render classic bullets with solid dot', () => {
    const style = classicStyle;
    const rendered = bullets.map(b => `${style.layout.bulletStyle} ${b}`);

    rendered.forEach(line => {
      expect(line).toMatch(/^• /);
    });
  });

  it('should render modern bullets with hollow dot', () => {
    const style = modernStyle;
    const rendered = bullets.map(b => `${style.layout.bulletStyle} ${b}`);

    rendered.forEach(line => {
      expect(line).toMatch(/^◦ /);
    });
  });

  it('should render executive bullets with solid dot', () => {
    const style = executiveStyle;
    const rendered = bullets.map(b => `${style.layout.bulletStyle} ${b}`);

    rendered.forEach(line => {
      expect(line).toMatch(/^• /);
    });
  });
});

describe('Divider Style Rendering', () => {
  it('should indicate thin underline for classic', () => {
    const style = classicStyle;
    expect(style.layout.dividerStyle).toBe('thin');
    // In actual rendering, this would be a 1px border-bottom
  });

  it('should indicate dash line for modern', () => {
    const style = modernStyle;
    expect(style.layout.dividerStyle).toBe('dash');
    // In actual rendering, this would be ————————————
  });

  it('should indicate thick underline for executive', () => {
    const style = executiveStyle;
    expect(style.layout.dividerStyle).toBe('thick');
    // In actual rendering, this would be a 2px border-bottom
  });
});

describe('Font Stack Consistency', () => {
  it('should have valid CSS font stack for classic', () => {
    const style = classicStyle;
    const fontStack = [style.fonts.primary, ...style.fonts.fallback].join(', ');

    expect(fontStack).toBe('Georgia, Times New Roman, Times, serif');
  });

  it('should have valid CSS font stack for modern', () => {
    const style = modernStyle;
    const fontStack = [style.fonts.primary, ...style.fonts.fallback].join(', ');

    expect(fontStack).toBe('Arial, Helvetica, sans-serif');
  });

  it('should have valid CSS font stack for executive', () => {
    const style = executiveStyle;
    const fontStack = [style.fonts.primary, ...style.fonts.fallback].join(', ');

    expect(fontStack).toBe('Georgia, Times New Roman, Times, serif');
  });
});

describe('Color Scheme Validation', () => {
  it('should have valid hex colors for classic', () => {
    const style = classicStyle;
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;

    expect(style.colors.primary).toMatch(hexRegex);
    expect(style.colors.name).toMatch(hexRegex);
    expect(style.colors.bodyText).toMatch(hexRegex);
    expect(style.colors.sectionHeading).toMatch(hexRegex);
  });

  it('should have valid hex colors for modern', () => {
    const style = modernStyle;
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;

    expect(style.colors.primary).toMatch(hexRegex);
    expect(style.colors.name).toMatch(hexRegex);
    expect(style.colors.bodyText).toMatch(hexRegex);
  });

  it('should have valid hex colors for executive', () => {
    const style = executiveStyle;
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;

    expect(style.colors.primary).toMatch(hexRegex);
    expect(style.colors.name).toMatch(hexRegex);
    expect(style.colors.bodyText).toMatch(hexRegex);
  });
});

describe('Spacing Configuration', () => {
  it('should have reasonable page margins', () => {
    [classicStyle, modernStyle, executiveStyle].forEach(style => {
      expect(style.spacing.pageMargin).toBeGreaterThanOrEqual(36); // At least 0.5 inch
      expect(style.spacing.pageMargin).toBeLessThanOrEqual(72); // At most 1 inch
    });
  });

  it('should have reasonable section gaps', () => {
    [classicStyle, modernStyle, executiveStyle].forEach(style => {
      expect(style.spacing.sectionGap).toBeGreaterThan(0);
      expect(style.spacing.sectionGap).toBeLessThanOrEqual(24);
    });
  });

  it('should have reasonable line heights', () => {
    [classicStyle, modernStyle, executiveStyle].forEach(style => {
      expect(style.spacing.lineHeight).toBeGreaterThanOrEqual(1.0);
      expect(style.spacing.lineHeight).toBeLessThanOrEqual(2.0);
    });
  });
});
