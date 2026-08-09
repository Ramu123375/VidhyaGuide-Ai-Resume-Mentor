import { useState } from "react";

function Mentor() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi! I'm Vidya AI Mentor. Ask me anything about careers, interviews, skills, resumes, or placements.",
    },
  ]);

  const [loading, setLoading] = useState(false);

  // =========================================
  // SEND MESSAGE TO AI
  // =========================================

  const sendMessage = async () => {
    if (!message.trim() || loading) {
      return;
    }

    const userMessage = message.trim();

    // Show user's message
    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://vidhyaguide-ai-resume-mentor.onrender.com/mentor",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            message: userMessage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Something went wrong"
        );
      }

      // Show AI response
      setMessages((previous) => [
        ...previous,
        {
          role: "ai",
          text: data.response,
        },
      ]);
    } catch (error) {
      console.error("Mentor error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "ai",
          text:
            "Sorry, I couldn't connect to the AI server. Please make sure the FastAPI backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // ENTER KEY
  // =========================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  // =========================================
  // QUICK QUESTION
  // =========================================

  const askQuestion = (question) => {
    setMessage(question);
  };

  // =========================================
  // UI
  // =========================================

  return (
    <div className="mentor-page">

      {/* HEADER */}

      <div className="mentor-header">

        <div>
          <div className="mentor-label">
            AI CAREER ASSISTANT
          </div>

          <h1>
            Vidya AI Mentor
          </h1>

          <p>
            Your personal AI career assistant.
          </p>
        </div>

      </div>


      {/* CHAT */}

      <div className="mentor-chat">

        {messages.map((item, index) => (

          <div
            key={index}
            className={
              item.role === "user"
                ? "message user-message"
                : "message ai-message"
            }
          >

            <div className="message-label">
              {item.role === "user"
                ? "You"
                : "Vidya AI"}
            </div>

            <div className="message-text">
              {item.text}
            </div>

          </div>

        ))}


        {/* LOADING */}

        {loading && (

          <div className="message ai-message">

            <div className="message-label">
              Vidya AI
            </div>

            <div className="message-text">
              Thinking...
            </div>

          </div>

        )}

      </div>


      {/* INPUT */}

      <div className="mentor-input-area">

        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Ask Vidya AI anything about your career..."
          rows="3"
        />

        <button
          onClick={sendMessage}
          disabled={
            loading || !message.trim()
          }
        >
          {loading
            ? "Thinking..."
            : "Send →"}
        </button>

      </div>


      {/* QUICK QUESTIONS */}

      <div className="mentor-suggestions">

        <button
          onClick={() =>
            askQuestion(
              "How can I prepare for campus placements?"
            )
          }
        >
          Placement preparation
        </button>


        <button
          onClick={() =>
            askQuestion(
              "What skills should I learn to become a full stack developer?"
            )
          }
        >
          Full Stack skills
        </button>


        <button
          onClick={() =>
            askQuestion(
              "How can I improve my resume?"
            )
          }
        >
          Improve my resume
        </button>


        <button
          onClick={() =>
            askQuestion(
              "Give me some interview questions for a fresher."
            )
          }
        >
          Interview questions
        </button>

      </div>

    </div>
  );
}

export default Mentor;