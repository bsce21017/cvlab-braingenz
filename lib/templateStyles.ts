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
  skillsSeparator: '|' | '•' | '·' | ',' | '—';
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
  name: 'Core',
  fonts: {
    primary: 'Georgia',
    fallback: ['Times New Roman', 'Times', 'serif'],
  },
  fontSize: {
    name: 18,                // Name size matching reference
    title: 11,
    sectionHeading: 9,       // Slightly smaller section headings
    jobTitle: 9.5,
    body: 9,                 // Smaller body for density
    contact: 8.5,
  },
  colors: {
    primary: '#003366',      // Deep navy blue (matching reference)
    name: '#003366',         // Navy blue name
    sectionHeading: '#003366',
    bodyText: '#1a1a1a',     // Near black body text
    subtleText: '#333333',   // Dark gray for dates/companies
    divider: '#003366',      // Navy blue dividers
  },
  spacing: {
    pageMargin: 50,          // Slightly smaller margins
    sectionGap: 10,
    itemGap: 5,
    bulletIndent: 12,
    lineHeight: 1.2,
  },
  layout: {
    dividerStyle: 'thin',
    dividerWeight: 0.75,     // Thin underline
    bulletStyle: '•',
    contactSeparator: '•',   // Bullet separator for contact
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
 * - Serif font (Times New Roman)
 * - Mixed case name, sentence case headings
 * - Section heading with gray line extending to right
 * - Solid bullets (•)
 * - Clean single-column layout
 */
export const modernStyle: TemplateStyle = {
  id: 'modern',
  name: 'Dynamic',
  fonts: {
    primary: 'Times New Roman',
    fallback: ['Times', 'serif'],
  },
  fontSize: {
    name: 22,                // Large bold name (matching reference)
    title: 10,               // Subtitle size
    sectionHeading: 16,      // Larger section headings
    jobTitle: 11,
    body: 10,
    contact: 9,
  },
  colors: {
    primary: '#000000',      // Black
    name: '#000000',         // Black name
    sectionHeading: '#000000', // Black section headings
    bodyText: '#333333',     // Dark gray body
    subtleText: '#666666',   // Gray for secondary text
    divider: '#CCCCCC',      // Light gray line divider
  },
  spacing: {
    pageMargin: 50,          // Matching margins
    sectionGap: 20,
    itemGap: 10,
    bulletIndent: 14,
    lineHeight: 1.4,
  },
  layout: {
    dividerStyle: 'thin',    // Thin gray line
    dividerWeight: 0.5,      // Thin line
    bulletStyle: '•',        // Solid bullet
    contactSeparator: '·',   // Middle dot separator for contact
    skillsSeparator: '·',    // Middle dot separator for skills
  },
  textTransform: {
    name: 'none',            // Title case name (not uppercase)
    sectionHeading: 'capitalize',
    title: 'none',
  },
};

/**
 * Executive Template (Template 6)
 * - Serif font (Times New Roman)
 * - ALL CAPS name in navy, no title under name
 * - Navy thick underline dividers
 * - Solid bullets (•)
 * - CORE COMPETENCIES section with pipe separators
 * - No header divider (goes straight to first section)
 */
export const executiveStyle: TemplateStyle = {
  id: 'executive',
  name: 'Premium',
  fonts: {
    primary: 'Times New Roman',
    fallback: ['Times', 'serif'],
  },
  fontSize: {
    name: 20,                // 20pt bold uppercase name (matching golden)
    title: 12,               // Title size (not shown in this template)
    sectionHeading: 11,      // Section headings
    jobTitle: 10,
    body: 9,
    contact: 9,
  },
  colors: {
    primary: '#003366',      // Deep navy blue
    name: '#003366',         // Navy blue name
    sectionHeading: '#003366', // Navy blue section headings
    bodyText: '#000000',     // Black body text
    subtleText: '#444444',   // Dark gray for secondary
    divider: '#003366',      // Navy blue dividers
  },
  spacing: {
    pageMargin: 40,          // Matching margins
    sectionGap: 14,
    itemGap: 8,
    bulletIndent: 12,
    lineHeight: 1.4,
  },
  layout: {
    dividerStyle: 'thick',
    dividerWeight: 2,        // Thick underline (matching reference)
    bulletStyle: '•',        // Solid bullets
    contactSeparator: '|',   // Pipe separator
    skillsSeparator: '|',    // Pipe separator for core competencies
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
