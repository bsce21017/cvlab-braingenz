/**
 * Generate Test Outputs for Visual Comparison
 *
 * This script generates:
 * 1. PDFs for each template using test fixture data
 * 2. HTML files for each template
 * 3. A comparison HTML page showing generated vs golden
 *
 * Usage: npx tsx __tests__/utils/generate-test-outputs.ts
 */

import fs from 'fs';
import path from 'path';
import React from 'react';

// Import template styles
import { classicStyle, modernStyle, executiveStyle, getTemplateStyle } from '../../lib/templateStyles';
import { ptToPx } from '../../lib/templateConverters';

// Import PDF templates - we'll create Node.js compatible versions
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

// Import DOCX generator
import { generateResumeAsWordBuffer } from '../../lib/downloadResume';

// Import types
import type { ResumeData } from '../../lib/resumeDataTypes';

const FIXTURES_DIR = path.join(__dirname, '../fixtures/resume-data');
const OUTPUT_DIR = path.join(__dirname, '../output');
const GOLDEN_DIR = path.join(__dirname, '../golden/pdf');

// Load template-specific fixtures
const classicResume: ResumeData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'classic-golden.json'), 'utf-8')
);

const modernResume: ResumeData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'modern-golden.json'), 'utf-8')
);

const executiveResume: ResumeData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'executive-golden.json'), 'utf-8')
);

const templates = ['classic', 'modern', 'executive'] as const;

// Get the right fixture for each template
function getFixtureForTemplate(templateId: typeof templates[number]): ResumeData {
  switch (templateId) {
    case 'classic':
      return classicResume;
    case 'modern':
      return modernResume;
    case 'executive':
      return executiveResume;
    default:
      return classicResume;
  }
}

// Ensure output directory exists
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============================================================================
// CLASSIC TEMPLATE - Two-column layout matching golden reference
// ============================================================================

function createClassicPDF(data: ResumeData): React.ReactElement {
  // Colors from golden reference - ALL BLACK (no colors)
  const BLACK = '#000000';

  // Spacing values tuned to match golden reference
  const SPACING = {
    betweenNameAndContact: 12,  // More space after name
    betweenContactAndFirstSection: 4,  // Less space before summary
    betweenSections: 12,
    betweenHeadingAndUnderline: 2,
    betweenUnderlineAndContent: 6,
    betweenExperienceItems: 10,
    betweenBulletPoints: 2,
    betweenCompanyAndBullets: 2,
    bulletIndent: 12,
  };

  const styles = StyleSheet.create({
    page: {
      paddingTop: 54,
      paddingBottom: 54,
      paddingLeft: 54,
      paddingRight: 54,
      fontFamily: 'Times-Roman',
      fontSize: 10,
      color: BLACK,
      lineHeight: 1.35,
    },
    // Header section - centered name and contact
    headerSection: {
      textAlign: 'center',
      marginBottom: SPACING.betweenContactAndFirstSection,
    },
    name: {
      fontSize: 18,
      fontWeight: 'bold',
      color: BLACK,
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: SPACING.betweenNameAndContact,
    },
    contactLine: {
      fontSize: 10,
      color: BLACK,
    },
    // Section container
    section: {
      marginTop: SPACING.betweenSections,
    },
    // Section heading with underline
    sectionHeading: {
      fontSize: 11,
      fontWeight: 'bold',
      color: BLACK,
      textTransform: 'uppercase',
      marginBottom: SPACING.betweenHeadingAndUnderline,
    },
    sectionUnderline: {
      height: 1,
      backgroundColor: BLACK,
      marginBottom: SPACING.betweenUnderlineAndContent,
    },
    // Body/summary text
    bodyText: {
      fontSize: 10,
      color: BLACK,
      lineHeight: 1.35,
    },
    // Experience item styles
    experienceItem: {
      marginBottom: SPACING.betweenExperienceItems,
    },
    expHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    expTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      color: BLACK,
    },
    expPeriod: {
      fontSize: 10,
      color: BLACK,
    },
    expCompany: {
      fontSize: 10,
      color: BLACK,
      fontStyle: 'italic',
      marginBottom: SPACING.betweenCompanyAndBullets,
    },
    // Bullet styles
    bulletRow: {
      flexDirection: 'row',
      marginBottom: SPACING.betweenBulletPoints,
    },
    bulletChar: {
      width: SPACING.bulletIndent,
      fontSize: 10,
      color: BLACK,
    },
    bulletText: {
      flex: 1,
      fontSize: 10,
      color: BLACK,
      lineHeight: 1.35,
    },
  });

  const contactParts = [data.phone, data.email, data.location].filter(Boolean);

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      // Header - centered name and contact
      React.createElement(View, { style: styles.headerSection },
        React.createElement(Text, { style: styles.name }, data.name.toUpperCase()),
        React.createElement(Text, { style: styles.contactLine }, contactParts.join(' • '))
      ),

      // SUMMARY Section
      data.summary && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionHeading }, 'SUMMARY'),
        React.createElement(View, { style: styles.sectionUnderline }),
        React.createElement(Text, { style: styles.bodyText }, data.summary)
      ),

      // EXPERIENCE Section
      data.experience && data.experience.length > 0 && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionHeading }, 'EXPERIENCE'),
        React.createElement(View, { style: styles.sectionUnderline }),
        ...data.experience.map((exp, idx) =>
          React.createElement(View, { key: idx, style: styles.experienceItem },
            React.createElement(View, { style: styles.expHeaderRow },
              React.createElement(Text, { style: styles.expTitle }, exp.title),
              React.createElement(Text, { style: styles.expPeriod }, exp.period || '')
            ),
            React.createElement(Text, { style: styles.expCompany },
              `${exp.company}, ${(exp as any).location || 'City'}`
            ),
            ...(exp.bullets || []).map((bullet, bIdx) =>
              React.createElement(View, { key: bIdx, style: styles.bulletRow },
                React.createElement(Text, { style: styles.bulletChar }, '•'),
                React.createElement(Text, { style: styles.bulletText }, bullet)
              )
            )
          )
        ),
        // Prior Experience (inline, after detailed experience items)
        (data as any).priorExperience && React.createElement(View, { style: { marginTop: 4 } },
          React.createElement(Text, { style: styles.bodyText },
            React.createElement(Text, { style: { fontWeight: 'bold' } }, 'Prior Experience: '),
            (data as any).priorExperience
          )
        )
      ),

      // EDUCATION Section
      data.education && data.education.length > 0 && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionHeading }, 'EDUCATION'),
        React.createElement(View, { style: styles.sectionUnderline }),
        ...data.education.map((edu, idx) =>
          React.createElement(View, { key: idx, style: { marginBottom: 8 } },
            // Institution row: "Institution, Location" (bold) with year on right
            React.createElement(View, { style: styles.expHeaderRow },
              React.createElement(Text, { style: styles.expTitle },
                `${edu.institution}${(edu as any).location ? `, ${(edu as any).location}` : ''}`
              ),
              React.createElement(Text, { style: styles.expPeriod }, edu.period || '')
            ),
            // Degree in italic
            React.createElement(Text, { style: styles.expCompany }, edu.degree),
            // Honors if present
            (edu as any).honors && React.createElement(Text, { style: styles.bodyText }, (edu as any).honors)
          )
        ),
        // Executive Education if present
        (data as any).executiveEducation && React.createElement(View, { style: { marginTop: 8 } },
          React.createElement(Text, { style: styles.bodyText },
            React.createElement(Text, { style: { fontWeight: 'bold' } }, 'Executive Education: '),
            (data as any).executiveEducation
          )
        )
      ),

      // ADDITIONAL INFORMATION Section
      (data as any).additionalInfo && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionHeading }, 'ADDITIONAL INFORMATION'),
        React.createElement(View, { style: styles.sectionUnderline }),
        // Certifications
        (data as any).additionalInfo.certifications && React.createElement(View, { style: { marginBottom: 6 } },
          React.createElement(Text, { style: styles.bodyText },
            React.createElement(Text, { style: { fontWeight: 'bold' } }, 'Certifications: '),
            (data as any).additionalInfo.certifications
          )
        ),
        // Board Positions
        (data as any).additionalInfo.boardPositions && React.createElement(View, { style: { marginBottom: 6 } },
          React.createElement(Text, { style: styles.bodyText },
            React.createElement(Text, { style: { fontWeight: 'bold' } }, 'Board Positions: '),
            (data as any).additionalInfo.boardPositions
          )
        ),
        // Speaking
        (data as any).additionalInfo.speaking && React.createElement(View, { style: { marginBottom: 6 } },
          React.createElement(Text, { style: styles.bodyText },
            React.createElement(Text, { style: { fontWeight: 'bold' } }, 'Speaking: '),
            (data as any).additionalInfo.speaking
          )
        ),
        // Languages
        (data as any).additionalInfo.languages && React.createElement(View, { style: { marginBottom: 6 } },
          React.createElement(Text, { style: styles.bodyText },
            React.createElement(Text, { style: { fontWeight: 'bold' } }, 'Languages: '),
            (data as any).additionalInfo.languages
          )
        ),
        // Technical
        (data as any).additionalInfo.technical && React.createElement(View, { style: { marginBottom: 6 } },
          React.createElement(Text, { style: styles.bodyText },
            React.createElement(Text, { style: { fontWeight: 'bold' } }, 'Technical: '),
            (data as any).additionalInfo.technical
          )
        )
      )
    )
  );
}

