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
  Tab,
  TabStopType,
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
import { classicStyle, modernStyle, executiveStyle } from "./templateStyles";

// ============================================================================
// FONT & SIZE CONFIGURATION
// ============================================================================

// Font families for different templates
const FONT_FAMILIES = {
  serif: "Times New Roman",      // Classic template - matches golden reference
  sansSerif: "Arial",            // Modern/Executive templates
};

// Default font (for backwards compatibility)
const FONT_FAMILY = FONT_FAMILIES.sansSerif;

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

// Classic template sizes (matching golden reference - uses points × 2 for half-points)
const CLASSIC_SIZES = {
  name: 36,           // 18pt
  sectionHeading: 22, // 11pt
  body: 20,           // 10pt
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
  classicBlue: "004080", // Navy blue
  modernBlack: "222222", // Near black
  executiveAmber: "8B4513", // Saddle brown

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
    {
      reference: "resume-bullets-hollow",
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "◦",
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: {
              indent: {
                left: convertInchesToTwip(0.25),
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
    bulletStyle?: "solid" | "hollow";
    font?: string;
  } = {},
): Paragraph {
  const bulletRef = options.bulletStyle === "hollow" ? "resume-bullets-hollow" : "resume-bullets";
  return new Paragraph({
    numbering: { reference: bulletRef, level: 0 },
    children: [
      createTextRun(text, {
        size: options.size || FONT_SIZES["text-sm"],
        color: options.color || COLORS.gray700,
        font: options.font,
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
    rightColPercent?: number; // unused, kept for API compatibility
    font?: string; // Font family override
    contentWidthTwips?: number; // Content width in twips
  } = {},
): Paragraph {
  const leftText = (left ?? "").trim();
  const rightText = (right ?? "").trim();
  const fontFamily = options.font ?? FONT_FAMILY;

  const after = options.spacingAfter ?? SPACING.xs;

  // Use tab stops for Google Docs compatibility
  // Content width: 6.77" (A4 with 0.75" margins) = 9749 twips
  const totalWidth = options.contentWidthTwips ?? convertInchesToTwip(6.77);

  // If left is empty, just right-align the text
  if (!leftText) {
    return new Paragraph({
      children: [
        createTextRun(rightText, {
          bold: options.rightBold,
          size: options.rightSize ?? FONT_SIZES["text-sm"],
          color: options.rightColor ?? COLORS.black,
          font: fontFamily,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after },
      keepNext: true,
    });
  }

  // Use a right-aligned tab stop at the end of the content area
  return new Paragraph({
    tabStops: [
      {
        type: TabStopType.RIGHT,
        position: totalWidth,
      },
    ],
    children: [
      createTextRun(leftText, {
        bold: options.leftBold,
        size: options.leftSize ?? FONT_SIZES["text-sm"],
        color: options.leftColor ?? COLORS.black,
        font: fontFamily,
      }),
      new TextRun({ children: [new Tab()] }),
      createTextRun(rightText, {
        bold: options.rightBold,
        size: options.rightSize ?? FONT_SIZES["text-sm"],
        color: options.rightColor ?? COLORS.black,
        font: fontFamily,
      }),
    ],
    spacing: { after },
    keepNext: true,
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
      default:
        generateClassicTemplate(data, children);
    }

    // Page settings based on template
    // Classic: A4, serif font, 0.75" margins
    // Modern: A4, sans-serif font, 40pt (~0.56") margins (from spec)
    // Executive: A4, serif font, 40pt margins
    const isClassic = template === "classic";
    const isModern = template === "modern";

    // All templates use A4 size
    const pageWidth = convertInchesToTwip(8.27);   // A4 width
    const pageHeight = convertInchesToTwip(11.69); // A4 height

    // Margins: Classic uses 0.75", Modern/Executive use 40pt (~0.56")
    const pageMargin = isClassic ? convertInchesToTwip(0.75) : 40 * 20; // 40pt = 800 twips

    // Font settings
    const defaultFont = (isClassic || template === "executive") ? FONT_FAMILIES.serif : FONT_FAMILIES.sansSerif;
    const defaultSize = isClassic ? CLASSIC_SIZES.body : FONT_SIZES["text-sm"];

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: defaultFont,
              size: defaultSize,
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
                width: pageWidth,
                height: pageHeight,
              },
              margin: {
                top: pageMargin,
                right: pageMargin,
                bottom: pageMargin,
                left: pageMargin,
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

/**
 * Generate resume as Word document buffer (for Node.js/testing)
 * Returns a Buffer instead of triggering browser download
 */
export async function generateResumeAsWordBuffer(
  data: ResumeData,
  template: string,
): Promise<Buffer> {
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
    default:
      generateClassicTemplate(data, children);
  }

  // Page settings based on template
  // Classic: A4, serif font, 0.75" margins
  // Modern: A4, sans-serif font, 40pt (~0.56") margins (from spec)
  // Executive: A4, serif font, 40pt margins
  const isClassic = template === "classic";

  // All templates use A4 size
  const pageWidth = convertInchesToTwip(8.27);   // A4 width
  const pageHeight = convertInchesToTwip(11.69); // A4 height

  // Margins: Classic uses 0.75", Modern/Executive use 40pt (~0.56")
  const pageMargin = isClassic ? convertInchesToTwip(0.75) : 40 * 20; // 40pt = 800 twips

  // Font settings
  const defaultFont = (isClassic || template === "executive") ? FONT_FAMILIES.serif : FONT_FAMILIES.sansSerif;
  const defaultSize = isClassic ? CLASSIC_SIZES.body : FONT_SIZES["text-sm"];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: defaultFont,
            size: defaultSize,
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
              width: pageWidth,
              height: pageHeight,
            },
            margin: {
              top: pageMargin,
              right: pageMargin,
              bottom: pageMargin,
              left: pageMargin,
            },
          },
        },
        children: children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// ============================================================================
// CLASSIC TEMPLATE
// Single-column layout matching golden reference:
// - Times New Roman font
// - All black colors
// - Centered name with contact below
// - Full-width underlined section headings
// - A4 page size
// ============================================================================

function generateClassicTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
): void {
  // Colors from shared templateStyles (single source of truth)
  const CLASSIC_C = {
    name: classicStyle.colors.name.replace('#', ''),
    sectionHeading: classicStyle.colors.sectionHeading.replace('#', ''),
    divider: classicStyle.colors.divider.replace('#', ''),
    bodyText: classicStyle.colors.bodyText.replace('#', ''),
    subtleText: classicStyle.colors.subtleText.replace('#', ''),
  };
  const FONT = FONT_FAMILIES.serif;

  // Helper to create text with classic styling
  const classicText = (
    text: string,
    options: { bold?: boolean; italic?: boolean; size?: number; color?: string } = {},
  ): TextRun => {
    return new TextRun({
      text,
      font: FONT,
      size: options.size ?? CLASSIC_SIZES.body,
      color: options.color ?? CLASSIC_C.bodyText,
      bold: options.bold,
      italics: options.italic,
    });
  };

  // Helper to create section with underlined heading
  const createSection = (heading: string): void => {
    children.push(
      new Paragraph({
        children: [classicText(heading.toUpperCase(), { bold: true, size: CLASSIC_SIZES.sectionHeading, color: CLASSIC_C.sectionHeading })],
        spacing: { before: SPACING.lg, after: SPACING.xs },
        keepNext: true,
      }),
    );
    // Underline
    children.push(
      new Paragraph({
        spacing: { after: SPACING.sm },
        border: {
          bottom: {
            color: CLASSIC_C.divider,
            size: 1,
            style: BorderStyle.SINGLE,
          },
        },
      }),
    );
  };

  // ==================== HEADER ====================
  // Name - centered, uppercase, bold
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: (data.name || "Your Name").toUpperCase(),
          font: FONT,
          size: CLASSIC_SIZES.name,
          bold: true,
          color: CLASSIC_C.name,
          characterSpacing: 40, // Letter spacing (in twips, ~2pt)
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: SPACING.lg }, // More space after name
    }),
  );

  // Contact info - centered, bullet separator
  const contactParts: string[] = [];
  if (data.phone) contactParts.push(data.phone);
  if (data.email) contactParts.push(data.email);
  if (data.location) contactParts.push(data.location);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [classicText(contactParts.join(" • "))],
        alignment: AlignmentType.CENTER,
        spacing: { after: SPACING.xs }, // Less space before summary
      }),
    );
  }

  // ==================== SUMMARY SECTION ====================
  if (data.summary && data.summary.trim().length > 0) {
    createSection("SUMMARY");
    children.push(
      new Paragraph({
        children: [classicText(data.summary)],
        spacing: { after: SPACING.xs },
      }),
    );
  }

  // ==================== EXPERIENCE SECTION ====================
  if (data.experience && data.experience.length > 0) {
    createSection("EXPERIENCE");

    data.experience.forEach((exp, idx) => {
      // Position title (left) and period (right)
      children.push(
        createLeftRightLine(exp.title || "", exp.period || "", {
          leftBold: true,
          rightBold: false,
          leftColor: CLASSIC_C.bodyText,
          rightColor: CLASSIC_C.subtleText,
          leftSize: CLASSIC_SIZES.body,
          rightSize: CLASSIC_SIZES.body,
          spacingAfter: 0,
          font: FONT,
        }),
      );

      // Company, Location (italic)
      const companyLine = [exp.company, (exp as any).location].filter(Boolean).join(", ");
      if (companyLine) {
        children.push(
          new Paragraph({
            children: [classicText(companyLine, { italic: true })],
            spacing: { after: SPACING.xs },
          }),
        );
      }

      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          children.push(
            new Paragraph({
              children: [
                classicText("•  "),
                classicText(bullet),
              ],
              indent: { left: convertInchesToTwip(0.15), hanging: convertInchesToTwip(0.15) },
              spacing: { after: SPACING.xs },
            }),
          );
        });
      }

      // Spacing between experience items
      if (idx < data.experience!.length - 1) {
        children.push(new Paragraph({ spacing: { after: SPACING.md } }));
      }
    });

    // Prior Experience (if present)
    if ((data as any).priorExperience) {
      children.push(
        new Paragraph({
          children: [
            classicText("Prior Experience: ", { bold: true }),
            classicText((data as any).priorExperience),
          ],
          spacing: { before: SPACING.sm, after: SPACING.xs },
        }),
      );
    }
  }

  // ==================== EDUCATION SECTION ====================
  if (data.education && data.education.length > 0) {
    createSection("EDUCATION");

    data.education.forEach((edu, idx) => {
      // Institution, Location (bold) with year on right
      const institutionLine = [edu.institution, (edu as any).location].filter(Boolean).join(", ");
      children.push(
        createLeftRightLine(institutionLine, edu.period || "", {
          leftBold: true,
          rightBold: false,
          leftColor: CLASSIC_C.bodyText,
          rightColor: CLASSIC_C.subtleText,
          leftSize: CLASSIC_SIZES.body,
          rightSize: CLASSIC_SIZES.body,
          spacingAfter: 0,
          font: FONT,
        }),
      );

      // Degree (italic)
      if (edu.degree) {
        children.push(
          new Paragraph({
            children: [classicText(edu.degree, { italic: true })],
            spacing: { after: SPACING.xs },
          }),
        );
      }

      // Honors
      if ((edu as any).honors) {
        children.push(
          new Paragraph({
            children: [classicText((edu as any).honors)],
            spacing: { after: SPACING.xs },
          }),
        );
      }

      // Spacing between education items
      if (idx < data.education!.length - 1) {
        children.push(new Paragraph({ spacing: { after: SPACING.sm } }));
      }
    });

    // Executive Education (if present)
    if ((data as any).executiveEducation) {
      children.push(
        new Paragraph({
          children: [
            classicText("Executive Education: ", { bold: true }),
            classicText((data as any).executiveEducation),
          ],
          spacing: { before: SPACING.sm, after: SPACING.xs },
        }),
      );
    }
  }

  // ==================== ADDITIONAL INFORMATION SECTION ====================
  const additionalInfo = (data as any).additionalInfo;
  if (additionalInfo) {
    createSection("ADDITIONAL INFORMATION");

    const infoItems = [
      { label: "Certifications", value: additionalInfo.certifications },
      { label: "Board Positions", value: additionalInfo.boardPositions },
      { label: "Speaking", value: additionalInfo.speaking },
      { label: "Languages", value: additionalInfo.languages },
      { label: "Technical", value: additionalInfo.technical },
    ];

    infoItems.forEach((item) => {
      if (item.value) {
        children.push(
          new Paragraph({
            children: [
              classicText(`${item.label}: `, { bold: true }),
              classicText(item.value),
            ],
            spacing: { after: SPACING.sm },
          }),
        );
      }
    });
  }

  // Fallback: If no additionalInfo object but has old-style arrays
  if (!additionalInfo) {
    // Skills section
    if (data.skills && data.skills.length > 0) {
      createSection("SKILLS");
      children.push(
        new Paragraph({
          children: [classicText(data.skills.join("; "))],
          spacing: { after: SPACING.xs },
        }),
      );
    }

    // Certifications section
    if (data.certifications && data.certifications.length > 0) {
      createSection("CERTIFICATIONS");
      children.push(
        new Paragraph({
          children: [classicText(data.certifications.join("; "))],
          spacing: { after: SPACING.xs },
        }),
      );
    }

    // Languages section - handle both string and array formats
    if (data.languages && data.languages.length > 0) {
      createSection("LANGUAGES");
      const languagesText = Array.isArray(data.languages) ? data.languages.join(", ") : String(data.languages);
      children.push(
        new Paragraph({
          children: [classicText(languagesText)],
          spacing: { after: SPACING.xs },
        }),
      );
    }
  }
}

