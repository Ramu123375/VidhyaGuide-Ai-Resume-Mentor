import { useEffect, useState } from "react";

// ======================================================
// API CONFIGURATION
// ======================================================

const API_URL = "http://127.0.0.1:8000";


// ======================================================
// DASHBOARD
// ======================================================

function Dashboard({ onOpenMentor }) {

  // ----------------------------------------------------
  // USER
  // ----------------------------------------------------

  const [user, setUser] = useState(null);


  // ----------------------------------------------------
  // RESUME
  // ----------------------------------------------------

  const [selectedFile, setSelectedFile] = useState(null);


  // ----------------------------------------------------
  // ANALYSIS
  // ----------------------------------------------------

  const [analysis, setAnalysis] = useState(null);


  // ----------------------------------------------------
  // AI CAREER ANALYSIS
  // ----------------------------------------------------

  const [aiAnalysis, setAiAnalysis] = useState("");


  // ----------------------------------------------------
  // UI STATES
  // ----------------------------------------------------

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");


  // ====================================================
  // LOAD SAVED DATA
  // ====================================================

  useEffect(() => {

    const savedUser =
      localStorage.getItem("vidya_user");

    const savedAnalysis =
      localStorage.getItem(
        "vidya_resume_analysis"
      );

    const savedAI =
      localStorage.getItem(
        "vidya_ai_analysis"
      );


    // USER
    if (savedUser) {

      try {

        setUser(
          JSON.parse(savedUser)
        );

      } catch {

        console.log(
          "Unable to load saved user"
        );

      }

    }


    // ATS ANALYSIS
    if (savedAnalysis) {

      try {

        setAnalysis(
          JSON.parse(savedAnalysis)
        );

      } catch {

        console.log(
          "Unable to load saved resume analysis"
        );

      }

    }


    // AI ANALYSIS
    if (savedAI) {

      setAiAnalysis(
        savedAI
      );

    }

  }, []);


  // ====================================================
  // LOGOUT
  // ====================================================

  const logout = () => {

    localStorage.removeItem(
      "vidya_user"
    );

    localStorage.removeItem(
      "vidya_resume_analysis"
    );

    localStorage.removeItem(
      "vidya_ai_analysis"
    );

    window.location.href = "/";

  };


  // ====================================================
  // FILE SELECT
  // ====================================================

  const handleFileChange = (event) => {

    const file =
      event.target.files[0];

    setError("");

    setSelectedFile(
      file || null
    );

  };


  // ====================================================
  // NORMALIZE AI RESPONSE
  // ====================================================

  const normalizeAIResponse = (value) => {

    if (!value) {
      return "";
    }


    // Already string
    if (typeof value === "string") {

      return value;

    }


    // Object / JSON response
    if (typeof value === "object") {

      // Some AI responses may contain
      // a "content" field
      if (
        typeof value.content === "string"
      ) {

        return value.content;

      }


      // Otherwise convert object
      // into readable JSON
      return JSON.stringify(
        value,
        null,
        2
      );

    }


    return String(value);

  };


  // ====================================================
  // ANALYZE RESUME
  // ====================================================

  const analyzeResume = async () => {

    // --------------------------------------------------
    // CHECK FILE
    // --------------------------------------------------

    if (!selectedFile) {

      setError(
        "Please select a PDF resume first."
      );

      return;

    }


    // --------------------------------------------------
    // CHECK PDF
    // --------------------------------------------------

    if (
      selectedFile.type !==
      "application/pdf"
    ) {

      setError(
        "Please upload a PDF file only."
      );

      return;

    }


    // --------------------------------------------------
    // START LOADING
    // --------------------------------------------------

    setUploading(true);

    setError("");


    try {

      // ------------------------------------------------
      // FORM DATA
      // ------------------------------------------------

      const formData =
        new FormData();

      formData.append(
        "resume",
        selectedFile
      );


      // ------------------------------------------------
      // SEND TO FASTAPI
      // ------------------------------------------------

      const response =
        await fetch(
          `${API_URL}/analyze-resume`,
          {
            method: "POST",
            body: formData
          }
        );


      // ------------------------------------------------
      // READ RESPONSE
      // ------------------------------------------------

      const data =
        await response.json();


      // ------------------------------------------------
      // ERROR
      // ------------------------------------------------

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Resume analysis failed"
        );

      }


      // =================================================
      // ATS RESULT
      // =================================================

      setAnalysis(
        data.analysis || null
      );


      // =================================================
      // IMPORTANT:
      //
      // BACKEND RETURNS:
      //
      // career_guidance
      //
      // NOT:
      //
      // ai_analysis
      // =================================================

      const careerGuidance =
        normalizeAIResponse(
          data.career_guidance
        );


      setAiAnalysis(
        careerGuidance
      );


      // =================================================
      // SAVE ATS RESULT
      // =================================================

      localStorage.setItem(
        "vidya_resume_analysis",
        JSON.stringify(
          data.analysis || {}
        )
      );


      // =================================================
      // SAVE AI RESULT
      // =================================================

      localStorage.setItem(
        "vidya_ai_analysis",
        careerGuidance
      );


      // ------------------------------------------------
      // SUCCESS
      // ------------------------------------------------

      console.log(
        "Resume analysis completed successfully."
      );

      console.log(
        "ATS Analysis:",
        data.analysis
      );

      console.log(
        "AI Career Guidance:",
        careerGuidance
      );


    } catch (error) {

      console.error(
        "Resume analysis error:",
        error
      );


      setError(
        error.message ||
        "Unable to analyze resume."
      );


    } finally {

      setUploading(false);

    }

  };


  // ====================================================
  // AI SECTION PARSER
  // ====================================================

  const getAISection = (title) => {

    if (!aiAnalysis) {

      return "";

    }


    // -----------------------------------------------
    // Escape special regex characters
    // -----------------------------------------------

    const escapedTitle =
      title.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );


    // -----------------------------------------------
    // All possible AI sections
    // -----------------------------------------------

    const nextSections =
      "SUMMARY|MISTAKES|IMPROVEMENTS|SKILLS|RECOMMENDED_ROLES|CAREER_GUIDANCE|ROADMAP|PLACEMENT_TIPS";


    // -----------------------------------------------
    // Match section
    // -----------------------------------------------

    const regex =
      new RegExp(
        `${escapedTitle}\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:${nextSections})\\s*:?|$)`,
        "i"
      );


    const match =
      aiAnalysis.match(
        regex
      );


    if (!match) {

      return "";

    }


    return match[1]
      .trim()
      .replace(
        /^[:\-]\s*/,
        ""
      );

  };


  // ====================================================
  // AI LIST PARSER
  // ====================================================

  const getAIList = (title) => {

    const section =
      getAISection(title);


    if (!section) {

      return [];

    }


    return section
      .split("\n")
      .map(
        (item) =>
          item
            .replace(
             (/^[-•*]\s*/,
              "")
            )
            .replace(
              /^\d+[.)]\s*/,
              ""
            )
            .trim()
      )
      .filter(Boolean);

  };


  // ====================================================
  // DISPLAY RAW AI RESPONSE
  // ====================================================

  const hasStructuredAI =
    getAISection("SUMMARY") ||
    getAISection("MISTAKES") ||
    getAISection("IMPROVEMENTS") ||
    getAISection("SKILLS") ||
    getAISection("RECOMMENDED_ROLES");


  // ====================================================
  // RENDER
  // ====================================================

  return (

    <div className="dashboard-page">


      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="dashboard-nav">


        <div className="dashboard-logo">
          VG
        </div>


        <div className="dashboard-brand">

          VidyaGuide <span>AI</span>

        </div>


        <div className="dashboard-user">

          <span>
            {user?.name || "User"}
          </span>


          <button
            onClick={logout}
          >
            Logout
          </button>

        </div>


      </nav>



      {/* =================================================
          MAIN
      ================================================= */}

      <main className="dashboard-container">


        {/* =================================================
            HERO
        ================================================= */}

        <section className="dashboard-hero">


          <p className="dashboard-eyebrow">
            AI CAREER COMMAND CENTER
          </p>


          <h1>

            Welcome back,{" "}

            <span>
              {user?.name || "there"}
            </span>

          </h1>


          <p>

            Analyze your resume, discover
            your career path and prepare
            for your dream companies.

          </p>


        </section>



        {/* =================================================
            STATS
        ================================================= */}

        <section className="stats-grid">


          {/* RESUME */}

          <div className="stat-card">


            <div className="stat-icon">
              📄
            </div>


            <div>

              <strong>
                Resume
              </strong>


              <p>

                {analysis
                  ? "Analyzed"
                  : "Not analyzed yet"}

              </p>

            </div>


          </div>



          {/* ATS */}

          <div className="stat-card">


            <div className="stat-icon">
              🎯
            </div>


            <div>

              <strong>
                ATS Score
              </strong>


              <p>

                {analysis
                  ? `${analysis.score}/100`
                  : "Waiting for analysis"}

              </p>

            </div>


          </div>



          {/* CAREER */}

          <div className="stat-card">


            <div className="stat-icon">
              🚀
            </div>


            <div>

              <strong>
                Career Path
              </strong>


              <p>

                {aiAnalysis
                  ? "AI generated"
                  : "Waiting for AI"}

              </p>

            </div>


          </div>


        </section>



        {/* =================================================
            RESUME ANALYZER
        ================================================= */}

        <section className="resume-analyzer">


          <div className="section-heading">


            <p className="dashboard-eyebrow">
              STEP 01
            </p>


            <h2>
              Analyze your resume
            </h2>


            <p>

              Upload your PDF resume and
              VidyaGuide AI will analyze your
              ATS compatibility and career profile.

            </p>


          </div>



          <div className="upload-box">


            <div className="upload-icon">
              📄
            </div>


            <h3>
              Upload your resume
            </h3>


            <p>
              PDF files only
            </p>



            <label className="file-select">


              Choose PDF


              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={
                  handleFileChange
                }
              />


            </label>



            {selectedFile && (

              <div className="selected-file">

                ✓ {selectedFile.name}

              </div>

            )}



            {error && (

              <div className="resume-error">

                {error}

              </div>

            )}



            <button
              className="analyze-button"
              onClick={
                analyzeResume
              }
              disabled={
                uploading
              }
            >

              {uploading
                ? "Analyzing with AI..."
                : "Analyze Resume →"}

            </button>


          </div>


        </section>



        {/* =================================================
            ATS RESULT
        ================================================= */}

        {analysis && (

          <section className="ats-result">


            <div className="section-heading">


              <p className="dashboard-eyebrow">
                RESUME INTELLIGENCE
              </p>


              <h2>
                Your ATS analysis
              </h2>


            </div>



            <div className="ats-grid">


              {/* SCORE */}

              <div className="score-card">


                <p>
                  ATS SCORE
                </p>


                <div className="score-number">

                  {analysis.score}

                  <span>
                    /100
                  </span>

                </div>



                <div className="score-bar">


                  <div
                    style={{
                      width:
                        `${analysis.score}%`
                    }}
                  />


                </div>



                <small>


                  {analysis.score >= 80

                    ? "Excellent resume compatibility"

                    : analysis.score >= 60

                      ? "Good, but there is room for improvement"

                      : "Needs improvement"

                  }


                </small>


              </div>



              {/* FOUND SECTIONS */}

              <div className="analysis-card">


                <h3>
                  ✓ Detected sections
                </h3>


                <div className="tag-container">


                  {analysis.found_sections?.map(
                    (section) => (

                      <span
                        className="success-tag"
                        key={section}
                      >
                        {section}
                      </span>

                    )
                  )}


                </div>


              </div>



              {/* MISSING */}

              <div className="analysis-card">


                <h3>
                  ⚠ Missing sections
                </h3>


                {analysis.missing_sections?.length ? (

                  <ul>

                    {analysis.missing_sections.map(
                      (section) => (

                        <li key={section}>
                          {section}
                        </li>

                      )
                    )}

                  </ul>

                ) : (

                  <p>
                    No major sections are missing.
                  </p>

                )}


              </div>



              {/* SKILLS */}

              <div className="analysis-card">


                <h3>
                  💻 Detected skills
                </h3>


                <div className="tag-container">


                  {analysis.keywords?.map(
                    (keyword) => (

                      <span
                        className="skill-tag"
                        key={keyword}
                      >

                        {keyword}

                      </span>

                    )
                  )}


                </div>


              </div>


            </div>



            {/* ATS SUGGESTIONS */}

            <div className="suggestions-card">


              <h3>
                💡 ATS improvement suggestions
              </h3>


              <ul>


                {analysis.suggestions?.map(
                  (suggestion, index) => (

                    <li key={index}>
                      {suggestion}
                    </li>

                  )
                )}


              </ul>


            </div>


          </section>

        )}



        {/* =================================================
            GEMINI AI CAREER INTELLIGENCE
        ================================================= */}

        {aiAnalysis && (

          <section className="ai-career-section">


            <div className="section-heading">


              <p className="dashboard-eyebrow">
                GEMINI CAREER INTELLIGENCE
              </p>


              <h2>
                Your AI career analysis
              </h2>


              <p>

                VidyaGuide AI analyzed your resume
                and generated personalized career guidance.

              </p>


            </div>



            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="ai-summary-card">


              <div className="ai-card-icon">
                ✨
              </div>


              <div>


                <h3>
                  AI Profile Summary
                </h3>


                <p>


                  {getAISection(
                    "SUMMARY"
                  ) || (

                    !hasStructuredAI
                      ? aiAnalysis
                      : "AI summary generated from your resume."

                  )}


                </p>


              </div>


            </div>



            {/* =================================================
                AI RESULT GRID
            ================================================= */}

            <div className="ai-result-grid">


              {/* MISTAKES */}

              <div className="ai-result-card">


                <div className="ai-result-header">

                  <span>
                    ⚠️
                  </span>

                  <h3>
                    Resume Mistakes
                  </h3>

                </div>


                {getAIList(
                  "MISTAKES"
                ).length > 0 ? (

                  <ul>

                    {getAIList(
                      "MISTAKES"
                    ).map(
                      (item, index) => (

                        <li key={index}>
                          {item}
                        </li>

                      )
                    )}

                  </ul>

                ) : (

                  <p>
                    AI will identify resume mistakes here.
                  </p>

                )}


              </div>



              {/* IMPROVEMENTS */}

              <div className="ai-result-card">


                <div className="ai-result-header">

                  <span>
                    💡
                  </span>

                  <h3>
                    Improvements
                  </h3>

                </div>


                {getAIList(
                  "IMPROVEMENTS"
                ).length > 0 ? (

                  <ul>

                    {getAIList(
                      "IMPROVEMENTS"
                    ).map(
                      (item, index) => (

                        <li key={index}>
                          {item}
                        </li>

                      )
                    )}

                  </ul>

                ) : (

                  <p>
                    AI improvement suggestions will appear here.
                  </p>

                )}


              </div>



              {/* SKILLS */}

              <div className="ai-result-card">


                <div className="ai-result-header">

                  <span>
                    🧠
                  </span>

                  <h3>
                    Skills Detected by AI
                  </h3>

                </div>


                {getAIList(
                  "SKILLS"
                ).length > 0 ? (

                  <ul>

                    {getAIList(
                      "SKILLS"
                    ).map(
                      (item, index) => (

                        <li key={index}>
                          {item}
                        </li>

                      )
                    )}

                  </ul>

                ) : (

                  <p>
                    AI detected skills will appear here.
                  </p>

                )}


              </div>



              {/* ROLES */}

              <div className="ai-result-card ai-highlight">


                <div className="ai-result-header">

                  <span>
                    🎯
                  </span>

                  <h3>
                    Recommended Roles
                  </h3>

                </div>


                {getAIList(
                  "RECOMMENDED_ROLES"
                ).length > 0 ? (

                  <ul>

                    {getAIList(
                      "RECOMMENDED_ROLES"
                    ).map(
                      (item, index) => (

                        <li key={index}>
                          {item}
                        </li>

                      )
                    )}

                  </ul>

                ) : (

                  <p>
                    Recommended career roles will appear here.
                  </p>

                )}


              </div>



              {/* CAREER GUIDANCE */}

              <div className="ai-result-card">


                <div className="ai-result-header">

                  <span>
                    🚀
                  </span>

                  <h3>
                    Career Guidance
                  </h3>

                </div>


                <p>


                  {getAISection(
                    "CAREER_GUIDANCE"
                  ) ||

                    "Personalized career guidance will appear here."

                  }


                </p>


              </div>



              {/* PLACEMENT */}

              <div className="ai-result-card">


                <div className="ai-result-header">

                  <span>
                    💼
                  </span>

                  <h3>
                    Placement Preparation
                  </h3>

                </div>


                {getAIList(
                  "PLACEMENT_TIPS"
                ).length > 0 ? (

                  <ul>

                    {getAIList(
                      "PLACEMENT_TIPS"
                    ).map(
                      (item, index) => (

                        <li key={index}>
                          {item}
                        </li>

                      )
                    )}

                  </ul>

                ) : (

                  <p>
                    Placement preparation tips will appear here.
                  </p>

                )}


              </div>


            </div>



            {/* =================================================
                ROADMAP
            ================================================= */}

            <div className="roadmap-card">


              <div className="ai-result-header">

                <span>
                  🗺️
                </span>

                <h3>
                  Personalized Career Roadmap
                </h3>

              </div>


              <div className="roadmap-content">


                {getAIList(
                  "ROADMAP"
                ).length > 0 ? (

                  getAIList(
                    "ROADMAP"
                  ).map(
                    (item, index) => (

                      <div
                        className="roadmap-step"
                        key={index}
                      >


                        <div className="roadmap-number">
                          {index + 1}
                        </div>


                        <p>
                          {item}
                        </p>


                      </div>

                    )
                  )

                ) : (

                  <p>
                    Your personalized career roadmap will appear here.
                  </p>

                )}


              </div>


            </div>


          </section>

        )}



        {/* =================================================
            NEXT FEATURES
        ================================================= */}

        <section className="dashboard-section">


          <div className="section-heading">


            <p className="dashboard-eyebrow">
              NEXT
            </p>


            <h2>
              Your AI career toolkit
            </h2>


          </div>



          <div className="feature-grid">


            {/* COMPANY */}

            <div className="dashboard-card">


              <div className="card-top">


                <div className="big-icon">
                  🏢
                </div>


                <span className="coming-badge">
                  PLACEMENTS
                </span>


              </div>


              <h3>
                Company Intelligence
              </h3>


              <p>

                Explore companies, job roles,
                required skills and placement
                preparation.

              </p>


              <button
                className="secondary-card-button"
                 onClick={onOpenMentor}
              >
                Mentor →
              </button>


            </div>



            {/* AI MENTOR */}

            <div className="dashboard-card ai-card">


              <div className="card-top">


                <div className="big-icon">
                  ✨
                </div>


                <span className="coming-badge">
                  AI AGENT
                </span>


              </div>


              <h3>
                Vidya AI Mentor
              </h3>


              <p>

                Ask questions about careers,
                interviews, skills and placements.

              </p>


              <button
                className="primary-card-button"
                onClick={onOpenMentor}
              >
                Open Mentor→
              </button>


            </div>


          </div>


        </section>


      </main>


    </div>

  );

}


// ======================================================
// EXPORT
// ======================================================

export default Dashboard;