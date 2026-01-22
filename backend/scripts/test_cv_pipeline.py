#!/usr/bin/env python3
"""
CV Pipeline Debugger
====================
Tests the full CV generation pipeline to identify where data is lost.

This script:
1. Extracts text from template files (PDF/DOCX)
2. Runs Prompt 3 (The Craftsman) with the real LLM
3. Validates JSON output structure
4. Checks for missing fields in structured_data
5. Tests text parsing as fallback
6. Generates a detailed report

Usage:
    cd backend
    source venv/bin/activate
    python scripts/test_cv_pipeline.py
"""

import os
import sys
import json
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

# Add backend to path
BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

# Now import backend modules
from app.services.ocr_service import OCRService
from app.agents.prompt3_craftsman import CraftsmanAgent, extract_json_from_response
from app.services.llm_handler import llm_handler
from app.config import settings


# Test files - actual CVs to process (not templates)
TEST_FILES = [
    "/Users/danielhaynes/Downloads/Bandar Assiri.pdf",
    "/Users/danielhaynes/Downloads/Abdullah AlQasim.pdf",
    "/Users/danielhaynes/Downloads/Abdulaziz AlSharif.pdf",
]

# Reference template files (desired output format)
TEMPLATE_FILES = [
    "/Users/danielhaynes/Downloads/Template 5.pdf",
    "/Users/danielhaynes/Downloads/Template 6.pdf",
]


def print_header(text: str, char: str = "="):
    """Print a formatted header"""
    print(f"\n{char * 70}")
    print(f"  {text}")
    print(f"{char * 70}")


def print_subheader(text: str):
    """Print a formatted subheader"""
    print(f"\n--- {text} ---")


