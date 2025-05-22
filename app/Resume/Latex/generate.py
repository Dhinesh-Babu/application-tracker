import google.generativeai as genai
import os
import json
import re
import subprocess
import datetime
import shutil

# --- Configuration ---
# IMPORTANT: Replace with your actual API key or set it as an environment variable
# genai.configure(api_key="YOUR_GEMINI_API_KEY")
# Or better, set it as an environment variable:
# export GOOGLE_API_KEY="YOUR_GEMINI_API_KEY"

# Ensure API key is set
try:
    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
except KeyError:
    print("Error: GOOGLE_API_KEY environment variable not set.")
    print("Please set it before running the script (e.g., export GOOGLE_API_KEY='your_key_here').")
    exit(1)


# --- Helper Functions ---

def load_knowledge_bank(file_path="knowledge_bank.json"):
    """Loads the structured resume data directly from a JSON file."""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        print(f"Knowledge bank loaded from {file_path}")
        return data
    except FileNotFoundError:
        print(f"Error: Knowledge bank file not found at {file_path}")
        return None
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {file_path}. Check file format.")
        return None

def read_original_latex_section(file_path):
    """Reads the raw content of an original LaTeX section file for example purposes."""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        # Escape any triple quotes within the content to prevent f-string issues
        content = content.replace('"""', '\\"\\"\\"')
        return content
    except FileNotFoundError:
        return "" # Return empty string instead of printing warning if file just doesn't exist

def write_latex_section(file_path, content):
    """Writes content back to a LaTeX file."""
    with open(file_path, 'w') as f:
        f.write(content)

def compile_latex_to_pdf(output_folder):
    """Compiles the LaTeX document to PDF using latexmk."""
    try:
        print(f"Attempting to compile LaTeX in {output_folder} from resume.tex...")
        # Clean up auxiliary files first for a clean build
        subprocess.run(['latexmk', '-c'], cwd=output_folder, check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # Compile using latexmk for robustness
        result = subprocess.run(['latexmk', '-pdf', 'resume.tex'], cwd=output_folder, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"Resume generated successfully: {output_folder}/resume.pdf")
            return True
        else:
            print(f"Error compiling LaTeX (return code {result.returncode}) in {output_folder}:")
            print("STDOUT:\n", result.stdout)
            print("STDERR:\n", result.stderr)
            print("Please ensure LaTeX distribution (e.g., TeX Live, MiKTeX) and latexmk are installed and in your PATH.")
            return False
    except FileNotFoundError:
        print("latexmk command not found. Please install LaTeX and ensure latexmk is in your system's PATH.")
        return False
    except Exception as e:
        print(f"An unexpected error occurred during LaTeX compilation: {e}")
        return False

# --- Gemini Interaction Functions ---

def get_gemini_response(prompt_text, model_name="gemini-1.5-flash", temperature=0.4):
    """Sends a prompt to the Gemini API and returns the response text."""
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt_text, generation_config=genai.types.GenerationConfig(temperature=temperature))
        return response.text
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return ""