// ============================================================================
// MODERN TEMPLATE - Sans-serif with underlined titles and solid bullets
// Based on golden reference
// ============================================================================

function createModernPDF(data: ResumeData): React.ReactElement {
  // Colors matching golden reference
  const COLORS = {
    black: '#000000',      // Pure black for name and headings
    darkGray: '#333333',   // Body text
    mediumGray: '#666666', // Secondary text (dates, company)
    dividerGray: '#CCCCCC', // Light gray for divider lines
  };

  // Spacing from golden reference - MORE space throughout
  const SPACING = {
    pageMargin: 50,              // Match golden margins
    betweenNameAndContact: 16,   // Double space after name
    afterContact: 20,            // Space before Summary section
    betweenSections: 16,         // Space between sections
    betweenHeadingAndContent: 12, // More space after section heading line
    betweenExperienceItems: 10,  // Space between jobs
    betweenEducationItems: 4,    // Space between education items
    betweenBulletPoints: 2,      // Space between bullets
    bulletIndent: 14,
    titleRowMarginBottom: 1,
    companyMarginBottom: 2,      // Space after company line
  };

  const styles = StyleSheet.create({
    page: {
      padding: 45,  // Slightly smaller margins to fit more content
      fontFamily: 'Times-Roman',  // Serif font to match golden
      fontSize: 10,
      color: COLORS.darkGray,
      lineHeight: 1.35,  // Tighter line height to match golden
    },
    // Header - no divider after contact
    headerSection: {
      textAlign: 'center',
      marginBottom: SPACING.afterContact,
    },
    name: {
      fontSize: 22,  // Larger name like golden
      fontWeight: 'bold',  // More weight on name
      color: COLORS.black,
      marginBottom: SPACING.betweenNameAndContact,
    },
    contactLine: {
      fontSize: 9,
      color: COLORS.mediumGray,
    },
    // Section container
    section: {
      marginBottom: SPACING.betweenSections,
    },
    // Section heading with solid line divider
    sectionHeadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.betweenHeadingAndContent,
    },
    sectionHeadingText: {
      fontSize: 16,
      fontWeight: 'bold',  // More weight on section titles
      color: COLORS.black,
      marginRight: 10,
      letterSpacing: 0.5,
    },
    sectionHeadingLine: {
      flex: 1,
      height: 0.75,
      backgroundColor: COLORS.dividerGray,
      alignSelf: 'center',  // Ensure line is vertically centered
    },
    // Summary
    summaryText: {
      fontSize: 10,
      color: COLORS.darkGray,
      lineHeight: 1.4,
      textAlign: 'justify',  // Justified like golden
    },
    // Experience item
    experienceItem: {
      marginBottom: SPACING.betweenExperienceItems,
    },
    // Title row - title with date right-aligned, NO underline
    titleRowContainer: {
      marginBottom: SPACING.titleRowMarginBottom,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    titleText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: COLORS.black,
    },
    dateText: {
      fontSize: 10,
      color: COLORS.mediumGray,
    },
    // Company line
    companyLine: {
      fontSize: 10,
      fontStyle: 'italic',
      color: COLORS.black,  // Black like golden
      marginBottom: SPACING.companyMarginBottom,
    },
    // Bullets
    bulletRow: {
      flexDirection: 'row',
      marginBottom: SPACING.betweenBulletPoints,
      paddingLeft: SPACING.bulletIndent,
    },
    bulletChar: {
      width: 14,
      fontSize: 8,
      color: COLORS.darkGray,
    },
    bulletText: {
      flex: 1,
      fontSize: 9,
      color: COLORS.darkGray,
      lineHeight: 1.3,
    },
    // Education item
    educationItem: {
      marginBottom: SPACING.betweenEducationItems,
    },
    // Education degree row - degree with year, NO underline
    educationDegreeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    degreeText: {
      fontSize: 11,
      fontWeight: 'bold',
      color: COLORS.black,
    },
    yearText: {
      fontSize: 10,
      color: COLORS.mediumGray,
    },
    // Institution line - separate line below degree
    institutionLine: {
      fontSize: 10,
      fontStyle: 'italic',
      color: COLORS.black,  // Black like golden
    },
    // Additional section
    additionalRow: {
      flexDirection: 'row',
      marginBottom: 2,
    },
    additionalLabel: {
      fontSize: 10,
      fontWeight: 'bold',
      color: COLORS.darkGray,
    },
    additionalValue: {
      flex: 1,
      fontSize: 10,
      color: COLORS.darkGray,
    },
  });

  const contactParts = [data.phone, data.email, data.location].filter(Boolean);

  // Helper to create section heading with solid line divider
  const createSectionHeading = (title: string) =>
    React.createElement(View, { style: styles.sectionHeadingRow },
      React.createElement(Text, { style: styles.sectionHeadingText }, title),
      React.createElement(View, { style: styles.sectionHeadingLine })
    );

  // Helper to create title row - title and date with underline, no line between
  const createTitleRow = (title: string, date: string) =>
    React.createElement(View, { style: styles.titleRowContainer },
      React.createElement(View, { style: styles.titleRow },
        React.createElement(Text, { style: styles.titleText }, title),
        React.createElement(Text, { style: styles.dateText }, date)
      )
    );

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      // Header - NO divider after contact
      React.createElement(View, { style: styles.headerSection },
        React.createElement(Text, { style: styles.name }, data.name),
        React.createElement(Text, { style: styles.contactLine }, contactParts.join(' · '))
      ),

      // Summary Section
      data.summary && React.createElement(View, { style: styles.section },
        createSectionHeading('Summary'),
        React.createElement(Text, { style: styles.summaryText }, data.summary)
      ),

      // Experience Section
      data.experience && data.experience.length > 0 && React.createElement(View, { style: styles.section },
        createSectionHeading('Experience'),
        ...data.experience.map((exp, idx) =>
          React.createElement(View, { key: idx, style: styles.experienceItem },
            createTitleRow(exp.title, exp.period || ''),
            React.createElement(Text, { style: styles.companyLine },
              `${exp.company}${(exp as any).location ? ` – ${(exp as any).location}` : ''}`
            ),
            ...(exp.bullets || []).map((bullet, bIdx) =>
              React.createElement(View, { key: bIdx, style: styles.bulletRow },
                React.createElement(Text, { style: styles.bulletChar }, '•'),
                React.createElement(Text, { style: styles.bulletText }, bullet)
              )
            )
          )
        )
      ),

      // Education Section
      data.education && data.education.length > 0 && React.createElement(View, { style: styles.section },
        createSectionHeading('Education'),
        ...data.education.map((edu, idx) =>
          React.createElement(View, { key: idx, style: styles.educationItem },
            // Degree and institution on same line, year on right
            React.createElement(View, { style: styles.educationDegreeRow },
              React.createElement(Text, { style: styles.degreeText },
                edu.degree,
                React.createElement(Text, { style: { fontWeight: 'normal', fontStyle: 'italic' } },
                  `, ${edu.institution}`
                )
              ),
              React.createElement(Text, { style: styles.yearText }, edu.period || '')
            )
          )
        )
      ),

      // Additional Section
      React.createElement(View, { style: styles.section },
        createSectionHeading('Additional'),
        // Board Roles
        (data as any).boardRoles && (data as any).boardRoles.length > 0 && React.createElement(View, { style: styles.additionalRow },
          React.createElement(Text, { style: styles.additionalLabel }, 'Board Roles: '),
          React.createElement(Text, { style: styles.additionalValue }, (data as any).boardRoles.join(' · '))
        ),
        // Certifications
        data.certifications && data.certifications.length > 0 && React.createElement(View, { style: styles.additionalRow },
          React.createElement(Text, { style: styles.additionalLabel }, 'Certifications: '),
          React.createElement(Text, { style: styles.additionalValue }, data.certifications.join(' · '))
        ),
        // Speaking
        (data as any).speaking && (data as any).speaking.length > 0 && React.createElement(View, { style: styles.additionalRow },
          React.createElement(Text, { style: styles.additionalLabel }, 'Speaking: '),
          React.createElement(Text, { style: styles.additionalValue }, (data as any).speaking.join(' · '))
        ),
        // Languages
        data.languages && data.languages.length > 0 && React.createElement(View, { style: styles.additionalRow },
          React.createElement(Text, { style: styles.additionalLabel }, 'Languages: '),
          React.createElement(Text, { style: styles.additionalValue }, data.languages.join(' · '))
        )
      )
    )
  );
}

