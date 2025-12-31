/**
 * Simplified Resume Data types for template rendering
 */

export interface ResumeData {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  summary?: string;
  experience: {
    title: string;
    company: string;
    period: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    period: string;
    details?: string[];
  }[];
  skills: string[];
  certifications: string[];
  languages: string[];
  projects?: {
    name: string;
    organization?: string;
    period?: string;
    details?: string[];
  }[];
}

/**
 * Convert ParsedResume to simplified ResumeData for templates
 */
import { ParsedResume } from './parseResumeText';
import { StructuredResumeData } from './api';

/**
 * Convert structured JSON from LLM directly to ResumeData (no parsing needed!)
 */
export function convertStructuredToResumeData(structured: StructuredResumeData): ResumeData {
  // Flatten skills from Record<string, string[]> to string[]
  const flatSkills: string[] = [];
  for (const category in structured.skills) {
    if (structured.skills[category] && Array.isArray(structured.skills[category])) {
      flatSkills.push(...structured.skills[category]);
    }
  }

  return {
    name: structured.contact.name || 'Resume',
    title: structured.contact.title,
    email: structured.contact.email,
    phone: structured.contact.phone,
    location: structured.contact.location,
    website: structured.contact.website,
    linkedin: structured.contact.linkedin,
    summary: structured.summary,
    experience: (structured.experience || []).map(exp => ({
      title: exp.title || '',
      company: exp.company || '',
      period: exp.period || '',
      bullets: exp.bullets || [],
    })),
    education: (structured.education || []).map(edu => ({
      degree: edu.degree || '',
      institution: edu.institution || '',
      period: edu.period || '',
      details: edu.details || [],
    })),
    skills: flatSkills,
    certifications: structured.certifications || [],
    languages: structured.languages || [],
    projects: structured.projects?.map(proj => ({
      name: proj.name || '',
      details: proj.description ? [proj.description, ...(proj.details || [])] : (proj.details || []),
    })),
  };
}

export function convertToResumeData(parsed: ParsedResume): ResumeData | null {
  if (!parsed) {
    return null;
  }

  // Flatten skills from Record<string, string[]> to string[]
  const flatSkills: string[] = [];
  for (const category in parsed.skills) {
    if (parsed.skills[category] && Array.isArray(parsed.skills[category])) {
      flatSkills.push(...parsed.skills[category]);
    }
  }

  // Ensure we have at least a name
  const name = parsed.contact?.name || 'Resume';

  return {
    name: name,
    title: parsed.contact?.title,
    email: parsed.contact?.email,
    phone: parsed.contact?.phone,
    location: parsed.contact?.location,
    website: parsed.contact?.website,
    linkedin: parsed.contact?.linkedin,
    summary: parsed.summary,
    experience: (parsed.experience || []).map(exp => ({
      title: exp.title || '',
      company: exp.company || '',
      period: exp.period || '',
      bullets: exp.bullets || [],
    })),
    education: (parsed.education || []).map(edu => ({
      degree: edu.degree || '',
      institution: edu.institution || '',
      period: edu.period || '',
      details: edu.details || [],
    })),
    skills: flatSkills,
    certifications: parsed.certifications || [],
    languages: parsed.languages || [],
    projects: parsed.projects?.map(proj => ({
      name: proj.name || '',
      details: proj.description ? [proj.description] : [],
    })),
  };
}
