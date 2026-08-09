from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File
)

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import sqlite3
import hashlib
import os
import uuid

from ats import ats_analysis
from ai import generate_career_guidance, generate_mentor_response


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="VidyaGuide AI",
    description="AI-powered Career and Resume Mentor",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://vidhyaguide-ai-resume-mentor-frontend.onrender.com"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# =========================================================
# DATABASE
# =========================================================

DATABASE = "vidhya.db"


def get_db():

    connection = sqlite3.connect(
        DATABASE
    )

    connection.row_factory = sqlite3.Row

    return connection


# =========================================================
# PASSWORD HASH
# =========================================================

def hash_password(password):

    return hashlib.sha256(
        password.encode("utf-8")
    ).hexdigest()


# =========================================================
# DATABASE INITIALIZATION
# =========================================================

def init_db():

    db = get_db()

    # -----------------------------------------------------
    # CREATE USERS TABLE
    # -----------------------------------------------------

    db.execute(
        """
        CREATE TABLE IF NOT EXISTS users (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            email TEXT UNIQUE NOT NULL,

            password TEXT NOT NULL

        )
        """
    )

    # -----------------------------------------------------
    # CREATE DEMO ACCOUNT
    # -----------------------------------------------------

    demo_email = "demo@vidhyaguide.ai"

    existing_demo = db.execute(
        """
        SELECT id
        FROM users
        WHERE email = ?
        """,
        (demo_email,)
    ).fetchone()

    if not existing_demo:

        demo_password = hash_password(
            "demo123"
        )

        db.execute(
            """
            INSERT INTO users
            (
                name,
                email,
                password
            )
            VALUES (?, ?, ?)
            """,
            (
                "Demo User",
                demo_email,
                demo_password
            )
        )

    db.commit()

    db.close()


# Initialize database
init_db()


# =========================================================
# UPLOAD DIRECTORY
# =========================================================

UPLOAD_FOLDER = "uploads"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


# =========================================================
# REQUEST MODELS
# =========================================================

class LoginRequest(BaseModel):

    email: str

    password: str


class SignupRequest(BaseModel):

    name: str

    email: str

    password: str


class MentorRequest(BaseModel):

    message: str


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {

        "message":
        "VidyaGuide AI Backend is running!",

        "status":
        "success"

    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():

    return {

        "status":
        "healthy"

    }


# =========================================================
# SIGNUP
# =========================================================

@app.post("/signup")
def signup(
    data: SignupRequest
):

    name = data.name.strip()

    email = data.email.strip().lower()

    password = data.password


    # -----------------------------------------------------
    # VALIDATION
    # -----------------------------------------------------

    if not name:

        raise HTTPException(
            status_code=400,
            detail="Name is required"
        )


    if not email:

        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )


    if len(password) < 6:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters"
        )


    # -----------------------------------------------------
    # DATABASE
    # -----------------------------------------------------

    db = get_db()


    existing_user = db.execute(
        """
        SELECT id
        FROM users
        WHERE email = ?
        """,
        (email,)
    ).fetchone()


    if existing_user:

        db.close()

        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists"
        )


    # -----------------------------------------------------
    # HASH PASSWORD
    # -----------------------------------------------------

    hashed_password = hash_password(
        password
    )


    # -----------------------------------------------------
    # INSERT USER
    # -----------------------------------------------------

    db.execute(
        """
        INSERT INTO users
        (
            name,
            email,
            password
        )
        VALUES (?, ?, ?)
        """,
        (
            name,
            email,
            hashed_password
        )
    )


    db.commit()


    # -----------------------------------------------------
    # GET CREATED USER
    # -----------------------------------------------------

    user = db.execute(
        """
        SELECT id, name, email
        FROM users
        WHERE email = ?
        """,
        (email,)
    ).fetchone()


    db.close()


    return {

        "success":
        True,

        "message":
        "Account created successfully",

        "user": {

            "id":
            user["id"],

            "name":
            user["name"],

            "email":
            user["email"]

        }

    }


# =========================================================
# LOGIN
# =========================================================