class ResumeTextParser:
    """
    Python port of parseResumeText.ts for testing purposes.
    Simplified version to test the same logic used in frontend.
    """

    SECTION_KEYWORDS = {
        'summary': ['summary', 'professional summary', 'profile', 'objective', 'about me'],
        'experience': ['experience', 'work experience', 'employment', 'work history', 'professional experience'],
        'education': ['education', 'academic', 'qualifications'],
        'skills': ['skills', 'technical skills', 'competencies', 'expertise'],
        'certifications': ['certifications', 'certificates', 'credentials'],
        'languages': ['languages', 'language skills'],
        'projects': ['projects', 'key projects', 'portfolio'],
    }

    PERIOD_PATTERNS = [
        r'\d{4}\s*[-–]\s*(?:\d{4}|Present|Current|Now)',
        r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+)?\d{4}',
        r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–]\s*(?:Present|Current|Now)',
        r'\d{1,2}/\d{4}\s*[-–]\s*(?:\d{1,2}/\d{4}|Present|Current|Now)',
    ]

    def __init__(self):
        self.issues = []

    def parse(self, text: str) -> Dict[str, Any]:
        """Parse resume text into structured format"""
        result = {
            'contact': {'name': ''},
            'summary': None,
            'experience': [],
            'education': [],
            'skills': {},
            'certifications': [],
            'languages': [],
            'rawText': text,
            '_parsing_issues': []
        }

        lines = text.split('\n')
        sections = {}
        current_section = 'header'
        found_name = False

        for i, line in enumerate(lines):
            trimmed = line.strip()
            if not trimmed:
                continue

            # Check for markdown headers
            header_match = re.match(r'^(#{1,3})\s+(.+)$', trimmed)
            if header_match:
                header_level = len(header_match.group(1))
                header_text = header_match.group(2)

                if not found_name and header_level == 1:
                    result['contact']['name'] = self._clean_markdown(header_text)
                    found_name = True
                    current_section = 'contactInfo'
                else:
                    current_section = self._identify_section(header_text)

                if current_section not in sections:
                    sections[current_section] = []
                continue

            # Check for ALL CAPS section headers
            if trimmed == trimmed.upper() and 3 < len(trimmed) < 50:
                section_type = self._identify_section(trimmed.lower())
                if section_type != 'other':
                    current_section = section_type
                    if current_section not in sections:
                        sections[current_section] = []
                    continue

            # Try to extract name from first few lines
            if not found_name and i < 10:
                if self._looks_like_name(trimmed):
                    result['contact']['name'] = self._clean_markdown(trimmed)
                    found_name = True
                    current_section = 'contactInfo'
                    continue

            if current_section not in sections:
                sections[current_section] = []
            sections[current_section].append(trimmed)

        # Parse experience section
        if 'experience' in sections:
            result['experience'] = self._parse_experience(sections['experience'])

        # Parse education section
        if 'education' in sections:
            result['education'] = self._parse_education(sections['education'])

        # Parse summary
        if 'summary' in sections:
            result['summary'] = ' '.join(sections['summary'])

        # Parse contact info
        if 'contactInfo' in sections:
            contact_text = ' '.join(sections['contactInfo'])
            email_match = re.search(r'[\w.-]+@[\w.-]+\.\w+', contact_text)
            if email_match:
                result['contact']['email'] = email_match.group(0)
            phone_match = re.search(r'\(?\+?[0-9]{1,3}\)?[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}', contact_text)
            if phone_match:
                result['contact']['phone'] = phone_match.group(0)

        result['_parsing_issues'] = self.issues
        return result

    def _identify_section(self, text: str) -> str:
        """Identify section type from header text"""
        clean_text = text.lower().strip()
        for section, keywords in self.SECTION_KEYWORDS.items():
            if any(kw in clean_text for kw in keywords):
                return section
        return 'other'

    def _clean_markdown(self, text: str) -> str:
        """Remove markdown formatting"""
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
        text = re.sub(r'\*([^*]+)\*', r'\1', text)
        text = re.sub(r'_([^_]+)_', r'\1', text)
        return text.strip()

    def _looks_like_name(self, text: str) -> bool:
        """Check if text looks like a person's name"""
        if re.match(r'^[#*\-]', text):
            return False
        if re.search(r'[\w.-]+@[\w.-]+\.\w+', text):
            return False
        if re.search(r'\(?\+?[0-9]{1,3}\)?[-.\s]?[0-9]{2,4}', text):
            return False
        words = text.split()
        if 1 <= len(words) <= 4:
            if all(re.match(r'^[A-Za-z\-\']+$', w) for w in words):
                return True
        return False

    def _has_period(self, text: str) -> Optional[str]:
        """Extract date period from text"""
        for pattern in self.PERIOD_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)
        return None

    def _parse_experience(self, lines: List[str]) -> List[Dict]:
        """Parse experience section"""
        experiences = []
        current_exp = None

        for line in lines:
            if not line.strip():
                continue

            # Check for job title (bold markdown)
            title_match = re.match(r'^\*\*([^*|]+)\*\*', line)
            has_pipe = '|' in line
            period = self._has_period(line)

            looks_like_job_entry = title_match or (has_pipe and not line.startswith('-'))

            if looks_like_job_entry:
                if current_exp and (current_exp['title'] or current_exp['company'] or current_exp['bullets']):
                    experiences.append(current_exp)

                if title_match:
                    current_exp = {
                        'title': title_match.group(1).strip(),
                        'company': '',
                        'period': period or '',
                        'bullets': []
                    }
                    # Extract company from same line
                    rest = line.replace(title_match.group(0), '').strip()
                    if rest:
                        parts = rest.split('|')
                        if parts:
                            current_exp['company'] = self._clean_markdown(parts[0].strip())
                elif has_pipe:
                    parts = [p.strip() for p in line.split('|')]
                    current_exp = {
                        'title': parts[0] if parts else '',
                        'company': parts[1] if len(parts) > 1 else '',
                        'period': period or (parts[2] if len(parts) > 2 else ''),
                        'bullets': []
                    }
            elif line.startswith(('-', '*', '')) and current_exp:
                bullet = self._clean_markdown(re.sub(r'^[-*]\s*', '', line))
                if bullet:
                    current_exp['bullets'].append(bullet)
            elif current_exp and not current_exp['company'] and line[0].isupper():
                # Might be company name
                current_exp['company'] = self._clean_markdown(line.split('|')[0])

        if current_exp and (current_exp['title'] or current_exp['company'] or current_exp['bullets']):
            experiences.append(current_exp)

        return experiences

    def _parse_education(self, lines: List[str]) -> List[Dict]:
        """Parse education section"""
        education = []
        current_edu = None

        for line in lines:
            if not line.strip():
                continue

            # Check for degree
            degree_match = re.match(r'^\*\*([^*]+)\*\*', line) or \
                           re.search(r'(Bachelor|Master|PhD|B\.|M\.|MBA|BSc|MSc)', line, re.IGNORECASE)

            if degree_match:
                if current_edu:
                    education.append(current_edu)

                current_edu = {
                    'degree': self._clean_markdown(degree_match.group(1) if hasattr(degree_match, 'group') else degree_match.group(0)),
                    'institution': '',
                    'period': ''
                }

                # Extract period from same line
                period_match = re.search(r'\d{4}\s*[-–]\s*(?:\d{4}|Present)', line)
                if period_match:
                    current_edu['period'] = period_match.group(0)
            elif current_edu and re.search(r'University|College|Institute', line, re.IGNORECASE):
                current_edu['institution'] = self._clean_markdown(line.split('|')[0])

        if current_edu:
            education.append(current_edu)

        return education


def validate_structured_data(data: Dict) -> Tuple[bool, List[str]]:
    """
    Validate structured_data has all required fields.
    Returns (is_valid, list_of_issues)
    """
    issues = []

    if not data:
        return False, ["structured_data is None or empty"]

    # Check contact
    contact = data.get('contact', {})
    if not contact.get('name'):
        issues.append("Missing contact.name")

    # Check experience
    experience = data.get('experience', [])
    if not experience:
        issues.append("No experience entries")
    else:
        for i, exp in enumerate(experience):
            if not exp.get('title'):
                issues.append(f"Experience[{i}]: Missing title")
            if not exp.get('company'):
                issues.append(f"Experience[{i}]: Missing company")
            if not exp.get('period'):
                issues.append(f"Experience[{i}]: Missing period")

    # Check education
    education = data.get('education', [])
    if education:
        for i, edu in enumerate(education):
            if not edu.get('degree'):
                issues.append(f"Education[{i}]: Missing degree")
            if not edu.get('institution'):
                issues.append(f"Education[{i}]: Missing institution")

    return len(issues) == 0, issues


