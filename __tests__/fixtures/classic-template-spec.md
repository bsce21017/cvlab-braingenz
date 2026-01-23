# Classic Template Style Specification

> Derived from visual analysis of golden reference PDF: `__tests__/golden/pdf/classic/reference-page*.png`

---

## Page Layout

| Property | Value |
|----------|-------|
| Page Size | A4 (210mm × 297mm) |
| Top Margin | 1 inch (72pt) |
| Bottom Margin | 0.75 inch (54pt) |
| Left Margin | 1 inch (72pt) |
| Right Margin | 1 inch (72pt) |
| Content Width | ~468pt (6.5 inches) |

---

## Typography

### Font Family
- **Primary Font**: Times New Roman (serif)
- **PDF Fallback**: Times-Roman (built-in PDF font)
- **Web Fallback**: Times, Liberation Serif, serif

### Font Sizes
| Element | Size |
|---------|------|
| Name | 18pt |
| Contact Line | 10pt |
| Section Headings | 11pt |
| Body Text | 10pt |
| Bullet Text | 10pt |

### Font Weights
- **Normal**: 400
- **Bold**: 700

### Line Heights
| Context | Value |
|---------|-------|
| Tight (bullets) | 1.2 |
| Normal (body) | 1.3 |
| Relaxed (summary) | 1.35 |

---

## Header Section

### Name
```
KHALID AL-RASHID
```

| Property | Value |
|----------|-------|
| Font Size | 18pt |
| Font Weight | Bold |
| Text Transform | UPPERCASE |
| Letter Spacing | 2px |
| Text Align | Center |
| Color | #000000 (black) |
| Margin Bottom | 4pt |

### Contact Line
```
+966 50 XXX XXXX • khalid.alrashid@email.com • Dammam, Saudi Arabia
```

| Property | Value |
|----------|-------|
| Font Size | 10pt |
| Font Weight | Normal |
| Text Align | Center |
| Separator | ` • ` (space bullet space) |
| Color | #000000 |
| Margin Bottom | 12pt |

---

## Section Headings

```
SUMMARY
────────────────────────────────────────────────────────────
```

| Property | Value |
|----------|-------|
| Font Size | 11pt |
| Font Weight | Bold |
| Text Transform | UPPERCASE |
| Text Align | Left |
| Color | #000000 |
| Margin Top | 12pt |
| Margin Bottom | 2pt (below text) |
| Underline | 1px solid black, full width |
| Padding Below Underline | 6pt |

**Section Names Used:**
- SUMMARY
- EXPERIENCE
- EDUCATION
- ADDITIONAL INFORMATION

---

## Summary Section

| Property | Value |
|----------|-------|
| Font Size | 10pt |
| Font Weight | Normal |
| Font Style | Normal |
| Text Align | Left (slight justify) |
| Line Height | 1.35 |
| Margin Top | 6pt |
| Color | #000000 |

---

## Experience Section

### Overall Structure
```
Position Title                                    2019 – Present
Company, City
• Bullet point text that may wrap to multiple lines with hanging
  indent for continuation
• Another bullet point
```

### Position Row (Title + Date)

| Property | Value |
|----------|-------|
| Display | Flex, space-between |
| Margin Bottom | 0pt |

**Position Title:**
| Property | Value |
|----------|-------|
| Font Size | 10pt |
| Font Weight | Bold |
| Text Align | Left |

**Date Range:**
| Property | Value |
|----------|-------|
| Font Size | 10pt |
| Font Weight | Normal |
| Text Align | Right |
| Date Separator | ` – ` (space en-dash space) |

### Company Line
```
Company, City
```

| Property | Value |
|----------|-------|
| Font Size | 10pt |
| Font Weight | Normal |
| Font Style | Italic |
| Margin Bottom | 2pt |
| Format | `{company}, {city}` |

### Bullet Points
```
•   Bullet text starts here and continues with a hanging indent
    when it wraps to the next line
```

| Property | Value |
|----------|-------|
| Bullet Character | • (U+2022) |
| Bullet Size | 10pt |
| Bullet Color | #000000 |
| Bullet Indent | 12pt from left |
| Text Offset | 6pt from bullet |
| Hanging Indent | Yes |
| Line Spacing | 2pt between bullets |
| Text Font Size | 10pt |
| Text Line Height | 1.3 |

### Spacing Between Experience Items
| Property | Value |
|----------|-------|
| Item Spacing | 10pt |

### Prior Experience Format (inline)
```
Prior Experience: Role, Company (Years); Role, Company (Years)
```

| Property | Value |
|----------|-------|
| Label | Bold |
| Content | Normal |
| Separator | `; ` (semicolon space) |

---

## Education Section

### Overall Structure
```
INSEAD, Fontainebleau, France                              2012
Master of Business Administration, Technology Management

King Fahd University of Petroleum & Minerals, Dhahran      2001
Bachelor of Science in Computer Engineering
First Class Honors, Dean's List
```

### Institution Row

**Institution Name:**
| Property | Value |
|----------|-------|
| Font Size | 10pt |
| Font Weight | Bold |
| Format | `{institution}, {location}` |

**Year:**
| Property | Value |
|----------|-------|
| Font Size | 10pt |
| Font Weight | Normal |
| Text Align | Right |

### Degree Line
| Property | Value |
|----------|-------|
| Font Size | 10pt |
| Font Weight | Normal |
| Font Style | Italic |

### Honors/Additional Info
| Property | Value |
|----------|-------|
| Font Size | 10pt |
| Font Weight | Normal |
| Font Style | Normal |

### Executive Education Format
```
Executive Education: Program, School (Year); Program, School (Year)
```
| Property | Value |
|----------|-------|
| Label | Bold |
| Content | Normal |
| Separator | `; ` |

### Spacing Between Education Items
| Property | Value |
|----------|-------|
| Item Spacing | 8pt |

---

## Additional Information Section

### Overall Structure
```
Certifications: Cert1; Cert2; Cert3
Board Positions: Position1 (Years); Position2 (Years)
Speaking: Event1 (Year); Event2 (Year)
Languages: Lang1 (Level), Lang2 (Level)
Technical: Skill1, Skill2, Skill3
```

### Labeled Item Format
| Property | Value |
|----------|-------|
| Label Font Weight | Bold |
| Label Font Style | Normal |
| Content Font Weight | Normal |
| Format | `{Label}: {content}` |
| Item Separator | `; ` (semicolon space) |
| Line Spacing | 6pt between categories |

### Standard Categories
1. Certifications
2. Board Positions
3. Speaking
4. Languages
5. Technical

---

## Colors

| Element | Color |
|---------|-------|
| All Text | #000000 (pure black) |
| Headings | #000000 |
| Dividers/Lines | #000000 |
| Bullets | #000000 |

---

## Dividers

### Section Underline
| Property | Value |
|----------|-------|
| Height | 1px |
| Color | #000000 |
| Style | Solid |
| Width | 100% of content area |

---

## Implementation Notes

### PDF Generation (@react-pdf/renderer)
- Use `Times-Roman` font family (built-in)
- Note: Built-in Times-Roman has slightly different metrics than Times New Roman
- May need to adjust sizes by ~5% to compensate

### HTML/CSS
- Use `'Times New Roman', Times, serif` font stack
- All measurements in pt for consistency

### Key Differences from "Modern" Template
1. Uses serif font (not sans-serif)
2. Section headings have underlines (not color bars)
3. All text is black (no navy blue accents)
4. More traditional, conservative styling
