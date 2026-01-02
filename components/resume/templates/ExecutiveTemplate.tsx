'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import { ResumeData } from '@/lib/resumeDataTypes';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

interface ExecutiveTemplateProps {
  data: ResumeData;
}

export function ExecutiveTemplate({ data }: ExecutiveTemplateProps) {
  return (
    <div className={`bg-white p-8 min-h-[1000px] text-gray-800 ${inter.className}`}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight uppercase">
          {data.name || 'Your Name'}
        </h1>
        {data.title && (
          <p className="text-xl font-semibold text-gray-900 uppercase tracking-wide mt-1">
            {data.title}
          </p>
        )}
        <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
          {data.location && <span>{data.location}</span>}
          {data.location && data.email && <span>|</span>}
          {data.email && <span>{data.email}</span>}
          {data.email && data.website && <span>|</span>}
          {data.website && <span>{data.website}</span>}
        </div>
      </div>

      <div className="h-0.5 bg-[#d4a574] mb-5" />

      <div className="space-y-5">
        {/* Summary */}
        {data.summary && (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b border-[#d4a574]">
              Summary
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed text-justify">{data.summary}</p>
          </div>
        )}

        {/* Professional Experience */}
        {data.experience && data.experience.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b border-[#d4a574]">
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
                          <span className="text-gray-600">•</span>
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
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b border-[#d4a574]">
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
                          <span className="text-gray-600">•</span>
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

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b border-[#d4a574]">
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
                          <span className="text-gray-600">•</span>
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
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-2 pb-1 border-b border-[#d4a574]">
              Additional Information
            </h2>
            <ul className="ml-3 space-y-0.5">
              {data.languages && data.languages.length > 0 && (
                <li className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-600">•</span>
                  <span><span className="font-bold">Languages:</span> {data.languages.join(', ')}.</span>
                </li>
              )}
              {data.certifications && data.certifications.length > 0 && (
                <li className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-600">•</span>
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
