/**
 * Shared Template Style System
 *
 * Single source of truth for all CV template styling across HTML, PDF, and DOCX formats.
 * All measurements are defined in points (pt) and converted as needed for each format.
 *
 * Template Mapping (from reference docs):
 * - Classic (Template 2): Serif, thin underline dividers, solid bullets (•)
 * - Modern (Template 5): Sans-serif, long dash dividers, hollow bullets (◦)
 * - Executive (Template 6): Serif, thick underline dividers, solid bullets (•), CORE COMPETENCIES
 */

import { ptToPx, ptToTwip, ptToHalfPt } from './templateConverters';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TemplateId = 'classic' | 'modern' | 'executive';

export interface FontConfig {
  primary: string;
  fallback: string[];
}

export interface FontSizes {
  name: number;           // Name at top of resume
  title: number;          // Job title (for Executive)
  sectionHeading: number; // Section headers
  jobTitle: number;       // Experience job titles
  body: number;           // Body text, bullets
  contact: number;        // Contact info line
}

export interface Colors {
  primary: string;        // Accent color (borders, name, etc.)
  name: string;           // Name text color
  sectionHeading: string; // Section heading text color
  bodyText: string;       // Main body text
  subtleText: string;     // Secondary/muted text (contact info, company names)
  divider: string;        // Divider line color
}

export interface Spacing {
  pageMargin: number;     // Page margins (all sides)
  sectionGap: number;     // Gap between sections
  itemGap: number;        // Gap between items within a section
  bulletIndent: number;   // Bullet point indentation
  lineHeight: number;     // Line height multiplier
}

export interface Layout {
  dividerStyle: 'thin' | 'thick' | 'dash' | 'none';
  dividerWeight: number;  // Line thickness in pt
  bulletStyle: '•' | '◦' | '-' | '▪';
  contactSeparator: '|' | '•' | '·' | '—';
  skillsSeparator: '|' | '•' | ',' | '—';
}

export interface TextTransform {
  name: 'uppercase' | 'capitalize' | 'none';
  sectionHeading: 'uppercase' | 'capitalize' | 'none';
  title: 'uppercase' | 'capitalize' | 'none';
}

export interface TemplateStyle {
  id: TemplateId;
  name: string;
  fonts: FontConfig;
  fontSize: FontSizes;
  colors: Colors;
  spacing: Spacing;
  layout: Layout;
  textTransform: TextTransform;
}

// ============================================================================
// TEMPLATE CONFIGURATIONS
// ============================================================================

/**
 * Classic Template (Template 2)
 * - Serif font (Georgia/Times New Roman)
 * - ALL CAPS name and section headings
 * - Thin underline dividers
 * - Solid bullets (•)
 * - Two-column layout with section labels on left
 */
export const classicStyle: TemplateStyle = {
  id: 'classic',
  name: 'Classic',
  fonts: {
    primary: 'Georgia',
    fallback: ['Times New Roman', 'Times', 'serif'],
  },
  fontSize: {
    name: 18,
    title: 14,
    sectionHeading: 11,
    jobTitle: 10.5,
    body: 10,
    contact: 9,
  },
  colors: {
    primary: '#004080',      // Navy blue
    name: '#004080',
    sectionHeading: '#004080',
    bodyText: '#333333',
    subtleText: '#555555',
    divider: '#004080',
  },
  spacing: {
    pageMargin: 36,          // 0.5 inch
    sectionGap: 14,
    itemGap: 8,
    bulletIndent: 12,
    lineHeight: 1.3,
  },
  layout: {
    dividerStyle: 'thin',
    dividerWeight: 0.75,
    bulletStyle: '•',
    contactSeparator: '•',
    skillsSeparator: '•',
  },
  textTransform: {
    name: 'uppercase',
    sectionHeading: 'uppercase',
    title: 'none',
  },
};

/**
 * Modern Template (Template 5)
 * - Sans-serif font (Arial)
 * - Mixed case name, sentence case headings
 * - Long dash dividers (————)
 * - Hollow bullets (◦)
 * - Clean single-column layout
 */
export const modernStyle: TemplateStyle = {
  id: 'modern',
  name: 'Modern',
  fonts: {
    primary: 'Arial',
    fallback: ['Helvetica', 'sans-serif'],
  },
  fontSize: {
    name: 18,
    title: 14,
    sectionHeading: 11,
    jobTitle: 10.5,
    body: 10,
    contact: 9,
  },
  colors: {
    primary: '#222222',      // Near black
    name: '#222222',
    sectionHeading: '#222222',
    bodyText: '#444444',
    subtleText: '#666666',
    divider: '#888888',
  },
  spacing: {
    pageMargin: 40,
    sectionGap: 16,
    itemGap: 10,
    bulletIndent: 10,
    lineHeight: 1.35,
  },
  layout: {
    dividerStyle: 'dash',
    dividerWeight: 1,
    bulletStyle: '◦',
    contactSeparator: '·',
    skillsSeparator: '|',
  },
  textTransform: {
    name: 'none',
    sectionHeading: 'capitalize',
    title: 'none',
  },
};

