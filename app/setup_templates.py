# setup_templates.py - Script to create template files

import os
from pathlib import Path

# Get the current script directory
SCRIPT_DIR = Path(__file__).parent

# Create templates directory - handle different directory structures
if (SCRIPT_DIR / "app").exists():
    # Script is in root directory
    TEMPLATES_DIR = SCRIPT_DIR / "app" / "templates"
elif SCRIPT_DIR.name == "app":
    # Script is in app directory
    TEMPLATES_DIR = SCRIPT_DIR / "templates"
else:
    # Create relative to current directory
    TEMPLATES_DIR = Path("templates")

# Create the templates directory and app directory if needed
TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)

# Modern Template
modern_template = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ personal_info.name }} - Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            color: #333;
            background: white;
            font-size: 11px;
        }
        
        .resume {
            max-width: 8.5in;
            min-height: 11in;
            margin: 0 auto;
            padding: 0.4in;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #2563eb;
        }
        
        .name {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
            letter-spacing: 1px;
        }
        
        .contact-info {
            font-size: 10px;
            color: #666;
            line-height: 1.3;
        }
        
        .contact-info span {
            margin: 0 8px;
        }
        
        .section {
            margin-bottom: 18px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            padding-bottom: 3px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .summary {
            font-size: 11px;
            line-height: 1.5;
            text-align: justify;
            color: #555;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 10px;
        }
        
        .skill-category {
            margin-bottom: 6px;
        }
        
        .skill-category strong {
            color: #1e40af;
            font-size: 10px;
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 12px;
            page-break-inside: avoid;
        }
        
        .job-header, .edu-header, .project-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 4px;
        }
        
        .job-title, .degree, .project-name {
            font-weight: bold;
            font-size: 12px;
            color: #1e40af;
        }
        
        .company, .institution {
            font-weight: 600;
            font-size: 11px;
            color: #374151;
        }
        
        .date {
            font-size: 9px;
            color: #6b7280;
            font-style: italic;
        }
        
        .location {
            font-size: 9px;
            color: #6b7280;
            margin-left: 5px;
        }
        
        .responsibilities, .project-details {
            list-style: none;
            margin-top: 4px;
        }
        
        .responsibilities li, .project-details li {
            font-size: 10px;
            line-height: 1.4;
            margin-bottom: 2px;
            padding-left: 12px;
            position: relative;
        }
        
        .responsibilities li:before, .project-details li:before {
            content: "▸";
            color: #2563eb;
            font-size: 10px;
            position: absolute;
            left: 0;
        }
        
        .technologies {
            margin-top: 4px;
            font-size: 9px;
            color: #6b7280;
        }
        
        .technologies strong {
            color: #374151;
        }
        
        .certifications-list {
            list-style: none;
            font-size: 10px;
        }
        
        .certifications-list li {
            margin-bottom: 3px;
            padding-left: 12px;
            position: relative;
        }
        
        .certifications-list li:before {
            content: "🏆";
            position: absolute;
            left: 0;
            font-size: 8px;
        }
        
        @media print {
            .resume {
                box-shadow: none;
                padding: 0.3in;
            }
            
            body {
                font-size: 10px;
            }
        }
        
        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .projects-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
    </style>