// ============================================================================
// EXECUTIVE TEMPLATE
// ============================================================================

function createExecutivePDF(data: ResumeData): React.ReactElement {
  // Colors from JSON spec
  const COLORS = {
    navy: '#003366',      // Name, section headings, dividers
    black: '#000000',     // Body text, job titles, bullets, company line
    darkGray: '#444444',  // Contact info, dates
  };

  // Spacing - tighter values to match golden reference density
  const SPACING = {
    pageMargin: 40,
    afterName: 2,         // Reduced from 4
    afterTitle: 2,        // Reduced from 4
    afterContact: 8,      // Reduced from 12
    headerDividerMargin: 8, // Reduced from 12
    sectionMarginTop: 10,   // Reduced from 14
    sectionUnderlineMarginBottom: 5, // Reduced from 8
    betweenSections: 10,    // Reduced from 14
    betweenJobEntries: 8,   // Reduced from 10
    afterJobTitle: 1,       // Reduced from 2
    afterCompanyLine: 2,    // Reduced from 4
    betweenBullets: 1,      // Reduced from 2
    bulletIndent: 12,       // Reduced from 14
  };

  const styles = StyleSheet.create({
    page: {
      padding: SPACING.pageMargin,
      fontFamily: 'Times-Roman',
      fontSize: 10,
      color: COLORS.black,
      lineHeight: 1.25,  // Tighter line height
    },
    // Header styles
    header: {
      textAlign: 'center',
      marginBottom: SPACING.afterContact,
    },
    name: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.navy,  // Navy per spec
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,  // Larger gap between name and contact info
    },
    title: {
      fontSize: 10,        // Reduced from 12
      color: COLORS.darkGray,
      textTransform: 'uppercase',
      marginBottom: SPACING.afterTitle,
    },
    contact: {
      fontSize: 9,
      color: COLORS.darkGray,
    },
    // Header divider - thick navy line
    headerDivider: {
      height: 2.5,
      backgroundColor: COLORS.navy,
      marginTop: SPACING.headerDividerMargin,
      marginBottom: SPACING.headerDividerMargin,
    },
    // Section styles
    section: {
      marginBottom: SPACING.betweenSections,
    },
    sectionHeading: {
      fontSize: 11,
      fontWeight: 'bold',
      color: COLORS.navy,  // Navy per spec
      textTransform: 'uppercase',
      borderBottomWidth: 2,
      borderBottomColor: COLORS.navy,
      paddingBottom: 1,  // Reduced from 3 - divider closer to title
      marginBottom: SPACING.sectionUnderlineMarginBottom,
    },
    // Summary text - justified
    summaryText: {
      fontSize: 9,
      color: COLORS.black,
      lineHeight: 1.3,  // Tighter from 1.4
      textAlign: 'justify',
    },
    // Core competencies - left aligned
    coreCompetencies: {
      fontSize: 9,
      color: COLORS.black,
      textAlign: 'left',
    },
    // Experience styles
    experienceItem: {
      marginBottom: SPACING.betweenJobEntries,
    },
    jobTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      color: COLORS.black,
      marginBottom: SPACING.afterJobTitle,
    },
    // Company | Location | Date on same line, BLACK color, BOLD
    companyLine: {
      fontSize: 9,
      fontWeight: 'bold',
      color: COLORS.black,  // Black per spec, not gray
      marginBottom: SPACING.afterCompanyLine,
    },
    // Bullet styles
    bulletRow: {
      flexDirection: 'row',
      marginBottom: SPACING.betweenBullets,
    },
    bulletChar: {
      width: SPACING.bulletIndent,
      fontSize: 9,
      color: COLORS.black,
    },
    bulletText: {
      flex: 1,
      fontSize: 9,
      color: COLORS.black,
      lineHeight: 1.25,  // Tighter from 1.35
    },
    // Education styles
    educationItem: {
      marginBottom: 6,
    },
    degreeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: COLORS.black,
    },
    institutionText: {
      fontSize: 9,
      color: COLORS.black,  // Black, not italic per spec
    },
    // Skills category label:value format
    skillsRow: {
      marginBottom: 2,
    },
    skillsLabel: {
      fontSize: 9,
      fontWeight: 'bold',
      color: COLORS.black,
    },
    skillsValue: {
      fontSize: 9,
      color: COLORS.black,
    },
  });

  const contactParts = [data.phone, data.email, data.location].filter(Boolean);
  const extData = data as any; // Extended data with extra fields

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      // ==================== HEADER ====================
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.name }, data.name.toUpperCase()),
        // Title removed per user request
        React.createElement(Text, { style: styles.contact }, contactParts.join(' | '))
      ),
      // Header divider removed per user request

      // ==================== PROFESSIONAL SUMMARY ====================
      data.summary && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionHeading }, 'PROFESSIONAL SUMMARY'),
        React.createElement(Text, { style: styles.summaryText }, data.summary)
      ),

      // ==================== CORE COMPETENCIES ====================
      data.skills && data.skills.length > 0 && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionHeading }, 'CORE COMPETENCIES'),
        React.createElement(Text, { style: styles.coreCompetencies }, data.skills.join(' | '))
      ),

      // ==================== PROFESSIONAL EXPERIENCE ====================
      data.experience && data.experience.length > 0 && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionHeading }, 'PROFESSIONAL EXPERIENCE'),
        ...data.experience.map((exp, idx) =>
          React.createElement(View, { key: idx, style: styles.experienceItem },
            // Job title on its own line
            React.createElement(Text, { style: styles.jobTitle }, exp.title),
            // Company | Location | Date on same line
            React.createElement(Text, { style: styles.companyLine },
              [exp.company, (exp as any).location, exp.period].filter(Boolean).join(' | ')
            ),
            // Bullets
            ...(exp.bullets || []).map((bullet, bIdx) =>
              React.createElement(View, { key: bIdx, style: styles.bulletRow },
                React.createElement(Text, { style: styles.bulletChar }, '•'),
                React.createElement(Text, { style: styles.bulletText }, bullet)
              )
            )
          )
        )
      ),

      // ==================== KEY PROJECT ACHIEVEMENTS ====================
      extData.keyProjectAchievements && extData.keyProjectAchievements.length > 0 && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionHeading }, 'KEY PROJECT ACHIEVEMENTS'),
        ...extData.keyProjectAchievements.map((achievement: string, idx: number) =>
          React.createElement(View, { key: idx, style: styles.bulletRow },
            React.createElement(Text, { style: styles.bulletChar }, '•'),
            React.createElement(Text, { style: styles.bulletText }, achievement)
          )
        )
      ),

      // ==================== EDUCATION ====================
      data.education && data.education.length > 0 && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionHeading }, 'EDUCATION'),
        ...data.education.map((edu, idx) =>
          React.createElement(View, { key: idx, style: styles.educationItem },
            React.createElement(Text, { style: styles.degreeText }, edu.degree),
            React.createElement(Text, { style: styles.institutionText },
              [edu.institution, edu.period].filter(Boolean).join(', ')
            )
          )
        )
      ),

      // ==================== PROFESSIONAL CERTIFICATIONS ====================
      data.certifications && data.certifications.length > 0 && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionHeading }, 'PROFESSIONAL CERTIFICATIONS'),
        ...data.certifications.map((cert, idx) =>
          React.createElement(View, { key: idx, style: styles.bulletRow },
            React.createElement(Text, { style: styles.bulletChar }, '•'),
            React.createElement(Text, { style: styles.bulletText }, cert)
          )
        )
      ),

      // ==================== PROFESSIONAL AFFILIATIONS ====================
      extData.affiliations && extData.affiliations.length > 0 && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionHeading }, 'PROFESSIONAL AFFILIATIONS'),
        ...extData.affiliations.map((affiliation: string, idx: number) =>
          React.createElement(View, { key: idx, style: styles.bulletRow },
            React.createElement(Text, { style: styles.bulletChar }, '•'),
            React.createElement(Text, { style: styles.bulletText }, affiliation)
          )
        )
      ),

      // ==================== LANGUAGES & TECHNICAL SKILLS ====================
      (extData.languages || extData.technicalSkills) && React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionHeading }, 'LANGUAGES & TECHNICAL SKILLS'),
        // Languages
        extData.languages && React.createElement(View, { style: styles.skillsRow },
          React.createElement(Text, { style: styles.skillsLabel }, 'Languages: ',
            React.createElement(Text, { style: styles.skillsValue },
              typeof extData.languages === 'string' ? extData.languages : extData.languages.join(' | ')
            )
          )
        ),
        // Project Software
        extData.technicalSkills?.projectSoftware && React.createElement(View, { style: styles.skillsRow },
          React.createElement(Text, { style: styles.skillsLabel }, 'Project Software: ',
            React.createElement(Text, { style: styles.skillsValue }, extData.technicalSkills.projectSoftware)
          )
        ),
        // Technical
        extData.technicalSkills?.technical && React.createElement(View, { style: styles.skillsRow },
          React.createElement(Text, { style: styles.skillsLabel }, 'Technical: ',
            React.createElement(Text, { style: styles.skillsValue }, extData.technicalSkills.technical)
          )
        ),
        // Standards
        extData.technicalSkills?.standards && React.createElement(View, { style: styles.skillsRow },
          React.createElement(Text, { style: styles.skillsLabel }, 'Standards: ',
            React.createElement(Text, { style: styles.skillsValue }, extData.technicalSkills.standards)
          )
        )
      )
    )
  );
}

