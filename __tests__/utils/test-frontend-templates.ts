/**
 * Test Frontend Templates with Golden Data
 *
 * This script tests the actual frontend PDF and DOCX generation
 * using the same golden fixture data to ensure consistency.
 *
 * Usage: npx tsx __tests__/utils/test-frontend-templates.ts
 */

import fs from 'fs';
import path from 'path';

// Import the frontend PDF templates
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

// Import DOCX generator from frontend
import { generateResumeAsWordBuffer } from '../../lib/downloadResume';

// Import types
import type { ResumeData } from '../../lib/resumeDataTypes';

const FIXTURES_DIR = path.join(__dirname, '../fixtures/resume-data');
const OUTPUT_DIR = path.join(__dirname, '../output/frontend-test');

// Load golden fixtures
const classicResume: ResumeData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'classic-golden.json'), 'utf-8')
);
const modernResume: ResumeData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'modern-golden.json'), 'utf-8')
);
const executiveResume: ResumeData = JSON.parse(
  fs.readFileSync(path.join(FIXTURES_DIR, 'executive-golden.json'), 'utf-8')
);

// Ensure output directory exists
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============================================================================
// CLASSIC PDF TEMPLATE (copied from pdfTemplates.tsx for Node.js execution)
// ============================================================================

const classicStyles = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 54,
    paddingLeft: 54,
    paddingRight: 54,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: '#000000',
    lineHeight: 1.35,
  },
  headerSection: {
    textAlign: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  contactLine: {
    fontSize: 10,
    color: '#000000',
  },
  section: {
    marginTop: 12,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionUnderline: {
    height: 1,
    backgroundColor: '#000000',
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 10,
    color: '#000000',
    lineHeight: 1.35,
  },
  experienceItem: {
    marginBottom: 10,
  },
  expHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  expPeriod: {
    fontSize: 10,
    color: '#000000',
  },
  expCompany: {
    fontSize: 10,
    color: '#000000',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bulletChar: {
    width: 12,
    fontSize: 10,
    color: '#000000',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#000000',
    lineHeight: 1.35,
  },
});

function createClassicPDF(data: ResumeData): React.ReactElement {
  const contactParts = [data.phone, data.email, data.location].filter(Boolean);
  const extData = data as any;

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: classicStyles.page },
      // Header
      React.createElement(View, { style: classicStyles.headerSection },
        React.createElement(Text, { style: classicStyles.name }, (data.name || 'Your Name').toUpperCase()),
        React.createElement(Text, { style: classicStyles.contactLine }, contactParts.join(' • '))
      ),
      // Summary
      data.summary && React.createElement(View, { style: classicStyles.section },
        React.createElement(Text, { style: classicStyles.sectionHeading }, 'SUMMARY'),
        React.createElement(View, { style: classicStyles.sectionUnderline }),
        React.createElement(Text, { style: classicStyles.bodyText }, data.summary)
      ),
      // Experience
      data.experience && data.experience.length > 0 && React.createElement(View, { style: classicStyles.section },
        React.createElement(Text, { style: classicStyles.sectionHeading }, 'EXPERIENCE'),
        React.createElement(View, { style: classicStyles.sectionUnderline }),
        ...data.experience.map((exp, idx) =>
          React.createElement(View, { key: idx, style: classicStyles.experienceItem },
            React.createElement(View, { style: classicStyles.expHeaderRow },
              React.createElement(Text, { style: classicStyles.expTitle }, exp.title),
              React.createElement(Text, { style: classicStyles.expPeriod }, exp.period || '')
            ),
            React.createElement(Text, { style: classicStyles.expCompany },
              `${exp.company}${(exp as any).location ? `, ${(exp as any).location}` : ''}`
            ),
            ...(exp.bullets || []).map((bullet, bIdx) =>
              React.createElement(View, { key: bIdx, style: classicStyles.bulletRow },
                React.createElement(Text, { style: classicStyles.bulletChar }, '•'),
                React.createElement(Text, { style: classicStyles.bulletText }, bullet)
              )
            )
          )
        )
      ),
      // Education
      data.education && data.education.length > 0 && React.createElement(View, { style: classicStyles.section },
        React.createElement(Text, { style: classicStyles.sectionHeading }, 'EDUCATION'),
        React.createElement(View, { style: classicStyles.sectionUnderline }),
        ...data.education.map((edu, idx) =>
          React.createElement(View, { key: idx, style: { marginBottom: 8 } },
            React.createElement(View, { style: classicStyles.expHeaderRow },
              React.createElement(Text, { style: classicStyles.expTitle },
                `${edu.institution}${(edu as any).location ? `, ${(edu as any).location}` : ''}`
              ),
              React.createElement(Text, { style: classicStyles.expPeriod }, edu.period || '')
            ),
            React.createElement(Text, { style: classicStyles.expCompany }, edu.degree)
          )
        )
      ),
      // Skills
      data.skills && data.skills.length > 0 && React.createElement(View, { style: classicStyles.section },
        React.createElement(Text, { style: classicStyles.sectionHeading }, 'SKILLS'),
        React.createElement(View, { style: classicStyles.sectionUnderline }),
        React.createElement(Text, { style: classicStyles.bodyText }, data.skills.join(' • '))
      ),
      // Additional Info
      extData.additionalInfo && React.createElement(View, { style: classicStyles.section },
        React.createElement(Text, { style: classicStyles.sectionHeading }, 'ADDITIONAL INFORMATION'),
        React.createElement(View, { style: classicStyles.sectionUnderline }),
        extData.additionalInfo.certifications && React.createElement(View, { style: { marginBottom: 6 } },
          React.createElement(Text, { style: classicStyles.bodyText },
            React.createElement(Text, { style: { fontWeight: 'bold' } }, 'Certifications: '),
            extData.additionalInfo.certifications
          )
        ),
        extData.additionalInfo.boardPositions && React.createElement(View, { style: { marginBottom: 6 } },
          React.createElement(Text, { style: classicStyles.bodyText },
            React.createElement(Text, { style: { fontWeight: 'bold' } }, 'Board Positions: '),
            extData.additionalInfo.boardPositions
          )
        ),
        extData.additionalInfo.languages && React.createElement(View, { style: { marginBottom: 6 } },
          React.createElement(Text, { style: classicStyles.bodyText },
            React.createElement(Text, { style: { fontWeight: 'bold' } }, 'Languages: '),
            extData.additionalInfo.languages
          )
        )
      )
    )
  );
}

