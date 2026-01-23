'use client';

import React, { useState } from 'react';
import { ClassicTemplate } from '@/app/components/resume/templates/ClassicTemplate';
import { ModernTemplate } from '@/app/components/resume/templates/ModernTemplate';
import { ExecutiveTemplate } from '@/app/components/resume/templates/ExecutiveTemplate';
import { ResumeData } from '@/lib/resumeDataTypes';

// Sample data matching the golden reference
const sampleData: ResumeData = {
  name: "Khalid Abdullah Al-Rashid",
  email: "khalid.rashid@email.com",
  phone: "Phone",
  location: "City",
  summary: "Technology executive with two decades of experience transforming enterprises across the GCC. Fluent in organizational leadership, digital transformation and M&A technology integration. Board member and advisor to several regional technology organizations.",
  experience: [
    {
      title: "Chief Technology Officer",
      company: "Al Habib Industrial Company",
      period: "2022 - Present",
      bullets: [
        "Led SAR 600M digital transformation across 12 business units—45% cost reduction, 99.99% uptime",
        "Built AI Center of Excellence: 15 ML models in production, 60% process automation",
        "Migrated 200+ apps to hybrid cloud (Azure/AWS), saving SAR 45M annually",
        "Led tech due diligence for SAR 1.6B in acquisitions; unified 5 ERPs to S/4HANA in 18 months",
        "Achieved ISO 27001 and SOC 2 certifications; zero data breaches over 4 years",
        "Scaled team from 120 to 290 across four countries; 87% retention rate"
      ]
    },
    {
      title: "Vice President, Technology & Digital",
      company: "Saudi National Petroleum Services",
      period: "2018 - 2022",
      bullets: [
        "Deployed IoT predictive maintenance across 2,400 pieces of equipment, reducing unplanned downtime by 52%",
        "Directed SAR 180M SAP implementation across finance, HR, supply chain, and project management",
        "Established technology innovation lab in partnership with KFUPM; incubated 8 internal startups",
        "Architected real-time data integration platform with Saudi Aramco"
      ]
    }
  ],
  education: [
    {
      degree: "MBA, Technology Management",
      institution: "INSEAD, France",
      period: "2012"
    },
    {
      degree: "BS Computer Engineering",
      institution: "KFUPM, Saudi Arabia",
      period: "2001"
    }
  ],
  skills: [
    "Project Portfolio Management",
    "P&L Oversight (SAR 150M+)",
    "Stakeholder Management",
    "Contract Negotiation (FIDIC/NEC)",
    "Lean Construction",
    "Value Engineering",
    "HSE Excellence",
    "PMIS Systems (Primavera P6, MS Project)",
    "Agile/Scrum",
    "Contractor Management"
  ],
  certifications: [
    "TOGAF 9.2",
    "AWS Solutions Architect Professional",
    "CISSP",
    "PMP"
  ],
  languages: [
    "Arabic (native)",
    "English (fluent)",
    "French (business)"
  ]
};

export default function TemplateTestPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern' | 'executive'>('executive');

  const renderTemplate = () => {
    switch (selectedTemplate) {
      case 'classic':
        return <ClassicTemplate data={sampleData} />;
      case 'modern':
        return <ModernTemplate data={sampleData} />;
      case 'executive':
        return <ExecutiveTemplate data={sampleData} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
          Template Preview Test Page
        </h1>

        {/* Template Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {(['classic', 'modern', 'executive'] as const).map((template) => (
            <button
              key={template}
              onClick={() => setSelectedTemplate(template)}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: selectedTemplate === template ? 'bold' : 'normal',
                backgroundColor: selectedTemplate === template ? '#003366' : '#fff',
                color: selectedTemplate === template ? '#fff' : '#333',
                border: '2px solid #003366',
                borderRadius: '8px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {template}
            </button>
          ))}
        </div>

        {/* Template Preview */}
        <div style={{
          backgroundColor: '#fff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
}