def create_mock_analysis() -> Dict:
    """Create minimal mock analysis for testing Prompt 3"""
    return {
        "issues": [
            {
                "id": 1,
                "category": "experience",
                "severity": "medium",
                "title": "Vague job descriptions",
                "evidence": "Generic descriptions without metrics",
                "ceiling": "Add specific achievements and numbers",
                "floor": "Improve wording without new info",
                "delta": "MODERATE"
            }
        ],
        "metadata": {"cv_length": 500},
        "statistics": {},
        "total_issues": 1
    }


def create_mock_questions() -> List[Dict]:
    """Create minimal mock questions for testing Prompt 3"""
    return [
        {
            "id": 1,
            "question": "Can you tell me more about your achievements in your most recent role?",
            "category": "experience",
            "related_issue_id": 1,
            "priority": "high"
        }
    ]


def create_mock_answers() -> List[Dict]:
    """Create minimal mock answers (simulating user skipping questions)"""
    return [
        {
            "question_id": 1,
            "answer": "",  # Skipped
            "status": "skipped"
        }
    ]


def test_ocr_extraction(file_path: str) -> Tuple[bool, str, Dict]:
    """Test OCR text extraction"""
    print_subheader(f"Testing OCR: {Path(file_path).name}")

    result = {
        "success": False,
        "text_length": 0,
        "has_job_titles": False,
        "has_company_names": False,
        "preview": ""
    }

    try:
        ocr = OCRService()

        # Detect file type
        file_type, warning = ocr.detect_file_type(file_path)
        if warning:
            print(f"  [WARN] {warning}")
        print(f"  File type detected: {file_type}")

        text = ocr.extract_text(file_path, file_type)

        if not text:
            print("  [FAIL] No text extracted")
            return False, "", result

        result["success"] = True
        result["text_length"] = len(text)
        result["preview"] = text[:500]

        # Check for common job-related keywords
        job_keywords = ['manager', 'engineer', 'developer', 'analyst', 'director', 'coordinator', 'specialist']
        result["has_job_titles"] = any(kw in text.lower() for kw in job_keywords)

        company_indicators = ['inc', 'llc', 'ltd', 'corp', 'company', 'group']
        result["has_company_names"] = any(ind in text.lower() for ind in company_indicators)

        print(f"  [OK] Extracted {len(text)} characters")
        print(f"  [{'OK' if result['has_job_titles'] else 'WARN'}] Job titles detected: {result['has_job_titles']}")

        return True, text, result

    except Exception as e:
        print(f"  [FAIL] OCR Error: {e}")
        return False, "", result


def test_prompt3_output(cv_text: str, file_name: str) -> Tuple[bool, Dict, Dict]:
    """Test Prompt 3 (The Craftsman) output"""
    print_subheader(f"Testing Prompt 3 for: {file_name}")

    result = {
        "success": False,
        "is_valid_json": False,
        "has_optimized_cv": False,
        "has_structured_data": False,
        "raw_response_preview": "",
        "validation_issues": []
    }

    try:
        craftsman = CraftsmanAgent(llm_handler)

        # Run optimization with mock data
        print("  Running LLM optimization (this may take 30-60 seconds)...")
        optimization_result = craftsman.optimize_cv(
            cv_text=cv_text,
            analysis_report=create_mock_analysis(),
            questions=create_mock_questions(),
            user_answers=create_mock_answers(),
            max_tokens=8000
        )

        result["success"] = True

        # Check if optimized_cv exists
        optimized_cv = optimization_result.get("optimized_cv", "")
        result["has_optimized_cv"] = bool(optimized_cv)
        result["raw_response_preview"] = optimized_cv[:500] if optimized_cv else ""

        # Check if structured_data exists
        structured_data = optimization_result.get("structured_data")
        result["has_structured_data"] = structured_data is not None

        if structured_data:
            print(f"  [OK] structured_data present")
            is_valid, issues = validate_structured_data(structured_data)
            result["validation_issues"] = issues
            if issues:
                print(f"  [WARN] Validation issues found:")
                for issue in issues:
                    print(f"    - {issue}")
            else:
                print(f"  [OK] All fields validated")
        else:
            print(f"  [WARN] No structured_data - will fall back to text parsing")

            # Check if response looks like JSON or plain text
            if optimized_cv.strip().startswith('{'):
                result["is_valid_json"] = True
                print(f"  [INFO] Response appears to be JSON but missing structured_data")
            else:
                print(f"  [INFO] Response is plain text (not JSON)")

        return True, optimization_result, result

    except Exception as e:
        print(f"  [FAIL] Prompt 3 Error: {e}")
        import traceback
        traceback.print_exc()
        return False, {}, result


