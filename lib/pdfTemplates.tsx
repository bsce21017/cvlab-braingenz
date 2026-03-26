/**
 * PDF Templates using @react-pdf/renderer
 * These templates match the golden reference designs
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { ResumeData } from './resumeDataTypes';
import { classicStyle, modernStyle, executiveStyle } from './templateStyles';

// Register fonts using runtime fetch (works with both webpack and Turbopack)
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

    const bytes = new Uint8Array(fontData);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:application/octet-stream;base64,${base64}`;

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

// ============================================================================
// CLASSIC TEMPLATE - Serif font, navy blue accents (matching web preview)
// ============================================================================

const CLASSIC_COLORS = {
  name: classicStyle.colors.name,
  sectionHeading: classicStyle.colors.sectionHeading,
  divider: classicStyle.colors.divider,
  bodyText: classicStyle.colors.bodyText,
  subtleText: classicStyle.colors.subtleText,
};

const classicStyles = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 54,
    paddingLeft: 54,
    paddingRight: 54,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: CLASSIC_COLORS.bodyText,
    lineHeight: 1.35,
  },
  headerSection: {
    textAlign: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CLASSIC_COLORS.name,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  contactLine: {
    fontSize: 10,
    color: CLASSIC_COLORS.subtleText,
  },
  section: {
    marginTop: 12,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    color: CLASSIC_COLORS.sectionHeading,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionUnderline: {
    height: 1,
    backgroundColor: CLASSIC_COLORS.divider,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 10,
    color: CLASSIC_COLORS.bodyText,
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
    color: CLASSIC_COLORS.bodyText,
  },
  expPeriod: {
    fontSize: 10,
    color: CLASSIC_COLORS.subtleText,
  },
  expCompany: {
    fontSize: 10,
    color: CLASSIC_COLORS.subtleText,
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
    color: CLASSIC_COLORS.bodyText,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: CLASSIC_COLORS.bodyText,
    lineHeight: 1.35,
  },
});

export function ClassicPDFTemplate({ data }: { data: ResumeData }) {
  const contactParts = [data.phone, data.email, data.location].filter(Boolean);
  const extData = data as any;

  return (
    <Document>
      <Page size="A4" style={classicStyles.page}>
        {/* Header */}
        <View style={classicStyles.headerSection}>
          <Text style={classicStyles.name}>{(data.name || 'Your Name').toUpperCase()}</Text>
          <Text style={classicStyles.contactLine}>{contactParts.join(' • ')}</Text>
        </View>

        {/* Summary */}
        {data.summary && (
          <View style={classicStyles.section}>
            <Text style={classicStyles.sectionHeading}>SUMMARY</Text>
            <View style={classicStyles.sectionUnderline} />
            <Text style={classicStyles.bodyText}>{data.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <View style={classicStyles.section}>
            <Text style={classicStyles.sectionHeading}>EXPERIENCE</Text>
            <View style={classicStyles.sectionUnderline} />
            {data.experience.map((exp, idx) => (
              <View key={idx} style={classicStyles.experienceItem}>
                <View style={classicStyles.expHeaderRow}>
                  <Text style={classicStyles.expTitle}>{exp.title}</Text>
                  <Text style={classicStyles.expPeriod}>{exp.period || ''}</Text>
                </View>
                <Text style={classicStyles.expCompany}>
                  {exp.company}{(exp as any).location ? `, ${(exp as any).location}` : ''}
                </Text>
                {exp.bullets?.map((bullet, bIdx) => (
                  <View key={bIdx} style={classicStyles.bulletRow}>
                    <Text style={classicStyles.bulletChar}>•</Text>
                    <Text style={classicStyles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
            {extData.priorExperience && (
              <View style={{ marginTop: 4 }}>
                <Text style={classicStyles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Prior Experience: </Text>
                  {extData.priorExperience}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={classicStyles.section}>
            <Text style={classicStyles.sectionHeading}>EDUCATION</Text>
            <View style={classicStyles.sectionUnderline} />
            {data.education.map((edu, idx) => (
              <View key={idx} style={{ marginBottom: 8 }}>
                <View style={classicStyles.expHeaderRow}>
                  <Text style={classicStyles.expTitle}>
                    {edu.institution}{(edu as any).location ? `, ${(edu as any).location}` : ''}
                  </Text>
                  <Text style={classicStyles.expPeriod}>{edu.period || ''}</Text>
                </View>
                <Text style={classicStyles.expCompany}>{edu.degree}</Text>
                {(edu as any).honors && (
                  <Text style={classicStyles.bodyText}>{(edu as any).honors}</Text>
                )}
              </View>
            ))}
            {extData.executiveEducation && (
              <View style={{ marginTop: 8 }}>
                <Text style={classicStyles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Executive Education: </Text>
                  {extData.executiveEducation}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <View style={classicStyles.section}>
            <Text style={classicStyles.sectionHeading}>SKILLS</Text>
            <View style={classicStyles.sectionUnderline} />
            <Text style={classicStyles.bodyText}>{data.skills.join(' • ')}</Text>
          </View>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={classicStyles.section}>
            <Text style={classicStyles.sectionHeading}>CERTIFICATIONS</Text>
            <View style={classicStyles.sectionUnderline} />
            {data.certifications.map((cert, idx) => (
              <View key={idx} style={classicStyles.bulletRow}>
                <Text style={classicStyles.bulletChar}>•</Text>
                <Text style={classicStyles.bulletText}>{cert}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <View style={classicStyles.section}>
            <Text style={classicStyles.sectionHeading}>LANGUAGES</Text>
            <View style={classicStyles.sectionUnderline} />
            <Text style={classicStyles.bodyText}>{data.languages.join(', ')}</Text>
          </View>
        )}

        {/* Additional Information */}
        {extData.additionalInfo && (
          <View style={classicStyles.section}>
            <Text style={classicStyles.sectionHeading}>ADDITIONAL INFORMATION</Text>
            <View style={classicStyles.sectionUnderline} />
            {extData.additionalInfo.certifications && (
              <View style={{ marginBottom: 6 }}>
                <Text style={classicStyles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Certifications: </Text>
                  {extData.additionalInfo.certifications}
                </Text>
              </View>
            )}
            {extData.additionalInfo.boardPositions && (
              <View style={{ marginBottom: 6 }}>
                <Text style={classicStyles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Board Positions: </Text>
                  {extData.additionalInfo.boardPositions}
                </Text>
              </View>
            )}
            {extData.additionalInfo.speaking && (
              <View style={{ marginBottom: 6 }}>
                <Text style={classicStyles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Speaking: </Text>
                  {extData.additionalInfo.speaking}
                </Text>
              </View>
            )}
            {extData.additionalInfo.languages && (
              <View style={{ marginBottom: 6 }}>
                <Text style={classicStyles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Languages: </Text>
                  {extData.additionalInfo.languages}
                </Text>
              </View>
            )}
            {extData.additionalInfo.technical && (
              <View style={{ marginBottom: 6 }}>
                <Text style={classicStyles.bodyText}>
                  <Text style={{ fontWeight: 'bold' }}>Technical: </Text>
                  {extData.additionalInfo.technical}
                </Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}

// ============================================================================
// MODERN TEMPLATE - Serif font, section heading with gray line
// ============================================================================

const MODERN_COLORS = {
  name: modernStyle.colors.name,
  sectionHeading: modernStyle.colors.sectionHeading,
  bodyText: modernStyle.colors.bodyText,
  subtleText: modernStyle.colors.subtleText,
  divider: modernStyle.colors.divider,
};

const modernStyles = StyleSheet.create({
  page: {
    padding: 45,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: MODERN_COLORS.bodyText,
    lineHeight: 1.35,
  },
  headerSection: {
    textAlign: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: MODERN_COLORS.name,
    marginBottom: 16,
  },
  contactLine: {
    fontSize: 9,
    color: MODERN_COLORS.subtleText,
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
    color: MODERN_COLORS.sectionHeading,
    marginRight: 10,
    letterSpacing: 0.5,
  },
  sectionHeadingLine: {
    flex: 1,
    height: 0.75,
    backgroundColor: MODERN_COLORS.divider,
  },
  summaryText: {
    fontSize: 10,
    color: MODERN_COLORS.bodyText,
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
    color: MODERN_COLORS.name,
  },
  dateText: {
    fontSize: 10,
    color: MODERN_COLORS.subtleText,
  },
  companyLine: {
    fontSize: 10,
    fontStyle: 'italic',
    color: MODERN_COLORS.name,
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
    color: MODERN_COLORS.bodyText,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: MODERN_COLORS.bodyText,
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
    color: MODERN_COLORS.name,
  },
  yearText: {
    fontSize: 10,
    color: MODERN_COLORS.subtleText,
  },
  institutionLine: {
    fontSize: 10,
    fontStyle: 'italic',
    color: MODERN_COLORS.name,
  },
  additionalRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  additionalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: MODERN_COLORS.bodyText,
  },
  additionalValue: {
    flex: 1,
    fontSize: 10,
    color: MODERN_COLORS.bodyText,
  },
});

export function ModernPDFTemplate({ data }: { data: ResumeData }) {
  const contactParts = [data.phone, data.email, data.location].filter(Boolean);
  const extData = data as any;

  const SectionHeading = ({ title }: { title: string }) => (
    <View style={modernStyles.sectionHeadingRow}>
      <Text style={modernStyles.sectionHeadingText}>{title}</Text>
      <View style={modernStyles.sectionHeadingLine} />
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={modernStyles.page}>
        {/* Header - NO divider after contact */}
        <View style={modernStyles.headerSection}>
          <Text style={modernStyles.name}>{data.name || 'Your Name'}</Text>
          <Text style={modernStyles.contactLine}>{contactParts.join(' · ')}</Text>
        </View>

        {/* Summary */}
        {data.summary && (
          <View style={modernStyles.section}>
            <SectionHeading title="Summary" />
            <Text style={modernStyles.summaryText}>{data.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <View style={modernStyles.section}>
            <SectionHeading title="Experience" />
            {data.experience.map((exp, idx) => (
              <View key={idx} style={modernStyles.experienceItem}>
                <View style={modernStyles.titleRow}>
                  <Text style={modernStyles.titleText}>{exp.title}</Text>
                  <Text style={modernStyles.dateText}>{exp.period || ''}</Text>
                </View>
                <Text style={modernStyles.companyLine}>
                  {exp.company}{(exp as any).location ? ` – ${(exp as any).location}` : ''}
                </Text>
                {exp.bullets?.map((bullet, bIdx) => (
                  <View key={bIdx} style={modernStyles.bulletRow}>
                    <Text style={modernStyles.bulletChar}>•</Text>
                    <Text style={modernStyles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={modernStyles.section}>
            <SectionHeading title="Education" />
            {data.education.map((edu, idx) => (
              <View key={idx} style={modernStyles.educationItem}>
                <View style={modernStyles.degreeRow}>
                  <Text style={modernStyles.degreeText}>{edu.degree}</Text>
                  <Text style={modernStyles.yearText}>{edu.period || ''}</Text>
                </View>
                <Text style={modernStyles.institutionLine}>{edu.institution}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Additional */}
        <View style={modernStyles.section}>
          <SectionHeading title="Additional" />
          {extData.boardRoles && extData.boardRoles.length > 0 && (
            <View style={modernStyles.additionalRow}>
              <Text style={modernStyles.additionalLabel}>Board Roles: </Text>
              <Text style={modernStyles.additionalValue}>{extData.boardRoles.join(' · ')}</Text>
            </View>
          )}
          {data.certifications && data.certifications.length > 0 && (
            <View style={modernStyles.additionalRow}>
              <Text style={modernStyles.additionalLabel}>Certifications: </Text>
              <Text style={modernStyles.additionalValue}>{data.certifications.join(' · ')}</Text>
            </View>
          )}
          {extData.speaking && extData.speaking.length > 0 && (
            <View style={modernStyles.additionalRow}>
              <Text style={modernStyles.additionalLabel}>Speaking: </Text>
              <Text style={modernStyles.additionalValue}>{extData.speaking.join(' · ')}</Text>
            </View>
          )}
          {data.languages && data.languages.length > 0 && (
            <View style={modernStyles.additionalRow}>
              <Text style={modernStyles.additionalLabel}>Languages: </Text>
              <Text style={modernStyles.additionalValue}>{data.languages.join(' · ')}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}

// ============================================================================
// EXECUTIVE TEMPLATE - Navy blue, no title under name, no header divider
// ============================================================================

const EXEC_COLORS = {
  navy: executiveStyle.colors.primary,
  black: executiveStyle.colors.bodyText,
  darkGray: executiveStyle.colors.subtleText,
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
  companyName: {
    fontWeight: 'bold',
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

export function ExecutivePDFTemplate({ data }: { data: ResumeData }) {
  const contactParts = [data.phone, data.email, data.location].filter(Boolean);
  const extData = data as any;

  return (
    <Document>
      <Page size="A4" style={executiveStyles.page}>
        {/* Header - NO title, NO divider */}
        <View style={executiveStyles.header}>
          <Text style={executiveStyles.name}>{(data.name || 'Your Name').toUpperCase()}</Text>
          <Text style={executiveStyles.contact}>{contactParts.join(' | ')}</Text>
        </View>

        {/* Professional Summary */}
        {data.summary && (
          <View style={executiveStyles.section}>
            <Text style={executiveStyles.sectionHeading}>PROFESSIONAL SUMMARY</Text>
            <Text style={executiveStyles.summaryText}>{data.summary}</Text>
          </View>
        )}

        {/* Core Competencies */}
        {data.skills && data.skills.length > 0 && (
          <View style={executiveStyles.section}>
            <Text style={executiveStyles.sectionHeading}>CORE COMPETENCIES</Text>
            <Text style={executiveStyles.coreCompetencies}>{data.skills.join(' | ')}</Text>
          </View>
        )}

        {/* Professional Experience */}
        {data.experience && data.experience.length > 0 && (
          <View style={executiveStyles.section}>
            <Text style={executiveStyles.sectionHeading}>PROFESSIONAL EXPERIENCE</Text>
            {data.experience.map((exp, idx) => (
              <View key={idx} style={executiveStyles.experienceItem}>
                <Text style={executiveStyles.jobTitle}>{exp.title}</Text>
                <Text style={executiveStyles.companyLine}>
                  <Text style={executiveStyles.companyName}>{exp.company}</Text>
                  {(exp as any).location ? ` | ${(exp as any).location}` : ''}
                  {exp.period ? ` | ${exp.period}` : ''}
                </Text>
                {exp.bullets?.map((bullet, bIdx) => (
                  <View key={bIdx} style={executiveStyles.bulletRow}>
                    <Text style={executiveStyles.bulletChar}>•</Text>
                    <Text style={executiveStyles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Key Project Achievements */}
        {extData.keyProjectAchievements && extData.keyProjectAchievements.length > 0 && (
          <View style={executiveStyles.section}>
            <Text style={executiveStyles.sectionHeading}>KEY PROJECT ACHIEVEMENTS</Text>
            {extData.keyProjectAchievements.map((achievement: string, idx: number) => (
              <View key={idx} style={executiveStyles.bulletRow}>
                <Text style={executiveStyles.bulletChar}>•</Text>
                <Text style={executiveStyles.bulletText}>{achievement}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View style={executiveStyles.section}>
            <Text style={executiveStyles.sectionHeading}>EDUCATION</Text>
            {data.education.map((edu, idx) => (
              <View key={idx} style={executiveStyles.educationItem}>
                <Text style={executiveStyles.degreeText}>{edu.degree}</Text>
                <Text style={executiveStyles.institutionText}>
                  {[edu.institution, edu.period].filter(Boolean).join(', ')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Professional Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={executiveStyles.section}>
            <Text style={executiveStyles.sectionHeading}>PROFESSIONAL CERTIFICATIONS</Text>
            {data.certifications.map((cert, idx) => (
              <View key={idx} style={executiveStyles.bulletRow}>
                <Text style={executiveStyles.bulletChar}>•</Text>
                <Text style={executiveStyles.bulletText}>{cert}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Professional Affiliations */}
        {extData.affiliations && extData.affiliations.length > 0 && (
          <View style={executiveStyles.section}>
            <Text style={executiveStyles.sectionHeading}>PROFESSIONAL AFFILIATIONS</Text>
            {extData.affiliations.map((affiliation: string, idx: number) => (
              <View key={idx} style={executiveStyles.bulletRow}>
                <Text style={executiveStyles.bulletChar}>•</Text>
                <Text style={executiveStyles.bulletText}>{affiliation}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Languages & Technical Skills */}
        {(extData.languages || extData.technicalSkills) && (
          <View style={executiveStyles.section}>
            <Text style={executiveStyles.sectionHeading}>LANGUAGES & TECHNICAL SKILLS</Text>
            {extData.languages && (
              <View style={executiveStyles.skillsRow}>
                <Text style={executiveStyles.skillsLabel}>
                  Languages: <Text style={executiveStyles.skillsValue}>
                    {typeof extData.languages === 'string' ? extData.languages : extData.languages.join(' | ')}
                  </Text>
                </Text>
              </View>
            )}
            {extData.technicalSkills?.projectSoftware && (
              <View style={executiveStyles.skillsRow}>
                <Text style={executiveStyles.skillsLabel}>
                  Project Software: <Text style={executiveStyles.skillsValue}>{extData.technicalSkills.projectSoftware}</Text>
                </Text>
              </View>
            )}
            {extData.technicalSkills?.technical && (
              <View style={executiveStyles.skillsRow}>
                <Text style={executiveStyles.skillsLabel}>
                  Technical: <Text style={executiveStyles.skillsValue}>{extData.technicalSkills.technical}</Text>
                </Text>
              </View>
            )}
            {extData.technicalSkills?.standards && (
              <View style={executiveStyles.skillsRow}>
                <Text style={executiveStyles.skillsLabel}>
                  Standards: <Text style={executiveStyles.skillsValue}>{extData.technicalSkills.standards}</Text>
                </Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}

// ============================================================================
// TEMPLATE SELECTOR HELPER
// ============================================================================
export type PDFTemplate = 'classic' | 'modern' | 'executive';

export function getPDFTemplate(template: PDFTemplate, data: ResumeData) {
  switch (template) {
    case 'classic':
      return <ClassicPDFTemplate data={data} />;
    case 'modern':
      return <ModernPDFTemplate data={data} />;
    case 'executive':
      return <ExecutivePDFTemplate data={data} />;
    default:
      return <ClassicPDFTemplate data={data} />;
  }
}
