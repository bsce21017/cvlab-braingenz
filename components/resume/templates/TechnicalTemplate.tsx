'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import { ResumeData } from '@/lib/resumeDataTypes';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

interface TechnicalTemplateProps {
  data: ResumeData;
}

export function TechnicalTemplate({ data }: TechnicalTemplateProps) {
  return (
    <div className={`bg-white p-8 min-h-[1000px] text-gray-800 ${inter.className}`}>
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold text-[#1D61CB] tracking-wide uppercase">
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

      <div className="space-y-5 mt-6">
        {/* Summary */}
        {data.summary && (
          <div>
            <h2 className="text-base font-bold text-[#1D61CB] uppercase tracking-wide mb-2 py-1 border-t border-b border-[#1D61CB]">
              Summary
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed text-justify">{data.summary}</p>
          </div>
        )}

        {/* Technical Skills - Grid Layout */}
        {data.skills && data.skills.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-[#1D61CB] uppercase tracking-wide mb-3 py-1 border-t border-b border-[#1D61CB]">
              Technical Skills
            </h2>
            <div className="grid grid-cols-3 gap-x-6 gap-y-1">
              {data.skills.map((skill, idx) => (
                <span key={idx} className="text-sm text-gray-700">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Professional Experience */}
        {data.experience && data.experience.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-[#1D61CB] uppercase tracking-wide mb-2 py-1 border-t border-b border-[#1D61CB]">
              Professional Experience
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm">{exp.title}, {exp.company}</h3>
                    <span className="font-bold text-sm text-[#1D61CB] flex-shrink-0 ml-4">{exp.period}</span>
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

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-[#1D61CB] uppercase tracking-wide mb-2 py-1 border-t border-b border-[#1D61CB]">
              Education
            </h2>
            <div className="space-y-3">
              {data.education.map((edu, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm">{edu.degree}</h3>
                    <span className="font-bold text-sm text-[#1D61CB] flex-shrink-0 ml-4">{edu.period}</span>
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
            <h2 className="text-base font-bold text-[#1D61CB] uppercase tracking-wide mb-2 py-1 border-t border-b border-[#1D61CB]">
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