def generate_skills_section_with_gemini(structured_skills_data, job_description, example_latex):
    """
    Uses Gemini to generate a tailored skills section from structured data,
    providing an example of the desired LaTeX output.
    """
    skills_json = json.dumps(structured_skills_data, indent=2)
    
    # Corrected escaping for f-string literal backslashes
    prompt = f"""
    You are an expert resume writer. I will provide you with my comprehensive technical skills data in JSON format and a job description.
    Your task is to re-write the technical skills section for a resume to best match the job description, highlighting relevant skills and potentially rephrasing them to align with the job's terminology.
    **IMPORTANT**: You MUST escape all special LaTeX characters in the text. For example:
    '&' -> '\\&'
    '%' -> '\\%'
    '#' -> '\\#'
    '$' -> '\\$'
    '_' -> '\\_'
    '{{' -> '\\{{'
    '}}' -> '\\}}'
    '~' -> '\\textasciitilde{{}}'
    '^' -> '\\textasciicircum{{}}'
    '\\' -> '\\textbackslash{{}}'
    Maintain the existing LaTeX structure for a resume skills section. Use \\section{{Technical Skills}} as the main header.
    Each category (e.g., Languages, Cloud & DevOps Tools) should be \\textbf{{Category Name}}{{: Skill1, Skill2}}.
    For certifications, use a nested \\begin{{itemize}} with \\item and preserve the full \\href link exactly as provided.
    Ensure all \\begin{{itemize}} commands have a corresponding \\end{{itemize}}.
    Only include skills that are directly mentioned or strongly implied by the job description. If a skill is not relevant, omit it.
    If a category has no relevant skills, you can omit the category.

    ---BEGIN MY SKILLS DATA (JSON)---
    {skills_json}
    ---END MY SKILLS DATA (JSON)---

    ---BEGIN JOB DESCRIPTION---
    {job_description}
    ---END JOB DESCRIPTION---

    ---BEGIN EXAMPLE LATEX OUTPUT (FOR FORMAT REFERENCE)---
    {example_latex}
    ---END EXAMPLE LATEX OUTPUT (FOR FORMAT REFERENCE)---

    ---OUTPUT NEW SKILLS SECTION (LATEX ONLY)---
    """
    print("Generating skills section with Gemini...")
    return get_gemini_response(prompt)

def generate_experience_section_with_gemini(structured_experience_data, job_description, example_latex):
    """
    Uses Gemini to generate a tailored experience section from structured data,
    providing an example of the desired LaTeX output.
    """
    experience_json = json.dumps(structured_experience_data, indent=2)

    # Corrected escaping for f-string literal backslashes
    prompt = f"""
    You are an expert resume writer. I will provide you with my comprehensive experience data in JSON format and a job description.
    Your task is to select and re-write the most relevant achievement bullet points from my experience to match the job description, prioritizing impact and relevance.
    **IMPORTANT**: You MUST escape all special LaTeX characters in the text. For example:
    '&' -> '\\&'
    '%' -> '\\%'
    '#' -> '\\#'
    '$' -> '\\$'
    '_' -> '\\_'
    '{{' -> '\\{{'
    '}}' -> '\\}}'
    '~' -> '\\textasciitilde{{}}'
    '^' -> '\\textasciicircum{{}}'
    '\\' -> '\\textbackslash{{}}'
    **For each relevant role, aim for a minimum of 4-5 strong, concise bullet points**, focusing on quantifiable achievements and results.
    You can rephrase bullet points to emphasize aspects that align with the job description.
    Maintain the existing LaTeX structure for an experience section.
    Do NOT invent new experiences or roles. Stick to the provided content and rephrase/prioritize.
    If a role or its bullet points are not relevant to the job description, you can omit them entirely.
    Ensure that the company name, role title, duration, and location are correctly formatted using \\resumeSubheading.
    Ensure all \\begin{{itemize}} commands have a corresponding \\end{{itemize}}.

    ---BEGIN MY EXPERIENCE DATA (JSON)---
    {experience_json}
    ---END MY EXPERIENCE DATA (JSON)---

    ---BEGIN JOB DESCRIPTION---
    {job_description}
    ---END JOB DESCRIPTION---

    ---BEGIN EXAMPLE LATEX OUTPUT (FOR FORMAT REFERENCE)---
    {example_latex}
    ---END EXAMPLE LATEX OUTPUT (FOR FORMAT REFERENCE)---

    ---OUTPUT NEW EXPERIENCE SECTION (LATEX ONLY)---
    """
    print("Generating experience section with Gemini...")
    return get_gemini_response(prompt)

