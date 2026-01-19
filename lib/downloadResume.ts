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

const ZERO_CELL_MARGINS = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

/**
 * Robust "left text + right text" line that NEVER pushes the right text to the next line.
 * Uses a fixed-layout 2-cell table instead of tabs (tabs can wrap on long left text).
 */
function createLeftRightLine(
  left: string,
  right: string,
  options: {
    leftBold?: boolean;
    rightBold?: boolean;
    leftColor?: string;
    rightColor?: string;
    leftSize?: number;
    rightSize?: number;
    spacingAfter?: number;
    rightColPercent?: number; // default 35 when left exists
  } = {},
): Table {
  const leftText = (left ?? "").trim();
  const rightText = (right ?? "").trim();

  const after = options.spacingAfter ?? SPACING.xs;

  const rightPara = new Paragraph({
    children: [
      createTextRun(rightText, {
        bold: options.rightBold,
        size: options.rightSize ?? FONT_SIZES["text-sm"],
        color: options.rightColor ?? COLORS.black,
      }),
    ],
    alignment: AlignmentType.RIGHT,
    spacing: { after },
    keepNext: true,
  });

  // ✅ If left is empty, use ONE full-width cell (no fake left column spacing)
  if (!leftText) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: NO_CELL_BORDERS,
              margins: ZERO_CELL_MARGINS,
              verticalAlign: VerticalAlign.TOP,
              children: [rightPara],
            }),
          ],
        }),
      ],
    });
  }

  // Normal case: left + right in two columns
  const rightPct = Math.min(45, Math.max(25, options.rightColPercent ?? 35));
  const leftPct = 100 - rightPct;

  const leftPara = new Paragraph({
    children: [
      createTextRun(leftText, {
        bold: options.leftBold,
        size: options.leftSize ?? FONT_SIZES["text-sm"],
        color: options.leftColor ?? COLORS.black,
      }),
    ],
    spacing: { after },
    keepNext: true,
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: leftPct, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
            margins: ZERO_CELL_MARGINS,
            verticalAlign: VerticalAlign.TOP,
            children: [leftPara],
          }),
          new TableCell({
            width: { size: rightPct, type: WidthType.PERCENTAGE },
            borders: NO_CELL_BORDERS,
            margins: ZERO_CELL_MARGINS,
            verticalAlign: VerticalAlign.TOP,
            children: [rightPara],
          }),
        ],
      }),
    ],
  });
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

  // Blue divider line
  children.push(
    new Paragraph({
      spacing: { after: SPACING["2xl"] },
      border: {
        bottom: {
          color: primaryColor,
          size: 4, // thin line
          style: BorderStyle.SINGLE,
        },
      },
    }),
  );

  // ==================== TWO-COLUMN SECTION HELPER ====================
  // Left column: ~1.75 inches for section label (increased for better spacing)
  // Right column: remaining space for content
  const LEFT_COL_WIDTH = 2520; // ~1.75 inches in twips
  const RIGHT_COL_WIDTH = 8280; // Remaining width in twips (total ~10800 for 7.5" content area)

  const createTwoColumnSection = (
    heading: string | string[], // Can be multiline like "WORK\nEXPERIENCE"
    contentBlocks: (Paragraph | Table)[],
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
                contentBlocks.length > 0 ? contentBlocks : [new Paragraph({})],
            }),
          ],
        }),
      ],
    });
  };

  // Section divider - very thin blue line
  const addSectionDivider = (): void => {
    children.push(
      new Paragraph({
        spacing: { before: SPACING.xl, after: SPACING.xl },
        border: {
          bottom: {
            color: primaryColor,
            size: 2, // very thin line
            style: BorderStyle.SINGLE,
          },
        },
      }),
    );
  };

  // ==================== SUMMARY SECTION ====================
  if (data.summary && data.summary.trim().length > 0) {
    const summaryContent: (Paragraph | Table)[] = [
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
    const expContent: (Paragraph | Table)[] = [];

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
          keepNext: true, // Keep with next line to avoid orphans
        }),
      );

      // Line 2: Company | Location (left) AND Period (right) - FIXED (no wrap)
      const companyParts: string[] = [];
      if (exp.company) companyParts.push(exp.company);
      if ((exp as any).location) companyParts.push((exp as any).location);

      const left = companyParts.join(" | ");
      const right = exp.period || "";

      if (right) {
        expContent.push(
          createLeftRightLine(left, right, {
            leftBold: true,
            rightBold: true,
            leftColor: COLORS.black,
            rightColor: COLORS.black,
            leftSize: FONT_SIZES["text-sm"],
            rightSize: FONT_SIZES["text-sm"],
            spacingAfter: SPACING.xs,
            rightColPercent: 35, // give the date enough space so it never wraps
          }),
        );
      } else {
        // No period: just a normal paragraph
        expContent.push(
          new Paragraph({
            children: [
              createTextRun(left, {
                bold: true,
                size: FONT_SIZES["text-sm"],
                color: COLORS.black,
              }),
            ],
            spacing: { after: SPACING.xs },
            keepNext: true,
          }),
        );
      }

      const isLastExp = idx === data.experience!.length - 1;
      const gapAfterExp = isLastExp ? SPACING["2xl"] : SPACING.sm;

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet, bIdx) => {
          const isLastBullet = bIdx === exp.bullets!.length - 1;
          expContent.push(
            // ✅ FIX
            createBulletParagraph(bullet, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: isLastBullet ? gapAfterExp : SPACING.xs,
            }),
          );
        });
      }

      // // Spacing between experiences
      // if (idx < data.experience!.length - 1) {
      //   const hasBullets = !!(exp.bullets && exp.bullets.length > 0);
      //   expContent.push(createSpacer(hasBullets ? SPACING.lg : SPACING.sm));
      // }
    });

    children.push(createTwoColumnSection(["WORK", "EXPERIENCE"], expContent));
    addSectionDivider();
  }

  // ==================== EDUCATION SECTION ====================
  if (data.education && data.education.length > 0) {
    const eduContent: (Paragraph | Table)[] = [];

    data.education.forEach((edu, idx) => {
      // Degree (left) and period (right) - FIXED (no wrap)
      const left = edu.degree || "";
      const right = edu.period || "";

      if (right) {
        eduContent.push(
          createLeftRightLine(left, right, {
            leftBold: true,
            rightBold: true,
            leftColor: COLORS.black,
            rightColor: COLORS.black,
            spacingAfter: SPACING.xs,
            rightColPercent: 35,
          }),
        );
      } else {
        eduContent.push(
          new Paragraph({
            children: [
              createTextRun(left, {
                bold: true,
                size: FONT_SIZES["text-sm"],
                color: COLORS.black,
              }),
            ],
            spacing: { after: SPACING.xs },
            keepNext: true,
          }),
        );
      }

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
            spacing: { after: SPACING.xs }, // Reduced from SPACING.sm
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
        eduContent.push(createSpacer(SPACING.md)); // Reduced from SPACING.lg
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
    const projectContent: (Paragraph | Table)[] = [];

    data.projects.forEach((project, idx) => {
      const left = project.name || "";
      const right = project.period || "";

      // Project name (left) and period (right) - FIXED (no wrap)
      if (right) {
        projectContent.push(
          createLeftRightLine(left, right, {
            leftBold: true,
            rightBold: true,
            leftColor: COLORS.black,
            rightColor: COLORS.black,
            spacingAfter: SPACING.xs,
            rightColPercent: 35,
          }),
        );
      } else {
        projectContent.push(
          new Paragraph({
            children: [
              createTextRun(left, {
                bold: true,
                size: FONT_SIZES["text-sm"],
                color: COLORS.black,
              }),
            ],
            spacing: { after: SPACING.xs },
          }),
        );
      }

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
    const certContent: (Paragraph | Table)[] = data.certifications.map((cert) =>
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
    const langContent: (Paragraph | Table)[] = [
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

  // Black divider
  children.push(
    new Paragraph({
      spacing: { after: SPACING.xl },
      border: {
        bottom: {
          color: primaryColor,
          size: 4, // thin line
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
            size: 2, // very thin line
            style: BorderStyle.SINGLE,
          },
        },
        keepNext: true, // Keep with next paragraph
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
          keepNext: true, // Keep with next line
        }),
      );

      // Company | Location (left) and Period (right) - FIXED (no wrap)
      const leftParts: string[] = [];
      if (exp.company) leftParts.push(exp.company);
      if ((exp as any).location) leftParts.push((exp as any).location);

      const left = leftParts.join(" | ");
      const right = exp.period || "";

      if (right) {
        children.push(
          createLeftRightLine(left, right, {
            leftBold: true,
            rightBold: true,
            leftColor: COLORS.black,
            rightColor: COLORS.black,
            spacingAfter: SPACING.xs,
            rightColPercent: 35,
          }),
        );
      } else if (left) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(left, {
                bold: true,
                size: FONT_SIZES["text-sm"],
                color: COLORS.black,
              }),
            ],
            spacing: { after: SPACING.xs },
            keepNext: true,
          }),
        );
      }

      const isLastExp = idx === data.experience!.length - 1;
      const gapAfterExp = isLastExp ? SPACING["2xl"] : SPACING.sm;

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet, bIdx) => {
          const isLastBullet = bIdx === exp.bullets!.length - 1;
          children.push(
            createBulletParagraph(bullet, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: isLastBullet ? gapAfterExp : SPACING.xs,
            }),
          );
        });
      } else {
        // No bullets: put the spacing on the company/date line instead
        // (make sure your createLeftRightLine call uses spacingAfter: gapAfterExp)
      }

      // children.push(
      //   createSpacer(
      //     idx < data.experience!.length - 1 ? SPACING.lg : SPACING["2xl"],
      //   ),
      // );
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
      // Degree (left) and period (right) - FIXED (no wrap)
      const left = edu.degree || "";
      const right = edu.period || "";
      if (right) {
        children.push(
          createLeftRightLine(left, right, {
            leftBold: true,
            rightBold: true,
            leftColor: COLORS.black,
            rightColor: COLORS.black,
            spacingAfter: SPACING.xs,
            rightColPercent: 35,
          }),
        );
      } else {
        children.push(
          new Paragraph({
            children: [
              createTextRun(left, {
                bold: true,
                size: FONT_SIZES["text-sm"],
                color: COLORS.black,
              }),
            ],
            spacing: { after: SPACING.xs },
            keepNext: true,
          }),
        );
      }

      if (edu.institution) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(edu.institution, {
                size: FONT_SIZES["text-sm"],
                color: COLORS.gray700,
              }),
            ],
            spacing: { after: SPACING.xs }, // Reduced from SPACING.sm
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
          idx < data.education!.length - 1 ? SPACING.md : SPACING["2xl"], // Reduced from SPACING.lg
        ),
      );
    });
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    createSectionHeading("Projects");

    data.projects.forEach((project, idx) => {
      const left = project.name || "";
      const right = project.period || "";

      // Project name (left) and period (right) - FIXED (no wrap)
      if (right) {
        children.push(
          createLeftRightLine(left, right, {
            leftBold: true,
            rightBold: true,
            leftColor: COLORS.black,
            rightColor: COLORS.black,
            spacingAfter: SPACING.xs,
            rightColPercent: 35,
          }),
        );
      } else {
        children.push(
          new Paragraph({
            children: [
              createTextRun(left, {
                bold: true,
                size: FONT_SIZES["text-sm"],
                color: COLORS.black,
              }),
            ],
            spacing: { after: SPACING.xs },
          }),
        );
      }

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
          size: 4, // thin line
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
            size: 2, // very thin line
            style: BorderStyle.SINGLE,
          },
        },
        keepNext: true, // Keep with next paragraph
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
          keepNext: true, // Keep with next line
        }),
      );

      // Company | Location (left) and Period (right) - FIXED (no wrap)
      const leftParts: string[] = [];
      if (exp.company) leftParts.push(exp.company);
      if ((exp as any).location) leftParts.push((exp as any).location);

      const left = leftParts.join(" | ");
      const right = exp.period || "";

      if (right) {
        children.push(
          createLeftRightLine(left, right, {
            leftBold: true,
            rightBold: true,
            leftColor: COLORS.black,
            rightColor: COLORS.black,
            spacingAfter: SPACING.xs,
            rightColPercent: 35,
          }),
        );
      } else if (left) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(left, {
                bold: true,
                size: FONT_SIZES["text-sm"],
                color: COLORS.black,
              }),
            ],
            spacing: { after: SPACING.xs },
            keepNext: true,
          }),
        );
      }

      const isLastExp = idx === data.experience!.length - 1;
      const gapAfterExp = isLastExp ? SPACING["2xl"] : SPACING.sm;

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet, bIdx) => {
          const isLastBullet = bIdx === exp.bullets!.length - 1;
          children.push(
            createBulletParagraph(bullet, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: isLastBullet ? gapAfterExp : SPACING.xs,
            }),
          );
        });
      } else {
        // No bullets: put the spacing on the company/date line instead
        // (make sure your createLeftRightLine call uses spacingAfter: gapAfterExp)
      }

      // children.push(
      //   createSpacer(
      //     idx < data.experience!.length - 1 ? SPACING.lg : SPACING["2xl"],
      //   ),
      // );
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
      const left = edu.degree || "";
      const right = edu.period || "";

      // Degree (left) and period (right) - FIXED (no wrap)
      if (right) {
        children.push(
          createLeftRightLine(left, right, {
            leftBold: true,
            rightBold: true,
            leftColor: COLORS.black,
            rightColor: COLORS.black,
            spacingAfter: SPACING.xs,
            rightColPercent: 35,
          }),
        );
      } else {
        children.push(
          new Paragraph({
            children: [
              createTextRun(left, {
                bold: true,
                size: FONT_SIZES["text-sm"],
                color: COLORS.black,
              }),
            ],
            spacing: { after: SPACING.xs },
            keepNext: true,
          }),
        );
      }

      if (edu.institution) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(edu.institution, {
                size: FONT_SIZES["text-sm"],
                color: COLORS.gray700,
              }),
            ],
            spacing: { after: SPACING.xs }, // Reduced from SPACING.sm
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
          idx < data.education!.length - 1 ? SPACING.md : SPACING["2xl"], // Reduced from SPACING.lg
        ),
      );
    });
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    createSectionHeading("Key Projects");

    data.projects.forEach((project, idx) => {
      const left = project.name || "";
      const right = project.period || "";

      // Project name (left) and period (right) - FIXED (no wrap)
      if (right) {
        children.push(
          createLeftRightLine(left, right, {
            leftBold: true,
            rightBold: true,
            leftColor: COLORS.black,
            rightColor: COLORS.black,
            spacingAfter: SPACING.xs,
            rightColPercent: 35,
          }),
        );
      } else {
        children.push(
          new Paragraph({
            children: [
              createTextRun(left, {
                bold: true,
                size: FONT_SIZES["text-sm"],
                color: COLORS.black,
              }),
            ],
            spacing: { after: SPACING.xs },
          }),
        );
      }

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
        // ✅ control spacing here instead of using createSpacer()
        spacing: { before: SPACING.sm, after: SPACING.md },
        border: {
          top: {
            color: primaryColor,
            size: 2,
            style: BorderStyle.SINGLE,
          },
          bottom: {
            color: primaryColor,
            size: 2,
            style: BorderStyle.SINGLE,
          },
        },
        keepNext: true,
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

  // Professional Experience (period in BLUE) - FIXED (no wrap)
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
          keepNext: true,
        }),
      );

      const leftParts: string[] = [];
      if (exp.company) leftParts.push(exp.company);
      if ((exp as any).location) leftParts.push((exp as any).location);

      const left = leftParts.join(" | ");
      const right = exp.period || "";

      if (right) {
        children.push(
          createLeftRightLine(left, right, {
            leftBold: true,
            rightBold: true,
            leftColor: COLORS.black,
            rightColor: primaryColor, // BLUE period
            spacingAfter: SPACING.xs,
            rightColPercent: 35,
          }),
        );
      } else if (left) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(left, {
                bold: true,
                size: FONT_SIZES["text-sm"],
                color: COLORS.black,
              }),
            ],
            spacing: { after: SPACING.xs },
            keepNext: true,
          }),
        );
      }

      const isLastExp = idx === data.experience!.length - 1;
      const gapAfterExp = isLastExp ? SPACING["2xl"] : SPACING.sm;

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet, bIdx) => {
          const isLastBullet = bIdx === exp.bullets!.length - 1;
          children.push(
            createBulletParagraph(bullet, {
              size: FONT_SIZES["text-sm"],
              color: COLORS.gray700,
              spacingAfter: isLastBullet ? gapAfterExp : SPACING.xs,
            }),
          );
        });
      } else {
        // No bullets: put the spacing on the company/date line instead
        // (make sure your createLeftRightLine call uses spacingAfter: gapAfterExp)
      }

      // children.push(
      //   createSpacer(
      //     idx < data.experience!.length - 1 ? SPACING.lg : SPACING["2xl"],
      //   ),
      // );
    });
  }

  // Education (period in blue) - FIXED (no wrap)
  if (data.education && data.education.length > 0) {
    createSectionHeading("Education");

    data.education.forEach((edu, idx) => {
      const left = edu.degree || "";
      const right = edu.period || "";

      if (right) {
        children.push(
          createLeftRightLine(left, right, {
            leftBold: true,
            rightBold: true,
            leftColor: COLORS.black,
            rightColor: primaryColor, // BLUE period
            spacingAfter: SPACING.xs,
            rightColPercent: 35,
          }),
        );
      } else {
        children.push(
          new Paragraph({
            children: [
              createTextRun(left, {
                bold: true,
                size: FONT_SIZES["text-sm"],
                color: COLORS.black,
              }),
            ],
            spacing: { after: SPACING.xs },
            keepNext: true,
          }),
        );
      }

      if (edu.institution) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(edu.institution, {
                size: FONT_SIZES["text-sm"],
                color: COLORS.gray700,
              }),
            ],
            spacing: { after: SPACING.xs },
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
          idx < data.education!.length - 1 ? SPACING.md : SPACING["2xl"],
        ),
      );
    });
  }

  // Projects (period in blue) - FIXED (no wrap)
  if (data.projects && data.projects.length > 0) {
    createSectionHeading("Projects");

    data.projects.forEach((project, idx) => {
      const left = project.name || "";
      const right = project.period || "";

      if (right) {
        children.push(
          createLeftRightLine(left, right, {
            leftBold: true,
            rightBold: true,
            leftColor: COLORS.black,
            rightColor: primaryColor, // BLUE period
            spacingAfter: SPACING.xs,
            rightColPercent: 35,
          }),
        );
      } else {
        children.push(
          new Paragraph({
            children: [
              createTextRun(left, {
                bold: true,
                size: FONT_SIZES["text-sm"],
                color: COLORS.black,
              }),
            ],
            spacing: { after: SPACING.xs },
          }),
        );
      }

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
