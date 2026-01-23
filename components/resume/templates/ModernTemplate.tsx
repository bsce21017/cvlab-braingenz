'use client';

import React from 'react';
import { ResumeData, getSectionOrder, getSectionLabel, SectionKey } from '@/lib/resumeDataTypes';
import { getTemplateStyle } from '@/lib/templateStyles';
import { ptToPx } from '@/lib/templateConverters';

interface ModernTemplateProps {
  data: ResumeData;
}

export function ModernTemplate({ data }: ModernTemplateProps) {
  const templateStyle = getTemplateStyle('modern');
  const sectionOrder = getSectionOrder(data);

  // Modern template: Serif font, section heading with gray line extending to right
  // Uses middle dot (·) separator for contact info

  const sectionStyle: React.CSSProperties = {
    marginBottom: `${ptToPx(templateStyle.spacing.sectionGap)}px`,
  };

  // Section heading with line extending to right
  const sectionHeadingContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: `${ptToPx(templateStyle.spacing.itemGap)}px`,
  };

  const sectionHeadingTextStyle: React.CSSProperties = {
    fontSize: `${ptToPx(templateStyle.fontSize.sectionHeading)}px`,
    fontWeight: 'normal',
    color: templateStyle.colors.sectionHeading,
    whiteSpace: 'nowrap',
    marginRight: '10px',
    letterSpacing: '0.5px',
  };

  const sectionHeadingLineStyle: React.CSSProperties = {
    flex: 1,
    height: '0.5px',
    backgroundColor: templateStyle.colors.divider,
  };

  const titleRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '2px',
  };

  const titleTextStyle: React.CSSProperties = {
    fontSize: `${ptToPx(templateStyle.fontSize.jobTitle)}px`,
    fontWeight: 700,
    color: templateStyle.colors.sectionHeading,
  };

  const dateTextStyle: React.CSSProperties = {
    fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
    color: templateStyle.colors.subtleText,
  };

  const companyLineStyle: React.CSSProperties = {
    fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
    fontStyle: 'italic',
    color: templateStyle.colors.subtleText,
    marginBottom: '4px',
  };

  const bulletListStyle: React.CSSProperties = {
    marginTop: '4px',
    paddingLeft: '14px',
    listStyleType: 'none',
  };

  const bulletItemStyle: React.CSSProperties = {
    fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
    color: templateStyle.colors.bodyText,
    marginBottom: '3px',
    lineHeight: 1.35,
    display: 'flex',
  };

  const bulletCharStyle: React.CSSProperties = {
    width: '14px',
    flexShrink: 0,
    fontSize: '8pt',
    color: templateStyle.colors.bodyText,
  };

  const renderSection = (sectionKey: SectionKey) => {
    switch (sectionKey) {
      case 'summary':
        if (!data.summary || data.summary.trim().length === 0) return null;
        return (
          <div key={sectionKey} style={sectionStyle}>
            <div style={sectionHeadingContainerStyle}>
              <span style={sectionHeadingTextStyle}>{getSectionLabel(data, 'summary', 'modern')}</span>
              <div style={sectionHeadingLineStyle}></div>
            </div>
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

      case 'experience':
        if (!data.experience || data.experience.length === 0) return null;
        return (
          <div key={sectionKey} style={sectionStyle}>
            <div style={sectionHeadingContainerStyle}>
              <span style={sectionHeadingTextStyle}>{getSectionLabel(data, 'experience', 'modern')}</span>
              <div style={sectionHeadingLineStyle}></div>
            </div>
            <div>
              {data.experience.map((exp, idx) => (
                <div key={idx} style={{ marginBottom: idx < data.experience!.length - 1 ? '14px' : 0 }}>
                  <div style={titleRowStyle}>
                    <span style={titleTextStyle}>{exp.title}</span>
                    <span style={dateTextStyle}>{exp.period}</span>
                  </div>
                  <div style={companyLineStyle}>
                    {exp.company}{(exp as any).location ? ` – ${(exp as any).location}` : ''}
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul style={bulletListStyle}>
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} style={bulletItemStyle}>
                          <span style={bulletCharStyle}>{templateStyle.layout.bulletStyle}</span>
                          <span style={{ flex: 1 }}>{bullet}</span>
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
            <div style={sectionHeadingContainerStyle}>
              <span style={sectionHeadingTextStyle}>{getSectionLabel(data, 'education', 'modern')}</span>
              <div style={sectionHeadingLineStyle}></div>
            </div>
            <div>
              {data.education.map((edu, idx) => (
                <div key={idx} style={{ marginBottom: idx < data.education!.length - 1 ? '6px' : 0 }}>
                  <div style={titleRowStyle}>
                    <span style={titleTextStyle}>{edu.degree}</span>
                    <span style={dateTextStyle}>{edu.period}</span>
                  </div>
                  <div style={{
                    fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
                    fontStyle: 'italic',
                    color: templateStyle.colors.subtleText,
                  }}>
                    {edu.institution}
                  </div>
                  {edu.details && edu.details.length > 0 && (
                    <ul style={bulletListStyle}>
                      {edu.details.map((detail, dIdx) => (
                        <li key={dIdx} style={bulletItemStyle}>
                          <span style={bulletCharStyle}>{templateStyle.layout.bulletStyle}</span>
                          <span style={{ flex: 1 }}>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'skills':
        if (!data.skills || data.skills.length === 0) return null;
        return (
          <div key={sectionKey} style={sectionStyle}>
            <div style={sectionHeadingContainerStyle}>
              <span style={sectionHeadingTextStyle}>{getSectionLabel(data, 'skills', 'modern')}</span>
              <div style={sectionHeadingLineStyle}></div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '4px 16px',
            }}>
              {data.skills.map((skill, idx) => (
                <span key={idx} style={{
                  fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
                  color: templateStyle.colors.bodyText,
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        );

      case 'projects':
        if (!data.projects || data.projects.length === 0) return null;
        return (
          <div key={sectionKey} style={sectionStyle}>
            <div style={sectionHeadingContainerStyle}>
              <span style={sectionHeadingTextStyle}>{getSectionLabel(data, 'projects', 'modern')}</span>
              <div style={sectionHeadingLineStyle}></div>
            </div>
            <div>
              {data.projects.map((project, idx) => (
                <div key={idx} style={{ marginBottom: idx < data.projects!.length - 1 ? '10px' : 0 }}>
                  <div style={titleRowStyle}>
                    <span style={titleTextStyle}>{project.name}</span>
                    {project.period && <span style={dateTextStyle}>{project.period}</span>}
                  </div>
                  {project.organization && <div style={companyLineStyle}>{project.organization}</div>}
                  {project.details && project.details.length > 0 && (
                    <ul style={bulletListStyle}>
                      {project.details.map((detail, dIdx) => (
                        <li key={dIdx} style={bulletItemStyle}>
                          <span style={bulletCharStyle}>{templateStyle.layout.bulletStyle}</span>
                          <span style={{ flex: 1 }}>{detail}</span>
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
            <div style={sectionHeadingContainerStyle}>
              <span style={sectionHeadingTextStyle}>{getSectionLabel(data, 'certifications', 'modern')}</span>
              <div style={sectionHeadingLineStyle}></div>
            </div>
            <ul style={bulletListStyle}>
              {data.certifications.map((cert, idx) => (
                <li key={idx} style={bulletItemStyle}>
                  <span style={bulletCharStyle}>{templateStyle.layout.bulletStyle}</span>
                  <span style={{ flex: 1 }}>{cert}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'languages':
        if (!data.languages || data.languages.length === 0) return null;
        return (
          <div key={sectionKey} style={sectionStyle}>
            <div style={sectionHeadingContainerStyle}>
              <span style={sectionHeadingTextStyle}>{getSectionLabel(data, 'languages', 'modern')}</span>
              <div style={sectionHeadingLineStyle}></div>
            </div>
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

  // Build contact parts with middle dot separator
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
      {/* Header - NO divider after contact */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{
          fontSize: `${ptToPx(templateStyle.fontSize.name)}px`,
          fontWeight: 700,
          color: templateStyle.colors.name,
          marginBottom: '4px',
        }}>
          {data.name || 'Your Name'}
        </h1>
        <div style={{
          fontSize: `${ptToPx(templateStyle.fontSize.contact)}px`,
          color: templateStyle.colors.subtleText,
        }}>
          {contactParts.join(` ${templateStyle.layout.contactSeparator} `)}
        </div>
      </div>

      {/* Sections */}
      {sectionOrder.map((sectionKey) => renderSection(sectionKey))}
    </div>
  );
}