def generate_projects_section_with_gemini(structured_projects_data, job_description, example_latex):
    """
    Uses Gemini to generate a tailored projects section from structured data,
    providing an example of the desired LaTeX output.
    """
    projects_json = json.dumps(structured_projects_data, indent=2)

    # Corrected escaping for f-string literal backslashes
    prompt = f"""
    You are an expert resume writer. I will provide you with my comprehensive projects data in JSON format and a job description.
    Your task is to select and re-write the most relevant projects and their bullet points to match the job description.
    **IMPORTANT**: You MUST escape all special LaTeX characters in the text. For example:
    '&' -> '\\&'
    '%' -> '\\%'
    '#' -> '\\#'
    '$' -> '\\$'
    '_' -> '\\_'
    '{{' -> '\\{{'
    '}}' -> '\\}}'
    '~' -> '\\textasciitilde{{}}'
    '^' -> '\\textasciicircum{{}}'
    '\\' -> '\\textbackslash{{}}'
    **Aim to include 3 highly relevant projects.** If fewer than 3 are highly relevant, include all that are.
    You can rephrase project descriptions and bullet points to highlight aspects that align with the job's requirements.
    Maintain the existing LaTeX structure for a projects section.
    Do NOT invent new projects. Stick to the provided content and rephrase/prioritize.
    Ensure all \\begin{{itemize}} commands have a corresponding \\end{{itemize}}.

    ---BEGIN MY PROJECTS DATA (JSON)---
    {projects_json}
    ---END MY PROJECTS DATA (JSON)---

    ---BEGIN JOB DESCRIPTION---
    {job_description}
    ---END JOB DESCRIPTION---

    ---BEGIN EXAMPLE LATEX OUTPUT (FOR FORMAT REFERENCE)---
    {example_latex}
    ---END EXAMPLE LATEX OUTPUT (FOR FORMAT REFERENCE)---

    ---OUTPUT NEW PROJECTS SECTION (LATEX ONLY)---
    """
    print("Generating projects section with Gemini...")
    return get_gemini_response(prompt)


