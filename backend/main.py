from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import fitz
import google.generativeai as genai
from dotenv import load_dotenv
import os
import json
load_dotenv()
import requests
import time
import datetime
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer
)

from reportlab.lib.styles import getSampleStyleSheet
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
anakin_key = os.getenv("ANAKIN_API_KEY")
model = genai.GenerativeModel("gemini-2.5-flash")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TECH_SKILLS = {
    "python",
    "java",
    "javascript",
    "react",
    "node",
    "golang",
    "go",
    "docker",
    "kubernetes",
    "aws",
    "linux",
    "devops",
    "sql",
    "dbms",
    "backend",
    "frontend",
    "fullstack",
    "cloud",
    "cybersecurity",
    "machine learning",
    "ai",
    "data science",
    "system design"
}

ROLE_SKILLS = {

    "AI Engineer": [
        "Python",
        "Machine Learning",
        "Deep Learning",
        "TensorFlow",
        "PyTorch",
        "NumPy",
        "Pandas"
    ],

    "Frontend Developer": [
        "HTML",
        "CSS",
        "JavaScript",
        "React",
        "TypeScript",
        "Tailwind"
    ],

    "Backend Developer": [
        "Python",
        "Java",
        "Node.js",
        "SQL",
        "REST API",
        "Docker"
    ],

    "Data Scientist": [
        "Python",
        "Pandas",
        "NumPy",
        "Machine Learning",
        "Statistics",
        "Data Analysis"
    ],

    "Cybersecurity Engineer": [
        "Linux",
        "Networking",
        "Security",
        "OWASP",
        "Wireshark",
        "Nmap",
        "Python"
    ]
}

ROLE_KEYWORDS = {

    "AI Engineer": [
        "ai",
        "python",
        "machine learning",
        "deep learning",
        "data",
        "scientist"
    ],

    "Frontend Developer": [
        "frontend",
        "react",
        "javascript",
        "typescript",
        "html",
        "css"
    ],

    "Backend Developer": [
        "backend",
        "python",
        "java",
        "node",
        "sql",
        "api"
    ],

    "Data Scientist": [
        "data",
        "python",
        "pandas",
        "numpy",
        "analytics",
        "scientist"
    ],

    "Cybersecurity Engineer": [
        "security",
        "cyber",
        "offensive",
        "network",
        "soc",
        "pentest"
    ]
}

# ==========================
# SKILL CATEGORY MAPPING
# ==========================