// ============================================================================
// MODERN PDF TEMPLATE
// ============================================================================

const modernStyles = StyleSheet.create({
  page: {
    padding: 45,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.35,
  },
  headerSection: {
    textAlign: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  contactLine: {
    fontSize: 9,
    color: '#666666',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginRight: 10,
    letterSpacing: 0.5,
  },
  sectionHeadingLine: {
    flex: 1,
    height: 0.75,
    backgroundColor: '#CCCCCC',
  },
  summaryText: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.4,
    textAlign: 'justify',
  },
  experienceItem: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 1,
  },
  titleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  dateText: {
    fontSize: 10,
    color: '#666666',
  },
  companyLine: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#000000',
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 14,
  },
  bulletChar: {
    width: 14,
    fontSize: 8,
    color: '#333333',
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: '#333333',
    lineHeight: 1.3,
  },
  educationItem: {
    marginBottom: 4,
  },
  degreeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  degreeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
  },
  yearText: {
    fontSize: 10,
    color: '#666666',
  },
  institutionLine: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#000000',
  },
  additionalRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  additionalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333333',
  },
  additionalValue: {
    flex: 1,
    fontSize: 10,
    color: '#333333',
  },
});

function createModernPDF(data: ResumeData): React.ReactElement {
  const contactParts = [data.phone, data.email, data.location].filter(Boolean);
  const extData = data as any;

  const createSectionHeading = (title: string) =>
    React.createElement(View, { style: modernStyles.sectionHeadingRow },
      React.createElement(Text, { style: modernStyles.sectionHeadingText }, title),
      React.createElement(View, { style: modernStyles.sectionHeadingLine })
    );

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: modernStyles.page },
      // Header
      React.createElement(View, { style: modernStyles.headerSection },
        React.createElement(Text, { style: modernStyles.name }, data.name || 'Your Name'),
        React.createElement(Text, { style: modernStyles.contactLine }, contactParts.join(' · '))
      ),
      // Summary
      data.summary && React.createElement(View, { style: modernStyles.section },
        createSectionHeading('Summary'),
        React.createElement(Text, { style: modernStyles.summaryText }, data.summary)
      ),
      // Experience
      data.experience && data.experience.length > 0 && React.createElement(View, { style: modernStyles.section },
        createSectionHeading('Experience'),
        ...data.experience.map((exp, idx) =>
          React.createElement(View, { key: idx, style: modernStyles.experienceItem },
            React.createElement(View, { style: modernStyles.titleRow },
              React.createElement(Text, { style: modernStyles.titleText }, exp.title),
              React.createElement(Text, { style: modernStyles.dateText }, exp.period || '')
            ),
            React.createElement(Text, { style: modernStyles.companyLine },
              `${exp.company}${(exp as any).location ? ` – ${(exp as any).location}` : ''}`
            ),
            ...(exp.bullets || []).map((bullet, bIdx) =>
              React.createElement(View, { key: bIdx, style: modernStyles.bulletRow },
                React.createElement(Text, { style: modernStyles.bulletChar }, '•'),
                React.createElement(Text, { style: modernStyles.bulletText }, bullet)
              )
            )
          )
        )
      ),
      // Education
      data.education && data.education.length > 0 && React.createElement(View, { style: modernStyles.section },
        createSectionHeading('Education'),
        ...data.education.map((edu, idx) =>
          React.createElement(View, { key: idx, style: modernStyles.educationItem },
            React.createElement(View, { style: modernStyles.degreeRow },
              React.createElement(Text, { style: modernStyles.degreeText }, edu.degree),
              React.createElement(Text, { style: modernStyles.yearText }, edu.period || '')
            ),
            React.createElement(Text, { style: modernStyles.institutionLine }, edu.institution)
          )
        )
      ),
      // Additional
      React.createElement(View, { style: modernStyles.section },
        createSectionHeading('Additional'),
        extData.boardRoles && extData.boardRoles.length > 0 && React.createElement(View, { style: modernStyles.additionalRow },
          React.createElement(Text, { style: modernStyles.additionalLabel }, 'Board Roles: '),
          React.createElement(Text, { style: modernStyles.additionalValue }, extData.boardRoles.join(' · '))
        ),
        data.certifications && data.certifications.length > 0 && React.createElement(View, { style: modernStyles.additionalRow },
          React.createElement(Text, { style: modernStyles.additionalLabel }, 'Certifications: '),
          React.createElement(Text, { style: modernStyles.additionalValue }, data.certifications.join(' · '))
        ),
        data.languages && data.languages.length > 0 && React.createElement(View, { style: modernStyles.additionalRow },
          React.createElement(Text, { style: modernStyles.additionalLabel }, 'Languages: '),
          React.createElement(Text, { style: modernStyles.additionalValue }, data.languages.join(' · '))
        )
      )
    )
  );
}

