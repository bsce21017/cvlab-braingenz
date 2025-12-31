/**
 * Download resume utilities for PDF and Word generation
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from 'docx';
import { ResumeData } from './resumeDataTypes';

/**
 * Download resume as PDF from HTML element
 */
export async function downloadResumeAsPDF(element: HTMLElement, filename: string = 'resume.pdf'): Promise<void> {
  console.log('[downloadResume] Starting PDF generation for:', filename);
  console.log('[downloadResume] Element:', element);
  
  try {
    // Fix for technical template gradient header - replace with solid color for PDF
    const gradientHeaders = element.querySelectorAll('h1');
    const originalStyles: { element: HTMLElement; originalClass: string; originalColor: string }[] = [];
    
    gradientHeaders.forEach((header) => {
      const htmlHeader = header as HTMLElement;
      if (htmlHeader.className.includes('bg-clip-text') || htmlHeader.className.includes('text-transparent')) {
        originalStyles.push({
          element: htmlHeader,
          originalClass: htmlHeader.className,
          originalColor: htmlHeader.style.color || '',
        });
        // Remove gradient-related classes and add solid blue color
        htmlHeader.className = htmlHeader.className
          .replace(/bg-gradient-to-r\s+from-\[#[^\]]+\]\s+to-\[#[^\]]+\]/g, '')
          .replace(/bg-clip-text/g, '')
          .replace(/text-transparent/g, '')
          .trim();
        // Set solid blue color via inline style (more reliable for PDF)
        htmlHeader.style.color = '#2563eb';
        htmlHeader.style.webkitBackgroundClip = 'unset';
        htmlHeader.style.backgroundClip = 'unset';
      }
    });

    // Remove min-height constraints that cause page splitting
    const minHeightElements = element.querySelectorAll('[class*="min-h-"]');
    const originalMinHeights: { element: HTMLElement; originalStyle: string }[] = [];
    
    minHeightElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.style.minHeight || htmlEl.className.includes('min-h-')) {
        originalMinHeights.push({
          element: htmlEl,
          originalStyle: htmlEl.style.cssText,
        });
        htmlEl.style.minHeight = 'auto';
        // Remove min-h-* classes
        htmlEl.className = htmlEl.className.replace(/min-h-\[?\d+[^\s]*\]?/g, '').trim();
      }
    });

    // Reduce spacing for Technical/Modern templates to fit on one page
    const spaceYElements = element.querySelectorAll('[class*="space-y-"]');
    const originalSpaceY: { element: HTMLElement; originalClass: string }[] = [];
    spaceYElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.className.includes('space-y-5')) {
        originalSpaceY.push({
          element: htmlEl,
          originalClass: htmlEl.className,
        });
        // Reduce spacing from space-y-5 to space-y-2 for PDF (more aggressive)
        htmlEl.className = htmlEl.className.replace(/space-y-5/g, 'space-y-2');
      }
    });

    // Reduce header spacing (mb-2, my-4) to prevent page breaks
    const headerElements = element.querySelectorAll('[class*="mb-"], [class*="my-"], [class*="mt-"]');
    const originalHeaderSpacing: { element: HTMLElement; originalClass: string }[] = [];
    headerElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const className = htmlEl.className;
      // Reduce margin-bottom and margin-y values
      if (className.includes('mb-2') || className.includes('mb-4') || className.includes('mb-6')) {
        originalHeaderSpacing.push({
          element: htmlEl,
          originalClass: className,
        });
        htmlEl.className = className
          .replace(/mb-2/g, 'mb-1')
          .replace(/mb-4/g, 'mb-2')
          .replace(/mb-6/g, 'mb-3');
      }
      if (className.includes('my-4') || className.includes('my-6')) {
        if (!originalHeaderSpacing.find(e => e.element === htmlEl)) {
          originalHeaderSpacing.push({
            element: htmlEl,
            originalClass: className,
          });
        }
        htmlEl.className = htmlEl.className
          .replace(/my-4/g, 'my-2')
          .replace(/my-6/g, 'my-3');
      }
    });

    // Reduce container padding (p-8 to p-4 for more space)
    const paddedElements = element.querySelectorAll('[class*="p-8"]');
    const originalPadding: { element: HTMLElement; originalClass: string }[] = [];
    paddedElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.className.includes('p-8')) {
        originalPadding.push({
          element: htmlEl,
          originalClass: htmlEl.className,
        });
        htmlEl.className = htmlEl.className.replace(/p-8/g, 'p-4');
      }
    });

    // Wait for DOM reflow after removing min-height
    await new Promise(resolve => {
      // Force reflow by reading offsetHeight
      void element.offsetHeight;
      // Use requestAnimationFrame to ensure reflow is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    // Dynamic import for browser-only library
    console.log('[downloadResume] Importing html2pdf.js...');
    const html2pdf = (await import('html2pdf.js')).default;
    console.log('[downloadResume] html2pdf imported successfully');
    
    // Calculate optimal scale to fit on one page (after reflow)
    const elementHeight = element.scrollHeight;
    const elementWidth = element.scrollWidth;
    // Fix: margins are 5mm each, so total is 10mm (not 20mm)
    const a4Height = 297 - 10; // A4 height in mm minus margins (5mm top + 5mm bottom)
    const a4Width = 210 - 10; // A4 width in mm minus margins (5mm left + 5mm right)
    const pxToMm = 0.264583; // 1px = 0.264583mm at 96dpi
    const elementHeightMm = elementHeight * pxToMm;
    const elementWidthMm = elementWidth * pxToMm;
    
    // Calculate scale to fit height (primary constraint)
    const heightScale = a4Height / elementHeightMm;
    const widthScale = a4Width / elementWidthMm;
    const optimalScale = Math.min(heightScale, widthScale, 1); // Don't scale up, only down
    
    // More aggressive scaling for tall content
    let finalScale = optimalScale;
    if (optimalScale < 0.8) {
      // If content is still too tall, scale down more aggressively
      finalScale = optimalScale * 0.92;
    } else if (optimalScale < 0.9) {
      finalScale = optimalScale * 0.95;
    }
    
    const opt = {
      margin: [5, 5, 5, 5] as [number, number, number, number], // Reduced margins for more space
      filename: filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        // More aggressive scaling: if finalScale < 1, use it directly multiplied by 2
        // This ensures content fits on one page
        scale: finalScale < 1 ? Math.max(1.2, 2 * finalScale) : 2, // Minimum scale of 1.2 for quality
        useCORS: true,
        logging: false,
        letterRendering: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' as const,
        compress: true,
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        // Removed 'h1', 'h2', 'h3' from avoid to prevent forced page breaks
        avoid: ['.avoid-break'],
      },
    };

    console.log('[downloadResume] Calling html2pdf().set().from().save()...');
    await html2pdf().set(opt).from(element).save();
    console.log('[downloadResume] PDF generation completed successfully');

    // Restore original gradient classes and styles
    originalStyles.forEach(({ element: el, originalClass, originalColor }) => {
      el.className = originalClass;
      if (originalColor) {
        el.style.color = originalColor;
      } else {
        el.style.color = '';
      }
      el.style.webkitBackgroundClip = '';
      el.style.backgroundClip = '';
    });

    // Restore original min-height styles
    originalMinHeights.forEach(({ element: el, originalStyle }) => {
      el.style.cssText = originalStyle;
    });

    // Restore original spacing
    originalSpaceY.forEach(({ element: el, originalClass }) => {
      el.className = originalClass;
    });

    // Restore original header spacing
    originalHeaderSpacing.forEach(({ element: el, originalClass }) => {
      el.className = originalClass;
    });

    // Restore original padding
    originalPadding.forEach(({ element: el, originalClass }) => {
      el.className = originalClass;
    });
  } catch (error) {
    console.error('[downloadResume] Error generating PDF:', error);
    console.error('[downloadResume] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download resume as Word document with template-specific styling
 */
export async function downloadResumeAsWord(data: ResumeData, template: string, filename: string = 'resume.docx'): Promise<void> {
  console.log('[downloadResume] Starting Word generation for:', filename, 'Template:', template);
  console.log('[downloadResume] Resume Data:', data);

  try {
    const children: (Paragraph | Table)[] = [];

    // Template-specific color constants
    const BLUE = '#2563eb';
    const GOLD = '#b45309';
    const BLACK = '#000000';
    const GRAY_600 = '#4b5563';
    const GRAY_700 = '#374151';
    const GRAY_500 = '#6b7280';

    // Apply template-specific formatting
    switch (template) {
      case 'classic':
        generateClassicTemplate(data, children, BLUE, GRAY_600, GRAY_700);
        break;
      case 'modern':
        generateModernTemplate(data, children, BLACK, GRAY_600, GRAY_700);
        break;
      case 'executive':
        generateExecutiveTemplate(data, children, GOLD, GRAY_600, GRAY_700);
        break;
      case 'technical':
        generateTechnicalTemplate(data, children, BLUE, GRAY_600, GRAY_700);
        break;
      default:
        generateClassicTemplate(data, children, BLUE, GRAY_600, GRAY_700);
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('[downloadResume] Word generation completed successfully');
  } catch (error) {
    console.error('[downloadResume] Error generating Word document:', error);
    console.error('[downloadResume] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error(`Failed to generate Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate Classic Template (Two-column layout with blue headings)
 */
function generateClassicTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
  headingColor: string,
  textColor: string,
  secondaryTextColor: string
) {
  // Header - Blue Name (Centered, Uppercase)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: (data.name || 'Your Name').toUpperCase(),
          bold: true,
          size: 36,
          color: headingColor,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Contact Information (Centered)
  const contactInfo: string[] = [];
  if (data.email) contactInfo.push(data.email);
  if (data.phone) contactInfo.push(data.phone);
  if (data.location) contactInfo.push(data.location);

  if (contactInfo.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactInfo.join(' | '),
            size: 20,
            color: textColor,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Horizontal Rule (using border)
  children.push(
    new Paragraph({
      spacing: { after: 400 },
      border: {
        bottom: {
          color: '#d1d5db',
          size: 1,
          style: BorderStyle.SINGLE,
        },
      },
    })
  );

  // Two-column layout for sections using Table
  const createTwoColumnSection = (heading: string, content: (Paragraph | Table)[]) => {
    const headingCell = new TableCell({
      width: { size: 20, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: heading.toUpperCase(),
              bold: true,
              size: 22,
              color: headingColor,
            }),
          ],
        }),
      ],
    });

    const contentCell = new TableCell({
      width: { size: 80, type: WidthType.PERCENTAGE },
      children: content,
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [headingCell, contentCell],
        }),
      ],
    });
  };

  // Summary
  if (data.summary) {
    const summaryContent = [
      new Paragraph({
        children: [
          new TextRun({
            text: data.summary,
            size: 22,
            color: textColor,
          }),
        ],
        spacing: { after: 0 },
      }),
    ];
    children.push(createTwoColumnSection('Summary', summaryContent));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // Work Experience
  if (data.experience && data.experience.length > 0) {
    const expContent: Paragraph[] = [];
    data.experience.forEach((exp) => {
      // Title and Company
      expContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.title || '',
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (exp.company) {
        expContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.company,
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      // Period
      if (exp.period) {
        expContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.period,
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      // Bullets
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          expContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${bullet}`,
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      expContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    children.push(createTwoColumnSection('Work Experience', expContent));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // Education
  if (data.education && data.education.length > 0) {
    const eduContent: Paragraph[] = [];
    data.education.forEach((edu) => {
      eduContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree || '',
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (edu.institution) {
        eduContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.institution,
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      if (edu.period) {
        eduContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.period,
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      if (edu.details && edu.details.length > 0) {
        edu.details.forEach((detail) => {
          eduContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${detail}`,
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      eduContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    children.push(createTwoColumnSection('Education', eduContent));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // Key Skills (2 columns grid)
  if (data.skills && data.skills.length > 0) {
    const skillsContent: Paragraph[] = [];
    const skillsPerColumn = Math.ceil(data.skills.length / 2);
    const leftSkills = data.skills.slice(0, skillsPerColumn);
    const rightSkills = data.skills.slice(skillsPerColumn);

    const skillsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: leftSkills.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `• ${skill}`,
                        size: 20,
                        color: textColor,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
              ),
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: rightSkills.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `• ${skill}`,
                        size: 20,
                        color: textColor,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
              ),
            }),
          ],
        }),
      ],
    });
    children.push(createTwoColumnSection('Key Skills', [skillsTable]));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0) {
    const certContent = data.certifications.map(
      (cert) =>
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${cert}`,
              size: 20,
              color: textColor,
            }),
          ],
          spacing: { after: 100 },
        })
    );
    children.push(createTwoColumnSection('Certifications', certContent));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    const langContent = [
      new Paragraph({
        children: [
          new TextRun({
            text: data.languages.join(', '),
            size: 20,
            color: textColor,
          }),
        ],
      }),
    ];
    children.push(createTwoColumnSection('Languages', langContent));
  }
}

/**
 * Generate Modern Template (Clean minimal with black headings and borders)
 */
function generateModernTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
  headingColor: string,
  textColor: string,
  secondaryTextColor: string
) {
  // Header - Black Name (Centered, Uppercase)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: (data.name || 'Your Name').toUpperCase(),
          bold: true,
          size: 36,
          color: headingColor,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Contact Information
  const contactInfo: string[] = [];
  if (data.email) contactInfo.push(data.email);
  if (data.phone) contactInfo.push(data.phone);
  if (data.location) contactInfo.push(data.location);

  if (contactInfo.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactInfo.join(' | '),
            size: 20,
            color: textColor,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Thick horizontal rule
  children.push(
    new Paragraph({
      spacing: { after: 300 },
      border: {
        bottom: {
          color: '#000000',
          size: 6,
          style: BorderStyle.SINGLE,
        },
      },
    })
  );

  const createSection = (heading: string, content: (Paragraph | Table)[]) => {
    // Heading with border-bottom
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: heading.toUpperCase(),
            bold: true,
            size: 22,
            color: headingColor,
          }),
        ],
        spacing: { after: 200 },
        border: {
          bottom: {
            color: '#d1d5db',
            size: 1,
            style: BorderStyle.SINGLE,
          },
        },
      })
    );
    // Content
    content.forEach((p) => children.push(p));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  };

  // Summary
  if (data.summary) {
    createSection('Summary', [
      new Paragraph({
        children: [
          new TextRun({
            text: data.summary,
            size: 22,
            color: textColor,
          }),
        ],
        spacing: { after: 0 },
      }),
    ]);
  }

  // Professional Experience
  if (data.experience && data.experience.length > 0) {
    const expContent: Paragraph[] = [];
    data.experience.forEach((exp) => {
      expContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.title || '',
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (exp.company) {
        expContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.company,
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      if (exp.period) {
        expContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.period,
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          expContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${bullet}`,
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      expContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    createSection('Professional Experience', expContent);
  }

  // Skills (3 columns)
  if (data.skills && data.skills.length > 0) {
    const skillsPerColumn = Math.ceil(data.skills.length / 3);
    const col1 = data.skills.slice(0, skillsPerColumn);
    const col2 = data.skills.slice(skillsPerColumn, skillsPerColumn * 2);
    const col3 = data.skills.slice(skillsPerColumn * 2);

    const skillsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              children: col1.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: skill,
                        size: 20,
                        color: textColor,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
              ),
            }),
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              children: col2.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: skill,
                        size: 20,
                        color: textColor,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
              ),
            }),
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              children: col3.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: skill,
                        size: 20,
                        color: textColor,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
              ),
            }),
          ],
        }),
      ],
    });
    createSection('Skills', [skillsTable]);
  }

  // Education
  if (data.education && data.education.length > 0) {
    const eduContent: Paragraph[] = [];
    data.education.forEach((edu) => {
      eduContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree || '',
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (edu.institution) {
        eduContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.institution,
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      if (edu.period) {
        eduContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.period,
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      if (edu.details && edu.details.length > 0) {
        edu.details.forEach((detail) => {
          eduContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${detail}`,
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      eduContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    createSection('Education', eduContent);
  }

  // Additional Information
  if ((data.languages && data.languages.length > 0) || (data.certifications && data.certifications.length > 0)) {
    const additionalContent: Paragraph[] = [];
    if (data.languages && data.languages.length > 0) {
      additionalContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Languages: ',
              bold: true,
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: data.languages.join(', '),
              size: 20,
              color: textColor,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }
    if (data.certifications && data.certifications.length > 0) {
      additionalContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Certifications: ',
              bold: true,
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: data.certifications.join(', '),
              size: 20,
              color: textColor,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }
    createSection('Additional Information', additionalContent);
  }
}

/**
 * Generate Executive Template (Gold accents, left-aligned name)
 */
function generateExecutiveTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
  headingColor: string,
  textColor: string,
  secondaryTextColor: string
) {
  // Header - Large Bold Name (Left-aligned)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.name || 'Your Name',
          bold: true,
          size: 48,
          color: '#000000',
        }),
      ],
      spacing: { after: 100 },
    })
  );

  // Title in Gold
  if (data.title) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.title.toUpperCase(),
            bold: true,
            size: 28,
            color: headingColor,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Contact Information
  const contactInfo: string[] = [];
  if (data.location) contactInfo.push(data.location);
  if (data.email) contactInfo.push(data.email);
  if (data.website) contactInfo.push(data.website);

  if (contactInfo.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactInfo.join(' | '),
            size: 20,
            color: textColor,
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // Thick Gold horizontal rule
  children.push(
    new Paragraph({
      spacing: { after: 300 },
      border: {
        bottom: {
          color: headingColor,
          size: 6,
          style: BorderStyle.SINGLE,
        },
      },
    })
  );

  const createSection = (heading: string, content: (Paragraph | Table)[]) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: heading.toUpperCase(),
            bold: true,
            size: 22,
            color: headingColor,
          }),
        ],
        spacing: { after: 200 },
      })
    );
    content.forEach((p) => children.push(p));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  };

  // Summary
  if (data.summary) {
    createSection('Summary', [
      new Paragraph({
        children: [
          new TextRun({
            text: data.summary,
            size: 22,
            color: textColor,
          }),
        ],
        spacing: { after: 0 },
      }),
    ]);
  }

  // Professional Experience
  if (data.experience && data.experience.length > 0) {
    const expContent: Paragraph[] = [];
    data.experience.forEach((exp) => {
      expContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.title || '',
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (exp.company) {
        expContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.company,
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      if (exp.period) {
        expContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.period,
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          expContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${bullet}`,
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      expContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    createSection('Professional Experience', expContent);
  }

  // Education
  if (data.education && data.education.length > 0) {
    const eduContent: Paragraph[] = [];
    data.education.forEach((edu) => {
      eduContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree || '',
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (edu.institution) {
        eduContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.institution,
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      if (edu.period) {
        eduContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.period,
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      if (edu.details && edu.details.length > 0) {
        edu.details.forEach((detail) => {
          eduContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${detail}`,
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      eduContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    createSection('Education', eduContent);
  }

  // Additional Information
  if ((data.languages && data.languages.length > 0) || (data.certifications && data.certifications.length > 0)) {
    const additionalContent: Paragraph[] = [];
    if (data.languages && data.languages.length > 0) {
      additionalContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '• ',
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: 'Languages: ',
              bold: true,
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: data.languages.join(', '),
              size: 20,
              color: textColor,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 200 },
        })
      );
    }
    if (data.certifications && data.certifications.length > 0) {
      additionalContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '• ',
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: 'Certifications: ',
              bold: true,
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: data.certifications.join(', '),
              size: 20,
              color: textColor,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 200 },
        })
      );
    }
    createSection('Additional Information', additionalContent);
  }
}

/**
 * Generate Technical Template (Blue headings, skills before experience)
 */
function generateTechnicalTemplate(
  data: ResumeData,
  children: (Paragraph | Table)[],
  headingColor: string,
  textColor: string,
  secondaryTextColor: string
) {
  // Header - Blue Name (Centered, Uppercase)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: (data.name || 'Your Name').toUpperCase(),
          bold: true,
          size: 40,
          color: headingColor,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Contact Information
  const contactInfo: string[] = [];
  if (data.email) contactInfo.push(data.email);
  if (data.phone) contactInfo.push(data.phone);
  if (data.location) contactInfo.push(data.location);

  if (contactInfo.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactInfo.join(' | '),
            size: 20,
            color: textColor,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Horizontal rule
  children.push(
    new Paragraph({
      spacing: { after: 300 },
      border: {
        bottom: {
          color: '#d1d5db',
          size: 1,
          style: BorderStyle.SINGLE,
        },
      },
    })
  );

  const createSection = (heading: string, content: (Paragraph | Table)[]) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: heading.toUpperCase(),
            bold: true,
            size: 22,
            color: headingColor,
          }),
        ],
        spacing: { after: 200 },
        border: {
          bottom: {
            color: '#e5e7eb',
            size: 1,
            style: BorderStyle.SINGLE,
          },
        },
      })
    );
    content.forEach((p) => children.push(p));
    children.push(new Paragraph({ spacing: { after: 300 } }));
  };

  // Summary
  if (data.summary) {
    createSection('Summary', [
      new Paragraph({
        children: [
          new TextRun({
            text: data.summary,
            size: 22,
            color: textColor,
          }),
        ],
        spacing: { after: 0 },
      }),
    ]);
  }

  // Technical Skills (BEFORE Experience - 3 columns)
  if (data.skills && data.skills.length > 0) {
    const skillsPerColumn = Math.ceil(data.skills.length / 3);
    const col1 = data.skills.slice(0, skillsPerColumn);
    const col2 = data.skills.slice(skillsPerColumn, skillsPerColumn * 2);
    const col3 = data.skills.slice(skillsPerColumn * 2);

    const skillsTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              children: col1.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: skill,
                        size: 20,
                        color: textColor,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
              ),
            }),
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              children: col2.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: skill,
                        size: 20,
                        color: textColor,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
              ),
            }),
            new TableCell({
              width: { size: 33.33, type: WidthType.PERCENTAGE },
              children: col3.map(
                (skill) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: skill,
                        size: 20,
                        color: textColor,
                      }),
                    ],
                    spacing: { after: 100 },
                  })
              ),
            }),
          ],
        }),
      ],
    });
    createSection('Technical Skills', [skillsTable]);
  }

  // Professional Experience
  if (data.experience && data.experience.length > 0) {
    const expContent: Paragraph[] = [];
    data.experience.forEach((exp) => {
      expContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.title || '',
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (exp.company) {
        expContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.company,
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      if (exp.period) {
        expContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.period,
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          expContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${bullet}`,
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      expContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    createSection('Professional Experience', expContent);
  }

  // Education
  if (data.education && data.education.length > 0) {
    const eduContent: Paragraph[] = [];
    data.education.forEach((edu) => {
      eduContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree || '',
              bold: true,
              size: 24,
              color: '#000000',
            }),
          ],
          spacing: { after: 100 },
        })
      );
      if (edu.institution) {
        eduContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.institution,
                size: 20,
                color: textColor,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
      if (edu.period) {
        eduContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.period,
                size: 20,
                color: secondaryTextColor,
              }),
            ],
            spacing: { after: 200 },
          })
        );
      }
      if (edu.details && edu.details.length > 0) {
        edu.details.forEach((detail) => {
          eduContent.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${detail}`,
                  size: 20,
                  color: textColor,
                }),
              ],
              spacing: { after: 100 },
              indent: { left: 200 },
            })
          );
        });
      }
      eduContent.push(new Paragraph({ spacing: { after: 200 } }));
    });
    createSection('Education', eduContent);
  }

  // Additional Information
  if ((data.languages && data.languages.length > 0) || (data.certifications && data.certifications.length > 0)) {
    const additionalContent: Paragraph[] = [];
    if (data.languages && data.languages.length > 0) {
      additionalContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '• ',
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: 'Languages: ',
              bold: true,
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: data.languages.join(', '),
              size: 20,
              color: textColor,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 200 },
        })
      );
    }
    if (data.certifications && data.certifications.length > 0) {
      additionalContent.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '• ',
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: 'Certifications: ',
              bold: true,
              size: 20,
              color: textColor,
            }),
            new TextRun({
              text: data.certifications.join(', '),
              size: 20,
              color: textColor,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 200 },
        })
      );
    }
    createSection('Additional Information', additionalContent);
  }
}

