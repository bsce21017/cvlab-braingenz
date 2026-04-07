"""
CV Evaluation PDF Report Generator
Generates professional PDF reports for recruiters to share with hiring managers.
"""
import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)


# Brand colors
BRAND_BLUE = colors.HexColor('#093D7F')
BRAND_BLUE_LIGHT = colors.HexColor('#0B4FA0')
BRAND_GREEN = colors.HexColor('#34A853')
BRAND_YELLOW = colors.HexColor('#F9CB12')
BRAND_RED = colors.HexColor('#EA4335')
LIGHT_GRAY = colors.HexColor('#F7F9FC')
MEDIUM_GRAY = colors.HexColor('#E5E7EB')
DARK_TEXT = colors.HexColor('#1A1A2E')
MUTED_TEXT = colors.HexColor('#6B7280')


def get_styles():
    """Create custom paragraph styles."""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        'ReportTitle',
        parent=styles['Title'],
        fontSize=22,
        textColor=BRAND_BLUE,
        spaceAfter=4 * mm,
        fontName='Helvetica-Bold',
    ))

    styles.add(ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=MUTED_TEXT,
        spaceAfter=8 * mm,
    ))

    styles.add(ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=BRAND_BLUE,
        spaceBefore=6 * mm,
        spaceAfter=4 * mm,
        fontName='Helvetica-Bold',
    ))

    styles.add(ParagraphStyle(
        'CandidateName',
        parent=styles['Heading3'],
        fontSize=13,
        textColor=DARK_TEXT,
        spaceBefore=2 * mm,
        spaceAfter=2 * mm,
        fontName='Helvetica-Bold',
    ))

    styles.add(ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontSize=9,
        textColor=DARK_TEXT,
        leading=14,
    ))

    styles.add(ParagraphStyle(
        'SmallText',
        parent=styles['Normal'],
        fontSize=8,
        textColor=MUTED_TEXT,
        leading=12,
    ))

    styles.add(ParagraphStyle(
        'TagGreen',
        parent=styles['Normal'],
        fontSize=8,
        textColor=BRAND_GREEN,
    ))

    styles.add(ParagraphStyle(
        'TagRed',
        parent=styles['Normal'],
        fontSize=8,
        textColor=BRAND_RED,
    ))

    styles.add(ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=7,
        textColor=MUTED_TEXT,
        alignment=TA_CENTER,
    ))

    return styles


def get_score_color(score):
    if score >= 80:
        return BRAND_GREEN
    elif score >= 60:
        return BRAND_YELLOW
    else:
        return BRAND_RED


def get_recommendation_color(rec):
    rec_lower = (rec or '').lower()
    if 'best' in rec_lower:
        return BRAND_GREEN
    elif 'recommended' in rec_lower:
        return BRAND_BLUE
    else:
        return BRAND_YELLOW