/**
 * Executive Template (Template 6)
 * - Serif font (Georgia/Times New Roman)
 * - ALL CAPS name and section headings
 * - Thick underline dividers
 * - Solid bullets (•)
 * - CORE COMPETENCIES section with pipe separators
 */
export const executiveStyle: TemplateStyle = {
  id: 'executive',
  name: 'Executive',
  fonts: {
    primary: 'Georgia',
    fallback: ['Times New Roman', 'Times', 'serif'],
  },
  fontSize: {
    name: 20,
    title: 14,
    sectionHeading: 11,
    jobTitle: 10.5,
    body: 10,
    contact: 9,
  },
  colors: {
    primary: '#8B4513',      // Saddle brown / professional brown
    name: '#222222',
    sectionHeading: '#222222',
    bodyText: '#333333',
    subtleText: '#555555',
    divider: '#8B4513',
  },
  spacing: {
    pageMargin: 40,
    sectionGap: 16,
    itemGap: 10,
    bulletIndent: 12,
    lineHeight: 1.35,
  },
  layout: {
    dividerStyle: 'thick',
    dividerWeight: 1.5,
    bulletStyle: '•',
    contactSeparator: '|',
    skillsSeparator: '|',
  },
  textTransform: {
    name: 'uppercase',
    sectionHeading: 'uppercase',
    title: 'uppercase',
  },
};

// ============================================================================
// STYLE LOOKUP
// ============================================================================

export const templateStyles: Record<TemplateId, TemplateStyle> = {
  classic: classicStyle,
  modern: modernStyle,
  executive: executiveStyle,
};

/**
 * Get the style configuration for a template
 *
 * @param templateId - The template identifier
 * @returns The style configuration for that template
 */
export function getTemplateStyle(templateId: TemplateId): TemplateStyle {
  return templateStyles[templateId] || classicStyle;
}

// ============================================================================
// CSS STYLE GENERATORS
// ============================================================================

/**
 * Generate CSS styles for HTML templates
 */
export function generateCSSStyles(style: TemplateStyle) {
  return {
    page: {
      padding: `${ptToPx(style.spacing.pageMargin)}px`,
      fontFamily: `${style.fonts.primary}, ${style.fonts.fallback.join(', ')}`,
      fontSize: `${ptToPx(style.fontSize.body)}px`,
      color: style.colors.bodyText,
      lineHeight: style.spacing.lineHeight,
    },
    name: {
      fontSize: `${ptToPx(style.fontSize.name)}px`,
      fontWeight: 700,
      color: style.colors.name,
      textTransform: style.textTransform.name,
      textAlign: 'center' as const,
      letterSpacing: style.textTransform.name === 'uppercase' ? '0.05em' : 'normal',
    },
    title: {
      fontSize: `${ptToPx(style.fontSize.title)}px`,
      fontWeight: 600,
      color: style.colors.subtleText,
      textTransform: style.textTransform.title,
      textAlign: 'center' as const,
    },
    contact: {
      fontSize: `${ptToPx(style.fontSize.contact)}px`,
      color: style.colors.subtleText,
      textAlign: 'center' as const,
    },
    sectionHeading: {
      fontSize: `${ptToPx(style.fontSize.sectionHeading)}px`,
      fontWeight: 700,
      color: style.colors.sectionHeading,
      textTransform: style.textTransform.sectionHeading,
      letterSpacing: style.textTransform.sectionHeading === 'uppercase' ? '0.03em' : 'normal',
      borderBottom: style.layout.dividerStyle !== 'none'
        ? `${style.layout.dividerWeight}px solid ${style.colors.divider}`
        : 'none',
      paddingBottom: '4px',
      marginBottom: `${ptToPx(style.spacing.itemGap)}px`,
    },
    jobTitle: {
      fontSize: `${ptToPx(style.fontSize.jobTitle)}px`,
      fontWeight: 700,
      color: style.colors.bodyText,
    },
    bodyText: {
      fontSize: `${ptToPx(style.fontSize.body)}px`,
      color: style.colors.bodyText,
      lineHeight: style.spacing.lineHeight,
    },
    bulletList: {
      marginLeft: `${ptToPx(style.spacing.bulletIndent)}px`,
      listStyleType: 'none',
    },
    divider: {
      height: `${style.layout.dividerWeight}px`,
      backgroundColor: style.colors.divider,
      border: 'none',
    },
  };
}

// ============================================================================
// PDF STYLE GENERATORS (for @react-pdf/renderer)
// ============================================================================

/**
 * Generate styles for @react-pdf/renderer StyleSheet
 * Note: react-pdf uses points directly, no conversion needed
 */