@app.post("/login")
def login(
    data: LoginRequest
):

    email = data.email.strip().lower()

    password = data.password


    # -----------------------------------------------------
    # HASH PASSWORD
    # -----------------------------------------------------

    hashed_password = hash_password(
        password
    )


    # -----------------------------------------------------
    # DATABASE
    # -----------------------------------------------------

    db = get_db()


    user = db.execute(
        """
        SELECT id, name, email
        FROM users
        WHERE email = ?
        AND password = ?
        """,
        (
            email,
            hashed_password
        )
    ).fetchone()


    db.close()


    # -----------------------------------------------------
    # INVALID LOGIN
    # -----------------------------------------------------

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )


    # -----------------------------------------------------
    # SUCCESS
    # -----------------------------------------------------

    return {

        "success":
        True,

        "message":
        "Login successful",

        "user": {

            "id":
            user["id"],

            "name":
            user["name"],

            "email":
            user["email"]

        }

    }


# =========================================================
# GET USER
# =========================================================

@app.get("/users/{user_id}")
def get_user(
    user_id: int
):

    db = get_db()


    user = db.execute(
        """
        SELECT id, name, email
        FROM users
        WHERE id = ?
        """,
        (user_id,)
    ).fetchone()


    db.close()


    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )


    return {

        "success":
        True,

        "user": {

            "id":
            user["id"],

            "name":
            user["name"],

            "email":
            user["email"]

        }

    }


# =========================================================
# RESUME UPLOAD + ATS + GEMINI AI
# =========================================================

@app.post("/analyze-resume")
async def analyze_resume(
    resume: UploadFile = File(...)
):

    # -----------------------------------------------------
    # CHECK FILE
    # -----------------------------------------------------

    if not resume.filename:

        raise HTTPException(
            status_code=400,
            detail="No resume selected"
        )


    filename = resume.filename.lower()


    if not filename.endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are supported"
        )


    # -----------------------------------------------------
    # UNIQUE FILE NAME
    # -----------------------------------------------------

    unique_name = (
        str(uuid.uuid4())
        + ".pdf"
    )


    file_path = os.path.join(
        UPLOAD_FOLDER,
        unique_name
    )


    # -----------------------------------------------------
    # SAVE FILE
    # -----------------------------------------------------

    try:

        file_content = await resume.read()


        if not file_content:

            raise HTTPException(
                status_code=400,
                detail="The uploaded resume is empty"
            )


        with open(
            file_path,
            "wb"
        ) as file:

            file.write(
                file_content
            )


    except HTTPException:

        raise


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Unable to save resume: {error}"
        )


    # -----------------------------------------------------
    # ATS ANALYSIS
    # -----------------------------------------------------

    try:

        result = ats_analysis(
            file_path
        )


    except Exception as error:

        if os.path.exists(file_path):

            os.remove(file_path)


        raise HTTPException(
            status_code=400,
            detail=f"ATS analysis failed: {error}"
        )


    # -----------------------------------------------------
    # EXTRACT RESUME TEXT
    # -----------------------------------------------------

    resume_text = result.get(
        "extracted_text",
        ""
    )


    # -----------------------------------------------------
    # GEMINI AI ANALYSIS
    # -----------------------------------------------------

    ai_analysis = None


    if resume_text:

        try:

            ai_analysis = generate_career_guidance(
                resume_text
            )


        except Exception as error:

            ai_analysis = (
                "AI analysis unavailable: "
                + str(error)
            )


    else:

        ai_analysis = (
            "AI analysis unavailable because "
            "resume text could not be extracted."
        )


    # -----------------------------------------------------
    # REMOVE LARGE TEXT
    # -----------------------------------------------------

    result.pop(
        "extracted_text",
        None
    )


    # -----------------------------------------------------
    # FINAL RESPONSE
    # -----------------------------------------------------

    return {

        "success":
        True,

        "filename":
        resume.filename,

        "analysis":
        result,

        "ai_analysis":
        ai_analysis

    }


# =========================================================
# API STATUS
# =========================================================

@app.get("/api/status")
def api_status():

    return {

        "application":
        "VidyaGuide AI",

        "backend":
        "FastAPI",

        "ats":
        "available",

        "ai":
        "available",

        "database":
        "SQLite",

        "status":
        "running"

    }


# =========================================================
# VIDYA AI MENTOR
# =========================================================

@app.post("/mentor")
def mentor(
    data: MentorRequest
):

    message = data.message.strip()


    # -----------------------------------------------------
    # VALIDATION
    # -----------------------------------------------------

    if not message:

        raise HTTPException(
            status_code=400,
            detail="Message is required"
        )


    # -----------------------------------------------------
    # GEMINI RESPONSE
    # -----------------------------------------------------

    try:

        response = generate_mentor_response(
            message
        )


        return {

            "success":
            True,

            "response":
            response

        }


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"AI mentor error: {error}"
        )