'use client';

import React from 'react';
import { Inter } from 'next/font/google';
import { ResumeData } from '@/lib/resumeDataTypes';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

interface ClassicTemplateProps {
  data: ResumeData;
}

export function ClassicTemplate({ data }: ClassicTemplateProps) {
  return (
    <div className={`bg-white p-8 min-h-[1000px] text-gray-800 ${inter.className}`}>
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-[#004081] tracking-wide uppercase">
          {data.name || 'Your Name'}
        </h1>
        <div className="mt-2 text-sm text-gray-600 flex items-center justify-center gap-2 flex-wrap">
          {data.email && <span>{data.email}</span>}
          {data.email && data.phone && <span>|</span>}
          {data.phone && <span>{data.phone}</span>}
          {(data.email || data.phone) && data.location && <span>|</span>}
          {data.location && <span>{data.location}</span>}
        </div>
      </div>

      <div className="h-1 bg-[#004081] mb-6" />

      <div className="space-y-6">
        {/* Summary */}
        {data.summary && (
          <>
            <div className="flex gap-6">
              <h2 className="w-36 flex-shrink-0 text-base font-bold text-[#004081] uppercase tracking-wide">Summary</h2>
              <p className="flex-1 text-sm leading-relaxed text-justify">{data.summary}</p>
            </div>
            <div className="h-px bg-[#004081]" />
          </>
        )}

        {/* Work Experience */}
        {data.experience && data.experience.length > 0 && (
          <>
            <div className="flex gap-6">
              <h2 className="w-36 flex-shrink-0 text-base font-bold text-[#004081] uppercase tracking-wide">Work Experience</h2>
              <div className="flex-1 space-y-4">
                {data.experience.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm">{exp.title}, {exp.company}</h3>
                      <span className="font-bold text-sm flex-shrink-0 ml-4">{exp.period}</span>
                    </div>
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul className="mt-1 ml-6 space-y-0.5 list-disc">
                        {exp.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="text-sm">{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="h-px bg-[#004081]" />
          </>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <>
            <div className="flex gap-6">
              <h2 className="w-36 flex-shrink-0 text-base font-bold text-[#004081] uppercase tracking-wide">Education</h2>
              <div className="flex-1 space-y-3">
                {data.education.map((edu, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm">{edu.degree}</h3>
                      <span className="font-bold text-sm flex-shrink-0 ml-4">{edu.period}</span>
                    </div>
                    <p className="text-sm">{edu.institution}</p>
                    {edu.details && edu.details.length > 0 && (
                      <ul className="mt-1 ml-6 space-y-0.5 list-disc">
                        {edu.details.map((detail, dIdx) => (
                          <li key={dIdx} className="text-sm">{detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="h-px bg-[#004081]" />
          </>
        )}

        {/* Key Skills */}
        {data.skills && data.skills.length > 0 && (
          <>
            <div className="flex gap-6">
              <h2 className="w-36 flex-shrink-0 text-base font-bold text-[#004081] uppercase tracking-wide">Key Skills</h2>
              <ul className="flex-1 grid grid-cols-2 gap-x-8 gap-y-0.5 list-disc ml-6">
                {data.skills.map((skill, idx) => (
                  <li key={idx} className="text-sm">{skill}</li>
                ))}
              </ul>
            </div>
            <div className="h-px bg-[#004081]" />
          </>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <>
            <div className="flex gap-6">
              <h2 className="w-36 flex-shrink-0 text-base font-bold text-[#004081] uppercase tracking-wide">Certifications</h2>
              <ul className="flex-1 list-disc ml-6 space-y-0.5">
                {data.certifications.map((cert, idx) => (
                  <li key={idx} className="text-sm">{cert}</li>
                ))}
              </ul>
            </div>
            <div className="h-px bg-[#004081]" />
          </>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div className="flex gap-6">
            <h2 className="w-36 flex-shrink-0 text-base font-bold text-[#004081] uppercase tracking-wide">Languages</h2>
            <p className="flex-1 text-sm">{data.languages.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