def generate_custom_resume_from_knowledge_bank(job_description, knowledge_bank_path="knowledge_bank.json", base_resume_path=".", output_base_folder="generated_resumes"):
    """
    Generates a customized resume using Gemini AI based on the job description
    and a structured knowledge bank, providing LaTeX examples for formatting.
    All generated files are saved in a new timestamped subfolder.
    """
    print("--- Starting resume customization with Gemini AI (Knowledge Bank Method) ---")

    # Create a unique output folder for this run
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    output_folder = os.path.join(output_base_folder, f"resume_{timestamp}")
    os.makedirs(output_folder, exist_ok=True)
    print(f"Output will be saved to: {output_folder}")

    # Copy original LaTeX template files to the new output folder
    latex_template_files = ["resume.tex", "heading.tex", "education.tex", "custom-commands.tex", "skills.tex", "experience.tex", "projects.tex"]
    for fname in latex_template_files:
        src_path = os.path.join(base_resume_path, fname)
        if os.path.exists(src_path):
            shutil.copy(src_path, output_folder)
        else:
            print(f"Warning: Original LaTeX template file not found: {src_path}. This might affect compilation.")
    print(f"Copied original LaTeX template files to {output_folder}")

    # 1. Load Knowledge Bank (directly from JSON)
    knowledge_bank = load_knowledge_bank(knowledge_bank_path)
    if knowledge_bank is None:
        print("Aborting resume generation due to missing/invalid knowledge bank.")
        return

    # Extract relevant structured data for each section
    structured_skills = knowledge_bank.get("skills", {})
    structured_experience = knowledge_bank.get("experience", [])
    structured_projects = knowledge_bank.get("projects", [])

    # 2. Read Original LaTeX Sections for Example Context (from the copied files in output_folder)
    original_skills_example = read_original_latex_section(os.path.join(output_folder, "skills.tex"))
    original_experience_example = read_original_latex_section(os.path.join(output_folder, "experience.tex"))
    original_projects_example = read_original_latex_section(os.path.join(output_folder, "projects.tex"))


    # 3. Generate New Sections using Gemini, passing the examples
    new_skills_latex = generate_skills_section_with_gemini(structured_skills, job_description, original_skills_example)
    new_experience_latex = generate_experience_section_with_gemini(structured_experience, job_description, original_experience_example)
    new_projects_latex = generate_projects_section_with_gemini(structured_projects, job_description, original_projects_example)

    # 4. Handle Gemini's Output (e.g., stripping markdown code blocks if present)
    def clean_gemini_output(text):
        # This regex looks for an optional language specifier (like 'latex') after the first ```
        match = re.search(r"```(?:[a-zA-Z0-9_+\-]+)?\s*(.*?)\s*```", text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return text.strip()

    new_skills_latex = clean_gemini_output(new_skills_latex)
    new_experience_latex = clean_gemini_output(new_experience_latex)
    new_projects_latex = clean_gemini_output(new_projects_latex)

    # 5. Validate Gemini's output and write to files in the new output folder
    # If Gemini returns empty, it means it didn't find relevant content, or an error occurred.
    # For now, we'll write empty if Gemini decides so, leading to an empty section.
    if not new_skills_latex.strip():
        print("Warning: Gemini returned empty content for skills. This section will be empty in resume.")
    if not new_experience_latex.strip():
        print("Warning: Gemini returned empty content for experience. This section will be empty in resume.")
    if not new_projects_latex.strip():
        print("Warning: Gemini returned empty content for projects. This section will be empty in resume.")

    write_latex_section(os.path.join(output_folder, "skills.tex"), new_skills_latex)
    write_latex_section(os.path.join(output_folder, "experience.tex"), new_experience_latex)
    write_latex_section(os.path.join(output_folder, "projects.tex"), new_projects_latex)

    print(f"Updated .tex files in {output_folder} with Gemini-generated content.")

    # 6. Compile the LaTeX Resume to PDF in the new output folder
    compile_latex_to_pdf(output_folder)

    print("--- Resume customization complete ---")


# --- Example Usage ---
if __name__ == "__main__":
    job_description_devops = """
    
About the job

Kaseya® is the leading provider of complete IT infrastructure and security management solutions for Managed Service Providers (MSPs) and internal IT organizations worldwide powered by AI. Kaseya’s best-in-breed technologies allow organizations to efficiently manage and secure IT to drive sustained business success. Kaseya has achieved sustained, strong double-digit growth over the past several years and is backed by Insight Venture Partners www.insightpartners.com), a leading global private equity firm investing in high-growth technology and software companies that drive transformative change in the industries they serve.

Founded in 2000, Kaseya currently serves customers in over 20 countries across a wide variety of industries and manages over 15 million endpoints worldwide. To learn more about our company and our award-winning solutions, go to www.Kaseya.com and for more information on Kaseya’s culture, please click here: Kaseya Culture.

Kaseya is not your typical company. We are not afraid to tell you exactly who we are and our expectations. We have achieved record levels of success being BOLD, being GRITTY, being ACCOUNTABLE. The thousands of people that succeed at Kaseya are prepared to go above and beyond for the betterment of our customers, and the betterment of their careers and long-term financial wealth.

WHAT WE ARE LOOKING FOR:

Kaseya is seeking a dynamic and enthusiastic DevOps Engineer to join our cutting-edge engineering team. As a DevOps Engineer, you will be at the forefront of driving continuous integration, delivery, and deployment practices, empowering our software developers to deliver high-quality IT management solutions faster than ever before.

WHAT YOU'LL DO:

As a DevOps Engineer at Kaseya, you will be a vital member of our dynamic and innovative engineering team, responsible for bridging the gap between development and operations to facilitate continuous integration, delivery, and deployment of software solutions. Your technical prowess and passion for automation will play a key role in optimizing and streamlining the software development lifecycle, enabling the delivery of high-quality IT management solutions to our clients.

ESSENTIAL DUTIES AND RESPONSIBILITIES:

     Create and maintain automated solutions spanning the code management, build, package, deploy, and delivery functions of DevOps.
     Manage the day-to-day usage and provisioning of cloud and hybrid resources based on the project needs using Infrastructure as Code.
     Ensure performance and availability of data infrastructure through Proactive monitoring initiatives.
     Be part of an on-call rotation team to manage and restore any service related issues.
     Build deployment automation with configuration as code to provision data cloud services/infrastructure.
     Proactive monitor infrastructure costs and find ways to optimize/reduce infra.
     Adopt engineering best practices to deliver higher quality and scalable solutions.
     Stay abreast of emerging DevOps and Data technologies/tools.

WHAT YOU'LL BRING:

     5 years' experience working with and deploying solutions using AWS
     Experience writing infrastructure-as-code using tools such as CloudFormation or Terraform
     Experience maintaining continuous integration and deployment pipelines
     Understanding of technical architecture and design, theories, and best practices in a broad range of deployment, management, and operating scalable, highly available, and fault-tolerant systems
     Demonstrated experience with Continuous Integration/Continuous delivery using GitHub and Gitlab
     Contribution to open-source software
     Work related blog or GitHub account details
     Experience with Scripting languages including Python and Shell Scripts.
     Experience with logging tools like: Kibana, Elasticsearch, OpenSearch
     Experience supporting containerized and serverless deployments using Docker, ECS, K8s, or Lambda
     Experience with monitoring tools like Datadog, CloudWatch and Grafana.
     Experience working with AWS RDS (both MySQL and PostgreSQL)
     On Call rotation experience using tools like OpsGenie or PagerDuty.
     Experience with Incident management which includes troubleshooting, resolution and creating postmortems/RCAs.
     Data Warehousing and ETL using Snowflake and Airflow or similar

Join the Kaseya growth rocket ship and see how we are #ChangingLives !

Additional Information

Kaseya provides equal employment opportunity to all employees and applicants without regard to race, religion, age, ancestry, gender, sex, sexual orientation, national origin, citizenship status, physical or mental disability, veteran status, marital status, or any other characteristic protected by applicable law.
    """
    
    print("\n--- Generating DevOps-focused Resume from Knowledge Bank (with Examples) ---")
    generate_custom_resume_from_knowledge_bank(
        job_description_devops,
        knowledge_bank_path="knowledge_bank.json",
        base_resume_path=".",
        output_base_folder="generated_resumes"
    )

    print("\n--- Generating ML/Android-focused Resume from Knowledge Bank (with Examples) ---")
    job_description_ml_android = """
    bout the job

About DX

DX helps companies build world-class engineering organizations by providing leaders with insights into developer experience and productivity. DX is bootstrapped, profitable, and consistently growing revenue more than 3X year over year. We’re based in downtown Salt Lake City with customers like Indeed, Etsy, Dropbox, Twilio, Pfizer, and Vanguard.


About the role

This is a junior-level role where you'll spend your first 12–18 months dedicated to frontline engineering support, helping you gain technical fluency across our stack and build the foundations for your engineering career. Following this initial 12–18 month period, you will “graduate” into a more senior product engineering role, developing new features and capabilities.


Our engineering team is extremely small and we aim to keep it that way. This means that each person on our team carries significant weight and responsibility, and must ship a lot. In return, we have great compensation, zero bureaucracy, little to no meetings, and the opportunity to immensely impact the business each day. We’re looking for someone who’s eager to dive in, contribute, and launch their career at DX.


Key responsibilities

    Manage our Engineering Support Rotation during your onboarding phase, solving real-world technical issues.
    Collaborate with senior engineers to resolve bugs, optimize performance, and implement solutions.
    Work closely with internal teams to ensure customers’ success.


About you

    You’re a fast-learner who performs work with a high-level of intensity.
    You’re able to take ownership, work under pressure, and meet deadlines on time.
    You’re able to regularly work more than 40 hours/week—including after-hours or weekends when needed—to meet the workload and performance expectations that this role requires.
    You have foundational knowledge of web application development.


Bonus points if you

    Have startup experience
    Have experience working with Ruby, React, and/or PostgreSQL


Why you’ll love working here

    Mentorship & growth. You’ll work directly with senior engineers who will mentor you as you grow into a full-time product engineer.
    Ownership & impact. You’ll see the direct results of your efforts in our product’s performance and customer satisfaction.
    Collaborative culture. We’re a tight-knit team that values curiosity, knowledge sharing, and learning from one another.


Benefits

    Competitive salary and meaningful equity in a high-growth-stage startup
    401k with 4% match
    Unlimited PTO
    Fully covered medical insurance

    """
    generate_custom_resume_from_knowledge_bank(
        job_description_ml_android,
        knowledge_bank_path="knowledge_bank.json",
        base_resume_path=".",
        output_base_folder="generated_resumes"
    )