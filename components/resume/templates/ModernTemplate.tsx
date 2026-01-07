'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import { ResumeData, getSectionOrder, getSectionLabel, getPrimaryColor, SectionKey } from '@/lib/resumeDataTypes';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

interface ModernTemplateProps {
  data: ResumeData;
}

export function ModernTemplate({ data }: ModernTemplateProps) {
  const sectionOrder = getSectionOrder(data);
  const primaryColor = getPrimaryColor(data, 'modern');
  
  const renderSection = (sectionKey: SectionKey) => {
    switch (sectionKey) {
      case 'summary':
        if (!data.summary || data.summary.trim().length === 0) return null;
        return (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-400 pb-1">
              {getSectionLabel(data, 'summary', 'modern')}
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed text-justify">{data.summary}</p>
          </div>
        );
      
      case 'experience':
        if (!data.experience || data.experience.length === 0) return null;
        return (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-400 pb-1">
              {getSectionLabel(data, 'experience', 'modern')}
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm">{exp.title}, {exp.company}</h3>
                    <span className="font-bold text-sm flex-shrink-0 ml-4">{exp.period}</span>
                  </div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="mt-1 ml-3 space-y-0.5">
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-700">•</span>
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
      
      case 'skills':
        if (!data.skills || data.skills.length === 0) return null;
        return (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-400 pb-1">
              {getSectionLabel(data, 'skills', 'modern')}
            </h2>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1">
              {data.skills.map((skill, idx) => (
                <span key={idx} className="text-sm text-gray-700">{skill}</span>
              ))}
            </div>
          </div>
        );
      
      case 'education':
        if (!data.education || data.education.length === 0) return null;
        return (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-400 pb-1">
              {getSectionLabel(data, 'education', 'modern')}
            </h2>
            <div className="space-y-3">
              {data.education.map((edu, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm">{edu.degree}</h3>
                    <span className="font-bold text-sm flex-shrink-0 ml-4">{edu.period}</span>
                  </div>
                  <p className="text-sm text-gray-700">{edu.institution}</p>
                  {edu.details && edu.details.length > 0 && (
                    <ul className="mt-1 ml-3">
                      {edu.details.map((detail, dIdx) => (
                        <li key={dIdx} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-700">•</span>
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
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-400 pb-1">
              {getSectionLabel(data, 'projects', 'modern')}
            </h2>
            <div className="space-y-3">
              {data.projects.map((project, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm">{project.name}</h3>
                    {project.period && <span className="font-bold text-sm flex-shrink-0 ml-4">{project.period}</span>}
                  </div>
                  {project.organization && (
                    <p className="text-sm text-gray-700">{project.organization}</p>
                  )}
                  {project.details && project.details.length > 0 && (
                    <ul className="mt-1 ml-3">
                      {project.details.map((detail, dIdx) => (
                        <li key={dIdx} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-gray-700">•</span>
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
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-400 pb-1">
              {getSectionLabel(data, 'certifications', 'modern')}
            </h2>
            <ul className="ml-3 space-y-0.5">
              {data.certifications.map((cert, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-700">•</span>
                  <span>{cert}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      
      case 'languages':
        if (!data.languages || data.languages.length === 0) return null;
        return (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-400 pb-1">
              {getSectionLabel(data, 'languages', 'modern')}
            </h2>
            <p className="text-sm text-gray-700">{data.languages.join(', ')}</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white p-8 min-h-[1000px] text-gray-800 ${inter.className}`}>
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold tracking-wide uppercase" style={{ color: primaryColor }}>
          {data.name || 'Your Name'}
        </h1>
        <div className="mt-2 text-sm text-gray-600 flex items-center justify-center gap-2">
          {data.email && <span>{data.email}</span>}
          {data.email && data.phone && <span>|</span>}
          {data.phone && <span>{data.phone}</span>}
          {(data.email || data.phone) && data.location && <span>|</span>}
          {data.location && <span>{data.location}</span>}
        </div>
      </div>

      <div className="h-1 my-4" style={{ backgroundColor: primaryColor }} />

      <div className="space-y-5">
        {/* All sections rendered in order */}
        {sectionOrder.map((sectionKey) => (
          <React.Fragment key={sectionKey}>
            {renderSection(sectionKey)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