// ============================================================================
// MODERN TEMPLATE
// Sans-serif with solid line dividers and hollow bullets
// Based on golden reference comparison
// ============================================================================

function generateModernTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
): void {
  // Colors from shared templateStyles (single source of truth)
  const MODERN_COLORS = {
    black: modernStyle.colors.name.replace('#', ''),
    darkGray: modernStyle.colors.bodyText.replace('#', ''),
    mediumGray: modernStyle.colors.subtleText.replace('#', ''),
    dividerGray: modernStyle.colors.divider.replace('#', ''),
  };

  // Font sizes in half-points (multiply pt by 2)
  const MODERN_SIZES = {
    name: 44,           // 22pt (larger to match golden)
    sectionHeading: 32, // 16pt - bold section headings
    title: 22,          // 11pt
    body: 18,           // 9pt
    contact: 18,        // 9pt
  };

  // Spacing in twips (20 twips = 1pt)
  const MODERN_SPACING = {
    betweenNameAndContact: 320,    // 16pt - more space after name
    betweenContactAndDivider: 160, // 8pt
    afterHeaderDivider: 400,       // 20pt
    betweenSections: 320,          // 16pt
    betweenHeadingAndContent: 240, // 12pt - more space after section headings
    betweenExperienceItems: 200,   // 10pt
    betweenEducationItems: 80,     // 4pt
    betweenBulletPoints: 40,       // 2pt
    titleRowMarginBottom: 40,      // 2pt
    companyMarginBottom: 40,       // 2pt
  };

  const FONT = FONT_FAMILIES.serif; // Times New Roman to match PDF

  // Helper to create text run with modern styling
  const modernText = (
    text: string,
    options: { bold?: boolean; italic?: boolean; size?: number; color?: string } = {},
  ): TextRun => {
    return new TextRun({
      text,
      font: FONT,
      size: options.size ?? MODERN_SIZES.body,
      color: options.color ?? MODERN_COLORS.darkGray,
      bold: options.bold,
      italics: options.italic,
    });
  };

  // Helper to create section heading with solid line
  // In DOCX, we can't easily do inline lines, so we use a bottom border
  const createSectionHeadingWithLine = (title: string): void => {
    children.push(
      new Paragraph({
        children: [
          modernText(title, { bold: true, size: MODERN_SIZES.sectionHeading, color: MODERN_COLORS.black }),
        ],
        spacing: { before: MODERN_SPACING.betweenSections, after: MODERN_SPACING.betweenHeadingAndContent },
        border: {
          bottom: {
            color: MODERN_COLORS.dividerGray,
            size: 2, // thin line
            style: BorderStyle.SINGLE,
          },
        },
        keepNext: true,
      }),
    );
  };

  // Helper to create title row: Title (left) ... Date (right) - NO underline
  const createTitleRowWithDate = (title: string, date: string): void => {
    const contentWidth = convertInchesToTwip(7.27); // A4 content width with 40pt margins

    children.push(
      new Paragraph({
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: contentWidth,
          },
        ],
        children: [
          modernText(title, { bold: true, size: MODERN_SIZES.title, color: MODERN_COLORS.black }),
          new TextRun({ children: [new Tab()] }),
          modernText(date, { size: MODERN_SIZES.title, color: MODERN_COLORS.mediumGray }),
        ],
        spacing: { after: MODERN_SPACING.titleRowMarginBottom },
        keepNext: true,
      }),
    );
  };

  // ==================== HEADER ====================
  // Name - centered, mixed case (not uppercase), bold
  children.push(
    new Paragraph({
      children: [
        modernText(data.name || "Your Name", { bold: true, size: MODERN_SIZES.name, color: MODERN_COLORS.black }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: MODERN_SPACING.betweenNameAndContact },
    }),
  );

  // Contact info - centered, pipe separator
  const contactParts: string[] = [];
  if (data.phone) contactParts.push(data.phone);
  if (data.email) contactParts.push(data.email);
  if (data.location) contactParts.push(data.location);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          modernText(contactParts.join(" · "), { size: MODERN_SIZES.contact, color: MODERN_COLORS.mediumGray }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: MODERN_SPACING.betweenContactAndDivider },
      }),
    );
  }

  // No header divider - matching PDF which has no line after contact
  // Just add spacing before first section
  children.push(
    new Paragraph({
      spacing: { after: MODERN_SPACING.afterHeaderDivider },
    }),
  );

  // ==================== SUMMARY SECTION ====================
  if (data.summary && data.summary.trim().length > 0) {
    createSectionHeadingWithLine("Summary");
    children.push(
      new Paragraph({
        children: [
          modernText(data.summary, { size: MODERN_SIZES.body, color: MODERN_COLORS.darkGray }),
        ],
        spacing: { after: 0 },
      }),
    );
  }

  // ==================== EXPERIENCE SECTION ====================
  if (data.experience && data.experience.length > 0) {
    createSectionHeadingWithLine("Experience");

    data.experience.forEach((exp, idx) => {
      // Title row: "Job Title ... Date"
      createTitleRowWithDate(exp.title || "", exp.period || "");

      // Company line - italic, black, with em-dash separator for location
      const companyLine = [exp.company, (exp as any).location].filter(Boolean).join(" – ");
      if (companyLine) {
        children.push(
          new Paragraph({
            children: [
              modernText(companyLine, { italic: true, size: MODERN_SIZES.body, color: MODERN_COLORS.black }),
            ],
            spacing: { after: MODERN_SPACING.companyMarginBottom },
          }),
        );
      }

      // Bullets - solid style (•) to match PDF
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet, bIdx) => {
          const isLastBullet = bIdx === exp.bullets!.length - 1;
          const isLastExp = idx === data.experience!.length - 1;
          children.push(
            new Paragraph({
              children: [
                modernText("•  ", { size: MODERN_SIZES.body, color: MODERN_COLORS.darkGray }),
                modernText(bullet, { size: MODERN_SIZES.body, color: MODERN_COLORS.darkGray }),
              ],
              indent: { left: convertInchesToTwip(0.18), hanging: convertInchesToTwip(0.18) },
              spacing: { after: isLastBullet && !isLastExp ? MODERN_SPACING.betweenExperienceItems : MODERN_SPACING.betweenBulletPoints },
            }),
          );
        });
      }
    });
  }

  // ==================== EDUCATION SECTION ====================
  if (data.education && data.education.length > 0) {
    createSectionHeadingWithLine("Education");

    const contentWidth = convertInchesToTwip(7.27); // A4 content width with 40pt margins

    data.education.forEach((edu, idx) => {
      const isLastEdu = idx === data.education!.length - 1;
      // Degree and institution on same line, year on right
      children.push(
        new Paragraph({
          tabStops: [
            {
              type: TabStopType.RIGHT,
              position: contentWidth,
            },
          ],
          children: [
            modernText(edu.degree || "", { bold: true, size: MODERN_SIZES.title, color: MODERN_COLORS.black }),
            modernText(`, ${edu.institution}`, { italic: true, size: MODERN_SIZES.title, color: MODERN_COLORS.black }),
            new TextRun({ children: [new Tab()] }),
            modernText(edu.period || "", { size: MODERN_SIZES.title, color: MODERN_COLORS.mediumGray }),
          ],
          spacing: { after: isLastEdu ? 0 : MODERN_SPACING.betweenEducationItems },
          keepNext: true,
        }),
      );
    });
  }

  // ==================== ADDITIONAL SECTION ====================
  createSectionHeadingWithLine("Additional");

  // Board Roles
  if ((data as any).boardRoles && (data as any).boardRoles.length > 0) {
    children.push(
      new Paragraph({
        children: [
          modernText("Board Roles: ", { bold: true, size: MODERN_SIZES.body, color: MODERN_COLORS.darkGray }),
          modernText((data as any).boardRoles.join(" · "), { size: MODERN_SIZES.body, color: MODERN_COLORS.darkGray }),
        ],
        spacing: { after: 60 },
      }),
    );
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0) {
    children.push(
      new Paragraph({
        children: [
          modernText("Certifications: ", { bold: true, size: MODERN_SIZES.body, color: MODERN_COLORS.darkGray }),
          modernText(data.certifications.join(" · "), { size: MODERN_SIZES.body, color: MODERN_COLORS.darkGray }),
        ],
        spacing: { after: 60 },
      }),
    );
  }

  // Speaking
  if ((data as any).speaking && (data as any).speaking.length > 0) {
    children.push(
      new Paragraph({
        children: [
          modernText("Speaking: ", { bold: true, size: MODERN_SIZES.body, color: MODERN_COLORS.darkGray }),
          modernText((data as any).speaking.join(" · "), { size: MODERN_SIZES.body, color: MODERN_COLORS.darkGray }),
        ],
        spacing: { after: 60 },
      }),
    );
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    children.push(
      new Paragraph({
        children: [
          modernText("Languages: ", { bold: true, size: MODERN_SIZES.body, color: MODERN_COLORS.darkGray }),
          modernText(Array.isArray(data.languages) ? data.languages.join(" · ") : data.languages, { size: MODERN_SIZES.body, color: MODERN_COLORS.darkGray }),
        ],
        spacing: { after: 60 },
      }),
    );
  }
}