def test_text_parser(optimized_cv: str, file_name: str) -> Tuple[Dict, Dict]:
    """Test the text parser on optimized CV"""
    print_subheader(f"Testing Text Parser for: {file_name}")

    result = {
        "parsed_name": False,
        "parsed_experience_count": 0,
        "experience_with_title": 0,
        "experience_with_company": 0,
        "parsed_education_count": 0,
        "issues": []
    }

    parser = ResumeTextParser()
    parsed = parser.parse(optimized_cv)

    # Check name
    name = parsed.get('contact', {}).get('name', '')
    result["parsed_name"] = bool(name)
    print(f"  Name parsed: {'Yes' if name else 'No'} ({name[:30] if name else 'N/A'})")

    # Check experience
    experience = parsed.get('experience', [])
    result["parsed_experience_count"] = len(experience)

    for i, exp in enumerate(experience):
        if exp.get('title'):
            result["experience_with_title"] += 1
        else:
            result["issues"].append(f"Experience[{i}]: No title parsed")
        if exp.get('company'):
            result["experience_with_company"] += 1
        else:
            result["issues"].append(f"Experience[{i}]: No company parsed")

    print(f"  Experience entries: {len(experience)}")
    print(f"  With titles: {result['experience_with_title']}/{len(experience)}")
    print(f"  With companies: {result['experience_with_company']}/{len(experience)}")

    # Check education
    education = parsed.get('education', [])
    result["parsed_education_count"] = len(education)
    print(f"  Education entries: {len(education)}")

    if result["issues"]:
        print(f"  [WARN] Parsing issues:")
        for issue in result["issues"]:
            print(f"    - {issue}")

    return parsed, result


def export_cv_outputs(file_name: str, optimization_result: Dict, output_dir: Path) -> Dict[str, str]:
    """
    Export CV outputs in viewable formats.

    Creates:
    - {name}_optimized.md - The optimized CV markdown
    - {name}_structured.json - The structured data
    - {name}_preview.html - HTML preview of the CV

    Returns dict with paths to exported files.
    """
    base_name = Path(file_name).stem
    exported = {}

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    # Export optimized CV as markdown
    optimized_cv = optimization_result.get("optimized_cv", "")
    if optimized_cv:
        md_path = output_dir / f"{base_name}_optimized.md"
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(optimized_cv)
        exported["markdown"] = str(md_path)
        print(f"  [EXPORT] Markdown: {md_path}")

    # Export structured data as JSON
    structured_data = optimization_result.get("structured_data")
    if structured_data:
        json_path = output_dir / f"{base_name}_structured.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(structured_data, f, indent=2, ensure_ascii=False)
        exported["json"] = str(json_path)
        print(f"  [EXPORT] JSON: {json_path}")

    # Generate HTML preview
    html_path = output_dir / f"{base_name}_preview.html"
    html_content = generate_html_preview(base_name, optimized_cv, structured_data)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    exported["html"] = str(html_path)
    print(f"  [EXPORT] HTML Preview: {html_path}")

    return exported


def generate_classic_template(data: Dict) -> str:
    """Generate Classic template HTML - matches ClassicTemplate.tsx exactly."""
    contact = data.get('contact', {})
    summary = data.get('summary', '')
    experience = data.get('experience', [])
    education = data.get('education', [])
    skills = data.get('skills', {})
    certifications = data.get('certifications', [])
    languages = data.get('languages', [])

    # Flatten skills if it's a dict
    if isinstance(skills, dict):
        skills_list = []
        for category, items in skills.items():
            if isinstance(items, list):
                skills_list.extend(items)
            else:
                skills_list.append(str(items))
        skills = skills_list

    # Build contact line
    contact_parts = []
    if contact.get('email'):
        contact_parts.append(contact['email'])
    if contact.get('phone'):
        contact_parts.append(contact['phone'])
    if contact.get('location'):
        contact_parts.append(contact['location'])
    contact_line = ' | '.join(contact_parts)

    # Experience HTML
    exp_html = ''
    for exp in experience:
        bullets_html = ''
        for bullet in exp.get('bullets', []):
            bullets_html += f'<li><span class="bullet">•</span><span>{bullet}</span></li>'

        exp_html += f'''
        <div class="experience-item">
            <div class="exp-header">
                <div>
                    <h3 class="exp-title">{exp.get('title', '')}</h3>
                    <p class="exp-company">{exp.get('company', '')}</p>
                </div>
                <span class="exp-period">{exp.get('period', '')}</span>
            </div>
            <ul class="bullets">{bullets_html}</ul>
        </div>
        '''

    # Education HTML
    edu_html = ''
    for edu in education:
        details_html = ''
        for detail in edu.get('details', []):
            details_html += f'<li><span class="bullet">•</span><span>{detail}</span></li>'

        edu_html += f'''
        <div class="education-item">
            <div class="edu-header">
                <div>
                    <h3 class="edu-degree">{edu.get('degree', '')}</h3>
                    <p class="edu-institution">{edu.get('institution', '')}</p>
                </div>
                <span class="edu-period">{edu.get('period', '')}</span>
            </div>
            {f'<ul class="bullets">{details_html}</ul>' if details_html else ''}
        </div>
        '''

    # Skills HTML
    skills_html = ''
    for skill in skills:
        skills_html += f'<div class="skill-item"><span class="bullet">•</span><span>{skill}</span></div>'

    # Certifications HTML
    certs_html = ''
    for cert in certifications:
        certs_html += f'<li><span class="bullet">•</span><span>{cert}</span></li>'

    return f'''
    <div class="cv-classic">
        <!-- Header -->
        <div class="header">
            <h1 class="name">{contact.get('name', 'Your Name')}</h1>
            <div class="contact-line">{contact_line}</div>
        </div>

        <hr class="divider" />

        <div class="content">
            <!-- Summary -->
            {f'''
            <div class="section">
                <div class="section-label"><h2>Summary</h2></div>
                <div class="section-content"><p class="summary-text">{summary}</p></div>
            </div>
            ''' if summary else ''}

            <!-- Experience -->
            {f'''
            <div class="section">
                <div class="section-label"><h2>Work Experience</h2></div>
                <div class="section-content">{exp_html}</div>
            </div>
            ''' if experience else ''}

            <!-- Education -->
            {f'''
            <div class="section">
                <div class="section-label"><h2>Education</h2></div>
                <div class="section-content">{edu_html}</div>
            </div>
            ''' if education else ''}

            <!-- Skills -->
            {f'''
            <div class="section">
                <div class="section-label"><h2>Key Skills</h2></div>
                <div class="section-content"><div class="skills-grid">{skills_html}</div></div>
            </div>
            ''' if skills else ''}

            <!-- Certifications -->
            {f'''
            <div class="section">
                <div class="section-label"><h2>Certifications</h2></div>
                <div class="section-content"><ul class="bullets">{certs_html}</ul></div>
            </div>
            ''' if certifications else ''}

            <!-- Languages -->
            {f'''
            <div class="section">
                <div class="section-label"><h2>Languages</h2></div>
                <div class="section-content"><p>{", ".join(languages)}</p></div>
            </div>
            ''' if languages else ''}
        </div>
    </div>
    '''


