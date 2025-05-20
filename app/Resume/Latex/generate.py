import os
import shutil
import subprocess
import google.generativeai as genai
from pathlib import Path

# --- CONFIGURATION ---

genai.configure(api_key="---")  # Replace with your Gemini key

BASE_FILES = [
    "resume.tex",
    "custom-commands.tex",
    "heading.tex",
    "education.tex",
    "experience.tex",
    "projects.tex",
    "skills.tex",
]

MODIFIABLE_SECTIONS = {
    "experience": "experience.tex",
    "projects": "projects.tex",
    "skills": "skills.tex",
}

PROMPT_TEMPLATE = """
You are a resume assistant. Rewrite the following LaTeX section using the provided job description.
Be concise, formal, and generate valid LaTeX only.

SECTION TYPE: {section_type}
JOB DESCRIPTION:
{job_description}

EXISTING LATEX:
{existing_section}
"""

# --- FUNCTIONS ---

def read_file(path):
    with open(path, "r") as f:
        return f.read()

def write_file(path, content):
    with open(path, "w") as f:
        f.write(content.strip())

def copy_all_files(src_dir, dest_dir):
    os.makedirs(dest_dir, exist_ok=True)
    for file in BASE_FILES:
        shutil.copy(os.path.join(src_dir, file), os.path.join(dest_dir, file))

def update_section(section_type, job_description, folder):
    path = os.path.join(folder, MODIFIABLE_SECTIONS[section_type])
    old = read_file(path)
    prompt = PROMPT_TEMPLATE.format(
        section_type=section_type,
        job_description=job_description,
        existing_section=old,
    )

    model = genai.GenerativeModel("models/gemini-1.5-flash")
    print(f"📝 Updating {section_type}...")
    response = model.generate_content(prompt)
    write_file(path, response.text)

def compile_resume(folder):
    print("📄 Compiling LaTeX...")
    result = subprocess.run([
        "latexmk",
        "-pdf",
        "-interaction=nonstopmode",
        f"-output-directory={folder}",
        os.path.join(folder, "resume.tex")
    ])
    if result.returncode == 0:
        print(f"✅ Resume compiled: {folder}/resume.pdf")
    else:
        print("❌ Compilation failed. Check log for details.")

# --- MAIN ---

def main():
    import sys
    if len(sys.argv) < 2:
        print("Usage: python generate.py <company-name>")
        return

    company = sys.argv[1].strip().replace(" ", "_")
    output_dir = f"generated/{company}"
    base_dir = "."

    copy_all_files(base_dir, output_dir)

    print("📋 Paste the job description (end with Ctrl+D):")
    job_description = ""
    try:
        while True:
            job_description += input() + "\n"
    except EOFError:
        pass

    for section in MODIFIABLE_SECTIONS:
        update_section(section, job_description, output_dir)

    compile_resume(output_dir)

if __name__ == "__main__":
    main()