// ============================================================================
// EXECUTIVE PDF TEMPLATE
// ============================================================================

const EXEC_COLORS = {
  navy: '#003366',
  black: '#000000',
  darkGray: '#444444',
};

const executiveStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: EXEC_COLORS.black,
    lineHeight: 1.25,
  },
  header: {
    textAlign: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: EXEC_COLORS.navy,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  contact: {
    fontSize: 9,
    color: EXEC_COLORS.darkGray,
  },
  section: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    color: EXEC_COLORS.navy,
    textTransform: 'uppercase',
    borderBottomWidth: 2,
    borderBottomColor: EXEC_COLORS.navy,
    paddingBottom: 1,
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 9,
    color: EXEC_COLORS.black,
    lineHeight: 1.3,
    textAlign: 'justify',
  },
  coreCompetencies: {
    fontSize: 9,
    color: EXEC_COLORS.black,
    textAlign: 'left',
  },
  experienceItem: {
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: EXEC_COLORS.black,
    marginBottom: 1,
  },
  companyLine: {
    fontSize: 9,
    color: EXEC_COLORS.black,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  bulletChar: {
    width: 12,
    fontSize: 9,
    color: EXEC_COLORS.black,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: EXEC_COLORS.black,
    lineHeight: 1.25,
  },
  educationItem: {
    marginBottom: 6,
  },
  degreeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: EXEC_COLORS.black,
  },
  institutionText: {
    fontSize: 9,
    color: EXEC_COLORS.black,
  },
  skillsRow: {
    marginBottom: 2,
  },
  skillsLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: EXEC_COLORS.black,
  },
  skillsValue: {
    fontSize: 9,
    color: EXEC_COLORS.black,
    fontWeight: 'normal',
  },
});

