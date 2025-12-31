/**
 * Parse optimized resume text (markdown format) into structured sections
 */

export interface ContactInfo {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

export interface WorkExperience {
  title: string;
  company: string;
  period: string;
  bullets: string[];
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
  details?: string[];
}

export interface ParsedResume {
  contact: ContactInfo;
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Record<string, string[]>;
  certifications: string[];
  languages?: string[];
  projects?: { name: string; description: string }[];
  rawText: string;
}

/**
 * Extract email from text
 */
function extractEmail(text: string): string | undefined {
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  return emailMatch ? emailMatch[0] : undefined;
}

/**
 * Extract phone from text
 */
function extractPhone(text: string): string | undefined {
  // Match various phone formats including (+92)-302-6441231
  const phoneMatch = text.match(/\(?\+?[0-9]{1,3}\)?[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}/);
  return phoneMatch ? phoneMatch[0] : undefined;
}

/**
 * Extract LinkedIn URL or handle
 */
function extractLinkedIn(text: string): string | undefined {
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  return linkedinMatch ? linkedinMatch[0] : undefined;
}

/**
 * Clean markdown formatting from text
 */
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1')     // Remove italic
    .replace(/_([^_]+)_/g, '$1')       // Remove underscore italic
    .replace(/`([^`]+)`/g, '$1')       // Remove code
    .trim();
}

/**
 * Parse markdown text into structured resume
 */
export function parseResumeText(text: string): ParsedResume {
  const lines = text.split('\n');

  // Initialize result
  const result: ParsedResume = {
    contact: { name: '' },
    experience: [],
    education: [],
    skills: {},
    certifications: [],
    rawText: text,
  };

  // Section keywords mapping
  const sectionKeywords: Record<string, string[]> = {
    summary: ['summary', 'professional summary', 'profile', 'objective', 'about me', 'career objective'],
    experience: ['experience', 'work experience', 'employment', 'work history', 'professional experience', 'career history'],
    education: ['education', 'academic', 'qualifications', 'academic background'],
    skills: ['skills', 'technical skills', 'competencies', 'expertise', 'core competencies', 'technical expertise'],
    certifications: ['certifications', 'certificates', 'credentials', 'licenses', 'professional certifications'],
    languages: ['languages', 'language skills', 'language proficiency'],
    projects: ['projects', 'key projects', 'portfolio', 'notable projects'],
  };

  // Identify which section a header belongs to
  const identifySection = (headerText: string): string => {
    const cleanHeader = headerText.toLowerCase().trim();
    for (const [section, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some(kw => cleanHeader.includes(kw))) {
        return section;
      }
    }
    return 'other';
  };

  // Parse sections
  const sections: Record<string, string[]> = {};
  let currentSection = 'header';
  let foundFirstHeader = false;
  let foundName = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines at the start
    if (!trimmedLine && !foundName) {
      continue;
    }

    // Check for markdown headers (# or ##)
    const headerMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);

    if (headerMatch) {
      const headerLevel = headerMatch[1].length;
      const headerText = headerMatch[2];

      if (!foundFirstHeader && headerLevel === 1) {
        // First # header is the name
        result.contact.name = cleanMarkdown(headerText);
        foundFirstHeader = true;
        foundName = true;
        currentSection = 'contactInfo';
      } else {
        // Subsequent headers are sections
        const sectionType = identifySection(headerText);
        currentSection = sectionType;
      }

      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
    } else if (trimmedLine) {
      // If we haven't found the name yet and this looks like a name (first non-empty line, no special chars, reasonable length)
      if (!foundName && i < 5 && !trimmedLine.match(/^[#*\-•]/) && trimmedLine.length > 2 && trimmedLine.length < 100) {
        // Check if it's likely a name (not a section header, not all caps section title)
        const isLikelyName = !identifySection(trimmedLine.toLowerCase()) && 
                            !trimmedLine.match(/^(PROFESSIONAL|WORK|EDUCATION|SKILLS|CERTIFICATIONS|SUMMARY|EXPERIENCE)/i);
        
        if (isLikelyName) {
          result.contact.name = cleanMarkdown(trimmedLine);
          foundName = true;
          currentSection = 'contactInfo';
          continue; // Skip adding this line to sections, it's the name
        }
      }

      // Add content to current section
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      sections[currentSection].push(trimmedLine);
    }
  }

  // Parse contact info from the contactInfo section or entire text if no sections
  const contactText = sections['contactInfo'] ? sections['contactInfo'].join(' ') : text.substring(0, 500);
  
  // Extract email from contact info or entire text
  if (!result.contact.email) {
    result.contact.email = extractEmail(contactText) || extractEmail(text);
  }

  // Extract phone from contact info or entire text
  if (!result.contact.phone) {
    result.contact.phone = extractPhone(contactText) || extractPhone(text);
  }

  // Extract LinkedIn from contact info or entire text
  if (!result.contact.linkedin) {
    result.contact.linkedin = extractLinkedIn(contactText) || extractLinkedIn(text);
  }

  // Extract location (usually in **bold** or first part before |)
  if (!result.contact.location) {
    const locationMatch = contactText.match(/\*\*([^*]+)\*\*/);
    if (locationMatch) {
      result.contact.location = locationMatch[1].trim();
    } else {
      // Try to find location from pipe-separated format
      const parts = contactText.split('|').map(p => p.trim());
      if (parts.length > 0) {
        const firstPart = cleanMarkdown(parts[0]);
        if (firstPart && !firstPart.includes('@') && !firstPart.match(/^\+?\d/) && firstPart.length > 3) {
          result.contact.location = firstPart;
        }
      }
    }
  }

  // If name is still empty, try to extract from first few lines
  if (!result.contact.name || result.contact.name.trim() === '') {
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      if (line && line.length > 2 && line.length < 100) {
        // Check if it looks like a name (not a section header, not all caps section title, not email/phone)
        const isLikelyName = !identifySection(line.toLowerCase()) && 
                            !line.match(/^(PROFESSIONAL|WORK|EDUCATION|SKILLS|CERTIFICATIONS|SUMMARY|EXPERIENCE|CONTACT)/i) &&
                            !line.includes('@') && 
                            !line.match(/^\+?\d/) &&
                            !line.match(/^[-•*]/);
        
        if (isLikelyName) {
          result.contact.name = cleanMarkdown(line);
          break;
        }
      }
    }
  }

  // Parse summary
  if (sections['summary']) {
    result.summary = sections['summary']
      .map(line => cleanMarkdown(line))
      .join(' ')
      .replace(/^[-•*]\s*/g, '')
      .trim();
  }

  // Parse experience
  if (sections['experience']) {
    const expLines = sections['experience'];
    let currentExp: WorkExperience | null = null;

    for (const line of expLines) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine === '--' || cleanLine === '---') continue;

      // Check for job title (usually bold: **Title** or just Title | Company)
      const titleMatch = cleanLine.match(/^\*\*([^*|]+)\*\*/) || 
                        (cleanLine.includes('|') && !cleanLine.match(/^[-•*]/) ? cleanLine.split('|')[0].trim() : null);
      
      if (titleMatch) {
        // Save previous experience
        if (currentExp && (currentExp.title || currentExp.bullets.length > 0)) {
          result.experience.push(currentExp);
        }

        const titleText = typeof titleMatch === 'string' ? titleMatch : cleanMarkdown(titleMatch[1]);
        currentExp = {
          title: titleText.trim(),
          company: '',
          period: '',
          bullets: [],
        };

        // Check if company and period are on same line
        const restOfLine = typeof titleMatch === 'string' 
          ? cleanLine.replace(titleText, '').replace(/^\|\s*/, '')
          : cleanLine.replace(/^\*\*[^*]+\*\*\s*/, '');
        
        if (restOfLine) {
          // Extract period
          const periodMatch = restOfLine.match(/(\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Now))/i);
          if (periodMatch) {
            currentExp.period = periodMatch[1];
          }

          // Extract company (usually after | or before period)
          const companyPart = restOfLine.replace(/\|?\s*\d{4}\s*[-–].*$/i, '').replace(/^\|?\s*/, '').trim();
          if (companyPart && !companyPart.match(/^\d{4}/)) {
            currentExp.company = cleanMarkdown(companyPart);
          }
        }
      }
      // Check for company line (if not on title line) - more lenient
      else if (currentExp && !currentExp.company && 
               cleanLine.length > 2 && 
               !cleanLine.match(/^[-•*]/) && 
               !cleanLine.match(/^\d{4}/)) {
        const periodMatch = cleanLine.match(/(\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Now))/i);
        if (periodMatch) {
          currentExp.period = periodMatch[1];
          const companyPart = cleanLine.replace(periodMatch[0], '').replace(/\|/g, '').trim();
          if (companyPart) {
            currentExp.company = cleanMarkdown(companyPart);
          }
        } else if (cleanLine.length < 100) {
          // If it's a short line without period, might be company
          currentExp.company = cleanMarkdown(cleanLine);
        }
      }
      // Check for bullet points (more lenient)
      else if (cleanLine.match(/^[-•*]\s+/) || (currentExp && cleanLine.length > 10 && !cleanLine.match(/^\d{4}/))) {
        if (currentExp) {
          const bullet = cleanMarkdown(cleanLine.replace(/^[-•*]+\s*/, ''));
          if (bullet && bullet.length > 5) { // Only add meaningful bullets
            currentExp.bullets.push(bullet);
          }
        }
      }
      // Check for period on its own line
      else if (currentExp && !currentExp.period) {
        const periodMatch = cleanLine.match(/(\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Now))/i);
        if (periodMatch) {
          currentExp.period = periodMatch[1];
        }
      }
    }

    // Don't forget the last experience
    if (currentExp && (currentExp.title || currentExp.bullets.length > 0)) {
      result.experience.push(currentExp);
    }
  }
  
  // If no experience found in sections, try to extract from entire text
  if (result.experience.length === 0 && text.length > 200) {
    // Look for common experience patterns in the text
    const experiencePatterns = [
      /(?:worked|served|held|position|role|job|employed).*?at\s+([A-Z][^,\.]+)/gi,
      /([A-Z][^,\.]+)\s*[-–]\s*(\d{4}\s*[-–]\s*(?:\d{4}|Present))/gi,
    ];
    
    // This is a fallback - if we can't parse structured experience, at least try to find some
    // For now, we'll leave it empty rather than creating low-quality entries
  }

  // Parse education
  if (sections['education']) {
    const eduLines = sections['education'];
    let currentEdu: Education | null = null;

    for (const line of eduLines) {
      const cleanLine = line.trim();

      // Check for degree (usually bold or contains degree keywords)
      const degreeMatch = cleanLine.match(/^\*\*([^*]+)\*\*/) ||
        cleanLine.match(/(Bachelor|Master|PhD|B\.|M\.|MBA|BSc|MSc|BE|B\.Tech|M\.Tech|BS|MS)[^|]*/i);

      if (degreeMatch) {
        // Save previous education
        if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
          result.education.push(currentEdu);
        }

        currentEdu = {
          degree: cleanMarkdown(degreeMatch[1] || degreeMatch[0]),
          institution: '',
          period: '',
        };

        // Extract period from same line
        const periodMatch = cleanLine.match(/(\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Expected))/i);
        if (periodMatch) {
          currentEdu.period = periodMatch[1];
        }
      }
      // Check for institution
      else if (currentEdu && cleanLine.match(/University|College|Institute|School/i)) {
        currentEdu.institution = cleanMarkdown(cleanLine.replace(/\|.*$/, ''));

        // Extract period if present
        const periodMatch = cleanLine.match(/(\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Expected))/i);
        if (periodMatch && !currentEdu.period) {
          currentEdu.period = periodMatch[1];
        }
      }
      // Check for period on its own
      else if (currentEdu && !currentEdu.period) {
        const periodMatch = cleanLine.match(/(\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Expected))/i);
        if (periodMatch) {
          currentEdu.period = periodMatch[1];
        }
      }
    }

    // Don't forget the last education
    if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
      result.education.push(currentEdu);
    }
  }

  // Parse skills
  if (sections['skills']) {
    const skillLines = sections['skills'];
    let currentCategory = 'General';

    for (const line of skillLines) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine === '--' || cleanLine === '---') continue;

      // Check for category header (bold or with colon)
      const categoryMatch = cleanLine.match(/^\*\*([^*:]+)\*\*:?\s*(.*)/) ||
        cleanLine.match(/^([A-Za-z\s]+):\s*(.+)/);

      if (categoryMatch) {
        currentCategory = categoryMatch[1].trim();
        const skillsText = categoryMatch[2] || '';

        if (!result.skills[currentCategory]) {
          result.skills[currentCategory] = [];
        }

        if (skillsText) {
          const skills = skillsText.split(/[,;]/).map(s => cleanMarkdown(s)).filter(Boolean);
          result.skills[currentCategory].push(...skills);
        }
      }
      // Bullet point skills
      else if (cleanLine.match(/^[-•*]\s+/)) {
        const skill = cleanMarkdown(cleanLine.replace(/^[-•*]+\s*/, ''));
        if (skill) {
          if (!result.skills[currentCategory]) {
            result.skills[currentCategory] = [];
          }
          result.skills[currentCategory].push(skill);
        }
      }
      // Comma-separated skills on a line
      else if (cleanLine.includes(',')) {
        const skills = cleanLine.split(/[,;]/).map(s => cleanMarkdown(s)).filter(Boolean);
        if (!result.skills[currentCategory]) {
          result.skills[currentCategory] = [];
        }
        result.skills[currentCategory].push(...skills);
      }
    }
  }

  // Parse certifications
  if (sections['certifications']) {
    for (const line of sections['certifications']) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine === '--' || cleanLine === '---') continue;

      if (cleanLine.match(/^[-•*]\s+/)) {
        const cert = cleanMarkdown(cleanLine.replace(/^[-•*]+\s*/, ''));
        if (cert) {
          result.certifications.push(cert);
        }
      } else if (!cleanLine.match(/^#/)) {
        result.certifications.push(cleanMarkdown(cleanLine));
      }
    }
  }

  // Parse languages
  if (sections['languages']) {
    result.languages = [];
    for (const line of sections['languages']) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine === '--' || cleanLine === '---') continue;

      if (cleanLine.match(/^[-•*]\s+/)) {
        result.languages.push(cleanMarkdown(cleanLine.replace(/^[-•*]+\s*/, '')));
      } else if (cleanLine.includes(',')) {
        const langs = cleanLine.split(/[,;]/).map(l => cleanMarkdown(l)).filter(Boolean);
        result.languages.push(...langs);
      } else if (!cleanLine.match(/^#/)) {
        result.languages.push(cleanMarkdown(cleanLine));
      }
    }
  }

  // Parse projects
  if (sections['projects']) {
    result.projects = [];
    let currentProject: { name: string; description: string } | null = null;

    for (const line of sections['projects']) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine === '--' || cleanLine === '---') continue;

      // Project name (bold)
      const projectMatch = cleanLine.match(/^\*\*([^*]+)\*\*/);
      if (projectMatch) {
        if (currentProject) {
          result.projects.push(currentProject);
        }
        currentProject = {
          name: projectMatch[1].trim(),
          description: cleanLine.replace(/^\*\*[^*]+\*\*:?\s*/, '').trim(),
        };
      } else if (currentProject && cleanLine.match(/^[-•*]\s+/)) {
        const desc = cleanMarkdown(cleanLine.replace(/^[-•*]+\s*/, ''));
        currentProject.description += (currentProject.description ? ' ' : '') + desc;
      }
    }

    if (currentProject) {
      result.projects.push(currentProject);
    }
  }

  return result;
}

/**
 * Check if text looks like a structured resume that can be parsed
 */
export function isStructuredResume(text: string): boolean {
  if (!text || text.length < 50) return false;

  // Check for markdown headers
  const hasMarkdownHeaders = /^#{1,3}\s+/m.test(text);

  // Check for section keywords (more lenient)
  const hasSectionKeywords = /(professional summary|work experience|employment|education|skills|certifications|experience|summary|education)/i.test(text);

  // Check for structured formatting (bullet points, bold text, pipe separators)
  const hasFormatting = /(\*\*[^*]+\*\*|^[-•*]\s+|[\w.-]+@[\w.-]+\.\w+|\+\d|\(?\d{3,4}\))/m.test(text);

  // If it has section keywords OR formatting, it's likely a resume
  // Don't require markdown headers - many resumes don't use them
  return hasSectionKeywords || hasFormatting;
}
