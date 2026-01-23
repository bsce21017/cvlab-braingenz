'use client';

import React from 'react';
import { ResumeData, getSectionOrder, getSectionLabel, SectionKey } from '@/lib/resumeDataTypes';
import { getTemplateStyle } from '@/lib/templateStyles';
import { ptToPx } from '@/lib/templateConverters';

interface ExecutiveTemplateProps {
  data: ResumeData;
}

export function ExecutiveTemplate({ data }: ExecutiveTemplateProps) {
  const templateStyle = getTemplateStyle('executive');
  const sectionOrder = getSectionOrder(data);

  // Executive template: Serif font, thick navy underlines, CORE COMPETENCIES with pipes
  // NO title under name, NO header divider
  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: `${ptToPx(templateStyle.fontSize.sectionHeading)}px`,
    fontWeight: 700,
    color: templateStyle.colors.sectionHeading,
    textTransform: 'uppercase',
    borderBottom: `${templateStyle.layout.dividerWeight}px solid ${templateStyle.colors.divider}`,
    paddingBottom: '3px',
    marginBottom: `${ptToPx(templateStyle.spacing.itemGap)}px`,
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: `${ptToPx(templateStyle.spacing.sectionGap)}px`,
  };

  const expTitleStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: `${ptToPx(templateStyle.fontSize.jobTitle)}px`,
    color: templateStyle.colors.bodyText,
    marginBottom: '1px',
  };

  const companyLineStyle: React.CSSProperties = {
    fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
    color: templateStyle.colors.bodyText,
    marginBottom: '2px',
  };

  const companyNameStyle: React.CSSProperties = {
    fontWeight: 700,
  };

  const bulletListStyle: React.CSSProperties = {
    marginTop: '2px',
    listStyleType: 'none',
    padding: 0,
  };

  const bulletItemStyle: React.CSSProperties = {
    fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
    color: templateStyle.colors.bodyText,
    marginBottom: '2px',
    lineHeight: templateStyle.spacing.lineHeight,
    display: 'flex',
    gap: '8px',
  };

  const renderSection = (sectionKey: SectionKey) => {
    switch (sectionKey) {
      case 'summary':
        if (!data.summary || data.summary.trim().length === 0) return null;
        return (
          <div key={sectionKey} style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>{getSectionLabel(data, 'summary', 'executive')}</h2>
            <p style={{
              fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
              color: templateStyle.colors.bodyText,
              lineHeight: templateStyle.spacing.lineHeight,
              textAlign: 'justify',
            }}>
              {data.summary}
            </p>
          </div>
        );

      case 'skills':
        if (!data.skills || data.skills.length === 0) return null;
        // Executive template shows skills as pipe-separated in a CORE COMPETENCIES section
        return (
          <div key={sectionKey} style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>{getSectionLabel(data, 'skills', 'executive')}</h2>
            <p style={{
              fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
              color: templateStyle.colors.bodyText,
              textAlign: 'left',
              lineHeight: 1.6,
            }}>
              {data.skills.join(` ${templateStyle.layout.skillsSeparator} `)}
            </p>
          </div>
        );

      case 'experience':
        if (!data.experience || data.experience.length === 0) return null;
        return (
          <div key={sectionKey} style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>{getSectionLabel(data, 'experience', 'executive')}</h2>
            <div>
              {data.experience.map((exp, idx) => (
                <div key={idx} style={{ marginBottom: idx < data.experience!.length - 1 ? '8px' : 0 }}>
                  <div style={expTitleStyle}>{exp.title}</div>
                  <div style={companyLineStyle}>
                    <span style={companyNameStyle}>{exp.company}</span>
                    {(exp as any).location && ` | ${(exp as any).location}`}
                    {exp.period && ` | ${exp.period}`}
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul style={bulletListStyle}>
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} style={bulletItemStyle}>
                          <span style={{ color: templateStyle.colors.bodyText }}>{templateStyle.layout.bulletStyle}</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'education':
        if (!data.education || data.education.length === 0) return null;
        return (
          <div key={sectionKey} style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>{getSectionLabel(data, 'education', 'executive')}</h2>
            <div>
              {data.education.map((edu, idx) => (
                <div key={idx} style={{ marginBottom: idx < data.education!.length - 1 ? '6px' : 0 }}>
                  <div style={{
                    fontSize: `${ptToPx(templateStyle.fontSize.jobTitle)}px`,
                    fontWeight: 700,
                    color: templateStyle.colors.bodyText,
                  }}>
                    {edu.degree}
                  </div>
                  <div style={{
                    fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
                    color: templateStyle.colors.bodyText,
                  }}>
                    {edu.institution}{edu.period ? `, ${edu.period}` : ''}
                  </div>
                  {edu.details && edu.details.length > 0 && (
                    <ul style={bulletListStyle}>
                      {edu.details.map((detail, dIdx) => (
                        <li key={dIdx} style={bulletItemStyle}>
                          <span style={{ color: templateStyle.colors.bodyText }}>{templateStyle.layout.bulletStyle}</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'projects':
        if (!data.projects || data.projects.length === 0) return null;
        return (
          <div key={sectionKey} style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>{getSectionLabel(data, 'projects', 'executive')}</h2>
            <div>
              {data.projects.map((project, idx) => (
                <div key={idx} style={{ marginBottom: idx < data.projects!.length - 1 ? '8px' : 0 }}>
                  <div style={expTitleStyle}>{project.name}</div>
                  {project.organization && (
                    <div style={companyLineStyle}>
                      <span style={companyNameStyle}>{project.organization}</span>
                      {project.period && ` | ${project.period}`}
                    </div>
                  )}
                  {project.details && project.details.length > 0 && (
                    <ul style={bulletListStyle}>
                      {project.details.map((detail, dIdx) => (
                        <li key={dIdx} style={bulletItemStyle}>
                          <span style={{ color: templateStyle.colors.bodyText }}>{templateStyle.layout.bulletStyle}</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'certifications':
        if (!data.certifications || data.certifications.length === 0) return null;
        return (
          <div key={sectionKey} style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>{getSectionLabel(data, 'certifications', 'executive')}</h2>
            <ul style={bulletListStyle}>
              {data.certifications.map((cert, idx) => (
                <li key={idx} style={bulletItemStyle}>
                  <span style={{ color: templateStyle.colors.bodyText }}>{templateStyle.layout.bulletStyle}</span>
                  <span>{cert}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'languages':
        if (!data.languages || data.languages.length === 0) return null;
        return (
          <div key={sectionKey} style={sectionStyle}>
            <h2 style={sectionHeadingStyle}>{getSectionLabel(data, 'languages', 'executive')}</h2>
            <p style={{
              fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
              color: templateStyle.colors.bodyText,
            }}>
              {data.languages.join(', ')}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  // Build contact parts
  const contactParts: string[] = [];
  if (data.phone) contactParts.push(data.phone);
  if (data.email) contactParts.push(data.email);
  if (data.location) contactParts.push(data.location);

  return (
    <div style={{
      backgroundColor: 'white',
      padding: `${ptToPx(templateStyle.spacing.pageMargin)}px`,
      minHeight: '1000px',
      fontFamily: `${templateStyle.fonts.primary}, ${templateStyle.fonts.fallback.join(', ')}`,
      color: templateStyle.colors.bodyText,
      lineHeight: templateStyle.spacing.lineHeight,
    }}>
      {/* Header - Name only, NO title, NO header divider */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{
          fontSize: `${ptToPx(templateStyle.fontSize.name)}px`,
          fontWeight: 700,
          color: templateStyle.colors.name,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          margin: 0,
        }}>
          {data.name || 'Your Name'}
        </h1>
        {/* NO title displayed - Executive template doesn't show title under name */}
        <div style={{
          marginTop: '6px',
          fontSize: `${ptToPx(templateStyle.fontSize.contact)}px`,
          color: templateStyle.colors.subtleText,
        }}>
          {contactParts.join(` ${templateStyle.layout.contactSeparator} `)}
        </div>
      </div>

      {/* NO header divider - Executive template goes straight to first section */}

      {/* Sections */}
      {sectionOrder.map((sectionKey) => renderSection(sectionKey))}
    </div>
  );
}