function createExecutivePDF(data: ResumeData): React.ReactElement {
  const contactParts = [data.phone, data.email, data.location].filter(Boolean);
  const extData = data as any;

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: executiveStyles.page },
      // Header - NO title, NO divider
      React.createElement(View, { style: executiveStyles.header },
        React.createElement(Text, { style: executiveStyles.name }, (data.name || 'Your Name').toUpperCase()),
        React.createElement(Text, { style: executiveStyles.contact }, contactParts.join(' | '))
      ),
      // Professional Summary
      data.summary && React.createElement(View, { style: executiveStyles.section },
        React.createElement(Text, { style: executiveStyles.sectionHeading }, 'PROFESSIONAL SUMMARY'),
        React.createElement(Text, { style: executiveStyles.summaryText }, data.summary)
      ),
      // Core Competencies
      data.skills && data.skills.length > 0 && React.createElement(View, { style: executiveStyles.section },
        React.createElement(Text, { style: executiveStyles.sectionHeading }, 'CORE COMPETENCIES'),
        React.createElement(Text, { style: executiveStyles.coreCompetencies }, data.skills.join(' | '))
      ),
      // Professional Experience
      data.experience && data.experience.length > 0 && React.createElement(View, { style: executiveStyles.section },
        React.createElement(Text, { style: executiveStyles.sectionHeading }, 'PROFESSIONAL EXPERIENCE'),
        ...data.experience.map((exp, idx) =>
          React.createElement(View, { key: idx, style: executiveStyles.experienceItem },
            React.createElement(Text, { style: executiveStyles.jobTitle }, exp.title),
            React.createElement(Text, { style: executiveStyles.companyLine },
              React.createElement(Text, { style: { fontWeight: 'bold' } }, exp.company),
              (exp as any).location ? ` | ${(exp as any).location}` : '',
              exp.period ? ` | ${exp.period}` : ''
            ),
            ...(exp.bullets || []).map((bullet, bIdx) =>
              React.createElement(View, { key: bIdx, style: executiveStyles.bulletRow },
                React.createElement(Text, { style: executiveStyles.bulletChar }, '•'),
                React.createElement(Text, { style: executiveStyles.bulletText }, bullet)
              )
            )
          )
        )
      ),
      // Key Project Achievements
      extData.keyProjectAchievements && extData.keyProjectAchievements.length > 0 && React.createElement(View, { style: executiveStyles.section },
        React.createElement(Text, { style: executiveStyles.sectionHeading }, 'KEY PROJECT ACHIEVEMENTS'),
        ...extData.keyProjectAchievements.map((achievement: string, idx: number) =>
          React.createElement(View, { key: idx, style: executiveStyles.bulletRow },
            React.createElement(Text, { style: executiveStyles.bulletChar }, '•'),
            React.createElement(Text, { style: executiveStyles.bulletText }, achievement)
          )
        )
      ),
      // Education
      data.education && data.education.length > 0 && React.createElement(View, { style: executiveStyles.section },
        React.createElement(Text, { style: executiveStyles.sectionHeading }, 'EDUCATION'),
        ...data.education.map((edu, idx) =>
          React.createElement(View, { key: idx, style: executiveStyles.educationItem },
            React.createElement(Text, { style: executiveStyles.degreeText }, edu.degree),
            React.createElement(Text, { style: executiveStyles.institutionText },
              [edu.institution, edu.period].filter(Boolean).join(', ')
            )
          )
        )
      ),
      // Professional Certifications
      data.certifications && data.certifications.length > 0 && React.createElement(View, { style: executiveStyles.section },
        React.createElement(Text, { style: executiveStyles.sectionHeading }, 'PROFESSIONAL CERTIFICATIONS'),
        ...data.certifications.map((cert, idx) =>
          React.createElement(View, { key: idx, style: executiveStyles.bulletRow },
            React.createElement(Text, { style: executiveStyles.bulletChar }, '•'),
            React.createElement(Text, { style: executiveStyles.bulletText }, cert)
          )
        )
      ),
      // Professional Affiliations
      extData.affiliations && extData.affiliations.length > 0 && React.createElement(View, { style: executiveStyles.section },
        React.createElement(Text, { style: executiveStyles.sectionHeading }, 'PROFESSIONAL AFFILIATIONS'),
        ...extData.affiliations.map((affiliation: string, idx: number) =>
          React.createElement(View, { key: idx, style: executiveStyles.bulletRow },
            React.createElement(Text, { style: executiveStyles.bulletChar }, '•'),
            React.createElement(Text, { style: executiveStyles.bulletText }, affiliation)
          )
        )
      ),
      // Languages & Technical Skills
      (extData.languages || extData.technicalSkills) && React.createElement(View, { style: executiveStyles.section },
        React.createElement(Text, { style: executiveStyles.sectionHeading }, 'LANGUAGES & TECHNICAL SKILLS'),
        extData.languages && React.createElement(View, { style: executiveStyles.skillsRow },
          React.createElement(Text, { style: executiveStyles.skillsLabel }, 'Languages: ',
            React.createElement(Text, { style: executiveStyles.skillsValue },
              typeof extData.languages === 'string' ? extData.languages : extData.languages.join(' | ')
            )
          )
        ),
        extData.technicalSkills?.projectSoftware && React.createElement(View, { style: executiveStyles.skillsRow },
          React.createElement(Text, { style: executiveStyles.skillsLabel }, 'Project Software: ',
            React.createElement(Text, { style: executiveStyles.skillsValue }, extData.technicalSkills.projectSoftware)
          )
        ),
        extData.technicalSkills?.technical && React.createElement(View, { style: executiveStyles.skillsRow },
          React.createElement(Text, { style: executiveStyles.skillsLabel }, 'Technical: ',
            React.createElement(Text, { style: executiveStyles.skillsValue }, extData.technicalSkills.technical)
          )
        ),
        extData.technicalSkills?.standards && React.createElement(View, { style: executiveStyles.skillsRow },
          React.createElement(Text, { style: executiveStyles.skillsLabel }, 'Standards: ',
            React.createElement(Text, { style: executiveStyles.skillsValue }, extData.technicalSkills.standards)
          )
        )
      )
    )
  );
}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