SKILL_MAPPING = {

    # Existing mappings
    "Data Science & Analytics": [
        "Python",
        "Machine Learning",
        "Data Analysis",
        "Pandas",
        "NumPy"
    ],

    "Full-Stack Programming": [
        "JavaScript",
        "React",
        "Node.js",
        "HTML",
        "CSS"
    ],

    "Back-End Programming": [
        "Python",
        "Java",
        "SQL",
        "DBMS"
    ],

    "DevOps & Infrastructure": [
        "Linux",
        "Docker",
        "Kubernetes",
        "AWS",
        "CI/CD"
    ],

    "Product & Operations": [
        "Project Management",
        "Agile"
    ],

    # WeWorkRemotely mappings
    "Programming": [
        "Python",
        "Java",
        "JavaScript",
        "React",
        "Node.js",
        "SQL"
    ],

    "DevOps": [
        "Docker",
        "Kubernetes",
        "AWS",
        "Linux",
        "CI/CD"
    ],

    "Design": [
        "Figma",
        "UI Design",
        "UX Design",
        "Graphic Design"
    ],

    "Customer Support": [
        "Communication",
        "Problem Solving"
    ],

    "Sales": [
        "Sales",
        "Negotiation"
    ]
}
def fetch_jobicy_jobs():

    headers = {
        "X-API-Key": os.getenv("ANAKIN_API_KEY"),
        "Content-Type": "application/json"
    }

    payload = {
        "action_id": "jb_jobs",
        "params": {
            "count": "20"
        }
    }

    response = requests.post(
        "https://anakin.io/v1/holocron/task",
        headers=headers,
        json=payload
    )

    data = response.json()

    if "job_id" not in data:
        print("JOBICY FAILED:", data)
        return []

    job_id = data["job_id"]

    result = None

    for _ in range(60):   # increased from 10

        poll_response = requests.get(
            f"https://anakin.io/v1/holocron/jobs/{job_id}",
            headers=headers
        )

        result = poll_response.json()

        print("JOBICY RESULT:")
        print(result)

        if result.get("status") == "completed":
            print("JOBICY COMPLETED")
            break

        time.sleep(2)

    # If still processing after all attempts
    if not result or result.get("status") != "completed":
        print("JOBICY TIMEOUT")
        return []

    transformed_jobs = []

    try:
        jobs_data = result["data"]["data"]["data"]
    except Exception as e:
        print("JOBICY PARSE ERROR:", e)
        print(result)
        return []

    for job in jobs_data:

        skills = []

        for industry in job.get("industry", []):

            if industry in SKILL_MAPPING:
                skills.extend(SKILL_MAPPING[industry])
            else:
                skills.append(industry)

        transformed_jobs.append({
            "company": job["company"],
            "role": job["title"],
            "skills": list(set(skills)),
            "location": job["geo"],
            "level": job["level"],
            "url": job["url"]
        })

    print(f"JOBICY LOADED: {len(transformed_jobs)} jobs")

    return transformed_jobs

def fetch_remoteok_jobs():

    headers = {
        "X-API-Key": os.getenv("ANAKIN_API_KEY"),
        "Content-Type": "application/json"
    }

    payload = {
        "action_id": "ro_jobs",
        "params": {
            "tag": "",
            "limit": 20
        }
    }

    response = requests.post(
        "https://anakin.io/v1/wire/task",
        headers=headers,
        json=payload
    )

    data = response.json()

    if "job_id" not in data:
        print("REMOTEOK FAILED:", data)
        return []

    job_id = data["job_id"]

    result = None

    for _ in range(60):

        poll_response = requests.get(
            f"https://anakin.io/v1/wire/jobs/{job_id}",
            headers=headers
        )

        result = poll_response.json()

        print("REMOTEOK RESULT:")
        print(result)

        if result.get("status") == "completed":
            print("REMOTEOK COMPLETED")
            break

        time.sleep(2)

    if not result or result.get("status") != "completed":
        print("REMOTEOK TIMEOUT")
        return []

    try:
        completed_data = result["data"]["data"]["data"]
    except Exception as e:
        print("REMOTEOK PARSE ERROR:", e)
        print(result)
        return []

    transformed_jobs = []

    for job in completed_data:

        transformed_jobs.append({
            "company": job["company"],
            "role": job["position"],
            "skills": job.get("tags", []),
            "location": job.get("location", ""),
            "level": "Unknown",
            "url": job.get("apply_url", job.get("url", ""))
        })

    print(f"REMOTEOK LOADED: {len(transformed_jobs)} jobs")

    return transformed_jobs

def fetch_weworkremotely_jobs():

    headers = {
        "X-API-Key": os.getenv("ANAKIN_API_KEY"),
        "Content-Type": "application/json"
    }

    payload = {
        "action_id": "ww_jobs",
        "params": {
            "limit": 20
        }
    }

    response = requests.post(
        "https://anakin.io/v1/holocron/task",
        headers=headers,
        json=payload
    )

    data = response.json()

    job_id = data["job_id"]

    for _ in range(30):

        poll_response = requests.get(
            f"https://anakin.io/v1/holocron/jobs/{job_id}",
            headers=headers
        )

        result = poll_response.json()

        if result.get("status") == "completed":
            break
        print(
            datetime.datetime.now(),
            result
        )
        retry_ms = result.get(
            "retry_after_ms",
            2000
        )

        time.sleep(retry_ms / 1000)

    jobs_data = result["data"]["data"]["data"]
    print(jobs_data[0])
    transformed_jobs = []

    for job in jobs_data:

        skills = []

        for category in job.get("categories", []):

            if category.lower() in TECH_SKILLS:
                skills.append(category)

        transformed_jobs.append({
            "company": job["company"],
            "role": job["title"],
            "skills": list(set(skills)),
            "location": "Remote",
            "level": "Unknown",
            "url": job["url"]
        })
    print("FIRST JOB:")
    print(jobs_data[0])
    return transformed_jobs

