/**
 * Download resume utilities for PDF and Word generation
 *
 * This file generates Word documents that match the web template styling exactly.
 * Font sizes, colors, spacing, and layout are precisely calibrated to match
 * the React/Tailwind templates.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  LevelFormat,
  convertInchesToTwip,
  INumberingOptions,
  IBorderOptions,
  TableLayoutType,
  VerticalAlign,
} from "docx";
import { ResumeData } from "./resumeDataTypes";

// ============================================================================
// FONT & SIZE CONFIGURATION
// ============================================================================

// Using Arial - it's truly cross-platform (available on Windows, Mac, Linux)
// Calibri is Windows-only and causes issues on Mac
const FONT_FAMILY = "Arial";

// Tailwind to docx size conversion (docx uses half-points)
// text-sm = 14px = 10.5pt = 21 half-points
// text-base = 16px = 12pt = 24 half-points
// text-xl = 20px = 15pt = 30 half-points
// text-3xl = 30px = 22.5pt = 45 half-points
// text-4xl = 36px = 27pt = 54 half-points
const FONT_SIZES = {
  "text-sm": 21, // 14px - body text, bullets
  "text-base": 24, // 16px - section headings
  "text-xl": 30, // 20px - subtitle
  "text-3xl": 45, // 30px - name (most templates)
  "text-4xl": 54, // 36px - name (executive)
};

// Spacing constants in twips (1 twip = 1/20 point)
const SPACING = {
  xs: 30, // ~2px
  sm: 60, // ~4px
  md: 120, // ~8px
  lg: 180, // ~12px
  xl: 240, // ~16px
  "2xl": 300, // ~20px
  "3xl": 360, // ~24px
};

// Color constants matching Tailwind colors (without #)
const COLORS = {
  // Primary colors for each template
  classicBlue: "2563EB", // blue-600
  modernBlack: "000000", // black
  executiveAmber: "B45309", // amber-700
  technicalBlue: "1D4ED8", // blue-700

  // Gray scale
  gray900: "111827",
  gray800: "1F2937",
  gray700: "374151",
  gray600: "4B5563",
  gray500: "6B7280",
  gray400: "9CA3AF",
  gray300: "D1D5DB",

  white: "FFFFFF",
  black: "000000",
};

// ============================================================================
// BORDER CONFIGURATIONS
// ============================================================================

// Mac Word requires explicit border settings - BorderStyle.NONE alone isn't enough
// Using NIL style which is more universally supported
const INVISIBLE_BORDER: IBorderOptions = {
  style: BorderStyle.NIL, // NIL is more reliable than NONE on Mac
  size: 0,
  color: "FFFFFF",
};

// For tables, we need to be very explicit about all borders
const NO_BORDERS = {
  top: INVISIBLE_BORDER,
  bottom: INVISIBLE_BORDER,
  left: INVISIBLE_BORDER,
  right: INVISIBLE_BORDER,
  insideHorizontal: INVISIBLE_BORDER,
  insideVertical: INVISIBLE_BORDER,
};

// Cell-specific borders (some versions of Word need this separately)
const NO_CELL_BORDERS = {
  top: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
};

// ============================================================================
// NUMBERING CONFIGURATION FOR PROPER BULLETS
// ============================================================================

const createNumberingConfig = (): INumberingOptions => ({
  config: [
    {
      reference: "resume-bullets",
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: {
              indent: {
                left: convertInchesToTwip(0.2),
                hanging: convertInchesToTwip(0.15),
              },
            },
          },
        },
      ],
    },
  ],
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createTextRun(
  text: string,
  options: {
    bold?: boolean;
    size?: number;
    color?: string;
    font?: string;
  } = {},
): TextRun {
  return new TextRun({
    text,
    bold: options.bold,
    size: options.size || FONT_SIZES["text-sm"],
    color: options.color || COLORS.gray700,
    font: options.font || FONT_FAMILY,
  });
}

function createBulletParagraph(
  text: string,
  options: {
    size?: number;
    color?: string;
    spacingAfter?: number;
  } = {},
): Paragraph {
  return new Paragraph({
    numbering: { reference: "resume-bullets", level: 0 },
    children: [
      createTextRun(text, {
        size: options.size || FONT_SIZES["text-sm"],
        color: options.color || COLORS.gray700,
      }),
    ],
    spacing: { after: options.spacingAfter ?? SPACING.xs },
  });
}

function createSpacer(height: number = SPACING.xl): Paragraph {
  return new Paragraph({ spacing: { after: height } });
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export async function downloadResumeAsWord(
  data: ResumeData,
  template: string,
  filename: string = "resume.docx",
): Promise<void> {
  console.log(
    "[downloadResume] Starting Word generation for:",
    filename,
    "Template:",
    template,
  );
  console.log("[downloadResume] Resume Data:", data);

  try {
    const children: (Paragraph | Table)[] = [];

    // Generate template-specific content
    switch (template) {
      case "classic":
        generateClassicTemplate(data, children);
        break;
      case "modern":
        generateModernTemplate(data, children);
        break;
      case "executive":
        generateExecutiveTemplate(data, children);
        break;
      case "technical":
        generateTechnicalTemplate(data, children);
        break;
      default:
        generateClassicTemplate(data, children);
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: FONT_FAMILY,
              size: FONT_SIZES["text-sm"],
            },
          },
        },
      },
      numbering: createNumberingConfig(),
      sections: [
        {
          properties: {
            page: {
              size: {
                width: convertInchesToTwip(8.5), // US Letter width
                height: convertInchesToTwip(11), // US Letter height
              },
              margin: {
                top: convertInchesToTwip(0.5),
                right: convertInchesToTwip(0.5),
                bottom: convertInchesToTwip(0.5),
                left: convertInchesToTwip(0.5),
              },
            },
          },
          children: children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log("[downloadResume] Word generation completed successfully");
  } catch (error) {
    console.error("[downloadResume] Error generating Word document:", error);
    throw new Error(
      `Failed to generate Word document: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// ============================================================================
// CLASSIC TEMPLATE
// Two-column layout: Left column for section headers, right for content
// Blue name header, blue dividers, blue section labels
// ============================================================================

function generateClassicTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
): void {
  const primaryColor = COLORS.classicBlue;

  // ==================== HEADER ====================
  // Name - centered, uppercase, blue, bold
  children.push(
    new Paragraph({
      children: [
        createTextRun((data.name || "Your Name").toUpperCase(), {
          bold: true,
          size: FONT_SIZES["text-3xl"],
          color: primaryColor,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: SPACING.md },
    }),
  );

  // Contact info - centered, gray
  const contactParts: string[] = [];
  if (data.email) contactParts.push(data.email);
  if (data.phone) contactParts.push(data.phone);
  if (data.location) contactParts.push(data.location);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          createTextRun(contactParts.join(" | "), {
            size: FONT_SIZES["text-sm"],
            color: COLORS.gray600,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: SPACING.lg },
      }),
    );
  }

  // Thick blue divider line (h-1 in Tailwind = 4px)
  children.push(
    new Paragraph({
      spacing: { after: SPACING["2xl"] },
      border: {
        bottom: {
          color: primaryColor,
          size: 18, // ~2.25pt thick
          style: BorderStyle.SINGLE,
        },
      },
    }),
  );

  // ==================== TWO-COLUMN SECTION HELPER ====================
  // Left column: ~1.25 inches for section label
  // Right column: remaining space for content
  const LEFT_COL_WIDTH = 1800; // ~1.25 inches in twips
  const RIGHT_COL_WIDTH = 8640; // Remaining width in twips (total ~10440 for 7.5" content area)

  const createTwoColumnSection = (
    heading: string | string[], // Can be multiline like "WORK\nEXPERIENCE"
    contentParagraphs: Paragraph[],
  ): Table => {
    // Handle multiline headings
    const headingLines = Array.isArray(heading) ? heading : heading.split("\n");
    const headingParagraphs = headingLines.map(
      (line, idx) =>
        new Paragraph({
          children: [
            createTextRun(line.toUpperCase(), {
              bold: true,
              size: FONT_SIZES["text-base"],
              color: primaryColor,
            }),
          ],
          spacing: { after: idx < headingLines.length - 1 ? 0 : 0 },
        }),
    );

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            // Left column - section heading
            new TableCell({
              width: { size: LEFT_COL_WIDTH, type: WidthType.DXA },
              borders: NO_CELL_BORDERS,
              verticalAlign: VerticalAlign.TOP,
              children: headingParagraphs,
            }),
            // Right column - content
            new TableCell({
              width: { size: RIGHT_COL_WIDTH, type: WidthType.DXA },
              borders: NO_CELL_BORDERS,
              verticalAlign: VerticalAlign.TOP,
              children:
                contentParagraphs.length > 0
                  ? contentParagraphs
                  : [new Paragraph({})],
            }),
          ],
        }),
      ],
    });
  };

  // Section divider - thin blue line
  const addSectionDivider = (): void => {
    children.push(
      new Paragraph({
        spacing: { before: SPACING.xl, after: SPACING.xl },
        border: {
          bottom: {
            color: primaryColor,
            size: 4, // thin line
            style: BorderStyle.SINGLE,
          },
        },
      }),
    );
  };

  // ==================== SUMMARY SECTION ====================
  if (data.summary && data.summary.trim().length > 0) {
    const summaryContent = [
      new Paragraph({
        children: [
          createTextRun(data.summary, {
            size: FONT_SIZES["text-sm"],
            color: COLORS.gray700,
          }),
        ],
        alignment: AlignmentType.BOTH, // justified text
      }),
    ];
    children.push(createTwoColumnSection("SUMMARY", summaryContent));
    addSectionDivider();
  }

  // ==================== WORK EXPERIENCE SECTION ====================
  if (data.experience && data.experience.length > 0) {
    const expContent: Paragraph[] = [];

    data.experience.forEach((exp, idx) => {
      // Line 1: Job Title (bold)
      expContent.push(
        new Paragraph({
          children: [
            createTextRun(exp.title || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
          ],
          spacing: { after: SPACING.xs },
        }),
      );

      // Line 2: Company | Location | Period
      // Format: "Company Name | Location | Period" or "Company Name | Period" if no location
      const companyParts: string[] = [];
      if (exp.company) companyParts.push(exp.company);
      // Check if experience has location field (it might be in the data)
      if ((exp as any).location) companyParts.push((exp as any).location);
      if (exp.period) companyParts.push(exp.period);

      expContent.push(
        new Paragraph({
          children: [
            createTextRun(companyParts.join(" | "), {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
          ],
          spacing: { after: SPACING.sm },
        }),
      );

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          expContent.push(
            createBulletParagraph(bullet, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: SPACING.xs,
            }),
          );
        });
      }

      // Spacing between experiences
      if (idx < data.experience!.length - 1) {
        expContent.push(createSpacer(SPACING.lg));
      }
    });

    children.push(createTwoColumnSection(["WORK", "EXPERIENCE"], expContent));
    addSectionDivider();
  }

  // ==================== EDUCATION SECTION ====================
  if (data.education && data.education.length > 0) {
    const eduContent: Paragraph[] = [];

    data.education.forEach((edu, idx) => {
      // Degree (bold)
      expContent: [
        new Paragraph({
          children: [
            createTextRun(edu.degree || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
            // Add period on same line, right-aligned using tab
            new TextRun({ text: "\t" }),
            createTextRun(edu.period || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
          ],
          tabStops: [{ type: "right" as const, position: RIGHT_COL_WIDTH }],
          spacing: { after: SPACING.xs },
        }),
      ];

      eduContent.push(
        new Paragraph({
          children: [
            createTextRun(edu.degree || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
            new TextRun({ text: "\t" }),
            createTextRun(edu.period || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
          ],
          tabStops: [{ type: "right" as const, position: RIGHT_COL_WIDTH }],
          spacing: { after: SPACING.xs },
        }),
      );

      // Institution
      if (edu.institution) {
        eduContent.push(
          new Paragraph({
            children: [
              createTextRun(edu.institution, {
                size: FONT_SIZES["text-sm"],
                color: COLORS.gray700,
              }),
            ],
            spacing: { after: SPACING.sm },
          }),
        );
      }

      // Details (if any)
      if (edu.details && edu.details.length > 0) {
        edu.details.forEach((detail) => {
          eduContent.push(
            createBulletParagraph(detail, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: SPACING.xs,
            }),
          );
        });
      }

      if (idx < data.education!.length - 1) {
        eduContent.push(createSpacer(SPACING.lg));
      }
    });

    children.push(createTwoColumnSection("EDUCATION", eduContent));
    addSectionDivider();
  }

  // ==================== SKILLS SECTION (2-column grid) ====================
  if (data.skills && data.skills.length > 0) {
    // Create a nested 2-column table for skills
    const skillsPerColumn = Math.ceil(data.skills.length / 2);
    const leftSkills = data.skills.slice(0, skillsPerColumn);
    const rightSkills = data.skills.slice(skillsPerColumn);

    const skillsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: NO_CELL_BORDERS,
              children: leftSkills.map((skill) =>
                createBulletParagraph(skill, {
                  size: FONT_SIZES["text-sm"],
                  color: COLORS.gray700,
                  spacingAfter: SPACING.xs,
                }),
              ),
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: NO_CELL_BORDERS,
              children:
                rightSkills.length > 0
                  ? rightSkills.map((skill) =>
                      createBulletParagraph(skill, {
                        size: FONT_SIZES["text-sm"],
                        color: COLORS.gray700,
                        spacingAfter: SPACING.xs,
                      }),
                    )
                  : [new Paragraph({})],
            }),
          ],
        }),
      ],
    });

    // Wrap skills table in the two-column layout
    const skillsContent = [
      new Paragraph({
        children: [],
        spacing: { after: 0 },
      }),
    ];

    // We need to add the skills table directly after the section table
    children.push(createTwoColumnSection("KEY SKILLS", [new Paragraph({})]));

    // Remove the empty paragraph we just added and add the proper content
    children.pop();

    // Create a proper two-column section with the skills table embedded
    const skillsSectionTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: LEFT_COL_WIDTH, type: WidthType.DXA },
              borders: NO_CELL_BORDERS,
              verticalAlign: VerticalAlign.TOP,
              children: [
                new Paragraph({
                  children: [
                    createTextRun("KEY SKILLS", {
                      bold: true,
                      size: FONT_SIZES["text-base"],
                      color: primaryColor,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: RIGHT_COL_WIDTH, type: WidthType.DXA },
              borders: NO_CELL_BORDERS,
              verticalAlign: VerticalAlign.TOP,
              children: [skillsTable],
            }),
          ],
        }),
      ],
    });

    children.push(skillsSectionTable);
    addSectionDivider();
  }

  // ==================== PROJECTS SECTION ====================
  if (data.projects && data.projects.length > 0) {
    const projectContent: Paragraph[] = [];

    data.projects.forEach((project, idx) => {
      // Project name (bold)
      projectContent.push(
        new Paragraph({
          children: [
            createTextRun(project.name || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
            ...(project.period
              ? [
                  new TextRun({ text: "\t" }),
                  createTextRun(project.period, {
                    bold: true,
                    size: FONT_SIZES["text-sm"],
                    color: COLORS.black,
                  }),
                ]
              : []),
          ],
          tabStops: [{ type: "right" as const, position: RIGHT_COL_WIDTH }],
          spacing: { after: SPACING.xs },
        }),
      );

      // Organization (if any)
      if (project.organization) {
        projectContent.push(
          new Paragraph({
            children: [
              createTextRun(project.organization, {
                size: FONT_SIZES["text-sm"],
                color: COLORS.gray700,
              }),
            ],
            spacing: { after: SPACING.sm },
          }),
        );
      }

      // Details
      if (project.details && project.details.length > 0) {
        project.details.forEach((detail) => {
          projectContent.push(
            createBulletParagraph(detail, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: SPACING.xs,
            }),
          );
        });
      }

      if (idx < data.projects!.length - 1) {
        projectContent.push(createSpacer(SPACING.lg));
      }
    });

    children.push(createTwoColumnSection("PROJECTS", projectContent));
    addSectionDivider();
  }

  // ==================== CERTIFICATIONS SECTION ====================
  if (data.certifications && data.certifications.length > 0) {
    const certContent = data.certifications.map((cert) =>
      createBulletParagraph(cert, {
        size: FONT_SIZES["text-sm"],
        color: COLORS.gray700,
        spacingAfter: SPACING.xs,
      }),
    );
    children.push(createTwoColumnSection("CERTIFICATIONS", certContent));
    addSectionDivider();
  }

  // ==================== LANGUAGES SECTION ====================
  if (data.languages && data.languages.length > 0) {
    const langContent = [
      new Paragraph({
        children: [
          createTextRun(data.languages.join(", "), {
            size: FONT_SIZES["text-sm"],
            color: COLORS.gray700,
          }),
        ],
      }),
    ];
    children.push(createTwoColumnSection("LANGUAGES", langContent));
    // No divider after last section
  }
}

// ============================================================================
// MODERN TEMPLATE
// Clean minimal with black name, gray borders, 3-column skills
// ============================================================================

function generateModernTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
): void {
  const primaryColor = COLORS.modernBlack;

  // Header - Name
  children.push(
    new Paragraph({
      children: [
        createTextRun((data.name || "Your Name").toUpperCase(), {
          bold: true,
          size: FONT_SIZES["text-3xl"],
          color: primaryColor,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: SPACING.md },
    }),
  );

  // Contact info
  const contactParts: string[] = [];
  if (data.email) contactParts.push(data.email);
  if (data.phone) contactParts.push(data.phone);
  if (data.location) contactParts.push(data.location);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          createTextRun(contactParts.join(" | "), {
            size: FONT_SIZES["text-sm"],
            color: COLORS.gray600,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: SPACING.lg },
      }),
    );
  }

  // Thick black divider
  children.push(
    new Paragraph({
      spacing: { after: SPACING.xl },
      border: {
        bottom: {
          color: primaryColor,
          size: 18,
          style: BorderStyle.SINGLE,
        },
      },
    }),
  );

  // Section heading helper with gray bottom border
  const createSectionHeading = (title: string): void => {
    children.push(
      new Paragraph({
        children: [
          createTextRun(title.toUpperCase(), {
            bold: true,
            size: FONT_SIZES["text-base"],
            color: COLORS.gray900,
          }),
        ],
        spacing: { after: SPACING.md },
        border: {
          bottom: {
            color: COLORS.gray400,
            size: 4,
            style: BorderStyle.SINGLE,
          },
        },
      }),
    );
  };

  // Summary
  if (data.summary && data.summary.trim().length > 0) {
    createSectionHeading("Summary");
    children.push(
      new Paragraph({
        children: [
          createTextRun(data.summary, {
            size: FONT_SIZES["text-sm"],
            color: COLORS.gray700,
          }),
        ],
        alignment: AlignmentType.BOTH,
        spacing: { after: SPACING["2xl"] },
      }),
    );
  }

  // Experience
  if (data.experience && data.experience.length > 0) {
    createSectionHeading("Professional Experience");

    data.experience.forEach((exp, idx) => {
      // Title
      children.push(
        new Paragraph({
          children: [
            createTextRun(exp.title || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
          ],
          spacing: { after: SPACING.xs },
        }),
      );

      // Company | Location | Period
      const companyLine: string[] = [];
      if (exp.company) companyLine.push(exp.company);
      if ((exp as any).location) companyLine.push((exp as any).location);
      if (exp.period) companyLine.push(exp.period);

      children.push(
        new Paragraph({
          children: [
            createTextRun(companyLine.join(" | "), {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
          ],
          spacing: { after: SPACING.sm },
        }),
      );

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          children.push(
            createBulletParagraph(bullet, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: SPACING.xs,
            }),
          );
        });
      }

      children.push(
        createSpacer(
          idx < data.experience!.length - 1 ? SPACING.lg : SPACING["2xl"],
        ),
      );
    });
  }

  // Skills (3-column grid, no bullets)
  if (data.skills && data.skills.length > 0) {
    createSectionHeading("Skills");

    const skillsPerColumn = Math.ceil(data.skills.length / 3);
    const col1 = data.skills.slice(0, skillsPerColumn);
    const col2 = data.skills.slice(skillsPerColumn, skillsPerColumn * 2);
    const col3 = data.skills.slice(skillsPerColumn * 2);

    const skillsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              borders: NO_CELL_BORDERS,
              children: col1.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      createTextRun(skill, {
                        size: FONT_SIZES["text-sm"],
                        color: COLORS.gray700,
                      }),
                    ],
                    spacing: { after: SPACING.sm },
                  }),
              ),
            }),
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              borders: NO_CELL_BORDERS,
              children:
                col2.length > 0
                  ? col2.map(
                      (skill) =>
                        new Paragraph({
                          children: [
                            createTextRun(skill, {
                              size: FONT_SIZES["text-sm"],
                              color: COLORS.gray700,
                            }),
                          ],
                          spacing: { after: SPACING.sm },
                        }),
                    )
                  : [new Paragraph({})],
            }),
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              borders: NO_CELL_BORDERS,
              children:
                col3.length > 0
                  ? col3.map(
                      (skill) =>
                        new Paragraph({
                          children: [
                            createTextRun(skill, {
                              size: FONT_SIZES["text-sm"],
                              color: COLORS.gray700,
                            }),
                          ],
                          spacing: { after: SPACING.sm },
                        }),
                    )
                  : [new Paragraph({})],
            }),
          ],
        }),
      ],
    });

    children.push(skillsTable);
    children.push(createSpacer(SPACING["2xl"]));
  }

  // Education
  if (data.education && data.education.length > 0) {
    createSectionHeading("Education");

    data.education.forEach((edu, idx) => {
      children.push(
        new Paragraph({
          children: [
            createTextRun(edu.degree || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
            new TextRun({ text: "\t" }),
            createTextRun(edu.period || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
          ],
          tabStops: [
            { type: "right" as const, position: convertInchesToTwip(7.5) },
          ],
          spacing: { after: SPACING.xs },
        }),
      );

      if (edu.institution) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(edu.institution, {
                size: FONT_SIZES["text-sm"],
                color: COLORS.gray700,
              }),
            ],
            spacing: { after: SPACING.sm },
          }),
        );
      }

      if (edu.details && edu.details.length > 0) {
        edu.details.forEach((detail) => {
          children.push(
            createBulletParagraph(detail, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: SPACING.xs,
            }),
          );
        });
      }

      children.push(
        createSpacer(
          idx < data.education!.length - 1 ? SPACING.lg : SPACING["2xl"],
        ),
      );
    });
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    createSectionHeading("Projects");

    data.projects.forEach((project, idx) => {
      children.push(
        new Paragraph({
          children: [
            createTextRun(project.name || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
            ...(project.period
              ? [
                  new TextRun({ text: "\t" }),
                  createTextRun(project.period, {
                    bold: true,
                    size: FONT_SIZES["text-sm"],
                    color: COLORS.black,
                  }),
                ]
              : []),
          ],
          tabStops: [
            { type: "right" as const, position: convertInchesToTwip(7.5) },
          ],
          spacing: { after: SPACING.xs },
        }),
      );

      if (project.organization) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(project.organization, {
                size: FONT_SIZES["text-sm"],
                color: COLORS.gray700,
              }),
            ],
            spacing: { after: SPACING.sm },
          }),
        );
      }

      if (project.details && project.details.length > 0) {
        project.details.forEach((detail) => {
          children.push(
            createBulletParagraph(detail, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: SPACING.xs,
            }),
          );
        });
      }

      children.push(
        createSpacer(
          idx < data.projects!.length - 1 ? SPACING.lg : SPACING["2xl"],
        ),
      );
    });
  }

  // Additional Information
  if (
    (data.languages && data.languages.length > 0) ||
    (data.certifications && data.certifications.length > 0)
  ) {
    createSectionHeading("Additional Information");

    if (data.languages && data.languages.length > 0) {
      children.push(
        new Paragraph({
          children: [
            createTextRun("Languages: ", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
            }),
            createTextRun(data.languages.join(", "), {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
            }),
          ],
          spacing: { after: SPACING.sm },
        }),
      );
    }

    if (data.certifications && data.certifications.length > 0) {
      children.push(
        new Paragraph({
          children: [
            createTextRun("Certifications: ", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
            }),
            createTextRun(data.certifications.join(", "), {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
            }),
          ],
          spacing: { after: SPACING.sm },
        }),
      );
    }
  }
}

// ============================================================================
// EXECUTIVE TEMPLATE
// Large name, amber/gold accents, centered header with title
// ============================================================================

function generateExecutiveTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
): void {
  const primaryColor = COLORS.executiveAmber;

  // Header - Large Name
  children.push(
    new Paragraph({
      children: [
        createTextRun((data.name || "Your Name").toUpperCase(), {
          bold: true,
          size: FONT_SIZES["text-4xl"],
          color: COLORS.gray900,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: SPACING.sm },
    }),
  );

  // Title
  if (data.title) {
    children.push(
      new Paragraph({
        children: [
          createTextRun(data.title.toUpperCase(), {
            bold: true,
            size: FONT_SIZES["text-xl"],
            color: COLORS.gray900,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: SPACING.md },
      }),
    );
  }

  // Contact info
  const contactParts: string[] = [];
  if (data.location) contactParts.push(data.location);
  if (data.email) contactParts.push(data.email);
  if (data.website) contactParts.push(data.website);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          createTextRun(contactParts.join(" | "), {
            size: FONT_SIZES["text-sm"],
            color: COLORS.gray600,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: SPACING.lg },
      }),
    );
  }

  // Gold divider
  children.push(
    new Paragraph({
      spacing: { after: SPACING["2xl"] },
      border: {
        bottom: {
          color: primaryColor,
          size: 12,
          style: BorderStyle.SINGLE,
        },
      },
    }),
  );

  // Section heading with gold bottom border
  const createSectionHeading = (title: string): void => {
    children.push(
      new Paragraph({
        children: [
          createTextRun(title.toUpperCase(), {
            bold: true,
            size: FONT_SIZES["text-base"],
            color: COLORS.gray900,
          }),
        ],
        spacing: { after: SPACING.md },
        border: {
          bottom: {
            color: primaryColor,
            size: 4,
            style: BorderStyle.SINGLE,
          },
        },
      }),
    );
  };

  // Summary
  if (data.summary && data.summary.trim().length > 0) {
    createSectionHeading("Summary");
    children.push(
      new Paragraph({
        children: [
          createTextRun(data.summary, {
            size: FONT_SIZES["text-sm"],
            color: COLORS.gray700,
          }),
        ],
        alignment: AlignmentType.BOTH,
        spacing: { after: SPACING["2xl"] },
      }),
    );
  }

  // Experience
  if (data.experience && data.experience.length > 0) {
    createSectionHeading("Professional Experience");

    data.experience.forEach((exp, idx) => {
      children.push(
        new Paragraph({
          children: [
            createTextRun(exp.title || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
          ],
          spacing: { after: SPACING.xs },
        }),
      );

      const companyLine: string[] = [];
      if (exp.company) companyLine.push(exp.company);
      if ((exp as any).location) companyLine.push((exp as any).location);
      if (exp.period) companyLine.push(exp.period);

      children.push(
        new Paragraph({
          children: [
            createTextRun(companyLine.join(" | "), {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
          ],
          spacing: { after: SPACING.sm },
        }),
      );

      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          children.push(
            createBulletParagraph(bullet, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: SPACING.xs,
            }),
          );
        });
      }

      children.push(
        createSpacer(
          idx < data.experience!.length - 1 ? SPACING.lg : SPACING["2xl"],
        ),
      );
    });
  }

  // Skills (3-column grid)
  if (data.skills && data.skills.length > 0) {
    createSectionHeading("Core Competencies");

    const skillsPerColumn = Math.ceil(data.skills.length / 3);
    const col1 = data.skills.slice(0, skillsPerColumn);
    const col2 = data.skills.slice(skillsPerColumn, skillsPerColumn * 2);
    const col3 = data.skills.slice(skillsPerColumn * 2);

    const skillsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              borders: NO_CELL_BORDERS,
              children: col1.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      createTextRun(skill, {
                        size: FONT_SIZES["text-sm"],
                        color: COLORS.gray700,
                      }),
                    ],
                    spacing: { after: SPACING.sm },
                  }),
              ),
            }),
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              borders: NO_CELL_BORDERS,
              children:
                col2.length > 0
                  ? col2.map(
                      (skill) =>
                        new Paragraph({
                          children: [
                            createTextRun(skill, {
                              size: FONT_SIZES["text-sm"],
                              color: COLORS.gray700,
                            }),
                          ],
                          spacing: { after: SPACING.sm },
                        }),
                    )
                  : [new Paragraph({})],
            }),
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              borders: NO_CELL_BORDERS,
              children:
                col3.length > 0
                  ? col3.map(
                      (skill) =>
                        new Paragraph({
                          children: [
                            createTextRun(skill, {
                              size: FONT_SIZES["text-sm"],
                              color: COLORS.gray700,
                            }),
                          ],
                          spacing: { after: SPACING.sm },
                        }),
                    )
                  : [new Paragraph({})],
            }),
          ],
        }),
      ],
    });

    children.push(skillsTable);
    children.push(createSpacer(SPACING["2xl"]));
  }

  // Education
  if (data.education && data.education.length > 0) {
    createSectionHeading("Education");

    data.education.forEach((edu, idx) => {
      children.push(
        new Paragraph({
          children: [
            createTextRun(edu.degree || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
            new TextRun({ text: "\t" }),
            createTextRun(edu.period || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
          ],
          tabStops: [
            { type: "right" as const, position: convertInchesToTwip(7.5) },
          ],
          spacing: { after: SPACING.xs },
        }),
      );

      if (edu.institution) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(edu.institution, {
                size: FONT_SIZES["text-sm"],
                color: COLORS.gray700,
              }),
            ],
            spacing: { after: SPACING.sm },
          }),
        );
      }

      if (edu.details && edu.details.length > 0) {
        edu.details.forEach((detail) => {
          children.push(
            createBulletParagraph(detail, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: SPACING.xs,
            }),
          );
        });
      }

      children.push(
        createSpacer(
          idx < data.education!.length - 1 ? SPACING.lg : SPACING["2xl"],
        ),
      );
    });
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    createSectionHeading("Key Projects");

    data.projects.forEach((project, idx) => {
      children.push(
        new Paragraph({
          children: [
            createTextRun(project.name || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
            ...(project.period
              ? [
                  new TextRun({ text: "\t" }),
                  createTextRun(project.period, {
                    bold: true,
                    size: FONT_SIZES["text-sm"],
                    color: COLORS.black,
                  }),
                ]
              : []),
          ],
          tabStops: [
            { type: "right" as const, position: convertInchesToTwip(7.5) },
          ],
          spacing: { after: SPACING.xs },
        }),
      );

      if (project.organization) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(project.organization, {
                size: FONT_SIZES["text-sm"],
                color: COLORS.gray700,
              }),
            ],
            spacing: { after: SPACING.sm },
          }),
        );
      }

      if (project.details && project.details.length > 0) {
        project.details.forEach((detail) => {
          children.push(
            createBulletParagraph(detail, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: SPACING.xs,
            }),
          );
        });
      }

      children.push(
        createSpacer(
          idx < data.projects!.length - 1 ? SPACING.lg : SPACING["2xl"],
        ),
      );
    });
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0) {
    createSectionHeading("Certifications");
    data.certifications.forEach((cert) => {
      children.push(
        createBulletParagraph(cert, {
          size: FONT_SIZES["text-sm"],
          color: COLORS.gray700,
          spacingAfter: SPACING.xs,
        }),
      );
    });
    children.push(createSpacer(SPACING["2xl"]));
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    createSectionHeading("Languages");
    children.push(
      new Paragraph({
        children: [
          createTextRun(data.languages.join(", "), {
            size: FONT_SIZES["text-sm"],
            color: COLORS.gray700,
          }),
        ],
      }),
    );
  }
}

// ============================================================================
// TECHNICAL TEMPLATE
// Blue name, top+bottom borders on headings, period in blue
// ============================================================================

function generateTechnicalTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
): void {
  const primaryColor = COLORS.technicalBlue;

  // Header - Name (blue)
  children.push(
    new Paragraph({
      children: [
        createTextRun((data.name || "Your Name").toUpperCase(), {
          bold: true,
          size: FONT_SIZES["text-3xl"],
          color: primaryColor,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: SPACING.md },
    }),
  );

  // Contact info
  const contactParts: string[] = [];
  if (data.email) contactParts.push(data.email);
  if (data.phone) contactParts.push(data.phone);
  if (data.location) contactParts.push(data.location);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          createTextRun(contactParts.join(" | "), {
            size: FONT_SIZES["text-sm"],
            color: COLORS.gray600,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: SPACING["2xl"] },
      }),
    );
  }

  // Section heading with TOP and BOTTOM blue borders
  const createSectionHeading = (title: string): void => {
    children.push(
      new Paragraph({
        children: [
          createTextRun(title.toUpperCase(), {
            bold: true,
            size: FONT_SIZES["text-base"],
            color: primaryColor,
          }),
        ],
        spacing: { before: SPACING.sm, after: SPACING.sm },
        border: {
          top: {
            color: primaryColor,
            size: 4,
            style: BorderStyle.SINGLE,
          },
          bottom: {
            color: primaryColor,
            size: 4,
            style: BorderStyle.SINGLE,
          },
        },
      }),
    );
    children.push(createSpacer(SPACING.md));
  };

  // Summary
  if (data.summary && data.summary.trim().length > 0) {
    createSectionHeading("Summary");
    children.push(
      new Paragraph({
        children: [
          createTextRun(data.summary, {
            size: FONT_SIZES["text-sm"],
            color: COLORS.gray700,
          }),
        ],
        alignment: AlignmentType.BOTH,
        spacing: { after: SPACING["2xl"] },
      }),
    );
  }

  // Technical Skills (BEFORE experience) - 3-column grid
  if (data.skills && data.skills.length > 0) {
    createSectionHeading("Technical Skills");

    const skillsPerColumn = Math.ceil(data.skills.length / 3);
    const col1 = data.skills.slice(0, skillsPerColumn);
    const col2 = data.skills.slice(skillsPerColumn, skillsPerColumn * 2);
    const col3 = data.skills.slice(skillsPerColumn * 2);

    const skillsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              borders: NO_CELL_BORDERS,
              children: col1.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      createTextRun(skill, {
                        size: FONT_SIZES["text-sm"],
                        color: COLORS.gray700,
                      }),
                    ],
                    spacing: { after: SPACING.sm },
                  }),
              ),
            }),
            new TableCell({
              width: { size: 33, type: WidthType.PERCENTAGE },
              borders: NO_CELL_BORDERS,
              children:
                col2.length > 0
                  ? col2.map(
                      (skill) =>
                        new Paragraph({
                          children: [
                            createTextRun(skill, {
                              size: FONT_SIZES["text-sm"],
                              color: COLORS.gray700,
                            }),
                          ],
                          spacing: { after: SPACING.sm },
                        }),
                    )
                  : [new Paragraph({})],
            }),
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              borders: NO_CELL_BORDERS,
              children:
                col3.length > 0
                  ? col3.map(
                      (skill) =>
                        new Paragraph({
                          children: [
                            createTextRun(skill, {
                              size: FONT_SIZES["text-sm"],
                              color: COLORS.gray700,
                            }),
                          ],
                          spacing: { after: SPACING.sm },
                        }),
                    )
                  : [new Paragraph({})],
            }),
          ],
        }),
      ],
    });

    children.push(skillsTable);
    children.push(createSpacer(SPACING["2xl"]));
  }

  // Professional Experience (period in BLUE)
  if (data.experience && data.experience.length > 0) {
    createSectionHeading("Professional Experience");

    data.experience.forEach((exp, idx) => {
      children.push(
        new Paragraph({
          children: [
            createTextRun(exp.title || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
          ],
          spacing: { after: SPACING.xs },
        }),
      );

      // Company | Location | Period (period in blue)
      const companyParts: TextRun[] = [];
      const textParts: string[] = [];
      if (exp.company) textParts.push(exp.company);
      if ((exp as any).location) textParts.push((exp as any).location);

      if (textParts.length > 0) {
        companyParts.push(
          createTextRun(textParts.join(" | ") + (exp.period ? " | " : ""), {
            bold: true,
            size: FONT_SIZES["text-sm"],
            color: COLORS.black,
          }),
        );
      }

      if (exp.period) {
        companyParts.push(
          createTextRun(exp.period, {
            bold: true,
            size: FONT_SIZES["text-sm"],
            color: primaryColor, // BLUE period
          }),
        );
      }

      children.push(
        new Paragraph({
          children: companyParts,
          spacing: { after: SPACING.sm },
        }),
      );

      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          children.push(
            createBulletParagraph(bullet, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: SPACING.xs,
            }),
          );
        });
      }

      children.push(
        createSpacer(
          idx < data.experience!.length - 1 ? SPACING.lg : SPACING["2xl"],
        ),
      );
    });
  }

  // Education (period in blue)
  if (data.education && data.education.length > 0) {
    createSectionHeading("Education");

    data.education.forEach((edu, idx) => {
      children.push(
        new Paragraph({
          children: [
            createTextRun(edu.degree || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: COLORS.black,
            }),
            new TextRun({ text: "\t" }),
            createTextRun(edu.period || "", {
              bold: true,
              size: FONT_SIZES["text-sm"],
              color: primaryColor, // BLUE period
            }),
          ],
          tabStops: [
            { type: "right" as const, position: convertInchesToTwip(7.5) },
          ],
          spacing: { after: SPACING.xs },
        }),
      );

      if (edu.institution) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(edu.institution, {
                size: FONT_SIZES["text-sm"],
                color: COLORS.gray700,
              }),
            ],
            spacing: { after: SPACING.sm },
          }),
        );
      }

      if (edu.details && edu.details.length > 0) {
        edu.details.forEach((detail) => {
          children.push(
            createBulletParagraph(detail, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: SPACING.xs,
            }),
          );
        });
      }

      children.push(
        createSpacer(
          idx < data.education!.length - 1 ? SPACING.lg : SPACING["2xl"],
        ),
      );
    });
  }

  // Projects (period in blue)
  if (data.projects && data.projects.length > 0) {
    createSectionHeading("Projects");

    data.projects.forEach((project, idx) => {
      const projectNameParts: TextRun[] = [
        createTextRun(project.name || "", {
          bold: true,
          size: FONT_SIZES["text-sm"],
          color: COLORS.black,
        }),
      ];

      if (project.period) {
        projectNameParts.push(new TextRun({ text: "\t" }));
        projectNameParts.push(
          createTextRun(project.period, {
            bold: true,
            size: FONT_SIZES["text-sm"],
            color: primaryColor, // BLUE period
          }),
        );
      }

      children.push(
        new Paragraph({
          children: projectNameParts,
          tabStops: [
            { type: "right" as const, position: convertInchesToTwip(7.5) },
          ],
          spacing: { after: SPACING.xs },
        }),
      );

      if (project.organization) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(project.organization, {
                size: FONT_SIZES["text-sm"],
                color: COLORS.gray700,
              }),
            ],
            spacing: { after: SPACING.sm },
          }),
        );
      }

      if (project.details && project.details.length > 0) {
        project.details.forEach((detail) => {
          children.push(
            createBulletParagraph(detail, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: SPACING.xs,
            }),
          );
        });
      }

      children.push(
        createSpacer(
          idx < data.projects!.length - 1 ? SPACING.lg : SPACING["2xl"],
        ),
      );
    });
  }

  // Additional Information
  if (
    (data.languages && data.languages.length > 0) ||
    (data.certifications && data.certifications.length > 0)
  ) {
    createSectionHeading("Additional Information");

    if (data.languages && data.languages.length > 0) {
      children.push(
        createBulletParagraph(`Languages: ${data.languages.join(", ")}.`, {
          size: FONT_SIZES["text-sm"],
          color: COLORS.gray700,
          spacingAfter: SPACING.xs,
        }),
      );
    }

    if (data.certifications && data.certifications.length > 0) {
      children.push(
        createBulletParagraph(
          `Certifications: ${data.certifications.join(", ")}.`,
          {
            size: FONT_SIZES["text-sm"],
            color: COLORS.gray700,
            spacingAfter: SPACING.xs,
          },
        ),
      );
    }
  }
}

// ============================================================================
// PDF DOWNLOAD (existing implementation)
// ============================================================================

export async function downloadResumeAsPDF(
  element: HTMLElement,
  filename: string = "resume.pdf",
): Promise<void> {
  console.log("[downloadResume] Starting PDF generation for:", filename);

  try {
    const gradientHeaders = element.querySelectorAll("h1");
    const originalStyles: {
      element: HTMLElement;
      originalClass: string;
      originalColor: string;
    }[] = [];

    gradientHeaders.forEach((header) => {
      const htmlHeader = header as HTMLElement;
      if (
        htmlHeader.className.includes("bg-clip-text") ||
        htmlHeader.className.includes("text-transparent")
      ) {
        originalStyles.push({
          element: htmlHeader,
          originalClass: htmlHeader.className,
          originalColor: htmlHeader.style.color || "",
        });
        htmlHeader.className = htmlHeader.className
          .replace(/bg-gradient-to-r\s+from-\[#[^\]]+\]\s+to-\[#[^\]]+\]/g, "")
          .replace(/bg-clip-text/g, "")
          .replace(/text-transparent/g, "")
          .trim();
        htmlHeader.style.color = "#2563eb";
        htmlHeader.style.webkitBackgroundClip = "unset";
        htmlHeader.style.backgroundClip = "unset";
      }
    });

    const minHeightElements = element.querySelectorAll('[class*="min-h-"]');
    const originalMinHeights: {
      element: HTMLElement;
      originalStyle: string;
    }[] = [];

    minHeightElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style.minHeight || htmlEl.className.includes("min-h-")) {
        originalMinHeights.push({
          element: htmlEl,
          originalStyle: htmlEl.style.cssText,
        });
        htmlEl.style.minHeight = "auto";
        htmlEl.className = htmlEl.className
          .replace(/min-h-\[?\d+[^\s]*\]?/g, "")
          .trim();
      }
    });

    const spaceYElements = element.querySelectorAll('[class*="space-y-"]');
    const originalSpaceY: { element: HTMLElement; originalClass: string }[] =
      [];
    spaceYElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.className.includes("space-y-5")) {
        originalSpaceY.push({
          element: htmlEl,
          originalClass: htmlEl.className,
        });
        htmlEl.className = htmlEl.className.replace(/space-y-5/g, "space-y-2");
      }
    });

    const headerElements = element.querySelectorAll(
      '[class*="mb-"], [class*="my-"], [class*="mt-"]',
    );
    const originalHeaderSpacing: {
      element: HTMLElement;
      originalClass: string;
    }[] = [];
    headerElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const className = htmlEl.className;
      if (
        className.includes("mb-2") ||
        className.includes("mb-4") ||
        className.includes("mb-6")
      ) {
        originalHeaderSpacing.push({
          element: htmlEl,
          originalClass: className,
        });
        htmlEl.className = className
          .replace(/mb-2/g, "mb-1")
          .replace(/mb-4/g, "mb-2")
          .replace(/mb-6/g, "mb-3");
      }
      if (className.includes("my-4") || className.includes("my-6")) {
        if (!originalHeaderSpacing.find((e) => e.element === htmlEl)) {
          originalHeaderSpacing.push({
            element: htmlEl,
            originalClass: className,
          });
        }
        htmlEl.className = htmlEl.className
          .replace(/my-4/g, "my-2")
          .replace(/my-6/g, "my-3");
      }
    });

    const paddedElements = element.querySelectorAll('[class*="p-8"]');
    const originalPadding: { element: HTMLElement; originalClass: string }[] =
      [];
    paddedElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.className.includes("p-8")) {
        originalPadding.push({
          element: htmlEl,
          originalClass: htmlEl.className,
        });
        htmlEl.className = htmlEl.className.replace(/p-8/g, "p-4");
      }
    });

    const overflowElements = element.querySelectorAll("*");
    const originalOverflows: {
      element: HTMLElement;
      originalOverflow: string;
      originalTextOverflow: string;
      originalWhiteSpace: string;
    }[] = [];

    overflowElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const style = window.getComputedStyle(htmlEl);
      if (
        style.overflow === "hidden" ||
        style.textOverflow === "ellipsis" ||
        style.whiteSpace === "nowrap"
      ) {
        originalOverflows.push({
          element: htmlEl,
          originalOverflow: htmlEl.style.overflow || "",
          originalTextOverflow: htmlEl.style.textOverflow || "",
          originalWhiteSpace: htmlEl.style.whiteSpace || "",
        });
        htmlEl.style.overflow = "visible";
        htmlEl.style.textOverflow = "clip";
        htmlEl.style.whiteSpace = "normal";
      }
    });

    const originalElementOverflow = element.style.overflow;
    const originalElementOverflowX = element.style.overflowX;
    const originalElementOverflowY = element.style.overflowY;
    element.style.overflow = "visible";
    element.style.overflowX = "visible";
    element.style.overflowY = "visible";

    await new Promise((resolve) => {
      void element.offsetHeight;
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const html2pdf = (await import("html2pdf.js")).default;

    const elementHeight = Math.max(
      element.scrollHeight,
      element.offsetHeight,
      element.clientHeight,
    );
    const elementWidth = Math.max(
      element.scrollWidth,
      element.offsetWidth,
      element.clientWidth,
    );

    const opt = {
      margin: [5, 5, 5, 5] as [number, number, number, number],
      filename: filename,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        width: elementWidth,
        height: elementHeight,
        windowWidth: elementWidth,
        windowHeight: elementHeight,
        allowTaint: true,
        backgroundColor: "#ffffff",
        removeContainer: false,
        onclone: (clonedDoc: any) => {
          if (clonedDoc && typeof clonedDoc.querySelectorAll === "function") {
            const allElements = clonedDoc.querySelectorAll("*");
            allElements.forEach((el: any) => {
              if (el instanceof HTMLElement) {
                el.style.overflow = "visible";
                el.style.overflowX = "visible";
                el.style.overflowY = "visible";
                if (el.style.textOverflow === "ellipsis")
                  el.style.textOverflow = "clip";
                if (el.style.whiteSpace === "nowrap")
                  el.style.whiteSpace = "normal";
              }
            });
          }
        },
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait" as const,
        compress: true,
        putOnlyUsedFonts: true,
        floatPrecision: 16,
      },
      pagebreak: { mode: ["css", "legacy"], avoid: [".avoid-break"] },
    };

    await html2pdf().set(opt).from(element).save();

    // Restore styles
    originalStyles.forEach(({ element: el, originalClass, originalColor }) => {
      el.className = originalClass;
      el.style.color = originalColor || "";
      el.style.webkitBackgroundClip = "";
      el.style.backgroundClip = "";
    });
    originalMinHeights.forEach(({ element: el, originalStyle }) => {
      el.style.cssText = originalStyle;
    });
    originalSpaceY.forEach(({ element: el, originalClass }) => {
      el.className = originalClass;
    });
    originalHeaderSpacing.forEach(({ element: el, originalClass }) => {
      el.className = originalClass;
    });
    originalPadding.forEach(({ element: el, originalClass }) => {
      el.className = originalClass;
    });
    originalOverflows.forEach(
      ({
        element: el,
        originalOverflow,
        originalTextOverflow,
        originalWhiteSpace,
      }) => {
        el.style.overflow = originalOverflow;
        el.style.textOverflow = originalTextOverflow;
        el.style.whiteSpace = originalWhiteSpace;
      },
    );
    element.style.overflow = originalElementOverflow;
    element.style.overflowX = originalElementOverflowX;
    element.style.overflowY = originalElementOverflowY;
  } catch (error) {
    console.error("[downloadResume] Error generating PDF:", error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
