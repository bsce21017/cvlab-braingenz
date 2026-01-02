/**
 * PDF Templates using @react-pdf/renderer
 * These templates generate real text-based PDFs (selectable, searchable, editable)
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { ResumeData } from './resumeDataTypes';

// Register fonts using runtime fetch (works with both webpack and Turbopack)
// This approach fetches fonts from public folder and registers them
const isBrowser = typeof window !== 'undefined';
const baseUrl = isBrowser ? window.location.origin : '';

// Font registration state
let fontsRegistered = false;
let fontRegistrationPromise: Promise<void> | null = null;

// Helper to fetch and register font with proper data URL format
async function registerFontFromUrl(family: string, url: string, fontWeight: number | 'normal' | 'bold'): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`);
    }
    const fontData = await response.arrayBuffer();
    
    // Convert ArrayBuffer to base64 data URL with proper format
    const bytes = new Uint8Array(fontData);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    // Use application/octet-stream instead of font/truetype for better compatibility
    const dataUrl = `data:application/octet-stream;base64,${base64}`;
    
    // Ensure dataUrl is a string before registering
    if (typeof dataUrl !== 'string') {
      throw new Error('Failed to convert font to data URL string');
    }
    
    Font.register({
      family,
      src: dataUrl,
      fontWeight: fontWeight as any,
    });
    
    console.log(`[PDF] Registered ${family} ${fontWeight} successfully`);
    return true;
  } catch (error) {
    console.error(`[PDF] Failed to register ${family} ${fontWeight}:`, error);
    return false;
  }
}

// Function to ensure fonts are registered before PDF generation
export async function ensureFontsRegistered(): Promise<void> {
  if (fontsRegistered) {
    return;
  }

  if (!isBrowser) {
    return;
  }

  if (fontRegistrationPromise) {
    return fontRegistrationPromise;
  }

  fontRegistrationPromise = (async () => {
    try {
      // Register Poppins as 'Inter' (similar font, static TTF files)
      const interResults = await Promise.all([
        registerFontFromUrl('Inter', `${baseUrl}/fonts/Poppins-Regular.ttf`, 'normal'),
        registerFontFromUrl('Inter', `${baseUrl}/fonts/Poppins-SemiBold.ttf`, 600),
        registerFontFromUrl('Inter', `${baseUrl}/fonts/Poppins-Bold.ttf`, 'bold'),
      ]);

      // Also register DM Sans
      const dmSansResults = await Promise.all([
        registerFontFromUrl('DM Sans', `${baseUrl}/fonts/DMSans-Regular.ttf`, 'normal'),
        registerFontFromUrl('DM Sans', `${baseUrl}/fonts/DMSans-SemiBold.ttf`, 600),
        registerFontFromUrl('DM Sans', `${baseUrl}/fonts/DMSans-Bold.ttf`, 'bold'),
      ]);

      if (interResults.every(r => r) && dmSansResults.every(r => r)) {
        fontsRegistered = true;
        console.log('[PDF] All fonts registered successfully');
      } else {
        console.warn('[PDF] Some fonts failed to register');
      }
    } catch (error) {
      console.error('[PDF] Error registering fonts:', error);
    }
  })();

  return fontRegistrationPromise;
}

// Pre-register fonts on module load (non-blocking)
if (isBrowser) {
  ensureFontsRegistered().catch(console.error);
}

// Use Inter font for all templates
const FONT_FAMILY = 'Inter';

// ============================================
// CLASSIC TEMPLATE
// ============================================
const classicStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#1f2937',
  },
  header: {
    textAlign: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: 700,
    color: '#004081',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    fontSize: 10,
    color: '#4b5563',
  },
  contactItem: {
    marginHorizontal: 4,
  },
  separator: {
    marginHorizontal: 4,
  },
  headerLine: {
    height: 3,
    backgroundColor: '#004081',
    marginBottom: 16,
  },
  sectionRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sectionLabelContainer: {
    width: 120,
    flexDirection: 'column',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#004081',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#004081',
    marginBottom: 12,
  },
  experienceItem: {
    marginBottom: 10,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  expTitle: {
    fontSize: 11,
    fontWeight: 700,
  },
  expPeriod: {
    fontSize: 11,
    fontWeight: 700,
  },
  bullet: {
    flexDirection: 'row',
    marginLeft: 12,
    marginTop: 2,
  },
  bulletPoint: {
    width: 8,
    fontSize: 11,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillItem: {
    width: '50%',
    flexDirection: 'row',
    marginBottom: 2,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
  },
});

export function ClassicPDFTemplate({ data }: { data: ResumeData }) {
  return (
    <Document>
      <Page size="A4" style={classicStyles.page}>
        {/* Header */}
        <View style={classicStyles.header}>
          <Text style={classicStyles.name}>{data.name || 'Your Name'}</Text>
          <View style={classicStyles.contactRow}>
            {data.email && <Text style={classicStyles.contactItem}>{data.email}</Text>}
            {data.email && data.phone && <Text style={classicStyles.separator}>|</Text>}
            {data.phone && <Text style={classicStyles.contactItem}>{data.phone}</Text>}
            {(data.email || data.phone) && data.location && <Text style={classicStyles.separator}>|</Text>}
            {data.location && <Text style={classicStyles.contactItem}>{data.location}</Text>}
          </View>
        </View>

        <View style={classicStyles.headerLine} />

        {/* Summary */}
        {data.summary && (
          <>
            <View style={classicStyles.sectionRow}>
              <View style={classicStyles.sectionLabelContainer}>
                <Text style={classicStyles.sectionLabel}>Summary</Text>
              </View>
              <Text style={[classicStyles.sectionContent, classicStyles.text]}>{data.summary}</Text>
            </View>
            <View style={classicStyles.divider} />
          </>
        )}

        {/* Work Experience */}
        {data.experience && data.experience.length > 0 && (
          <>
            <View style={classicStyles.sectionRow}>
              <View style={classicStyles.sectionLabelContainer}>
                <Text style={classicStyles.sectionLabel}>Work</Text>
                <Text style={classicStyles.sectionLabel}>Experience</Text>
              </View>
              <View style={classicStyles.sectionContent}>
                {data.experience.map((exp, idx) => (
                  <View key={idx} style={classicStyles.experienceItem}>
                    <View style={classicStyles.expHeader}>
                      <Text style={classicStyles.expTitle}>{exp.title}, {exp.company}</Text>
                      <Text style={classicStyles.expPeriod}>{exp.period}</Text>
                    </View>
                    {exp.bullets && exp.bullets.map((bullet, bIdx) => (
                      <View key={bIdx} style={classicStyles.bullet}>
                        <Text style={classicStyles.bulletPoint}>•</Text>
                        <Text style={classicStyles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
            <View style={classicStyles.divider} />
          </>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <>
            <View style={classicStyles.sectionRow}>
              <View style={classicStyles.sectionLabelContainer}>
                <Text style={classicStyles.sectionLabel}>Education</Text>
              </View>
              <View style={classicStyles.sectionContent}>
                {data.education.map((edu, idx) => (
                  <View key={idx} style={classicStyles.experienceItem}>
                    <View style={classicStyles.expHeader}>
                      <Text style={classicStyles.expTitle}>{edu.degree}</Text>
                      <Text style={classicStyles.expPeriod}>{edu.period}</Text>
                    </View>
                    <Text style={classicStyles.text}>{edu.institution}</Text>
                    {edu.details && edu.details.map((detail, dIdx) => (
                      <View key={dIdx} style={classicStyles.bullet}>
                        <Text style={classicStyles.bulletPoint}>•</Text>
                        <Text style={classicStyles.bulletText}>{detail}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
            <View style={classicStyles.divider} />
          </>
        )}

        {/* Key Skills */}
        {data.skills && data.skills.length > 0 && (
          <>
            <View style={classicStyles.sectionRow}>
              <View style={classicStyles.sectionLabelContainer}>
                <Text style={classicStyles.sectionLabel}>Key Skills</Text>
              </View>
              <View style={[classicStyles.sectionContent, classicStyles.skillsGrid]}>
                {data.skills.map((skill, idx) => (
                  <View key={idx} style={classicStyles.skillItem}>
                    <Text style={classicStyles.bulletPoint}>•</Text>
                    <Text style={classicStyles.text}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={classicStyles.divider} />
          </>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <>
            <View style={classicStyles.sectionRow}>
              <View style={classicStyles.sectionLabelContainer}>
                <Text style={classicStyles.sectionLabel}>Certifications</Text>
              </View>
              <View style={classicStyles.sectionContent}>
                {data.certifications.map((cert, idx) => (
                  <View key={idx} style={classicStyles.bullet}>
                    <Text style={classicStyles.bulletPoint}>•</Text>
                    <Text style={classicStyles.bulletText}>{cert}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={classicStyles.divider} />
          </>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <View style={classicStyles.sectionRow}>
            <View style={classicStyles.sectionLabelContainer}>
              <Text style={classicStyles.sectionLabel}>Languages</Text>
            </View>
            <Text style={[classicStyles.sectionContent, classicStyles.text]}>
              {data.languages.join(', ')}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

// ============================================
// MODERN TEMPLATE
// ============================================
const modernStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#1f2937',
  },
  header: {
    textAlign: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    fontSize: 10,
    color: '#4b5563',
  },
  contactItem: {
    marginHorizontal: 4,
  },
  separator: {
    marginHorizontal: 4,
  },
  headerLine: {
    height: 3,
    backgroundColor: '#111827',
    marginVertical: 12,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
  },
  experienceItem: {
    marginBottom: 10,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  expTitle: {
    fontSize: 11,
    fontWeight: 700,
  },
  expPeriod: {
    fontSize: 11,
    fontWeight: 700,
  },
  bullet: {
    flexDirection: 'row',
    marginLeft: 8,
    marginTop: 2,
  },
  bulletPoint: {
    width: 10,
    fontSize: 11,
    color: '#374151',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillItem: {
    width: '33.33%',
    fontSize: 10,
    marginBottom: 3,
    color: '#374151',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#374151',
  },
});

export function ModernPDFTemplate({ data }: { data: ResumeData }) {
  return (
    <Document>
      <Page size="A4" style={modernStyles.page}>
        {/* Header */}
        <View style={modernStyles.header}>
          <Text style={modernStyles.name}>{data.name || 'Your Name'}</Text>
          <View style={modernStyles.contactRow}>
            {data.email && <Text style={modernStyles.contactItem}>{data.email}</Text>}
            {data.email && data.phone && <Text style={modernStyles.separator}>|</Text>}
            {data.phone && <Text style={modernStyles.contactItem}>{data.phone}</Text>}
            {(data.email || data.phone) && data.location && <Text style={modernStyles.separator}>|</Text>}
            {data.location && <Text style={modernStyles.contactItem}>{data.location}</Text>}
          </View>
        </View>

        <View style={modernStyles.headerLine} />

        {/* Summary */}
        {data.summary && (
          <View style={modernStyles.section}>
            <Text style={modernStyles.sectionTitle}>Summary</Text>
            <Text style={modernStyles.text}>{data.summary}</Text>
          </View>
        )}

        {/* Professional Experience */}
        {data.experience && data.experience.length > 0 && (
          <View style={modernStyles.section}>
            <Text style={modernStyles.sectionTitle}>Professional Experience</Text>
            {data.experience.map((exp, idx) => (
              <View key={idx} style={modernStyles.experienceItem}>
                <View style={modernStyles.expHeader}>
                  <Text style={modernStyles.expTitle}>{exp.title}, {exp.company}</Text>
                  <Text style={modernStyles.expPeriod}>{exp.period}</Text>
                </View>
                {exp.bullets && exp.bullets.map((bullet, bIdx) => (
                  <View key={bIdx} style={modernStyles.bullet}>
                    <Text style={modernStyles.bulletPoint}>•</Text>
                    <Text style={modernStyles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <View style={modernStyles.section}>
            <Text style={modernStyles.sectionTitle}>Projects</Text>
            {data.projects.map((project, idx) => (
              <View key={idx} style={modernStyles.experienceItem}>
                <View style={modernStyles.expHeader}>
                  <Text style={modernStyles.expTitle}>{project.name}</Text>
                  {project.period && <Text style={modernStyles.expPeriod}>{project.period}</Text>}
                </View>
                {project.organization && <Text style={modernStyles.text}>{project.organization}</Text>}
                {project.details && project.details.map((detail, dIdx) => (
                  <View key={dIdx} style={modernStyles.bullet}>
                    <Text style={modernStyles.bulletPoint}>•</Text>
                    <Text style={modernStyles.bulletText}>{detail}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <View style={modernStyles.section}>
            <Text style={modernStyles.sectionTitle}>Skills</Text>
            <View style={modernStyles.skillsGrid}>
              {data.skills.map((skill, idx) => (
                <Text key={idx} style={modernStyles.skillItem}>{skill}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={modernStyles.section}>
            <Text style={modernStyles.sectionTitle}>Education</Text>
            {data.education.map((edu, idx) => (
              <View key={idx} style={modernStyles.experienceItem}>
                <View style={modernStyles.expHeader}>
                  <Text style={modernStyles.expTitle}>{edu.degree}</Text>
                  <Text style={modernStyles.expPeriod}>{edu.period}</Text>
                </View>
                <Text style={modernStyles.text}>{edu.institution}</Text>
                {edu.details && edu.details.map((detail, dIdx) => (
                  <View key={dIdx} style={modernStyles.bullet}>
                    <Text style={modernStyles.bulletPoint}>•</Text>
                    <Text style={modernStyles.bulletText}>{detail}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Additional Information */}
        {((data.languages && data.languages.length > 0) || (data.certifications && data.certifications.length > 0)) && (
          <View style={modernStyles.section}>
            <Text style={modernStyles.sectionTitle}>Additional Information</Text>
            {data.languages && data.languages.length > 0 && (
              <View style={modernStyles.bullet}>
                <Text style={modernStyles.bulletPoint}>•</Text>
                <Text style={modernStyles.bulletText}>
                  <Text style={{ fontWeight: 700 }}>Languages: </Text>
                  {data.languages.join(', ')}
                </Text>
              </View>
            )}
            {data.certifications && data.certifications.length > 0 && (
              <View style={modernStyles.bullet}>
                <Text style={modernStyles.bulletPoint}>•</Text>
                <Text style={modernStyles.bulletText}>
                  <Text style={{ fontWeight: 700 }}>Certifications: </Text>
                  {data.certifications.join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}

// ============================================
// EXECUTIVE TEMPLATE
// ============================================
const executiveStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#1f2937',
  },
  header: {
    marginBottom: 12,
  },
  name: {
    fontSize: 32,
    fontWeight: 700,
    color: '#111827',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: '#b45309',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    marginTop: 6,
    fontSize: 10,
    color: '#4b5563',
  },
  contactItem: {
    marginRight: 8,
  },
  separator: {
    marginRight: 8,
  },
  headerLine: {
    height: 2,
    backgroundColor: '#b45309',
    marginVertical: 14,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#d4a574',
  },
  experienceItem: {
    marginBottom: 12,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  expTitleContainer: {},
  expTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
  },
  expCompany: {
    fontSize: 10,
    color: '#4b5563',
  },
  expPeriod: {
    fontSize: 10,
    color: '#6b7280',
  },
  bullet: {
    flexDirection: 'row',
    marginTop: 4,
  },
  bulletPoint: {
    width: 10,
    fontSize: 11,
    color: '#9ca3af',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#374151',
  },
});

export function ExecutivePDFTemplate({ data }: { data: ResumeData }) {
  return (
    <Document>
      <Page size="A4" style={executiveStyles.page}>
        {/* Header */}
        <View style={executiveStyles.header}>
          <Text style={executiveStyles.name}>{data.name || 'Your Name'}</Text>
          {data.title && <Text style={executiveStyles.title}>{data.title}</Text>}
          <View style={executiveStyles.contactRow}>
            {data.location && <Text style={executiveStyles.contactItem}>{data.location}</Text>}
            {data.location && data.email && <Text style={executiveStyles.separator}>|</Text>}
            {data.email && <Text style={executiveStyles.contactItem}>{data.email}</Text>}
            {data.email && data.website && <Text style={executiveStyles.separator}>|</Text>}
            {data.website && <Text style={executiveStyles.contactItem}>{data.website}</Text>}
          </View>
        </View>

        <View style={executiveStyles.headerLine} />

        {/* Summary */}
        {data.summary && (
          <View style={executiveStyles.section}>
            <Text style={executiveStyles.sectionTitle}>Summary</Text>
            <Text style={executiveStyles.text}>{data.summary}</Text>
          </View>
        )}

        {/* Professional Experience */}
        {data.experience && data.experience.length > 0 && (
          <View style={executiveStyles.section}>
            <Text style={executiveStyles.sectionTitle}>Professional Experience</Text>
            {data.experience.map((exp, idx) => (
              <View key={idx} style={executiveStyles.experienceItem}>
                <View style={executiveStyles.expHeader}>
                  <View style={executiveStyles.expTitleContainer}>
                    <Text style={executiveStyles.expTitle}>{exp.title}</Text>
                    <Text style={executiveStyles.expCompany}>{exp.company}</Text>
                  </View>
                  <Text style={executiveStyles.expPeriod}>{exp.period}</Text>
                </View>
                {exp.bullets && exp.bullets.map((bullet, bIdx) => (
                  <View key={bIdx} style={executiveStyles.bullet}>
                    <Text style={executiveStyles.bulletPoint}>•</Text>
                    <Text style={executiveStyles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <View style={executiveStyles.section}>
            <Text style={executiveStyles.sectionTitle}>Projects</Text>
            {data.projects.map((project, idx) => (
              <View key={idx} style={executiveStyles.experienceItem}>
                <View style={executiveStyles.expHeader}>
                  <View style={executiveStyles.expTitleContainer}>
                    <Text style={executiveStyles.expTitle}>{project.name}</Text>
                    {project.organization && <Text style={executiveStyles.expCompany}>{project.organization}</Text>}
                  </View>
                  {project.period && <Text style={executiveStyles.expPeriod}>{project.period}</Text>}
                </View>
                {project.details && project.details.map((detail, dIdx) => (
                  <View key={dIdx} style={executiveStyles.bullet}>
                    <Text style={executiveStyles.bulletPoint}>•</Text>
                    <Text style={executiveStyles.bulletText}>{detail}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={executiveStyles.section}>
            <Text style={executiveStyles.sectionTitle}>Education</Text>
            {data.education.map((edu, idx) => (
              <View key={idx} style={executiveStyles.experienceItem}>
                <View style={executiveStyles.expHeader}>
                  <View style={executiveStyles.expTitleContainer}>
                    <Text style={executiveStyles.expTitle}>{edu.degree}</Text>
                    <Text style={executiveStyles.expCompany}>{edu.institution}</Text>
                  </View>
                  <Text style={executiveStyles.expPeriod}>{edu.period}</Text>
                </View>
                {edu.details && edu.details.map((detail, dIdx) => (
                  <View key={dIdx} style={executiveStyles.bullet}>
                    <Text style={executiveStyles.bulletPoint}>•</Text>
                    <Text style={executiveStyles.bulletText}>{detail}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Additional Information */}
        {((data.languages && data.languages.length > 0) || (data.certifications && data.certifications.length > 0)) && (
          <View style={executiveStyles.section}>
            <Text style={executiveStyles.sectionTitle}>Additional Information</Text>
            {data.languages && data.languages.length > 0 && (
              <View style={executiveStyles.bullet}>
                <Text style={executiveStyles.bulletPoint}>•</Text>
                <Text style={executiveStyles.bulletText}>
                  <Text style={{ fontWeight: 600 }}>Languages: </Text>
                  {data.languages.join(', ')}
                </Text>
              </View>
            )}
            {data.certifications && data.certifications.length > 0 && (
              <View style={executiveStyles.bullet}>
                <Text style={executiveStyles.bulletPoint}>•</Text>
                <Text style={executiveStyles.bulletText}>
                  <Text style={{ fontWeight: 600 }}>Certifications: </Text>
                  {data.certifications.join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}

// ============================================
// TECHNICAL TEMPLATE
// ============================================
const technicalStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: '#1f2937',
  },
  header: {
    textAlign: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 30,
    fontWeight: 700,
    color: '#1D61CB',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    fontSize: 10,
    color: '#4b5563',
  },
  contactItem: {
    marginHorizontal: 4,
  },
  separator: {
    marginHorizontal: 4,
  },
  headerLine: {
    height: 1,
    backgroundColor: '#d1d5db',
    marginVertical: 12,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1D61CB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingTop: 4,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#1D61CB',
    borderBottomWidth: 1,
    borderBottomColor: '#1D61CB',
  },
  experienceItem: {
    marginBottom: 12,
  },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  expTitleContainer: {},
  expTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#111827',
  },
  expCompany: {
    fontSize: 10,
    color: '#4b5563',
  },
  expPeriod: {
    fontSize: 10,
    color: '#6b7280',
  },
  bullet: {
    flexDirection: 'row',
    marginTop: 4,
  },
  bulletPoint: {
    width: 10,
    fontSize: 11,
    color: '#9ca3af',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillItem: {
    width: '33.33%',
    fontSize: 10,
    marginBottom: 3,
    color: '#374151',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#374151',
  },
});

export function TechnicalPDFTemplate({ data }: { data: ResumeData }) {
  return (
    <Document>
      <Page size="A4" style={technicalStyles.page}>
        {/* Header */}
        <View style={technicalStyles.header}>
          <Text style={technicalStyles.name}>{data.name || 'Your Name'}</Text>
          <View style={technicalStyles.contactRow}>
            {data.email && <Text style={technicalStyles.contactItem}>{data.email}</Text>}
            {data.email && data.phone && <Text style={technicalStyles.separator}>|</Text>}
            {data.phone && <Text style={technicalStyles.contactItem}>{data.phone}</Text>}
            {(data.email || data.phone) && data.location && <Text style={technicalStyles.separator}>|</Text>}
            {data.location && <Text style={technicalStyles.contactItem}>{data.location}</Text>}
          </View>
        </View>

        {/* Summary */}
        {data.summary && (
          <View style={technicalStyles.section}>
            <Text style={technicalStyles.sectionTitle}>Summary</Text>
            <Text style={technicalStyles.text}>{data.summary}</Text>
          </View>
        )}

        {/* Technical Skills - Before Experience */}
        {data.skills && data.skills.length > 0 && (
          <View style={technicalStyles.section}>
            <Text style={technicalStyles.sectionTitle}>Technical Skills</Text>
            <View style={technicalStyles.skillsGrid}>
              {data.skills.map((skill, idx) => (
                <Text key={idx} style={technicalStyles.skillItem}>{skill}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Professional Experience */}
        {data.experience && data.experience.length > 0 && (
          <View style={technicalStyles.section}>
            <Text style={technicalStyles.sectionTitle}>Professional Experience</Text>
            {data.experience.map((exp, idx) => (
              <View key={idx} style={technicalStyles.experienceItem}>
                <View style={technicalStyles.expHeader}>
                  <View style={technicalStyles.expTitleContainer}>
                    <Text style={technicalStyles.expTitle}>{exp.title}</Text>
                    <Text style={technicalStyles.expCompany}>{exp.company}</Text>
                  </View>
                  <Text style={technicalStyles.expPeriod}>{exp.period}</Text>
                </View>
                {exp.bullets && exp.bullets.map((bullet, bIdx) => (
                  <View key={bIdx} style={technicalStyles.bullet}>
                    <Text style={technicalStyles.bulletPoint}>•</Text>
                    <Text style={technicalStyles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={technicalStyles.section}>
            <Text style={technicalStyles.sectionTitle}>Education</Text>
            {data.education.map((edu, idx) => (
              <View key={idx} style={technicalStyles.experienceItem}>
                <View style={technicalStyles.expHeader}>
                  <View style={technicalStyles.expTitleContainer}>
                    <Text style={technicalStyles.expTitle}>{edu.degree}</Text>
                    <Text style={technicalStyles.expCompany}>{edu.institution}</Text>
                  </View>
                  <Text style={technicalStyles.expPeriod}>{edu.period}</Text>
                </View>
                {edu.details && edu.details.map((detail, dIdx) => (
                  <View key={dIdx} style={technicalStyles.bullet}>
                    <Text style={technicalStyles.bulletPoint}>•</Text>
                    <Text style={technicalStyles.bulletText}>{detail}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Additional Information */}
        {((data.languages && data.languages.length > 0) || (data.certifications && data.certifications.length > 0)) && (
          <View style={technicalStyles.section}>
            <Text style={technicalStyles.sectionTitle}>Additional Information</Text>
            {data.languages && data.languages.length > 0 && (
              <View style={technicalStyles.bullet}>
                <Text style={technicalStyles.bulletPoint}>•</Text>
                <Text style={technicalStyles.bulletText}>
                  <Text style={{ fontWeight: 600 }}>Languages: </Text>
                  {data.languages.join(', ')}
                </Text>
              </View>
            )}
            {data.certifications && data.certifications.length > 0 && (
              <View style={technicalStyles.bullet}>
                <Text style={technicalStyles.bulletPoint}>•</Text>
                <Text style={technicalStyles.bulletText}>
                  <Text style={{ fontWeight: 600 }}>Certifications: </Text>
                  {data.certifications.join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}

// ============================================
// TEMPLATE SELECTOR HELPER
// ============================================
export type PDFTemplate = 'classic' | 'modern' | 'executive' | 'technical';

export function getPDFTemplate(template: PDFTemplate, data: ResumeData) {
  switch (template) {
    case 'classic':
      return <ClassicPDFTemplate data={data} />;
    case 'modern':
      return <ModernPDFTemplate data={data} />;
    case 'executive':
      return <ExecutivePDFTemplate data={data} />;
    case 'technical':
      return <TechnicalPDFTemplate data={data} />;
    default:
      return <ClassicPDFTemplate data={data} />;
  }
}