export function generatePDFStyles(style: TemplateStyle) {
  return {
    page: {
      padding: style.spacing.pageMargin,
      fontFamily: style.fonts.primary,
      fontSize: style.fontSize.body,
      color: style.colors.bodyText,
    },
    name: {
      fontSize: style.fontSize.name,
      fontWeight: 700 as const,
      color: style.colors.name,
      textTransform: style.textTransform.name,
      textAlign: 'center' as const,
      letterSpacing: style.textTransform.name === 'uppercase' ? 0.5 : 0,
    },
    title: {
      fontSize: style.fontSize.title,
      fontWeight: 600 as const,
      color: style.colors.subtleText,
      textTransform: style.textTransform.title,
      textAlign: 'center' as const,
    },
    contact: {
      fontSize: style.fontSize.contact,
      color: style.colors.subtleText,
      textAlign: 'center' as const,
    },
    sectionHeading: {
      fontSize: style.fontSize.sectionHeading,
      fontWeight: 700 as const,
      color: style.colors.sectionHeading,
      textTransform: style.textTransform.sectionHeading,
      letterSpacing: style.textTransform.sectionHeading === 'uppercase' ? 0.3 : 0,
      borderBottomWidth: style.layout.dividerStyle !== 'none' ? style.layout.dividerWeight : 0,
      borderBottomColor: style.colors.divider,
      paddingBottom: 3,
      marginBottom: style.spacing.itemGap,
    },
    jobTitle: {
      fontSize: style.fontSize.jobTitle,
      fontWeight: 700 as const,
      color: style.colors.bodyText,
    },
    bodyText: {
      fontSize: style.fontSize.body,
      color: style.colors.bodyText,
      lineHeight: style.spacing.lineHeight,
    },
    section: {
      marginBottom: style.spacing.sectionGap,
    },
    experienceItem: {
      marginBottom: style.spacing.itemGap,
    },
    bullet: {
      flexDirection: 'row' as const,
      marginLeft: style.spacing.bulletIndent,
      marginTop: 2,
    },
    bulletPoint: {
      width: 10,
      fontSize: style.fontSize.body,
      color: style.colors.subtleText,
    },
    bulletText: {
      flex: 1,
      fontSize: style.fontSize.body,
      color: style.colors.bodyText,
    },
    divider: {
      height: style.layout.dividerWeight,
      backgroundColor: style.colors.divider,
      marginVertical: style.spacing.sectionGap / 2,
    },
  };
}

// ============================================================================
// DOCX STYLE GENERATORS
// ============================================================================

/**
 * Generate styles for docx library
 * DOCX uses twips for spacing and half-points for font sizes
 */
export function generateDOCXStyles(style: TemplateStyle) {
  // Strip # from hex colors for DOCX
  const stripHash = (color: string) => color.replace('#', '');

  return {
    fontFamily: style.fonts.primary,
    fontSize: {
      name: ptToHalfPt(style.fontSize.name),
      title: ptToHalfPt(style.fontSize.title),
      sectionHeading: ptToHalfPt(style.fontSize.sectionHeading),
      jobTitle: ptToHalfPt(style.fontSize.jobTitle),
      body: ptToHalfPt(style.fontSize.body),
      contact: ptToHalfPt(style.fontSize.contact),
    },
    colors: {
      primary: stripHash(style.colors.primary),
      name: stripHash(style.colors.name),
      sectionHeading: stripHash(style.colors.sectionHeading),
      bodyText: stripHash(style.colors.bodyText),
      subtleText: stripHash(style.colors.subtleText),
      divider: stripHash(style.colors.divider),
    },
    spacing: {
      pageMargin: ptToTwip(style.spacing.pageMargin),
      sectionGap: ptToTwip(style.spacing.sectionGap),
      itemGap: ptToTwip(style.spacing.itemGap),
      bulletIndent: ptToTwip(style.spacing.bulletIndent),
      xs: ptToTwip(2),
      sm: ptToTwip(4),
      md: ptToTwip(8),
      lg: ptToTwip(12),
      xl: ptToTwip(16),
    },
    layout: style.layout,
    textTransform: style.textTransform,
    borderSize: Math.round(style.layout.dividerWeight * 8), // DOCX border size
  };
}

// ============================================================================
// DEFAULT SECTION LABELS
// ============================================================================

export const defaultSectionLabels: Record<TemplateId, Record<string, string>> = {
  classic: {
    summary: 'SUMMARY',
    experience: 'EXPERIENCE',
    education: 'EDUCATION',
    skills: 'KEY SKILLS',
    projects: 'PROJECTS',
    certifications: 'CERTIFICATIONS',
    languages: 'LANGUAGES',
    additional: 'ADDITIONAL INFORMATION',
  },
  modern: {
    summary: 'Summary',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
    languages: 'Languages',
    additional: 'Additional',
  },
  executive: {
    summary: 'PROFESSIONAL SUMMARY',
    experience: 'PROFESSIONAL EXPERIENCE',
    education: 'EDUCATION',
    skills: 'CORE COMPETENCIES',
    projects: 'KEY PROJECTS',
    certifications: 'PROFESSIONAL CERTIFICATIONS',
    languages: 'LANGUAGES & TECHNICAL SKILLS',
    additional: 'PROFESSIONAL AFFILIATIONS',
  },
};

/**
 * Get the section label for a template
 */
export function getDefaultSectionLabel(
  templateId: TemplateId,
  sectionKey: string
): string {
  return defaultSectionLabels[templateId]?.[sectionKey] || sectionKey;
}