def generate_modern_template(data: Dict) -> str:
    """Generate Modern template HTML - matches ModernTemplate.tsx exactly."""
    contact = data.get('contact', {})
    summary = data.get('summary', '')
    experience = data.get('experience', [])
    education = data.get('education', [])
    skills = data.get('skills', {})
    certifications = data.get('certifications', [])
    languages = data.get('languages', [])

    # Flatten skills if it's a dict
    if isinstance(skills, dict):
        skills_list = []
        for category, items in skills.items():
            if isinstance(items, list):
                skills_list.extend(items)
            else:
                skills_list.append(str(items))
        skills = skills_list

    # Build contact line
    contact_parts = []
    if contact.get('email'):
        contact_parts.append(contact['email'])
    if contact.get('phone'):
        contact_parts.append(contact['phone'])
    if contact.get('location'):
        contact_parts.append(contact['location'])
    contact_line = ' | '.join(contact_parts)

    # Experience HTML
    exp_html = ''
    for exp in experience:
        bullets_html = ''
        for bullet in exp.get('bullets', []):
            bullets_html += f'<li><span class="bullet">•</span><span>{bullet}</span></li>'

        exp_html += f'''
        <div class="experience-item">
            <div class="exp-header">
                <div>
                    <h3 class="exp-title">{exp.get('title', '')}</h3>
                    <p class="exp-company">{exp.get('company', '')}</p>
                </div>
                <span class="exp-period">{exp.get('period', '')}</span>
            </div>
            <ul class="bullets">{bullets_html}</ul>
        </div>
        '''

    # Education HTML
    edu_html = ''
    for edu in education:
        edu_html += f'''
        <div class="education-item">
            <div class="edu-header">
                <div>
                    <h3 class="edu-degree">{edu.get('degree', '')}</h3>
                    <p class="edu-institution">{edu.get('institution', '')}</p>
                </div>
                <span class="edu-period">{edu.get('period', '')}</span>
            </div>
        </div>
        '''

    # Skills HTML (3-column grid)
    skills_html = ''
    for skill in skills:
        skills_html += f'<span class="skill-tag">{skill}</span>'

    # Additional info
    additional_html = ''
    if languages:
        additional_html += f'<p><strong>Languages:</strong> {", ".join(languages)}</p>'
    if certifications:
        additional_html += f'<p><strong>Certifications:</strong> {", ".join(certifications)}</p>'

    return f'''
    <div class="cv-modern">
        <!-- Header -->
        <div class="header">
            <h1 class="name">{contact.get('name', 'Your Name')}</h1>
            <div class="contact-line">{contact_line}</div>
        </div>

        <hr class="divider-thick" />

        <div class="content">
            <!-- Summary -->
            {f'''
            <div class="section">
                <h2 class="section-title">Summary</h2>
                <p class="summary-text">{summary}</p>
            </div>
            ''' if summary else ''}

            <!-- Professional Experience -->
            {f'''
            <div class="section">
                <h2 class="section-title">Professional Experience</h2>
                {exp_html}
            </div>
            ''' if experience else ''}

            <!-- Skills -->
            {f'''
            <div class="section">
                <h2 class="section-title">Skills</h2>
                <div class="skills-grid-3">{skills_html}</div>
            </div>
            ''' if skills else ''}

            <!-- Education -->
            {f'''
            <div class="section">
                <h2 class="section-title">Education</h2>
                {edu_html}
            </div>
            ''' if education else ''}

            <!-- Additional Information -->
            {f'''
            <div class="section">
                <h2 class="section-title">Additional Information</h2>
                {additional_html}
            </div>
            ''' if additional_html else ''}
        </div>
    </div>
    '''