jobicy_jobs = fetch_jobicy_jobs()
remoteok_jobs = fetch_remoteok_jobs()
wwr_jobs = fetch_weworkremotely_jobs()

jobs = jobicy_jobs + remoteok_jobs + wwr_jobs

if len(jobs) == 0:

    jobs = [
        {
            "company": "OpenAI",
            "role": "AI Engineer Intern",
            "skills": [
                "Python",
                "Machine Learning",
                "Pandas",
                "NumPy",
                "Git"
            ],
            "location": "Remote",
            "level": "Intern",
            "url": "#"
        },
        {
            "company": "Google",
            "role": "Backend Developer",
            "skills": [
                "Python",
                "SQL",
                "Docker",
                "REST APIs",
                "Linux"
            ],
            "location": "Remote",
            "level": "Junior",
            "url": "#"
        },
        {
            "company": "Amazon",
            "role": "Software Engineer",
            "skills": [
                "Java",
                "DSA",
                "System Design",
                "AWS"
            ],
            "location": "Remote",
            "level": "Junior",
            "url": "#"
        }
    ]

print(f"LIVE JOBS LOADED: {len(jobs)}")

user_skills=[]

resume_analysis = {}
roadmap_cache = {}

def get_cached_roadmap():

    if not roadmap_cache:
        return "No roadmap generated yet."

    return list(
        roadmap_cache.values()
    )[0]

def calculate_match(user_skills, job_skills):

    user_lower = [s.lower() for s in user_skills]

    matched = []
    missing = []

    for skill in job_skills:

        if skill.lower() in user_lower:
            matched.append(skill)

        else:
            missing.append(skill)

    score = 0

    if len(job_skills) > 0:
        score = round(
            (len(matched) / len(job_skills)) * 100
        )

    return {
        "score": score,
        "matched": matched,
        "missing": missing
    }



@app.get("/")
def root():
    return {"message": "GhostScout Backend Running"}

@app.get("/jobs")
def get_jobs():

    personalized_jobs = []

    for job in jobs:

        match_data = calculate_match(
            user_skills,
            job["skills"]
        )

        personalized_jobs.append({
            **job,
            "url": job["url"],
            "score": match_data["score"],
            "matchedSkills": match_data["matched"],
            "missingSkills": match_data["missing"],
            "potentialScore": 100,
            "isNew": match_data["score"] >= 70,

            "matchReason":
                f"You already match {len(match_data['matched'])} "
                f"out of {len(job['skills'])} required skills."
        })

    personalized_jobs.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return personalized_jobs

IGNORE_SKILLS = {
    "exec",
    "digital nomad",
    "other",
    "full time",
    "part time",
    "junior",
    "senior",

    "marketing",
    "video",
    "ops",
    "dev",

    "engineer",
    "backend",
    "frontend",
    "front end",
    "web dev",
    "web developer",

    "analyst",
    "data science",
    "microsoft",

    "teaching",
    "education",
    "hr",
    "recruiter",
    "virtual assistant",
    "data entry",
    "sales",
    "finance",
    "legal",
    "travel"
}
@app.get("/skill-gaps")
def get_skill_gaps():

    skill_count = {}

    # Use personalized jobs instead of raw jobs
    personalized_jobs = get_jobs()

    # Consider top 20 most relevant jobs
    top_jobs = personalized_jobs[:20]

    for job in top_jobs:

        for skill in job["missingSkills"]:

            if skill.lower() in IGNORE_SKILLS:
                continue

            skill_count[skill] = (
                skill_count.get(skill, 0) + 1
            )

    sorted_skills = sorted(
        skill_count.items(),
        key=lambda x: x[1],
        reverse=True
    )

    print("TOP SKILL GAPS:")
    print(sorted_skills[:10])

    return [
        {
            "skill": skill,
            "count": count
        }
        for skill, count in sorted_skills[:10]
    ]