</head>
<body>
    <div class="resume">
        <!-- Header -->
        <div class="header">
            <h1 class="name">{{ personal_info.name or "Your Name" }}</h1>
            <div class="contact-info">
                {% if personal_info.email %}<span>{{ personal_info.email }}</span>{% endif %}
                {% if personal_info.phone %}<span>{{ personal_info.phone }}</span>{% endif %}
                {% if personal_info.location %}<span>{{ personal_info.location }}</span>{% endif %}
                {% if personal_info.linkedin %}<span>LinkedIn: {{ personal_info.linkedin }}</span>{% endif %}
                {% if personal_info.github %}<span>GitHub: {{ personal_info.github }}</span>{% endif %}
            </div>
        </div>

        <!-- Professional Summary -->
        {% if summary %}
        <div class="section">
            <h2 class="section-title">Professional Summary</h2>
            <div class="summary">{{ summary }}</div>
        </div>
        {% endif %}

        <!-- Skills -->
        {% if skills.technical_skills or skills.tools or skills.languages %}
        <div class="section">
            <h2 class="section-title">Technical Skills</h2>
            <div class="skills-grid">
                {% if skills.technical_skills %}
                <div class="skill-category">
                    <strong>Technical Skills:</strong> {{ skills.technical_skills[:15] | join(', ') }}
                </div>
                {% endif %}
                {% if skills.tools %}
                <div class="skill-category">
                    <strong>Tools & Technologies:</strong> {{ skills.tools[:10] | join(', ') }}
                </div>
                {% endif %}
                {% if skills.languages %}
                <div class="skill-category">
                    <strong>Languages:</strong> {{ skills.languages[:8] | join(', ') }}
                </div>
                {% endif %}
                {% if certifications %}
                <div class="skill-category">
                    <strong>Certifications:</strong> {{ certifications[:3] | join(', ') }}
                </div>
                {% endif %}
            </div>
        </div>
        {% endif %}

        <!-- Experience and Education in Two Columns -->
        <div class="two-column">
            <!-- Professional Experience -->
            {% if experience %}
            <div class="section">
                <h2 class="section-title">Experience</h2>
                {% for exp in experience[:3] %}
                <div class="experience-item">
                    <div class="job-header">
                        <div>
                            <div class="job-title">{{ exp.role }}</div>
                            <div class="company">{{ exp.company }}{% if exp.location %}<span class="location">{{ exp.location }}</span>{% endif %}</div>
                        </div>
                        <div class="date">{{ exp.duration }}</div>
                    </div>
                    {% if exp.responsibilities %}
                    <ul class="responsibilities">
                        {% for resp in exp.responsibilities[:3] %}
                        <li>{{ resp[:120] }}{% if resp|length > 120 %}...{% endif %}</li>
                        {% endfor %}
                    </ul>
                    {% endif %}
                </div>
                {% endfor %}
            </div>
            {% endif %}

            <!-- Education -->
            {% if education %}
            <div class="section">
                <h2 class="section-title">Education</h2>
                {% for edu in education[:2] %}
                <div class="education-item">
                    <div class="edu-header">
                        <div>
                            <div class="degree">{{ edu.degree }}</div>
                            <div class="institution">{{ edu.institution }}</div>
                        </div>
                        <div class="date">{{ edu.duration }}</div>
                    </div>
                </div>
                {% endfor %}
            </div>
            {% endif %}
        </div>

        <!-- Projects -->
        {% if projects %}
        <div class="section">
            <h2 class="section-title">Key Projects</h2>
            <div class="projects-grid">
                {% for project in projects[:4] %}
                <div class="project-item">
                    <div class="project-header">
                        <div class="project-name">{{ project.name }}</div>
                        {% if project.duration %}<div class="date">{{ project.duration }}</div>{% endif %}
                    </div>
                    <div class="project-details">
                        <div style="font-size: 10px; line-height: 1.3; margin-bottom: 3px;">{{ project.description[:150] }}{% if project.description|length > 150 %}...{% endif %}</div>
                        {% if project.technologies %}
                        <div class="technologies">
                            <strong>Tech:</strong> {{ project.technologies[:6] | join(', ') }}
                        </div>
                        {% endif %}
                    </div>
                </div>
                {% endfor %}
            </div>
        </div>
        {% endif %}
    </div>
