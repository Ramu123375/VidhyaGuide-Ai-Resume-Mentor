import re
from PyPDF2 import PdfReader


# =========================================
# REQUIRED RESUME SECTIONS
# =========================================

REQUIRED_SECTIONS = {
    "summary": [
        "summary",
        "profile",
        "objective",
        "about me"
    ],

    "skills": [
        "skills",
        "technical skills",
        "core skills"
    ],

    "experience": [
        "experience",
        "work experience",
        "professional experience",
        "employment"
    ],

    "education": [
        "education",
        "academic",
        "qualification"
    ],

    "projects": [
        "projects",
        "project",
        "academic projects"
    ],

    "certifications": [
        "certifications",
        "certificates",
        "certification"
    ]
}


# =========================================
# IMPORTANT KEYWORDS
# =========================================

TECH_KEYWORDS = [

    "python",
    "java",
    "javascript",
    "typescript",
    "c",
    "c++",
    "html",
    "css",
    "react",
    "react.js",
    "angular",
    "vue",
    "node",
    "node.js",
    "express",
    "flask",
    "fastapi",
    "django",
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "sqlite",
    "git",
    "github",
    "rest api",
    "api",
    "docker",
    "aws",
    "azure",
    "machine learning",
    "artificial intelligence",
    "ai",
    "data structures",
    "algorithms",
    "oops",
    "object oriented"
]


# =========================================
# EXTRACT PDF TEXT
# =========================================

def extract_text_from_pdf(pdf_path):

    text = ""

    try:

        reader = PdfReader(pdf_path)

        for page in reader.pages:

            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

    except Exception as error:

        raise Exception(
            f"Unable to read PDF: {str(error)}"
        )

    return text


# =========================================
# CLEAN TEXT
# =========================================

def clean_text(text):

    text = text.lower()

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


# =========================================
# FIND SECTIONS
# =========================================

def find_sections(text):

    text_lower = clean_text(text)

    found = []
    missing = []

    for section, keywords in REQUIRED_SECTIONS.items():

        section_found = False

        for keyword in keywords:

            if keyword in text_lower:

                section_found = True
                break

        if section_found:

            found.append(section)

        else:

            missing.append(section)

    return found, missing


# =========================================
# FIND TECH KEYWORDS
# =========================================

def find_keywords(text):

    text_lower = clean_text(text)

    found_keywords = []

    for keyword in TECH_KEYWORDS:

        if keyword.lower() in text_lower:

            found_keywords.append(keyword)

    return sorted(
        list(set(found_keywords))
    )


# =========================================
# COUNT ACTION WORDS
# =========================================

def check_action_words(text):

    action_words = [

        "developed",
        "built",
        "created",
        "designed",
        "implemented",
        "developed",
        "managed",
        "optimized",
        "improved",
        "automated",
        "integrated",
        "analyzed",
        "tested",
        "deployed",
        "maintained"

    ]

    text_lower = clean_text(text)

    found = []

    for word in action_words:

        if word in text_lower:

            found.append(word)

    return found


# =========================================
# ATS SCORE
# =========================================

def calculate_ats_score(text):

    score = 0

    found_sections, missing_sections = find_sections(text)

    keywords = find_keywords(text)

    action_words = check_action_words(text)


    # -------------------------------------
    # SECTION SCORE
    # -------------------------------------

    section_score = (
        len(found_sections) /
        len(REQUIRED_SECTIONS)
    ) * 40

    score += section_score


    # -------------------------------------
    # KEYWORD SCORE
    # -------------------------------------

    keyword_score = min(
        len(keywords) * 2,
        30
    )

    score += keyword_score


    # -------------------------------------
    # ACTION WORD SCORE
    # -------------------------------------

    action_score = min(
        len(action_words) * 1.5,
        15
    )

    score += action_score


    # -------------------------------------
    # RESUME LENGTH / CONTENT
    # -------------------------------------

    word_count = len(
        text.split()
    )

    if word_count >= 300:

        score += 10

    elif word_count >= 150:

        score += 5


    # -------------------------------------
    # FINAL SCORE
    # -------------------------------------

    score = round(
        min(max(score, 0), 100)
    )


    # -------------------------------------
    # SUGGESTIONS
    # -------------------------------------

    suggestions = []


    if missing_sections:

        suggestions.append(
            "Add the missing resume sections: "
            + ", ".join(missing_sections)
        )


    if len(keywords) < 8:

        suggestions.append(
            "Add more relevant technical keywords "
            "based on the job description."
        )


    if len(action_words) < 5:

        suggestions.append(
            "Use stronger action words such as "
            "developed, implemented, designed, "
            "optimized and deployed."
        )


    if word_count < 150:

        suggestions.append(
            "Your resume contains very little content. "
            "Add more relevant projects, achievements "
            "and technical experience."
        )


    if not suggestions:

        suggestions.append(
            "Your resume has a good overall structure. "
            "Customize keywords for each job description "
            "to improve ATS compatibility."
        )


    return {

        "score": score,

        "found_sections": found_sections,

        "missing_sections": missing_sections,

        "keywords": keywords,

        "action_words": action_words,

        "word_count": word_count,

        "suggestions": suggestions

    }


# =========================================
# COMPLETE ATS ANALYSIS
# =========================================

def ats_analysis(pdf_path):

    text = extract_text_from_pdf(
        pdf_path
    )

    if not text.strip():

        raise Exception(
            "Could not extract text from this PDF. "
            "Please upload a text-based PDF."
        )

    result = calculate_ats_score(
        text
    )

    result["extracted_text"] = text

    return result