@app.get("/filtered-jobs")
def filtered_jobs(target_role: str):

    filtered = []

    keywords = ROLE_KEYWORDS[target_role]

    for job in jobs:

        text = (
            job["role"] + " " +
            job["company"] + " " +
            " ".join(job.get("skills", []))
        ).lower()

        if any(
            keyword in text
            for keyword in keywords
        ):

            job_skills = job.get("skills", [])

            matched_skills = [
                skill
                for skill in job_skills
                if skill.lower() in [
                    user_skill.lower()
                    for user_skill in user_skills
                ]
            ]

            missing_skills = [
                skill
                for skill in job_skills
                if skill.lower() not in [
                    user_skill.lower()
                    for user_skill in user_skills
                ]
            ]

            if len(job_skills) == 0:
                score = 0
            else:
                score = round(
                    (len(matched_skills) / len(job_skills)) * 100
                )

            filtered.append({
                **job,
                "score": score,
                "matchedSkills": matched_skills,
                "missingSkills": missing_skills
            })

    return filtered
@app.get("/roadmap")
def generate_roadmap(target_role: str = "AI Engineer"):

    global roadmap_cache

    # Cache hit
    if target_role in roadmap_cache:

        print(f"ROADMAP CACHE HIT: {target_role}")

        return {
            "roadmap": roadmap_cache[target_role]
        }

    print(f"GENERATING ROADMAP: {target_role}")

    role_gap_data = role_gaps(target_role)

    top_missing = role_gap_data["missing"]

    top_jobs = get_jobs()[:10]

    job_roles = [
        f"{job['company']} - {job['role']}"
        for job in top_jobs
    ]

    prompt = f"""
    Target Career Goal:

    {target_role}

    Current Student Skills:

    {", ".join(user_skills)}

    Top Matching Jobs:

    {chr(10).join(job_roles)}

    Missing Skills:

    {", ".join(top_missing)}

    Create a practical 4-week roadmap.

    IMPORTANT RULES:

    1. Focus ONLY on these missing skills:
    {", ".join(top_missing)}

    2. The roadmap should help the student become job-ready for:
    {target_role}

    3. Do NOT introduce unrelated skills.

    4. Do NOT suggest skills already present in the student's resume.

    5. Every task must directly improve one of the missing skills.

    6. Align learning tasks with the top matching jobs listed above.

    Format:

    Week 1:
    - 3 bullet points

    Week 2:
    - 3 bullet points

    Week 3:
    - 3 bullet points

    Week 4:
    - 3 bullet points

    Keep the response under 250 words.
    No explanations.
    Return roadmap only.
    """

    try:

        response = model.generate_content(prompt)

        roadmap_cache[target_role] = response.text

        return {
            "roadmap": response.text
        }

    except Exception as e:

        print("ROADMAP ERROR:", e)

        fallback_roadmap = f"""
Week 1:
- Study fundamentals related to {target_role}
- Review the top missing skills
- Complete one beginner project

Week 2:
- Practice intermediate concepts
- Strengthen weak skill areas
- Build a portfolio project

Week 3:
- Work on real-world tasks
- Improve problem-solving ability
- Study job requirements

Week 4:
- Refine resume
- Prepare for interviews
- Apply for internships/jobs
"""

        roadmap_cache[target_role] = fallback_roadmap

        return {
            "roadmap": fallback_roadmap
        }
    