</body>
</html>'''

# Save templates
with open(TEMPLATES_DIR / "modern_resume.html", "w", encoding="utf-8") as f:
    f.write(modern_template)

# Classic Template (simplified version)
classic_template = modern_template.replace(
    "font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;",
    "font-family: 'Times New Roman', serif;"
).replace(
    "color: #1e40af;", "color: #000;"
).replace(
    "border-bottom: 2px solid #2563eb;", "border-bottom: 2px solid #000;"
).replace(
    "color: #2563eb;", "color: #000;"
)

with open(TEMPLATES_DIR / "classic_resume.html", "w", encoding="utf-8") as f:
    f.write(classic_template)

# Create minimal version (copy the minimal template from above)
minimal_template = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ personal_info.name }} - Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            background: white;
            font-size: 11px;
        }
        
        .resume {
            max-width: 8.5in;
            min-height: 11in;
            margin: 0 auto;
            padding: 0.5in;
            background: white;
        }
        
        .header {
            margin-bottom: 30px;
        }
        
        .name {
            font-size: 32px;
            font-weight: 300;
            margin-bottom: 5px;
            color: #000;
            letter-spacing: -1px;
        }
        
        .contact-info {
            font-size: 10px;
            color: #666;
            margin-bottom: 20px;
        }
        
        .contact-info span {
            margin-right: 15px;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 15px;
            color: #000;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        
        .summary {
            font-size: 11px;
            line-height: 1.6;
            color: #555;
            margin-bottom: 5px;
        }
        
        .skills-container {
            font-size: 10px;
            line-height: 1.5;
        }
        
        .skill-category {
            margin-bottom: 8px;
        }
        
        .skill-category strong {
            color: #000;
            margin-right: 8px;
        }
        
        .experience-item, .education-item, .project-item {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .job-header, .edu-header, .project-header {
            margin-bottom: 8px;
        }
        
        .job-title, .degree, .project-name {
            font-weight: 600;
            font-size: 12px;
            color: #000;
        }
        
        .company-date, .institution-date {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 2px;
            font-size: 10px;
            color: #666;
        }
        
        .company, .institution {
            font-weight: 500;
        }
        
        .date {
            font-style: italic;
        }
        
        .responsibilities {
            list-style: none;
            margin-top: 8px;
        }
        
        .responsibilities li {
            font-size: 10px;
            line-height: 1.5;
            margin-bottom: 4px;
            padding-left: 10px;
            position: relative;
        }
        
        .responsibilities li:before {
            content: "—";
            position: absolute;
            left: 0;
            color: #999;
        }
        
        .project-description {
            font-size: 10px;
            line-height: 1.5;
            margin-top: 5px;
            color: #555;
        }
        
        .technologies {
            margin-top: 5px;
            font-size: 9px;
            color: #666;
            font-style: italic;
        }
        
        .certifications-list {
            list-style: none;
            font-size: 10px;
        }
        
        .certifications-list li {
            margin-bottom: 4px;
            padding-left: 10px;
            position: relative;
        }
        
        .certifications-list li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #999;
        }
        
        .two-column-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 25px;
        }
        
        @media print {
            .resume {
                padding: 0.4in;
            }
            
            body {
                font-size: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="resume">
        <!-- Header -->
        <div class="header">
            <h1 class="name">{{ personal_info.name or "Your Name" }}</h1>
            <div class="contact-info">
                {% if personal_info.email %}<span>{{ personal_info.email }}</span>{% endif %}
                {% if personal_info.phone %}<span>{{ personal_info.phone }}</span>{% endif %}
                {% if personal_info.location %}<span>{{ personal_info.location }}</span>{% endif %}
                {% if personal_info.linkedin %}<span>{{ personal_info.linkedin }}</span>{% endif %}
                {% if personal_info.github %}<span>{{ personal_info.github }}</span>{% endif %}
            </div>
        </div>

        <!-- Professional Summary -->
        {% if summary %}
        <div class="section">
            <h2 class="section-title">Summary</h2>
            <div class="summary">{{ summary }}</div>
        </div>
        {% endif %}

        <!-- Skills and Education in Two Columns -->
        <div class="two-column-section">
            <!-- Skills -->
            {% if skills.technical_skills or skills.tools or skills.languages %}
            <div>
                <h2 class="section-title">Skills</h2>
                <div class="skills-container">
                    {% if skills.technical_skills %}
                    <div class="skill-category">
                        <strong>Technical:</strong> {{ skills.technical_skills[:12] | join(', ') }}
                    </div>
                    {% endif %}
                    {% if skills.tools %}
                    <div class="skill-category">
                        <strong>Tools:</strong> {{ skills.tools[:10] | join(', ') }}
                    </div>
                    {% endif %}
                    {% if skills.languages %}
                    <div class="skill-category">
                        <strong>Languages:</strong> {{ skills.languages[:8] | join(', ') }}
                    </div>
                    {% endif %}
                </div>
            </div>
            {% endif %}

            <!-- Education -->
            {% if education %}
            <div>
                <h2 class="section-title">Education</h2>
                {% for edu in education[:2] %}
                <div class="education-item">
                    <div class="edu-header">
                        <div class="degree">{{ edu.degree }}</div>
                        <div class="company-date">
                            <span class="institution">{{ edu.institution }}</span>
                            <span class="date">{{ edu.duration }}</span>
                        </div>
                    </div>
                </div>
                {% endfor %}
            </div>
            {% endif %}
        </div>

        <!-- Professional Experience -->
        {% if experience %}
        <div class="section">
            <h2 class="section-title">Experience</h2>
            {% for exp in experience[:3] %}
            <div class="experience-item">
                <div class="job-header">
                    <div class="job-title">{{ exp.role }}</div>
                    <div class="company-date">
                        <span class="company">{{ exp.company }}{% if exp.location %} • {{ exp.location }}{% endif %}</span>
                        <span class="date">{{ exp.duration }}</span>
                    </div>
                </div>
                {% if exp.responsibilities %}
                <ul class="responsibilities">
                    {% for resp in exp.responsibilities[:4] %}
                    <li>{{ resp }}</li>
                    {% endfor %}
                </ul>
                {% endif %}
            </div>
            {% endfor %}
        </div>
        {% endif %}

        <!-- Projects -->
        {% if projects %}
        <div class="section">
            <h2 class="section-title">Projects</h2>
            {% for project in projects[:3] %}
            <div class="project-item">
                <div class="project-header">
                    <div class="project-name">{{ project.name }}</div>
                </div>
                <div class="project-description">{{ project.description }}</div>
                {% if project.technologies %}
                <div class="technologies">
                    {{ project.technologies | join(' • ') }}
                </div>
                {% endif %}
            </div>
            {% endfor %}
        </div>
        {% endif %}

        <!-- Certifications -->
        {% if certifications %}
        <div class="section">
            <h2 class="section-title">Certifications</h2>
            <ul class="certifications-list">
                {% for cert in certifications[:4] %}
                <li>{{ cert }}</li>
                {% endfor %}
            </ul>
        </div>
        {% endif %}
    </div>
</body>
</html>'''

