'use client';

import React from 'react';
import { ResumeData, getSectionOrder, getSectionLabel, SectionKey } from '@/lib/resumeDataTypes';
import { getTemplateStyle, generateCSSStyles } from '@/lib/templateStyles';
import { ptToPx } from '@/lib/templateConverters';

interface ClassicTemplateProps {
  data: ResumeData;
}

export function ClassicTemplate({ data }: ClassicTemplateProps) {
  const templateStyle = getTemplateStyle('classic');
  const css = generateCSSStyles(templateStyle);
  const sectionOrder = getSectionOrder(data);

  // Classic template uses a two-column layout with section labels on the left
  const leftColumnWidth = 140; // pixels
  const gapWidth = 24; // pixels

  const sectionContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: `${gapWidth}px`,
    marginBottom: `${ptToPx(templateStyle.spacing.sectionGap)}px`,
  };

  const sectionLabelStyle: React.CSSProperties = {
    width: `${leftColumnWidth}px`,
    flexShrink: 0,
    fontSize: `${ptToPx(templateStyle.fontSize.sectionHeading)}px`,
    fontWeight: 700,
    color: templateStyle.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  };

  const sectionContentStyle: React.CSSProperties = {
    flex: 1,
  };

  const dividerStyle: React.CSSProperties = {
    height: `${templateStyle.layout.dividerWeight}px`,
    backgroundColor: templateStyle.colors.divider,
    marginTop: `${ptToPx(templateStyle.spacing.sectionGap)}px`,
    marginBottom: `${ptToPx(templateStyle.spacing.sectionGap)}px`,
  };

  const jobTitleRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  };

  const jobTitleStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: `${ptToPx(templateStyle.fontSize.jobTitle)}px`,
    color: templateStyle.colors.bodyText,
  };

  const periodStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
    color: templateStyle.colors.bodyText,
    flexShrink: 0,
    marginLeft: '16px',
  };

  const companyStyle: React.CSSProperties = {
    fontStyle: 'italic',
    fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
    color: templateStyle.colors.subtleText,
  };

  const bulletListStyle: React.CSSProperties = {
    marginTop: '4px',
    marginLeft: '16px',
    listStyleType: 'disc',
    paddingLeft: '0',
  };

  const bulletItemStyle: React.CSSProperties = {
    fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
    color: templateStyle.colors.bodyText,
    marginBottom: '2px',
    lineHeight: templateStyle.spacing.lineHeight,
  };

  const renderSection = (sectionKey: SectionKey) => {
    switch (sectionKey) {
      case 'summary':
        if (!data.summary || data.summary.trim().length === 0) return null;
        return (
          <React.Fragment key={sectionKey}>
            <div style={sectionContainerStyle}>
              <h2 style={sectionLabelStyle}>{getSectionLabel(data, 'summary', 'classic')}</h2>
              <p style={{
                ...sectionContentStyle,
                fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
                color: templateStyle.colors.bodyText,
                lineHeight: templateStyle.spacing.lineHeight,
                textAlign: 'justify',
              }}>
                {data.summary}
              </p>
            </div>
            <div style={dividerStyle} />
          </React.Fragment>
        );

      case 'experience':
        if (!data.experience || data.experience.length === 0) return null;
        const experienceLabel = getSectionLabel(data, 'experience', 'classic');
        return (
          <React.Fragment key={sectionKey}>
            <div style={sectionContainerStyle}>
              <h2 style={sectionLabelStyle}>
                {experienceLabel.includes(' ') ? (
                  <>
                    {experienceLabel.split(' ')[0]}
                    <br />
                    {experienceLabel.split(' ').slice(1).join(' ')}
                  </>
                ) : experienceLabel}
              </h2>
              <div style={{ ...sectionContentStyle }}>
                {data.experience.map((exp, idx) => (
                  <div key={idx} style={{ marginBottom: idx < data.experience!.length - 1 ? '12px' : 0 }}>
                    <div style={jobTitleRowStyle}>
                      <span style={jobTitleStyle}>{exp.title}</span>
                      <span style={periodStyle}>{exp.period}</span>
                    </div>
                    <p style={companyStyle}>{exp.company}</p>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul style={bulletListStyle}>
                        {exp.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} style={bulletItemStyle}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={dividerStyle} />
          </React.Fragment>
        );

      case 'education':
        if (!data.education || data.education.length === 0) return null;
        return (
          <React.Fragment key={sectionKey}>
            <div style={sectionContainerStyle}>
              <h2 style={sectionLabelStyle}>{getSectionLabel(data, 'education', 'classic')}</h2>
              <div style={{ ...sectionContentStyle }}>
                {data.education.map((edu, idx) => (
                  <div key={idx} style={{ marginBottom: idx < data.education!.length - 1 ? '10px' : 0 }}>
                    <div style={jobTitleRowStyle}>
                      <span style={jobTitleStyle}>{edu.degree}</span>
                      <span style={periodStyle}>{edu.period}</span>
                    </div>
                    <p style={{
                      fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
                      color: templateStyle.colors.subtleText,
                    }}>
                      {edu.institution}
                    </p>
                    {edu.details && edu.details.length > 0 && (
                      <ul style={bulletListStyle}>
                        {edu.details.map((detail, dIdx) => (
                          <li key={dIdx} style={bulletItemStyle}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={dividerStyle} />
          </React.Fragment>
        );

      case 'skills':
        if (!data.skills || data.skills.length === 0) return null;
        return (
          <React.Fragment key={sectionKey}>
            <div style={sectionContainerStyle}>
              <h2 style={sectionLabelStyle}>{getSectionLabel(data, 'skills', 'classic')}</h2>
              <ul style={{
                ...sectionContentStyle,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '4px 32px',
                listStyleType: 'disc',
                paddingLeft: '16px',
                margin: 0,
              }}>
                {data.skills.map((skill, idx) => (
                  <li key={idx} style={bulletItemStyle}>{skill}</li>
                ))}
              </ul>
            </div>
            <div style={dividerStyle} />
          </React.Fragment>
        );

      case 'projects':
        if (!data.projects || data.projects.length === 0) return null;
        return (
          <React.Fragment key={sectionKey}>
            <div style={sectionContainerStyle}>
              <h2 style={sectionLabelStyle}>{getSectionLabel(data, 'projects', 'classic')}</h2>
              <div style={{ ...sectionContentStyle }}>
                {data.projects.map((project, idx) => (
                  <div key={idx} style={{ marginBottom: idx < data.projects!.length - 1 ? '10px' : 0 }}>
                    <div style={jobTitleRowStyle}>
                      <span style={jobTitleStyle}>{project.name}</span>
                      {project.period && <span style={periodStyle}>{project.period}</span>}
                    </div>
                    {project.organization && (
                      <p style={{
                        fontSize: `${ptToPx(templateStyle.fontSize.body)}px`,
                        color: templateStyle.colors.subtleText,
                      }}>
                        {project.organization}
                      </p>
                    )}
                    {project.details && project.details.length > 0 && (
                      <ul style={bulletListStyle}>
                        {project.details.map((detail, dIdx) => (
                          <li key={dIdx} style={bulletItemStyle}>{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div style={dividerStyle} />
          </React.Fragment>
        );

      case 'certifications':
        if (!data.certifications || data.certifications.length === 0) return null;
        return (
          <React.Fragment key={sectionKey}>
            <div style={sectionContainerStyle}>
              <h2 style={sectionLabelStyle}>{getSectionLabel(data, 'certifications', 'classic')}</h2>
              <ul style={{
                ...sectionContentStyle,
                listStyleType: 'disc',
                paddingLeft: '16px',
                margin: 0,
              }}>
                {data.certifications.map((cert, idx) => (
                  <li key={idx} style={bulletItemStyle}>{cert}</li>
                ))}
              </ul>
            </div>
            <div style={dividerStyle} />
          </React.Fragment>
        );

      case 'languages':
        if (!data.languages || data.languages.length === 0) return null;
        return (
          <div key={sectionKey} style={sectionContainerStyle}>
            <h2 style={sectionLabelStyle}>{getSectionLabel(data, 'languages', 'classic')}</h2>
            <p style={{
              ...sectionContentStyle,
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

  return (
    <div style={{
      backgroundColor: 'white',
      padding: `${ptToPx(templateStyle.spacing.pageMargin)}px`,
      minHeight: '1000px',
      fontFamily: `${templateStyle.fonts.primary}, ${templateStyle.fonts.fallback.join(', ')}`,
      color: templateStyle.colors.bodyText,
      lineHeight: templateStyle.spacing.lineHeight,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{
          fontSize: `${ptToPx(templateStyle.fontSize.name)}px`,
          fontWeight: 700,
          color: templateStyle.colors.name,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: 0,
        }}>
          {data.name || 'Your Name'}
        </h1>
        <div style={{
          marginTop: '8px',
          fontSize: `${ptToPx(templateStyle.fontSize.contact)}px`,
          color: templateStyle.colors.subtleText,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          {data.phone && <span>{data.phone}</span>}
          {data.phone && data.email && <span>{templateStyle.layout.contactSeparator}</span>}
          {data.email && <span>{data.email}</span>}
          {(data.phone || data.email) && data.location && <span>{templateStyle.layout.contactSeparator}</span>}
          {data.location && <span>{data.location}</span>}
        </div>
      </div>

      {/* Header Divider */}
      <div style={{
        height: '3px',
        backgroundColor: templateStyle.colors.divider,
        marginBottom: `${ptToPx(templateStyle.spacing.sectionGap)}px`,
      }} />

      {/* Sections */}
      {sectionOrder.map((sectionKey) => renderSection(sectionKey))}
    </div>
  );
}