def generate_evaluation_report(evaluation_data: dict) -> bytes:
    """
    Generate a PDF evaluation report.

    Args:
        evaluation_data: The evaluation results dict containing:
            - job_description_summary
            - jd_parsed
            - total_cvs
            - ranked_candidates (list)

    Returns:
        bytes: PDF file content
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = get_styles()
    elements = []

    # ═══════════════════════════════════
    # HEADER
    # ═══════════════════════════════════
    elements.append(Paragraph('CV Evaluation Report', styles['ReportTitle']))
    elements.append(Paragraph(
        f'Generated on {datetime.now().strftime("%B %d, %Y at %I:%M %p")} | '
        f'{evaluation_data.get("total_cvs", 0)} candidates analyzed',
        styles['ReportSubtitle']
    ))
    elements.append(HRFlowable(width="100%", thickness=2, color=BRAND_BLUE, spaceAfter=6 * mm))

    # ═══════════════════════════════════
    # JOB SUMMARY
    # ═══════════════════════════════════
    job_summary = evaluation_data.get('job_description_summary', 'N/A')
    jd_parsed = evaluation_data.get('jd_parsed', {})

    elements.append(Paragraph('Job Position', styles['SectionHeader']))
    elements.append(Paragraph(job_summary, styles['ReportBody']))
    elements.append(Spacer(1, 3 * mm))

    # Required & preferred skills
    req_skills = jd_parsed.get('required_skills', [])
    pref_skills = jd_parsed.get('preferred_skills', [])
    min_exp = jd_parsed.get('min_experience_years', 'N/A')
    edu_req = jd_parsed.get('education_requirement', 'N/A')

    if req_skills:
        elements.append(Paragraph(
            f'<b>Required Skills:</b> {", ".join(req_skills)}',
            styles['ReportBody']
        ))
    if pref_skills:
        elements.append(Paragraph(
            f'<b>Preferred Skills:</b> {", ".join(pref_skills)}',
            styles['ReportBody']
        ))
    elements.append(Paragraph(
        f'<b>Min Experience:</b> {min_exp} years  |  <b>Education:</b> {edu_req}',
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 6 * mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=MEDIUM_GRAY, spaceAfter=4 * mm))

    # ═══════════════════════════════════
    # RANKED CANDIDATES
    # ═══════════════════════════════════
    elements.append(Paragraph('Ranked Candidates', styles['SectionHeader']))

    rank_labels = {1: 'BEST MATCH', 2: 'RECOMMENDED', 3: 'WORTH CONSIDERING'}
    rank_colors_map = {1: BRAND_GREEN, 2: BRAND_BLUE, 3: BRAND_YELLOW}

    candidates = evaluation_data.get('ranked_candidates', [])

    for candidate in candidates:
        rank = candidate.get('rank', 0)
        name = candidate.get('candidate_name', candidate.get('filename', 'Unknown'))
        filename = candidate.get('filename', 'N/A')
        score = candidate.get('score', 0)
        confidence = candidate.get('confidence', 0)
        recommendation = candidate.get('hire_recommendation', rank_labels.get(rank, ''))
        reasoning = candidate.get('reasoning', '')
        score_breakdown = candidate.get('score_breakdown', {})
        skills_matched = candidate.get('skills_matched', [])
        skills_missing = candidate.get('skills_missing', [])
        why_selected = candidate.get('why_selected', [])
        why_not_others = candidate.get('why_not_others', [])
        strengths = candidate.get('strengths', [])
        gaps = candidate.get('gaps', [])

        candidate_elements = []

        # Rank + Name + Score header
        score_color = get_score_color(score)
        rec_color = get_recommendation_color(recommendation)

        header_data = [
            [
                Paragraph(f'<b>#{rank}</b>', ParagraphStyle('RankNum', fontSize=16, textColor=colors.white, alignment=TA_CENTER)),
                Paragraph(f'<b>{name}</b><br/><font size="8" color="{MUTED_TEXT.hexval()}">{filename}</font>', styles['ReportBody']),
                Paragraph(f'<b><font size="18" color="{score_color.hexval()}">{score}%</font></b><br/><font size="7" color="{MUTED_TEXT.hexval()}">Confidence: {confidence}%</font>', ParagraphStyle('ScoreCell', alignment=TA_RIGHT, fontSize=9)),
            ]
        ]

        header_table = Table(header_data, colWidths=[1.5 * cm, 10 * cm, 5 * cm])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), rank_colors_map.get(rank, BRAND_BLUE)),
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ]))
        candidate_elements.append(header_table)
        candidate_elements.append(Spacer(1, 3 * mm))

        # Recommendation badge
        candidate_elements.append(Paragraph(
            f'<font color="{rec_color.hexval()}"><b>{recommendation}</b></font>',
            styles['ReportBody']
        ))
        candidate_elements.append(Spacer(1, 2 * mm))

        # Score Breakdown
        if score_breakdown:
            breakdown_labels = ['Hard Skills', 'Experience', 'Education', 'ATS Keywords', 'Presentation', 'Cultural Fit']
            breakdown_keys = ['hard_skills', 'experience', 'education', 'ats_keywords', 'presentation', 'cultural_fit']
            breakdown_data = [['Dimension', 'Score']]
            for label, key in zip(breakdown_labels, breakdown_keys):
                val = score_breakdown.get(key, 0)
                breakdown_data.append([label, str(val)])

            breakdown_table = Table(breakdown_data, colWidths=[8.5 * cm, 2 * cm])
            breakdown_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), BRAND_BLUE),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('ALIGN', (1, 0), (1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, MEDIUM_GRAY),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            candidate_elements.append(breakdown_table)
            candidate_elements.append(Spacer(1, 3 * mm))

        # Skills matched / missing
        if skills_matched:
            candidate_elements.append(Paragraph(
                f'<b>Skills Matched:</b> <font color="{BRAND_GREEN.hexval()}">{", ".join(skills_matched)}</font>',
                styles['ReportBody']
            ))
        if skills_missing:
            candidate_elements.append(Paragraph(
                f'<b>Skills Missing:</b> <font color="{BRAND_RED.hexval()}">{", ".join(skills_missing)}</font>',
                styles['ReportBody']
            ))
        candidate_elements.append(Spacer(1, 2 * mm))

        # Why Selected
        if why_selected:
            candidate_elements.append(Paragraph('<b>Why This Candidate:</b>', styles['ReportBody']))
            for w in why_selected:
                candidate_elements.append(Paragraph(f'  + {w}', styles['SmallText']))

        # Why Not Others
        if why_not_others:
            candidate_elements.append(Paragraph('<b>Compared to Others:</b>', styles['ReportBody']))
            for w in why_not_others:
                candidate_elements.append(Paragraph(f'  vs {w}', styles['SmallText']))

        # Reasoning
        if reasoning:
            candidate_elements.append(Spacer(1, 2 * mm))
            candidate_elements.append(Paragraph(f'<b>Analysis:</b> {reasoning}', styles['ReportBody']))

        # Strengths
        if strengths:
            candidate_elements.append(Spacer(1, 2 * mm))
            candidate_elements.append(Paragraph(
                f'<b>Strengths:</b> {" | ".join(strengths)}',
                styles['SmallText']
            ))

        # Gaps
        if gaps:
            candidate_elements.append(Paragraph(
                f'<b>Gaps:</b> <font color="{BRAND_RED.hexval()}">{" | ".join(gaps)}</font>',
                styles['SmallText']
            ))

        candidate_elements.append(Spacer(1, 4 * mm))
        candidate_elements.append(HRFlowable(width="100%", thickness=0.5, color=MEDIUM_GRAY, spaceAfter=4 * mm))

        elements.append(KeepTogether(candidate_elements))

    # ═══════════════════════════════════
    # FOOTER
    # ═══════════════════════════════════
    elements.append(Spacer(1, 10 * mm))
    elements.append(HRFlowable(width="100%", thickness=1, color=BRAND_BLUE, spaceAfter=4 * mm))
    elements.append(Paragraph(
        f'Generated by CV Summit AI | {datetime.now().strftime("%Y-%m-%d %H:%M")} | Confidential',
        styles['Footer']
    ))

    # Build PDF
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