def generate_html_preview(name: str, optimized_cv: str, structured_data: Optional[Dict]) -> str:
    """Generate an HTML preview with actual CV templates matching the frontend."""

    # Generate CV templates if structured_data is available
    classic_cv = ''
    modern_cv = ''
    if structured_data:
        classic_cv = generate_classic_template(structured_data)
        modern_cv = generate_modern_template(structured_data)

    # Generate validation panel
    validation_html = ""
    if structured_data:
        contact = structured_data.get('contact', {})
        experience = structured_data.get('experience', [])
        education = structured_data.get('education', [])

        validation_html = '<div class="validation-panel"><h3>Field Validation</h3>'

        # Contact validation
        validation_html += '<div class="validation-section"><h4>Contact</h4>'
        for field in ['name', 'email', 'phone', 'location']:
            value = contact.get(field, '')
            status = 'ok' if value else 'missing'
            validation_html += f'<div class="field-row {status}"><span class="field-name">{field}:</span><span class="field-value">{value or "MISSING"}</span></div>'
        validation_html += '</div>'

        # Experience validation
        validation_html += '<div class="validation-section"><h4>Experience</h4>'
        for i, exp in enumerate(experience):
            validation_html += f'<div class="exp-validation"><strong>Position {i+1}:</strong>'
            for field in ['title', 'company', 'period']:
                value = exp.get(field, '')
                status = 'ok' if value else 'missing'
                validation_html += f'<div class="field-row {status}"><span class="field-name">{field}:</span><span class="field-value">{value or "MISSING"}</span></div>'
            validation_html += f'<div class="field-row ok"><span class="field-name">bullets:</span><span class="field-value">{len(exp.get("bullets", []))} items</span></div></div>'
        validation_html += '</div>'

        validation_html += '</div>'

    html = f'''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Preview - {name}</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: #eee;
            padding: 20px;
        }}
        .page-header {{
            text-align: center;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            margin-bottom: 30px;
        }}
        .page-header h1 {{ font-size: 2rem; margin-bottom: 10px; }}
        .page-header p {{ opacity: 0.9; }}

        .template-tabs {{
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            justify-content: center;
        }}
        .tab-btn {{
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s;
        }}
        .tab-btn.active {{
            background: #667eea;
            color: white;
        }}
        .tab-btn:not(.active) {{
            background: #2d2d44;
            color: #aaa;
        }}
        .tab-btn:hover:not(.active) {{
            background: #3d3d5c;
        }}

        .template-container {{
            display: none;
        }}
        .template-container.active {{
            display: block;
        }}

        .cv-wrapper {{
            max-width: 850px;
            margin: 0 auto;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }}

        /* Classic Template Styles */
        .cv-classic {{
            background: white;
            color: #1a202c;
            padding: 40px;
            font-family: Georgia, 'Times New Roman', serif;
            min-height: 1100px;
        }}
        .cv-classic .header {{
            text-align: center;
            margin-bottom: 20px;
        }}
        .cv-classic .name {{
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 2px;
        }}
        .cv-classic .contact-line {{
            margin-top: 10px;
            font-size: 13px;
            color: #4a5568;
        }}
        .cv-classic .divider {{
            border: none;
            border-top: 1px solid #cbd5e0;
            margin: 20px 0;
        }}
        .cv-classic .section {{
            display: flex;
            gap: 30px;
            margin-bottom: 20px;
        }}
        .cv-classic .section-label {{
            width: 130px;
            flex-shrink: 0;
        }}
        .cv-classic .section-label h2 {{
            font-size: 12px;
            font-weight: bold;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .cv-classic .section-content {{
            flex: 1;
        }}
        .cv-classic .summary-text {{
            font-size: 13px;
            color: #4a5568;
            line-height: 1.7;
            text-align: justify;
        }}
        .cv-classic .experience-item,
        .cv-classic .education-item {{
            margin-bottom: 16px;
        }}
        .cv-classic .exp-header,
        .cv-classic .edu-header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }}
        .cv-classic .exp-title,
        .cv-classic .edu-degree {{
            font-size: 14px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 2px;
        }}
        .cv-classic .exp-company,
        .cv-classic .edu-institution {{
            font-size: 13px;
            color: #4a5568;
        }}
        .cv-classic .exp-period,
        .cv-classic .edu-period {{
            font-size: 13px;
            color: #718096;
        }}
        .cv-classic .bullets {{
            list-style: none;
            margin-top: 8px;
        }}
        .cv-classic .bullets li {{
            display: flex;
            gap: 8px;
            font-size: 13px;
            color: #4a5568;
            margin-bottom: 4px;
            line-height: 1.5;
        }}
        .cv-classic .bullet {{
            color: #a0aec0;
        }}
        .cv-classic .skills-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 30px;
        }}
        .cv-classic .skill-item {{
            display: flex;
            gap: 8px;
            font-size: 13px;
            color: #4a5568;
        }}

        /* Modern Template Styles */
        .cv-modern {{
            background: white;
            color: #1a202c;
            padding: 40px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 1100px;
        }}
        .cv-modern .header {{
            text-align: center;
            margin-bottom: 10px;
        }}
        .cv-modern .name {{
            font-size: 28px;
            font-weight: bold;
            color: #1a202c;
            text-transform: uppercase;
            letter-spacing: 2px;
        }}
        .cv-modern .contact-line {{
            margin-top: 10px;
            font-size: 13px;
            color: #4a5568;
        }}
        .cv-modern .divider-thick {{
            border: none;
            border-top: 2px solid #1a202c;
            margin: 15px 0;
        }}
        .cv-modern .section {{
            margin-bottom: 20px;
        }}
        .cv-modern .section-title {{
            font-size: 12px;
            font-weight: bold;
            color: #1a202c;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #cbd5e0;
            padding-bottom: 5px;
            margin-bottom: 12px;
        }}
        .cv-modern .summary-text {{
            font-size: 13px;
            color: #4a5568;
            line-height: 1.7;
            text-align: justify;
        }}
        .cv-modern .experience-item,
        .cv-modern .education-item {{
            margin-bottom: 16px;
        }}
        .cv-modern .exp-header,
        .cv-modern .edu-header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }}
        .cv-modern .exp-title,
        .cv-modern .edu-degree {{
            font-size: 14px;
            font-weight: 600;
            color: #1a202c;
        }}
        .cv-modern .exp-company,
        .cv-modern .edu-institution {{
            font-size: 13px;
            color: #4a5568;
        }}
        .cv-modern .exp-period,
        .cv-modern .edu-period {{
            font-size: 13px;
            color: #718096;
        }}
        .cv-modern .bullets {{
            list-style: none;
            margin-top: 8px;
        }}
        .cv-modern .bullets li {{
            display: flex;
            gap: 8px;
            font-size: 13px;
            color: #4a5568;
            margin-bottom: 4px;
        }}
        .cv-modern .bullet {{
            color: #a0aec0;
        }}
        .cv-modern .skills-grid-3 {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px 16px;
        }}
        .cv-modern .skill-tag {{
            font-size: 13px;
            color: #4a5568;
        }}

        /* Validation Panel */
        .validation-panel {{
            background: #2d2d44;
            border-radius: 12px;
            padding: 20px;
            margin-top: 30px;
            max-width: 850px;
            margin-left: auto;
            margin-right: auto;
        }}
        .validation-panel h3 {{
            color: #667eea;
            margin-bottom: 15px;
            font-size: 18px;
        }}
        .validation-section {{
            margin-bottom: 20px;
        }}
        .validation-section h4 {{
            color: #aaa;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .field-row {{
            display: flex;
            gap: 10px;
            padding: 6px 12px;
            border-radius: 4px;
            margin-bottom: 4px;
            font-size: 13px;
        }}
        .field-row.ok {{
            background: rgba(72, 187, 120, 0.1);
        }}
        .field-row.missing {{
            background: rgba(245, 101, 101, 0.2);
        }}
        .field-name {{
            font-weight: 600;
            min-width: 80px;
        }}
        .field-row.ok .field-value {{
            color: #48bb78;
        }}
        .field-row.missing .field-value {{
            color: #f56565;
            font-weight: bold;
        }}
        .exp-validation {{
            background: #1a1a2e;
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 10px;
        }}
    </style>
</head>
<body>
    <div class="page-header">
        <h1>CV Test Output: {name}</h1>
        <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Templates match frontend exactly</p>
    </div>

    <div class="template-tabs">
        <button class="tab-btn active" onclick="showTemplate('classic')">Classic Template</button>
        <button class="tab-btn" onclick="showTemplate('modern')">Modern Template</button>
        <button class="tab-btn" onclick="showTemplate('validation')">Field Validation</button>
    </div>

    <div id="classic" class="template-container active">
        <div class="cv-wrapper">
            {classic_cv if classic_cv else '<p style="color: #f56565; padding: 40px; text-align: center;">No structured data available</p>'}
        </div>
    </div>

    <div id="modern" class="template-container">
        <div class="cv-wrapper">
            {modern_cv if modern_cv else '<p style="color: #f56565; padding: 40px; text-align: center;">No structured data available</p>'}
        </div>
    </div>

    <div id="validation" class="template-container">
        {validation_html if validation_html else '<p style="color: #f56565; padding: 40px; text-align: center;">No structured data to validate</p>'}
    </div>

    <script>
        function showTemplate(templateId) {{
            // Hide all templates
            document.querySelectorAll('.template-container').forEach(el => el.classList.remove('active'));
            // Deactivate all tabs
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

            // Show selected template
            document.getElementById(templateId).classList.add('active');
            // Activate selected tab
            event.target.classList.add('active');
        }}
    </script>
</body>
</html>
'''
    return html