with open(TEMPLATES_DIR / "minimal_resume.html", "w", encoding="utf-8") as f:
    f.write(minimal_template)

# Create creative template (sidebar version)
creative_template = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ personal_info.name }} - Resume</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.4;
            color: #333;
            background: white;
            font-size: 11px;
        }
        
        .resume {
            max-width: 8.5in;
            min-height: 11in;
            margin: 0 auto;
            padding: 0;
            background: white;
            display: grid;
            grid-template-columns: 2.5in 1fr;
            gap: 0;
        }
        
        .sidebar {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.4in;
        }
        
        .main-content {
            padding: 0.4in;
            background: white;
        }
        
        .profile-section {
            text-align: center;
            margin-bottom: 25px;
        }
        
        .name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .contact-info {
            font-size: 9px;
            line-height: 1.4;
        }
        
        .contact-info div {
            margin-bottom: 4px;
            word-break: break-all;
        }
        
        .sidebar-section {
            margin-bottom: 20px;
        }
        
        .sidebar-title {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            padding-bottom: 3px;
            border-bottom: 2px solid rgba(255,255,255,0.3);
        }
        
        .skills-list {
            font-size: 9px;
            line-height: 1.4;
        }
        
        .skill-item {
            margin-bottom: 6px;
            padding: 4px 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 3px;
            text-align: center;
        }
        
        .education-item {
            margin-bottom: 12px;
            font-size: 9px;
        }
        
        .edu-degree {
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .edu-school {
            opacity: 0.9;
            margin-bottom: 2px;
        }
        
        .edu-date {
            font-size: 8px;
            opacity: 0.8;
        }
        
        .main-section {
            margin-bottom: 20px;
        }
        
        .main-title {
            font-size: 14px;
            font-weight: bold;
            color: #667eea;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            padding-bottom: 3px;
            border-bottom: 2px solid #667eea;
        }
        
        .summary {
            font-size: 11px;
            line-height: 1.5;
            text-align: justify;
            color: #555;
        }
        
        .experience-item {
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        
        .job-header {
            margin-bottom: 6px;
        }
        
        .job-title {
            font-weight: bold;
            font-size: 12px;
            color: #667eea;
            margin-bottom: 2px;
        }
        
        .company-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #666;
            margin-bottom: 4px;
        }
        
        .company {
            font-weight: 600;
        }
        
        .date {
            font-style: italic;
        }
        
        .responsibilities {
            list-style: none;
            margin-top: 4px;
        }
        
        .responsibilities li {
            font-size: 10px;
            line-height: 1.4;
            margin-bottom: 3px;
            padding-left: 15px;
            position: relative;
        }
        
        .responsibilities li:before {
            content: "▶";
            color: #667eea;
            font-size: 8px;
            position: absolute;
            left: 0;
            top: 2px;
        }
        
        .projects-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        
        .project-item {
            padding: 10px;
            border: 1px solid #e5e7eb;
            border-radius: 5px;
            background: #f9fafb;
        }
        
        .project-name {
            font-weight: bold;
            font-size: 11px;
            color: #667eea;
            margin-bottom: 4px;
        }
        
        .project-description {
            font-size: 9px;
            line-height: 1.4;
            margin-bottom: 4px;
        }
        
        .project-tech {
            font-size: 8px;
            color: #666;
            font-style: italic;
        }
        
        .cert-item {
            font-size: 9px;
            margin-bottom: 4px;
            padding: 3px 6px;
            background: rgba(255,255,255,0.1);
            border-radius: 3px;
            text-align: center;
        }
        
        @media print {
            body {
                font-size: 10px;
            }
            
            .resume {
                padding: 0;
            }
            
            .sidebar {
                padding: 0.3in;
            }
            
            .main-content {
                padding: 0.3in;
            }
        }
    </style>
</head>
<body>
    <div class="resume">
        <!-- Sidebar -->
        <div class="sidebar">
            <!-- Profile -->
            <div class="profile-section">
                <h1 class="name">{{ personal_info.name or "Your Name" }}</h1>
                <div class="contact-info">
                    {% if personal_info.email %}<div>{{ personal_info.email }}</div>{% endif %}
                    {% if personal_info.phone %}<div>{{ personal_info.phone }}</div>{% endif %}
                    {% if personal_info.location %}<div>{{ personal_info.location }}</div>{% endif %}
                    {% if personal_info.linkedin %}<div>{{ personal_info.linkedin }}</div>{% endif %}
                    {% if personal_info.github %}<div>{{ personal_info.github }}</div>{% endif %}
                </div>
            </div>

            <!-- Skills -->
            {% if skills.technical_skills %}
            <div class="sidebar-section">
                <h3 class="sidebar-title">Skills</h3>
                <div class="skills-list">
                    {% for skill in skills.technical_skills[:12] %}
                    <div class="skill-item">{{ skill }}</div>
                    {% endfor %}
                </div>
            </div>
            {% endif %}

            <!-- Education -->
            {% if education %}
            <div class="sidebar-section">
                <h3 class="sidebar-title">Education</h3>
                {% for edu in education[:2] %}
                <div class="education-item">
                    <div class="edu-degree">{{ edu.degree }}</div>
                    <div class="edu-school">{{ edu.institution }}</div>
                    <div class="edu-date">{{ edu.duration }}</div>
                </div>
                {% endfor %}
            </div>
            {% endif %}

            <!-- Certifications -->
            {% if certifications %}
            <div class="sidebar-section">
                <h3 class="sidebar-title">Certifications</h3>
                {% for cert in certifications[:4] %}
                <div class="cert-item">{{ cert }}</div>
                {% endfor %}
            </div>
            {% endif %}

            <!-- Additional Skills -->
            {% if skills.tools %}
            <div class="sidebar-section">
                <h3 class="sidebar-title">Tools</h3>
                <div class="skills-list">
                    {% for tool in skills.tools[:8] %}
                    <div class="skill-item">{{ tool }}</div>
                    {% endfor %}
                </div>
            </div>
            {% endif %}
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Professional Summary -->
            {% if summary %}
            <div class="main-section">
                <h2 class="main-title">Profile</h2>
                <div class="summary">{{ summary }}</div>
            </div>
            {% endif %}

            <!-- Professional Experience -->
            {% if experience %}
            <div class="main-section">
                <h2 class="main-title">Experience</h2>
                {% for exp in experience[:3] %}
                <div class="experience-item">
                    <div class="job-header">
                        <div class="job-title">{{ exp.role }}</div>
                        <div class="company-info">
                            <span class="company">{{ exp.company }}</span>
                            <span class="date">{{ exp.duration }}</span>
                        </div>
                    </div>
                    {% if exp.responsibilities %}
                    <ul class="responsibilities">
                        {% for resp in exp.responsibilities[:3] %}
                        <li>{{ resp[:120] }}{% if resp|length > 120 %}...{% endif %}</li>
                        {% endfor %}
                    </ul>
                    {% endif %}
                </div>
                {% endfor %}
            </div>
            {% endif %}

            <!-- Projects -->
            {% if projects %}
            <div class="main-section">
                <h2 class="main-title">Projects</h2>
                <div class="projects-grid">
                    {% for project in projects[:4] %}
                    <div class="project-item">
                        <div class="project-name">{{ project.name }}</div>
                        <div class="project-description">{{ project.description[:100] }}{% if project.description|length > 100 %}...{% endif %}</div>
                        {% if project.technologies %}
                        <div class="project-tech">{{ project.technologies[:4] | join(', ') }}</div>
                        {% endif %}
                    </div>
                    {% endfor %}
                </div>
            </div>
            {% endif %}
        </div>
    </div>
</body>
</html>'''

with open(TEMPLATES_DIR / "creative_resume.html", "w", encoding="utf-8") as f:
    f.write(creative_template)

print("✅ All resume templates created successfully!")
print(f"📁 Templates saved in: {TEMPLATES_DIR}")
print("📋 Available templates:")
print("  - modern_resume.html (Professional with blue accents)")
print("  - classic_resume.html (Traditional serif layout)")
print("  - creative_resume.html (Sidebar with gradient)")
print("  - minimal_resume.html (Clean minimal design)")
print("\n🔧 Next steps:")
print("1. Install required packages: pip install jinja2 pdfkit")
print("2. Install wkhtmltopdf system dependency")
print("3. Update your main.py with the new template system")
print("4. Run the updated application!")