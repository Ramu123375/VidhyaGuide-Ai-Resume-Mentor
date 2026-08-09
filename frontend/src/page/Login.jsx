import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function Login() {

  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {

      const endpoint = isSignup
        ? `${API_URL}/signup`
        : `${API_URL}/login`;


      const body = isSignup
        ? {
            name,
            email,
            password
          }
        : {
            email,
            password
          };


      const response = await fetch(endpoint, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(body)

      });


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail || "Something went wrong"
        );

      }


      if (isSignup) {

        setSuccess(
          "Account created successfully. You can now sign in."
        );

        setIsSignup(false);

        setName("");
        setPassword("");

      } else {

        localStorage.setItem(
            "vidya_user",
            JSON.stringify(data.user)
        );
        setSuccess("Login successful!");
        setTimeout(() => {
            window.location.reload();
        }, 500);
        /*
          Dashboard connection will be added next.
        */

      }

    } catch (error) {

      setError(
        error.message ||
        "Unable to connect to server"
      );

    } finally {

      setLoading(false);

    }

  };


  const switchMode = () => {

    setIsSignup(!isSignup);

    setError("");
    setSuccess("");

  };


  return (

    <div className="login-page">

      {/* =================================
          LEFT BRANDING
      ================================= */}

      <section className="login-brand">

        <div className="brand-logo">
          VG
        </div>


        <div className="brand-content">

          <p className="eyebrow">
            AI CAREER PLATFORM
          </p>


          <h1>
            Build your career
            <span> with intelligence.</span>
          </h1>


          <p className="brand-description">

            Analyze your resume, discover the right
            career path, prepare for companies and get
            personalized guidance from your AI career mentor.

          </p>


          <div className="feature-list">


            <div className="feature-item">

              <div className="feature-icon">
                ✓
              </div>

              <div>

                <strong>
                  AI Resume Analysis
                </strong>

                <p>
                  Find mistakes and improve your ATS score.
                </p>

              </div>

            </div>


            <div className="feature-item">

              <div className="feature-icon">
                ✦
              </div>

              <div>

                <strong>
                  Personal Career Roadmap
                </strong>

                <p>
                  Discover skills and roles matched to you.
                </p>

              </div>

            </div>


            <div className="feature-item">

              <div className="feature-icon">
                ↗
              </div>

              <div>

                <strong>
                  Company Preparation
                </strong>

                <p>
                  Prepare smarter for your target companies.
                </p>

              </div>

            </div>


          </div>

        </div>


        <div className="brand-footer">
          © 2026 VidyaGuide AI
        </div>

      </section>


      {/* =================================
          LOGIN / SIGNUP
      ================================= */}

      <section className="login-section">

        <div className="login-card">


          <div className="mobile-logo">
            VG
          </div>


          <div className="login-header">

            <p className="login-small-title">

              {isSignup
                ? "GET STARTED"
                : "WELCOME BACK"}

            </p>


            <h2>

              {isSignup
                ? "Create your account"
                : "Sign in to VidyaGuide"}

            </h2>


            <p>

              {isSignup
                ? "Start your AI-powered career journey."
                : "Continue building your career with AI."}

            </p>

          </div>


          {/* =================================
              ERROR
          ================================= */}

          {error && (

            <div className="message-error">
              {error}
            </div>

          )}


          {/* =================================
              SUCCESS
          ================================= */}

          {success && (

            <div className="message-success">
              {success}
            </div>

          )}


          <form onSubmit={handleSubmit}>


            {/* NAME */}

            {isSignup && (

              <div className="input-group">

                <label htmlFor="name">
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                />

              </div>

            )}


            {/* EMAIL */}

            <div className="input-group">

              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />

            </div>


            {/* PASSWORD */}

            <div className="input-group">

              <div className="password-label">

                <label htmlFor="password">
                  Password
                </label>


                {!isSignup && (

                  <button
                    type="button"
                    className="forgot-button"
                  >
                    Forgot password?
                  </button>

                )}

              </div>


              <input
                id="password"
                type="password"
                placeholder={
                  isSignup
                    ? "Create a password"
                    : "Enter your password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                minLength={6}
                required
              />

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              {loading
                ? "Please wait..."
                : isSignup
                  ? "Create account"
                  : "Sign in"}

              {!loading && (
                <span>→</span>
              )}

            </button>


          </form>


          {/* =================================
              DIVIDER
          ================================= */}

          {!isSignup && (

            <>

              <div className="divider">
                <span>or</span>
              </div>


              <button
                type="button"
                className="demo-button"
                onClick={() => {

                  setEmail("demo@vidhyaguide.ai");
                  setPassword("demo123");

                }}
              >
                Use Demo Credentials
              </button>

            </>

          )}


          {/* =================================
              SWITCH LOGIN / SIGNUP
          ================================= */}

          <p className="signup-text">

            {isSignup
              ? "Already have an account?"
              : "Don't have an account?"}


            <button
              type="button"
              className="signup-link"
              onClick={switchMode}
            >

              {isSignup
                ? "Sign in"
                : "Create account"}

            </button>

          </p>


        </div>

      </section>

    </div>

  );

}

export default Login;