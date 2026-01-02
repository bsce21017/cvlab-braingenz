'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import { ResumeData } from '@/lib/resumeDataTypes';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

interface ModernTemplateProps {
  data: ResumeData;
}

export function ModernTemplate({ data }: ModernTemplateProps) {
  return (
    <div className={`bg-white p-8 min-h-[1000px] text-gray-800 ${inter.className}`}>
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-wide uppercase">
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

      <div className="h-1 bg-gray-900 my-4" />

      <div className="space-y-5">
        {/* Summary */}
        {data.summary && (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-400 pb-1">
              Summary
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed text-justify">{data.summary}</p>
          </div>
        )}

        {/* Professional Experience */}
        {data.experience && data.experience.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-400 pb-1">
              Professional Experience
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
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-400 pb-1">
              Projects
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
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-400 pb-1">
              Skills
            </h2>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1">
              {data.skills.map((skill, idx) => (
                <span key={idx} className="text-sm text-gray-700">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-400 pb-1">
              Education
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
        )}

        {/* Additional Information */}
        {((data.languages && data.languages.length > 0) ||
          (data.certifications && data.certifications.length > 0)) && (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 border-b border-gray-400 pb-1">
              Additional Information
            </h2>
            <ul className="ml-3 space-y-0.5">
              {data.languages && data.languages.length > 0 && (
                <li className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-700">•</span>
                  <span><span className="font-bold">Languages:</span> {data.languages.join(', ')}.</span>
                </li>
              )}
              {data.certifications && data.certifications.length > 0 && (
                <li className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-700">•</span>
                  <span><span className="font-bold">Certifications:</span> {data.certifications.join(', ')}.</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