// ============================================================================
// CREATE PDF ROUTER
// ============================================================================

function createNodePDF(data: ResumeData, templateId: typeof templates[number]): React.ReactElement {
  switch (templateId) {
    case 'classic':
      return createClassicPDF(data);
    case 'modern':
      return createModernPDF(data);
    case 'executive':
      return createExecutivePDF(data);
    default:
      return createClassicPDF(data);
  }
}

// ============================================================================
// HTML GENERATORS
// ============================================================================

/**
 * Generate HTML for Classic template - Single column with underlined headings
 * Matches the PDF structure: all black colors, full-width section underlines
 */
function generateClassicHTML(data: ResumeData): string {
  const BLACK = '#000000';
  const contactParts = [data.phone, data.email, data.location].filter(Boolean);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.name} - Classic Template</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: ${BLACK};
      line-height: 1.35;
      background: white;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 54px;
      margin: 0 auto;
      background: white;
    }
    /* Header - centered name and contact */
    .header {
      text-align: center;
      margin-bottom: 4px;
    }
    .name {
      font-size: 18pt;
      font-weight: bold;
      color: ${BLACK};
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
    }
    .contact {
      font-size: 10pt;
      color: ${BLACK};
    }
    /* Section with heading and underline */
    .section {
      margin-top: 12px;
    }
    .section-heading {
      font-size: 11pt;
      font-weight: bold;
      color: ${BLACK};
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .section-underline {
      height: 1px;
      background-color: ${BLACK};
      margin-bottom: 6px;
    }
    /* Body text */
    .body-text {
      font-size: 10pt;
      color: ${BLACK};
      line-height: 1.35;
    }
    /* Experience items */
    .experience-item {
      margin-bottom: 10px;
    }
    .exp-header {
      display: flex;
      justify-content: space-between;
    }
    .exp-title {
      font-size: 10pt;
      font-weight: bold;
      color: ${BLACK};
    }
    .exp-period {
      font-size: 10pt;
      color: ${BLACK};
    }
    .exp-company {
      font-size: 10pt;
      color: ${BLACK};
      font-style: italic;
      margin-bottom: 2px;
    }
    /* Bullet points */
    .bullet {
      display: flex;
      margin-bottom: 2px;
    }
    .bullet-char {
      width: 12px;
      flex-shrink: 0;
      font-size: 10pt;
    }
    .bullet-text {
      flex: 1;
      font-size: 10pt;
      line-height: 1.35;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="name">${data.name.toUpperCase()}</div>
      <div class="contact">${contactParts.join(' • ')}</div>
    </div>

    <!-- SUMMARY Section -->
    ${data.summary ? `
    <div class="section">
      <div class="section-heading">SUMMARY</div>
      <div class="section-underline"></div>
      <div class="body-text">${data.summary}</div>
    </div>
    ` : ''}

    <!-- EXPERIENCE Section -->
    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
      <div class="section-heading">EXPERIENCE</div>
      <div class="section-underline"></div>
      ${data.experience.map(exp => `
        <div class="experience-item">
          <div class="exp-header">
            <span class="exp-title">${exp.title}</span>
            <span class="exp-period">${exp.period || ''}</span>
          </div>
          <div class="exp-company">${exp.company}, ${(exp as any).location || 'City'}</div>
          ${(exp.bullets || []).map(bullet => `
            <div class="bullet">
              <span class="bullet-char">•</span>
              <span class="bullet-text">${bullet}</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
      ${(data as any).priorExperience ? `
        <div class="body-text" style="margin-top: 4px;"><strong>Prior Experience:</strong> ${(data as any).priorExperience}</div>
      ` : ''}
    </div>
    ` : ''}

    <!-- EDUCATION Section -->
    ${data.education && data.education.length > 0 ? `
    <div class="section">
      <div class="section-heading">EDUCATION</div>
      <div class="section-underline"></div>
      ${data.education.map(edu => `
        <div class="education-item" style="margin-bottom: 8px;">
          <div class="exp-header">
            <span class="exp-title">${edu.institution}${(edu as any).location ? `, ${(edu as any).location}` : ''}</span>
            <span class="exp-period">${edu.period || ''}</span>
          </div>
          <div class="exp-company">${edu.degree}</div>
          ${(edu as any).honors ? `<div class="body-text">${(edu as any).honors}</div>` : ''}
        </div>
      `).join('')}
      ${(data as any).executiveEducation ? `
        <div class="body-text" style="margin-top: 8px;"><strong>Executive Education:</strong> ${(data as any).executiveEducation}</div>
      ` : ''}
    </div>
    ` : ''}

    <!-- ADDITIONAL INFORMATION Section -->
    ${(data as any).additionalInfo ? `
    <div class="section">
      <div class="section-heading">ADDITIONAL INFORMATION</div>
      <div class="section-underline"></div>
      ${(data as any).additionalInfo.certifications ? `<div class="body-text" style="margin-bottom: 6px;"><strong>Certifications:</strong> ${(data as any).additionalInfo.certifications}</div>` : ''}
      ${(data as any).additionalInfo.boardPositions ? `<div class="body-text" style="margin-bottom: 6px;"><strong>Board Positions:</strong> ${(data as any).additionalInfo.boardPositions}</div>` : ''}
      ${(data as any).additionalInfo.speaking ? `<div class="body-text" style="margin-bottom: 6px;"><strong>Speaking:</strong> ${(data as any).additionalInfo.speaking}</div>` : ''}
      ${(data as any).additionalInfo.languages ? `<div class="body-text" style="margin-bottom: 6px;"><strong>Languages:</strong> ${(data as any).additionalInfo.languages}</div>` : ''}
      ${(data as any).additionalInfo.technical ? `<div class="body-text" style="margin-bottom: 6px;"><strong>Technical:</strong> ${(data as any).additionalInfo.technical}</div>` : ''}
    </div>
    ` : ''}
  </div>
</body>
</html>`;
}

/**
 * Generate HTML for Modern template - Sans-serif with underlined titles and solid bullets
 * Based on golden reference
 */
function generateModernHTML(data: ResumeData): string {
  // Colors matching golden reference
  const COLORS = {
    black: '#000000',      // Pure black for name and headings
    darkGray: '#333333',   // Body text
    mediumGray: '#666666', // Secondary text (dates, company)
    dividerGray: '#CCCCCC', // Light gray for divider lines
  };

  const contactParts = [data.phone, data.email, data.location].filter(Boolean);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.name} - Modern Template</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4; margin: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: ${COLORS.darkGray};
      line-height: 1.4;
      background: white;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 50px;
      margin: 0 auto;
      background: white;
    }
    /* Header - no divider after contact */
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .name {
      font-size: 22pt;
      font-weight: bold;
      color: ${COLORS.black};
      margin-bottom: 4px;
    }
    .contact {
      font-size: 9pt;
      color: ${COLORS.mediumGray};
    }
    /* Section */
    .section {
      margin-bottom: 20px;
    }
    /* Section heading with solid line divider */
    .section-heading {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    .section-heading-text {
      font-size: 16pt;
      font-weight: normal;
      color: ${COLORS.black};
      white-space: nowrap;
      margin-right: 10px;
      letter-spacing: 0.5px;
    }
    .section-heading-line {
      flex: 1;
      height: 0.5px;
      background: ${COLORS.dividerGray};
    }
    /* Summary */
    .summary-text {
      font-size: 10pt;
      color: ${COLORS.darkGray};
      line-height: 1.4;
      text-align: justify;
    }
    /* Experience item */
    .exp-item {
      margin-bottom: 14px;
    }
    /* Title row - no underline */
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2px;
    }
    .title-text {
      font-size: 11pt;
      font-weight: bold;
      color: ${COLORS.black};
    }
    .date-text {
      font-size: 10pt;
      color: ${COLORS.mediumGray};
    }
    /* Company line */
    .company-line {
      font-size: 10pt;
      font-style: italic;
      color: ${COLORS.mediumGray};
      margin-bottom: 4px;
    }
    /* Bullets */
    .bullet {
      display: flex;
      margin-bottom: 3px;
      padding-left: 14px;
    }
    .bullet-char {
      width: 14px;
      flex-shrink: 0;
      font-size: 8pt;
      color: ${COLORS.darkGray};
    }
    .bullet-text {
      flex: 1;
      font-size: 10pt;
      color: ${COLORS.darkGray};
      line-height: 1.35;
    }
    /* Education item */
    .edu-item {
      margin-bottom: 6px;
    }
    /* Education degree row - no underline */
    .edu-degree-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .degree-text {
      font-size: 11pt;
      font-weight: bold;
      color: ${COLORS.black};
    }
    .year-text {
      font-size: 10pt;
      color: ${COLORS.mediumGray};
    }
    /* Institution line - separate line below degree */
    .institution-line {
      font-size: 10pt;
      font-style: italic;
      color: ${COLORS.mediumGray};
    }
    /* Additional section */
    .additional-row {
      margin-bottom: 2px;
    }
    .additional-label {
      font-size: 10pt;
      font-weight: bold;
      color: ${COLORS.darkGray};
    }
    .additional-value {
      font-size: 10pt;
      color: ${COLORS.darkGray};
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header - NO divider after contact -->
    <div class="header">
      <div class="name">${data.name}</div>
      <div class="contact">${contactParts.join(' · ')}</div>
    </div>

    <!-- Summary Section -->
    ${data.summary ? `
    <div class="section">
      <div class="section-heading">
        <span class="section-heading-text">Summary</span>
        <div class="section-heading-line"></div>
      </div>
      <div class="summary-text">${data.summary}</div>
    </div>
    ` : ''}

    <!-- Experience Section -->
    ${data.experience?.length ? `
    <div class="section">
      <div class="section-heading">
        <span class="section-heading-text">Experience</span>
        <div class="section-heading-line"></div>
      </div>
      ${data.experience.map(exp => `
      <div class="exp-item">
        <div class="title-row">
          <span class="title-text">${exp.title}</span>
          <span class="date-text">${exp.period || ''}</span>
        </div>
        <div class="company-line">${exp.company}${(exp as any).location ? ` – ${(exp as any).location}` : ''}</div>
        ${(exp.bullets || []).map(b => `
        <div class="bullet">
          <span class="bullet-char">•</span>
          <span class="bullet-text">${b}</span>
        </div>
        `).join('')}
      </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Education Section -->
    ${data.education?.length ? `
    <div class="section">
      <div class="section-heading">
        <span class="section-heading-text">Education</span>
        <div class="section-heading-line"></div>
      </div>
      ${data.education.map(edu => `
      <div class="edu-item">
        <div class="edu-degree-row">
          <span class="degree-text">${edu.degree}</span>
          <span class="year-text">${edu.period || ''}</span>
        </div>
        <div class="institution-line">${edu.institution}</div>
      </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Additional Section -->
    <div class="section">
      <div class="section-heading">
        <span class="section-heading-text">Additional</span>
        <div class="section-heading-line"></div>
      </div>
      ${(data as any).boardRoles?.length ? `
      <div class="additional-row">
        <span class="additional-label">Board Roles: </span>
        <span class="additional-value">${(data as any).boardRoles.join(' · ')}</span>
      </div>
      ` : ''}
      ${data.certifications?.length ? `
      <div class="additional-row">
        <span class="additional-label">Certifications: </span>
        <span class="additional-value">${data.certifications.join(' · ')}</span>
      </div>
      ` : ''}
      ${(data as any).speaking?.length ? `
      <div class="additional-row">
        <span class="additional-label">Speaking: </span>
        <span class="additional-value">${(data as any).speaking.join(' · ')}</span>
      </div>
      ` : ''}
      ${data.languages?.length ? `
      <div class="additional-row">
        <span class="additional-label">Languages: </span>
        <span class="additional-value">${data.languages.join(' · ')}</span>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate HTML for Executive template
 */
function generateExecutiveHTML(data: ResumeData): string {
  const NAVY = '#003366';
  const contactParts = [data.phone, data.email, data.location].filter(Boolean);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.name} - Executive Template</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #000;
      background: white;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 40px;
      margin: 0 auto;
      background: white;
    }
    .header { text-align: center; margin-bottom: 8px; }
    .name { font-size: 20pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: ${NAVY}; }
    .title { font-size: 12pt; color: #444; text-transform: uppercase; margin-top: 4px; }
    .contact { font-size: 9pt; color: #444; margin-top: 6px; }
    .divider { height: 2.5px; background: ${NAVY}; margin: 12px 0; }
    .section { margin-bottom: 14px; }
    .section-heading {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      color: ${NAVY};
      border-bottom: 2px solid ${NAVY};
      padding-bottom: 3px;
      margin-bottom: 8px;
    }
    .exp-item { margin-bottom: 8px; }
    .exp-title { font-size: 10pt; font-weight: bold; margin-bottom: 1px; }
    .exp-company-line { font-size: 9pt; color: #000; margin-bottom: 2px; }
    .exp-company-name { font-weight: bold; }
    .bullet { display: flex; margin-top: 2px; }
    .bullet-char { width: 12px; color: #000; }
    .bullet-text { flex: 1; font-size: 9pt; }
    .text { font-size: 9pt; line-height: 1.4; text-align: justify; }
    .core-competencies { font-size: 9pt; text-align: left; }
    .edu-item { margin-bottom: 6px; }
    .edu-degree { font-size: 10pt; font-weight: bold; }
    .edu-institution { font-size: 9pt; color: #000; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="name">${data.name.toUpperCase()}</div>
      <div class="contact">${contactParts.join(' | ')}</div>
    </div>
    ${data.summary ? `<div class="section"><div class="section-heading">PROFESSIONAL SUMMARY</div><div class="text">${data.summary}</div></div>` : ''}
    ${data.skills?.length ? `<div class="section"><div class="section-heading">CORE COMPETENCIES</div><div class="core-competencies">${data.skills.join(' | ')}</div></div>` : ''}
    ${data.experience?.length ? `<div class="section"><div class="section-heading">PROFESSIONAL EXPERIENCE</div>${data.experience.map(exp => `
      <div class="exp-item">
        <div class="exp-title">${exp.title}</div>
        <div class="exp-company-line"><span class="exp-company-name">${exp.company}</span>${(exp as any).location ? ` | ${(exp as any).location}` : ''}${exp.period ? ` | ${exp.period}` : ''}</div>
        ${(exp.bullets || []).map(b => `<div class="bullet"><span class="bullet-char">•</span><span class="bullet-text">${b}</span></div>`).join('')}
      </div>`).join('')}</div>` : ''}
    ${data.education?.length ? `<div class="section"><div class="section-heading">EDUCATION</div>${data.education.map(edu => `
      <div class="edu-item">
        <div class="edu-degree">${edu.degree}</div>
        <div class="edu-institution">${[edu.institution, edu.period].filter(Boolean).join(', ')}</div>
      </div>`).join('')}</div>` : ''}
  </div>
</body>
</html>`;
}

/**
 * Generate HTML for a template
 */
function generateStandaloneHTML(data: ResumeData, templateId: typeof templates[number]): string {
  switch (templateId) {
    case 'classic':
      return generateClassicHTML(data);
    case 'modern':
      return generateModernHTML(data);
    case 'executive':
      return generateExecutiveHTML(data);
    default:
      return generateClassicHTML(data);
  }
}

/**
 * Generate comparison HTML page
 */
function generateComparisonPage(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Template Comparison - Generated vs Golden</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    h1 { text-align: center; margin-bottom: 30px; color: #333; }
    h2 { color: #666; margin: 20px 0 10px; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
    .template-section { margin-bottom: 40px; }
    .comparison-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .comparison-item {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .comparison-item h3 {
      background: #333;
      color: white;
      padding: 10px 15px;
      font-size: 14px;
    }
    .comparison-item.html h3 { background: #2196F3; }
    .comparison-item.pdf h3 { background: #4CAF50; }
    .comparison-item.golden h3 { background: #FF9800; }
    .comparison-item img, .comparison-item iframe {
      width: 100%;
      height: 800px;
      border: none;
    }
    .comparison-item img {
      object-fit: contain;
      background: #eee;
    }
    .nav {
      position: fixed;
      top: 10px;
      right: 10px;
      background: white;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .nav a {
      display: block;
      padding: 5px 10px;
      color: #333;
      text-decoration: none;
    }
    .nav a:hover { background: #f0f0f0; }
  </style>
</head>
<body>
  <nav class="nav">
    <strong>Jump to:</strong>
    <a href="#classic">Classic</a>
    <a href="#modern">Modern</a>
    <a href="#executive">Executive</a>
  </nav>

  <h1>Template Visual Comparison</h1>
  <p style="text-align: center; color: #666; margin-bottom: 30px;">
    Compare generated HTML and PDF outputs against golden reference images
  </p>

  ${templates.map(template => `
  <div id="${template}" class="template-section">
    <h2>${template.charAt(0).toUpperCase() + template.slice(1)} Template</h2>
    <div class="comparison-row">
      <div class="comparison-item html">
        <h3>Generated HTML</h3>
        <iframe src="./${template}/generated.html"></iframe>
      </div>
      <div class="comparison-item pdf">
        <h3>Generated PDF (as image)</h3>
        <img src="./${template}/generated-page1.png" alt="Generated PDF page 1" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23999%22>PDF not generated yet</text></svg>'">
      </div>
      <div class="comparison-item golden">
        <h3>Golden Reference</h3>
        <img src="../golden/pdf/${template}/reference-page1.png" alt="Golden reference page 1">
      </div>
    </div>
  </div>
  `).join('')}

  <div style="text-align: center; padding: 40px; color: #999;">
    <p>Generated by generate-test-outputs.ts</p>
    <p>Run: <code>npx tsx __tests__/utils/generate-test-outputs.ts</code></p>
  </div>
</body>
</html>`;
}

async function main() {
  console.log('Generating test outputs for visual comparison...\n');

  // Ensure output directories exist
  ensureDir(OUTPUT_DIR);
  templates.forEach(t => ensureDir(path.join(OUTPUT_DIR, t)));

  // Generate HTML for each template
  console.log('Generating HTML files...');
  for (const template of templates) {
    const data = getFixtureForTemplate(template);
    const html = generateStandaloneHTML(data, template);
    const outputPath = path.join(OUTPUT_DIR, template, 'generated.html');
    fs.writeFileSync(outputPath, html);
    console.log(`  [HTML] ${template} -> ${outputPath}`);
  }

  // Generate PDFs for each template
  console.log('\nGenerating PDF files...');
  try {
    for (const template of templates) {
      try {
        const data = getFixtureForTemplate(template);
        const pdfDocument = createNodePDF(data, template);
        const pdfBuffer = await renderToBuffer(pdfDocument);
        const outputPath = path.join(OUTPUT_DIR, template, 'generated.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);
        console.log(`  [PDF] ${template} -> ${outputPath}`);

        // Convert PDF to images for comparison
        try {
          const { pdf: pdfToImg } = await import('pdf-to-img');
          const document = await pdfToImg(pdfBuffer, { scale: 2 });
          let pageNum = 1;
          for await (const page of document) {
            const imgPath = path.join(OUTPUT_DIR, template, `generated-page${pageNum}.png`);
            fs.writeFileSync(imgPath, page);
            console.log(`  [PNG] ${template} page ${pageNum} -> ${imgPath}`);
            pageNum++;
          }
        } catch (imgError) {
          console.log(`  [WARN] Could not convert PDF to images: ${imgError}`);
        }
      } catch (pdfError) {
        console.log(`  [ERROR] Failed to generate PDF for ${template}: ${pdfError}`);
      }
    }
  } catch (error) {
    console.log(`  [ERROR] PDF generation setup failed: ${error}`);
  }

  // Generate DOCX for each template
  console.log('\nGenerating DOCX files...');
  try {
    for (const template of templates) {
      try {
        const data = getFixtureForTemplate(template);
        const docxBuffer = await generateResumeAsWordBuffer(data, template);
        const outputPath = path.join(OUTPUT_DIR, template, 'generated.docx');
        fs.writeFileSync(outputPath, docxBuffer);
        console.log(`  [DOCX] ${template} -> ${outputPath}`);
      } catch (docxError) {
        console.log(`  [ERROR] Failed to generate DOCX for ${template}: ${docxError}`);
      }
    }
  } catch (error) {
    console.log(`  [ERROR] DOCX generation setup failed: ${error}`);
  }

  // Generate comparison page
  console.log('\nGenerating comparison page...');
  const comparisonHtml = generateComparisonPage();
  const comparisonPath = path.join(OUTPUT_DIR, 'comparison.html');
  fs.writeFileSync(comparisonPath, comparisonHtml);
  console.log(`  [HTML] comparison -> ${comparisonPath}`);

  console.log('\n✅ Done! Open the comparison page to view results:');
  console.log(`   file://${comparisonPath}`);
}

main().catch(console.error);