// ============================================================================
// EXECUTIVE TEMPLATE
// Navy blue accents, centered header, serif font, formal structure
// Matches PDF golden reference spec
// ============================================================================

function generateExecutiveTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
): void {
  // Colors from shared templateStyles (single source of truth)
  const EXEC_COLORS = {
    navy: executiveStyle.colors.primary.replace('#', ''),
    black: executiveStyle.colors.bodyText.replace('#', ''),
    darkGray: executiveStyle.colors.subtleText.replace('#', ''),
  };

  // Font sizes in half-points (multiply pt by 2)
  const EXEC_SIZES = {
    name: 40,         // 20pt
    title: 20,        // 10pt (smaller than before)
    sectionHeading: 22, // 11pt
    body: 18,         // 9pt
    jobTitle: 20,     // 10pt
  };

  // Executive uses serif font (Times New Roman) to match PDF
  const EXEC_FONT = FONT_FAMILIES.serif;

  // Header - Large Name in Navy (no title underneath, no header divider)
  children.push(
    new Paragraph({
      children: [
        createTextRun((data.name || "Your Name").toUpperCase(), {
          bold: true,
          size: EXEC_SIZES.name,
          color: EXEC_COLORS.navy,
          font: EXEC_FONT,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },  // 12pt after - larger gap between name and contact
    }),
  );

  // Contact info - phone | email | location (dark gray) - no header divider after
  const contactParts: string[] = [];
  if (data.phone) contactParts.push(data.phone);
  if (data.email) contactParts.push(data.email);
  if (data.location) contactParts.push(data.location);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          createTextRun(contactParts.join(" | "), {
            size: EXEC_SIZES.body,
            color: EXEC_COLORS.darkGray,
            font: EXEC_FONT,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },  // 10pt after, goes straight to first section
      }),
    );
  }

  // Track if we've rendered the first section yet (to remove space before first section)
  let isFirstSectionRendered = false;

  // Section heading with navy bottom border (divider closer to title)
  const createSectionHeading = (title: string): void => {
    children.push(
      new Paragraph({
        children: [
          createTextRun(title.toUpperCase(), {
            bold: true,
            size: EXEC_SIZES.sectionHeading,
            color: EXEC_COLORS.navy,
            font: EXEC_FONT,
          }),
        ],
        spacing: { before: isFirstSectionRendered ? 100 : 0, after: 40 },  // No space before first section
        border: {
          bottom: {
            color: EXEC_COLORS.navy,
            size: 16,  // 2pt line
            style: BorderStyle.SINGLE,
          },
        },
        keepNext: true,
      }),
    );
    isFirstSectionRendered = true;
  };

  // PROFESSIONAL SUMMARY
  if (data.summary && data.summary.trim().length > 0) {
    createSectionHeading("Professional Summary");
    children.push(
      new Paragraph({
        children: [
          createTextRun(data.summary, {
            size: EXEC_SIZES.body,
            color: EXEC_COLORS.black,
            font: EXEC_FONT,
          }),
        ],
        alignment: AlignmentType.BOTH,  // Justified
        spacing: { after: 200 },  // 10pt after
      }),
    );
  }

  // CORE COMPETENCIES (left-aligned, pipe separated, no hanging indent on wrap)
  if (data.skills && data.skills.length > 0) {
    createSectionHeading("Core Competencies");
    children.push(
      new Paragraph({
        children: [
          createTextRun(data.skills.join(" | "), {
            size: EXEC_SIZES.body,
            color: EXEC_COLORS.black,
            font: EXEC_FONT,
          }),
        ],
        alignment: AlignmentType.LEFT,  // Left aligned per spec
        spacing: { after: 200 },
        indent: { left: 0, hanging: 0 },  // No indent on wrapped lines
      }),
    );
  }

  // PROFESSIONAL EXPERIENCE
  if (data.experience && data.experience.length > 0) {
    createSectionHeading("Professional Experience");

    data.experience.forEach((exp, idx) => {
      // Job title (bold, black)
      children.push(
        new Paragraph({
          children: [
            createTextRun(exp.title || "", {
              bold: true,
              size: EXEC_SIZES.jobTitle,
              color: EXEC_COLORS.black,
              font: EXEC_FONT,
            }),
          ],
          spacing: { after: 20 },  // 1pt after
          keepNext: true,
        }),
      );

      // Company (bold) | Location | Date on same line - only company is bold
      const companyLineChildren: any[] = [];
      if (exp.company) {
        companyLineChildren.push(
          createTextRun(exp.company, {
            bold: true,
            size: EXEC_SIZES.body,
            color: EXEC_COLORS.black,
            font: EXEC_FONT,
          })
        );
      }
      const locationDateParts: string[] = [];
      if ((exp as any).location) locationDateParts.push((exp as any).location);
      if (exp.period) locationDateParts.push(exp.period);
      if (locationDateParts.length > 0) {
        companyLineChildren.push(
          createTextRun(" | " + locationDateParts.join(" | "), {
            size: EXEC_SIZES.body,
            color: EXEC_COLORS.black,
            font: EXEC_FONT,
          })
        );
      }

      if (companyLineChildren.length > 0) {
        children.push(
          new Paragraph({
            children: companyLineChildren,
            spacing: { after: 40 },  // 2pt after
            keepNext: true,
          }),
        );
      }

      const isLastExp = idx === data.experience!.length - 1;
      const gapAfterExp = isLastExp ? 200 : 160;  // 10pt or 8pt

      // Bullets (black text)
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet, bIdx) => {
          const isLastBullet = bIdx === exp.bullets!.length - 1;
          children.push(
            createBulletParagraph(bullet, {
              size: EXEC_SIZES.body,
              color: EXEC_COLORS.black,
              spacingAfter: isLastBullet ? gapAfterExp : 20,
              font: EXEC_FONT,
            }),
          );
        });
      }
    });
  }

  // KEY PROJECT ACHIEVEMENTS (Executive specific)
  const extData = data as any;
  if (extData.keyProjectAchievements && extData.keyProjectAchievements.length > 0) {
    createSectionHeading("Key Project Achievements");
    extData.keyProjectAchievements.forEach((achievement: string, idx: number) => {
      const isLast = idx === extData.keyProjectAchievements.length - 1;
      children.push(
        createBulletParagraph(achievement, {
          size: EXEC_SIZES.body,
          color: EXEC_COLORS.black,
          spacingAfter: isLast ? 200 : 20,
          font: EXEC_FONT,
        }),
      );
    });
  }

  // EDUCATION
  if (data.education && data.education.length > 0) {
    createSectionHeading("Education");

    data.education.forEach((edu, idx) => {
      // Degree (bold, black)
      children.push(
        new Paragraph({
          children: [
            createTextRun(edu.degree || "", {
              bold: true,
              size: EXEC_SIZES.jobTitle,
              color: EXEC_COLORS.black,
              font: EXEC_FONT,
            }),
          ],
          spacing: { after: 20 },
          keepNext: true,
        }),
      );

      // Institution, Location, Year on same line (black, not italic)
      const instParts: string[] = [];
      if (edu.institution) instParts.push(edu.institution);
      if (edu.period) instParts.push(edu.period);

      if (instParts.length > 0) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(instParts.join(", "), {
                size: EXEC_SIZES.body,
                color: EXEC_COLORS.black,
                font: EXEC_FONT,
              }),
            ],
            spacing: { after: idx < data.education!.length - 1 ? 120 : 200 },
          }),
        );
      }
    });
  }

  // PROFESSIONAL CERTIFICATIONS
  if (data.certifications && data.certifications.length > 0) {
    createSectionHeading("Professional Certifications");
    data.certifications.forEach((cert, idx) => {
      const isLast = idx === data.certifications!.length - 1;
      children.push(
        createBulletParagraph(cert, {
          size: EXEC_SIZES.body,
          color: EXEC_COLORS.black,
          spacingAfter: isLast ? 200 : 20,
          font: EXEC_FONT,
        }),
      );
    });
  }

  // PROFESSIONAL AFFILIATIONS
  if (extData.affiliations && extData.affiliations.length > 0) {
    createSectionHeading("Professional Affiliations");
    extData.affiliations.forEach((affiliation: string, idx: number) => {
      const isLast = idx === extData.affiliations.length - 1;
      children.push(
        createBulletParagraph(affiliation, {
          size: EXEC_SIZES.body,
          color: EXEC_COLORS.black,
          spacingAfter: isLast ? 200 : 20,
          font: EXEC_FONT,
        }),
      );
    });
  }

  // LANGUAGES & TECHNICAL SKILLS
  if (data.languages || extData.technicalSkills) {
    createSectionHeading("Languages & Technical Skills");

    // Languages
    if (data.languages) {
      const languagesText = Array.isArray(data.languages) ? data.languages.join(" | ") : data.languages;
      children.push(
        new Paragraph({
          children: [
            createTextRun("Languages: ", {
              bold: true,
              size: EXEC_SIZES.body,
              color: EXEC_COLORS.black,
              font: EXEC_FONT,
            }),
            createTextRun(languagesText, {
              size: EXEC_SIZES.body,
              color: EXEC_COLORS.black,
              font: EXEC_FONT,
            }),
          ],
          spacing: { after: 40 },
        }),
      );
    }

    // Technical Skills categories
    if (extData.technicalSkills) {
      if (extData.technicalSkills.projectSoftware) {
        children.push(
          new Paragraph({
            children: [
              createTextRun("Project Software: ", {
                bold: true,
                size: EXEC_SIZES.body,
                color: EXEC_COLORS.black,
                font: EXEC_FONT,
              }),
              createTextRun(extData.technicalSkills.projectSoftware, {
                size: EXEC_SIZES.body,
                color: EXEC_COLORS.black,
                font: EXEC_FONT,
              }),
            ],
            spacing: { after: 40 },
          }),
        );
      }
      if (extData.technicalSkills.technical) {
        children.push(
          new Paragraph({
            children: [
              createTextRun("Technical: ", {
                bold: true,
                size: EXEC_SIZES.body,
                color: EXEC_COLORS.black,
                font: EXEC_FONT,
              }),
              createTextRun(extData.technicalSkills.technical, {
                size: EXEC_SIZES.body,
                color: EXEC_COLORS.black,
                font: EXEC_FONT,
              }),
            ],
            spacing: { after: 40 },
          }),
        );
      }
      if (extData.technicalSkills.standards) {
        children.push(
          new Paragraph({
            children: [
              createTextRun("Standards: ", {
                bold: true,
                size: EXEC_SIZES.body,
                color: EXEC_COLORS.black,
                font: EXEC_FONT,
              }),
              createTextRun(extData.technicalSkills.standards, {
                size: EXEC_SIZES.body,
                color: EXEC_COLORS.black,
                font: EXEC_FONT,
              }),
            ],
            spacing: { after: 40 },
          }),
        );
      }
    }
  }

  // Legacy Projects section (if no keyProjectAchievements)
  if (!extData.keyProjectAchievements && data.projects && data.projects.length > 0) {
    createSectionHeading("Key Projects");

    data.projects.forEach((project, idx) => {
      children.push(
        new Paragraph({
          children: [
            createTextRun(project.name || "", {
              bold: true,
              size: EXEC_SIZES.jobTitle,
              color: EXEC_COLORS.black,
              font: EXEC_FONT,
            }),
          ],
          spacing: { after: 20 },
          keepNext: true,
        }),
      );

      if (project.organization) {
        children.push(
          new Paragraph({
            children: [
              createTextRun(project.organization, {
                size: EXEC_SIZES.body,
                color: EXEC_COLORS.black,
                font: EXEC_FONT,
              }),
            ],
            spacing: { after: 40 },
          }),
        );
      }

      if (project.details && project.details.length > 0) {
        project.details.forEach((detail, dIdx) => {
          const isLastDetail = dIdx === project.details!.length - 1;
          const isLastProject = idx === data.projects!.length - 1;
          children.push(
            createBulletParagraph(detail, {
              size: EXEC_SIZES.body,
              color: EXEC_COLORS.black,
              font: EXEC_FONT,
              spacingAfter: isLastDetail && isLastProject ? 200 : 20,
            }),
          );
        });
      }

      children.push(
        createSpacer(idx < data.projects!.length - 1 ? 160 : 200),
      );
    });
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