def run_full_test(file_path: str, output_dir: Path) -> Dict:
    """Run complete test pipeline for a single file"""
    file_name = Path(file_path).name
    print_header(f"Testing: {file_name}")

    test_result = {
        "file": file_path,
        "file_name": file_name,
        "ocr": None,
        "prompt3": None,
        "parser": None,
        "exports": None,
        "overall_status": "FAIL"
    }

    # Step 1: OCR Extraction
    ocr_success, extracted_text, ocr_result = test_ocr_extraction(file_path)
    test_result["ocr"] = ocr_result

    if not ocr_success:
        print(f"\n[SKIP] Cannot continue without extracted text")
        return test_result

    # Step 2: Run Prompt 3
    prompt3_success, optimization_result, prompt3_result = test_prompt3_output(extracted_text, file_name)
    test_result["prompt3"] = prompt3_result

    if not prompt3_success:
        print(f"\n[SKIP] Cannot continue without Prompt 3 output")
        return test_result

    # Step 3: Export CV outputs for viewing
    print_subheader(f"Exporting CV outputs for: {file_name}")
    exports = export_cv_outputs(file_name, optimization_result, output_dir)
    test_result["exports"] = exports

    # Step 4: Test text parser on optimized_cv
    optimized_cv = optimization_result.get("optimized_cv", "")
    if optimized_cv:
        parsed, parser_result = test_text_parser(optimized_cv, file_name)
        test_result["parser"] = parser_result
    else:
        print(f"\n[SKIP] No optimized_cv to parse")

    # Determine overall status
    has_issues = False
    if prompt3_result.get("validation_issues"):
        has_issues = True
    if test_result.get("parser", {}).get("issues"):
        has_issues = True

    test_result["overall_status"] = "WARN" if has_issues else "PASS"

    return test_result