@app.get("/role-score")
def role_score(target_role: str):

    required = ROLE_SKILLS.get(
        target_role,
        []
    )

    matched = 0

    for skill in required:

        if skill.lower() in [
            s.lower()
            for s in user_skills
        ]:
            matched += 1

    score = int(
        matched / len(required) * 100
    ) if required else 0

    return {
        "score": score
    }

@app.get("/market-score")
def market_score():

    jobs_data = get_jobs()

    if len(jobs_data) == 0:
        return {
            "score": 0
        }

    top_jobs = jobs_data[:10]

    average_score = sum(
        job["score"]
        for job in top_jobs
    ) / len(top_jobs)

    return {
        "score": round(average_score)
    }

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):

    print("UPLOAD RECEIVED")

    contents = await file.read()

    pdf = fitz.open(stream=contents, filetype="pdf")

    extracted_text = ""

    for page in pdf:
        extracted_text += page.get_text()

    print("TEXT EXTRACTED")

    prompt = f"""
    Analyze this resume and return ONLY valid JSON.

    Format:

    {{
        "skills": [],
        "summary": "",
        "strengths": [],
        "improvements": []
    }}

    Resume:
    {extracted_text}
    """

    print("SENDING TO GEMINI")

    try:
        response = model.generate_content(prompt)

        cleaned = (
            response.text
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

        parsed = json.loads(cleaned)

    except Exception as e:

        print("RESUME ANALYSIS ERROR:", e)

        parsed = {
            "skills": [],
            "summary": "Resume analysis unavailable. Gemini quota exceeded.",
            "strengths": [],
            "improvements": []
        }
    
    global user_skills
    global resume_analysis

    user_skills = parsed["skills"]
    resume_analysis = parsed
    global roadmap_cache
    roadmap_cache.clear()

    return parsed

@app.get("/role-gaps")
def role_gaps(target_role: str):

    required = ROLE_SKILLS.get(
        target_role,
        []
    )

    missing = []

    for skill in required:

        if skill.lower() not in [
            s.lower()
            for s in user_skills
        ]:
            missing.append(skill)

    return {
        "role": target_role,
        "missing": missing
    }

@app.get("/learning-resources")
def learning_resources():

    gaps = get_skill_gaps()

    resources = []

    resource_map = {
        "python": "https://www.learnpython.org/",
        "machine learning": "https://www.coursera.org/learn/machine-learning",
        "pandas": "https://pandas.pydata.org/docs/getting_started/index.html",
        "numpy": "https://numpy.org/learn/",
        "sql": "https://sqlbolt.com/",
        "docker": "https://docs.docker.com/get-started/",
        "linux": "https://linuxjourney.com/",
        "golang": "https://go.dev/learn/",
        "aws": "https://skillbuilder.aws/",
        "react": "https://react.dev/learn"
    }

    for gap in gaps[:5]:

        skill = gap["skill"]

        resources.append({
            "skill": skill,
            "resource": resource_map.get(
                skill.lower(),
                "https://roadmap.sh"
            )
        })

    return resources

@app.get("/download-report")
def download_report():

    pdf_path = "career_report.pdf"

    doc = SimpleDocTemplate(pdf_path)

    styles = getSampleStyleSheet()

    content = []

    # Title
    content.append(
        Paragraph(
            "GhostScout Career Report",
            styles["Title"]
        )
    )

    content.append(Spacer(1, 20))

    # Summary
    content.append(
        Paragraph(
            "Career Summary",
            styles["Heading2"]
        )
    )

    content.append(
        Paragraph(
            resume_analysis.get(
                "summary",
                "No summary available."
            ),
            styles["BodyText"]
        )
    )

    content.append(Spacer(1, 12))

    # Skills
    content.append(
        Paragraph(
            "Top Skills",
            styles["Heading2"]
        )
    )

    skills_text = "<br/>".join(
        [
            f"• {skill}"
            for skill in resume_analysis.get(
                "skills",
                []
            )
        ]
    )

    content.append(
        Paragraph(
            skills_text,
            styles["BodyText"]
        )
    )

    content.append(Spacer(1, 12))

    # Strengths
    content.append(
        Paragraph(
            "Strengths",
            styles["Heading2"]
        )
    )

    strengths_text = "<br/>".join(
        [
            f"• {item}"
            for item in resume_analysis.get(
                "strengths",
                []
            )
        ]
    )

    content.append(
        Paragraph(
            strengths_text,
            styles["BodyText"]
        )
    )

    content.append(Spacer(1, 12))

    # Improvements
    content.append(
        Paragraph(
            "Areas For Improvement",
            styles["Heading2"]
        )
    )

    improvements_text = "<br/>".join(
        [
            f"• {item}"
            for item in resume_analysis.get(
                "improvements",
                []
            )
        ]
    )

    content.append(
        Paragraph(
            improvements_text,
            styles["BodyText"]
        )
    )

    content.append(Spacer(1, 12))

    resources = learning_resources()
    content.append(
        Spacer(1, 15)
    )

    content.append(
        Paragraph(
            "Learning Resources",
            styles["Heading2"]
        )
    )

    resource_text = "<br/>".join([
        f"• {item['skill']} : {item['resource']}"
        for item in resources
    ])

    content.append(
        Paragraph(
            resource_text,
            styles["BodyText"]
        )
    )

    # Market Score
    score = market_score()["score"]

    content.append(
        Paragraph(
            f"Market Readiness Score: {score}%",
            styles["Heading2"]
        )
    )

    content.append(Spacer(1, 12))

    # Best Match
    top_job = get_jobs()[0] if get_jobs() else None

    if top_job:

        content.append(
            Paragraph(
                "Best Match",
                styles["Heading2"]
            )
        )

        content.append(
            Paragraph(
                f"{top_job['company']} ({top_job['score']}%)",
                styles["BodyText"]
            )
        )

    content.append(Spacer(1, 12))

    # Skill Gaps
    gaps = get_skill_gaps()

    content.append(
        Paragraph(
            "Top Skill Gaps",
            styles["Heading2"]
        )
    )

    gap_text = "<br/>".join(
        [
            f"• {item['skill']}"
            for item in gaps[:5]
        ]
    )

    content.append(
        Paragraph(
            gap_text,
            styles["BodyText"]
        )
    )

    roadmap = get_cached_roadmap()
    content.append(
        Spacer(1, 15)
    )

    content.append(
        Paragraph(
            "AI Career Roadmap",
            styles["Heading2"]
        )
    )

    content.append(
        Paragraph(
            roadmap.replace("\n", "<br/>"),
            styles["BodyText"]
        )
    )

    doc.build(content)

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="GhostScout_Report.pdf"
    )

@app.post("/refresh-jobs")
def refresh_jobs():

    global jobs

    print("REFRESHING JOBS...")

    jobicy_jobs = fetch_jobicy_jobs()
    remoteok_jobs = fetch_remoteok_jobs()
    wwr_jobs = fetch_weworkremotely_jobs()

    jobs = (
        jobicy_jobs +
        remoteok_jobs +
        wwr_jobs
    )

    print(f"LIVE JOBS LOADED: {len(jobs)}")

    return {
        "jobs_loaded": len(jobs)
    }

@app.get("/career-insights")
def get_career_insights():

    jobs_data = get_jobs()

    best_job = jobs_data[0] if jobs_data else None

    gaps = get_skill_gaps()

    return {
        "market_score": market_score()["score"],
        "best_match_company":
            best_job["company"] if best_job else "N/A",

        "best_match_role":
            best_job["role"] if best_job else "N/A",

        "top_skill_gap":
            gaps[0]["skill"] if gaps else "N/A",

        "jobs_analyzed":
            len(jobs_data)
    }