async function runTests() {
  console.log('Testing Frontend Templates with Golden Data...\n');

  ensureDir(OUTPUT_DIR);
  ensureDir(path.join(OUTPUT_DIR, 'classic'));
  ensureDir(path.join(OUTPUT_DIR, 'modern'));
  ensureDir(path.join(OUTPUT_DIR, 'executive'));

  const templates = [
    { name: 'classic', data: classicResume, pdfFn: createClassicPDF },
    { name: 'modern', data: modernResume, pdfFn: createModernPDF },
    { name: 'executive', data: executiveResume, pdfFn: createExecutivePDF },
  ] as const;

  for (const template of templates) {
    console.log(`\n=== Testing ${template.name.toUpperCase()} Template ===`);

    // Generate PDF
    console.log(`  Generating PDF...`);
    try {
      const pdfDoc = template.pdfFn(template.data);
      const pdfBuffer = await renderToBuffer(pdfDoc as any);
      const pdfPath = path.join(OUTPUT_DIR, template.name, 'frontend-generated.pdf');
      fs.writeFileSync(pdfPath, pdfBuffer);
      console.log(`  ✓ PDF saved: ${pdfPath}`);
    } catch (error) {
      console.error(`  ✗ PDF generation failed:`, error);
    }

    // Generate DOCX
    console.log(`  Generating DOCX...`);
    try {
      const docxBuffer = await generateResumeAsWordBuffer(template.data, template.name);
      const docxPath = path.join(OUTPUT_DIR, template.name, 'frontend-generated.docx');
      fs.writeFileSync(docxPath, docxBuffer);
      console.log(`  ✓ DOCX saved: ${docxPath}`);
    } catch (error) {
      console.error(`  ✗ DOCX generation failed:`, error);
    }
  }

  console.log('\n✅ Frontend template test complete!');
  console.log(`\nOutputs saved to: ${OUTPUT_DIR}`);
  console.log('\nCompare these with the test outputs in __tests__/output/ to verify consistency.');
}

runTests().catch(console.error);