def generate_report(results: List[Dict]):
    """Generate summary report"""
    print_header("SUMMARY REPORT", "=")

    print("\n## Results by File:\n")
    for r in results:
        status_icon = "[OK]" if r.get("overall_status") == "PASS" else "[WARN]" if r.get("overall_status") == "WARN" else "[FAIL]"
        print(f"{status_icon} {r.get('file_name', 'Unknown')}: {r.get('overall_status', 'UNKNOWN')}")

        prompt3_data = r.get("prompt3") or {}
        parser_data = r.get("parser") or {}

        if prompt3_data.get("has_structured_data"):
            print(f"   - structured_data: Present")
        elif prompt3_data:
            print(f"   - structured_data: MISSING (will use text parsing)")

        if prompt3_data.get("validation_issues"):
            print(f"   - Validation issues: {len(prompt3_data['validation_issues'])}")
            for issue in prompt3_data["validation_issues"][:3]:
                print(f"     * {issue}")

        if parser_data.get("issues"):
            print(f"   - Parser issues: {len(parser_data['issues'])}")
            for issue in parser_data["issues"][:3]:
                print(f"     * {issue}")

    # Root cause analysis
    print("\n## Root Cause Analysis:\n")

    # Filter to only results that completed prompt3
    completed_results = [r for r in results if r.get("prompt3")]

    structured_data_missing = sum(1 for r in completed_results if not (r.get("prompt3") or {}).get("has_structured_data"))
    validation_issues = sum(1 for r in completed_results if (r.get("prompt3") or {}).get("validation_issues"))
    parser_issues = sum(1 for r in results if (r.get("parser") or {}).get("issues"))

    total_completed = len(completed_results)

    if total_completed == 0:
        print("[!] No files completed testing - check OCR and LLM configuration")
    else:
        if structured_data_missing > 0:
            print(f"[!] {structured_data_missing}/{total_completed} files: LLM not returning structured_data")
            print("    RECOMMENDATION: Strengthen JSON output requirement in prompt template")

        if validation_issues > 0:
            print(f"[!] {validation_issues}/{total_completed} files: structured_data has missing fields")
            print("    RECOMMENDATION: Add field validation in Craftsman agent")

        if parser_issues > 0:
            print(f"[!] {parser_issues}/{len(results)} files: Text parser failed to extract fields")
            print("    RECOMMENDATION: Fix regex patterns in parseResumeText.ts")

        if structured_data_missing == 0 and validation_issues == 0 and parser_issues == 0:
            print("[OK] No issues detected - all fields properly populated")

    # Save detailed report to file
    report_path = BACKEND_DIR / "scripts" / f"cv_pipeline_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\nDetailed report saved to: {report_path}")


def main():
    print_header("CV Pipeline Debugger", "=")
    print(f"Testing {len(TEST_FILES)} files...")
    print(f"Using LLM: {settings.DEFAULT_LLM_PROVIDER} / {settings.CLAUDE_MODEL}")

    # Create output directory for exports
    output_dir = BACKEND_DIR / "scripts" / "cv_test_outputs" / datetime.now().strftime('%Y%m%d_%H%M%S')
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {output_dir}")

    # Verify files exist
    existing_files = [f for f in TEST_FILES if os.path.exists(f)]
    missing_files = [f for f in TEST_FILES if not os.path.exists(f)]

    if missing_files:
        print(f"\n[WARN] Missing files:")
        for f in missing_files:
            print(f"  - {f}")

    if not existing_files:
        print("\n[ERROR] No test files found!")
        return

    results = []
    for file_path in existing_files:
        try:
            result = run_full_test(file_path, output_dir)
            results.append(result)
        except Exception as e:
            print(f"\n[ERROR] Test failed for {file_path}: {e}")
            import traceback
            traceback.print_exc()
            results.append({
                "file": file_path,
                "file_name": Path(file_path).name,
                "error": str(e),
                "overall_status": "ERROR"
            })

    generate_report(results)

    # Print export summary
    print_header("EXPORTED FILES", "-")
    print(f"\nAll exports saved to: {output_dir}")
    print("\nOpen the HTML files in your browser to view the CVs:")
    for r in results:
        if r.get("exports", {}).get("html"):
            print(f"  - file://{r['exports']['html']}")


if __name__ == "__main__":
    main()
