import { useState, useEffect } from "react"

interface InterviewQuestion {
  question: string
  category: string
  difficulty: string
}

interface AnswerFeedback {
  question: string
  user_answer: string
  feedback: string
  score: number
  improvement_suggestions: string[]
  ideal_points: string[]
}

interface Props {
  jobId: string
  jobTitle: string
  company: string
  onClose: () => void
}

export default function InterviewPrep({ jobId, jobTitle, company, onClose }: Props) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState("")
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [feedback, setFeedback] = useState<{ [key: number]: AnswerFeedback }>({})
  const [sessionId, setSessionId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<"loading" | "questions" | "practice" | "review">("loading")

  useEffect(() => {
    generateQuestions()
  }, [])

  const generateQuestions = async () => {
    setLoading(true)
    try {
      const response = await fetch("http://localhost:8000/interview/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId })
      })
      
      const data = await response.json()
      setQuestions(data.questions)
      setPhase("questions")
    } catch (error) {
      console.error("Failed to generate questions:", error)
      alert("Failed to generate questions. Please make sure your API key is configured.")
    } finally {
      setLoading(false)
    }
  }

  const startPractice = () => {
    setPhase("practice")
    setCurrentQuestionIndex(0)
    // Generate a session ID for tracking
    setSessionId(Date.now().toString())
  }

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return

    setLoading(true)
    try {
      // Get feedback directly (we'll simulate session management)
      const feedbackResponse = await fetch("http://localhost:8000/interview/get-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question: questions[currentQuestionIndex].question,
          answer: currentAnswer,
          question_category: questions[currentQuestionIndex].category
        })
      })

      const feedbackData = await feedbackResponse.json()
      
      setAnswers(prev => ({ ...prev, [currentQuestionIndex]: currentAnswer }))
      setFeedback(prev => ({ ...prev, [currentQuestionIndex]: feedbackData }))
      setCurrentAnswer("")

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      } else {
        setPhase("review")
      }
    } catch (error) {
      console.error("Failed to get feedback:", error)
      alert("Failed to get feedback. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "technical": return "#3b82f6"
      case "behavioral": return "#10b981" 
      case "company-specific": return "#f59e0b"
      default: return "#6b7280"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "#10b981"
      case "medium": return "#f59e0b"
      case "hard": return "#ef4444"
      default: return "#6b7280"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "#10b981"
    if (score >= 6) return "#f59e0b"
    return "#ef4444"
  }

  if (loading && phase === "loading") {
    return (
      <div style={{ 
        padding: "2rem", 
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "#f9fafb",
        borderRadius: "12px",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ 
            width: "4rem", 
            height: "4rem", 
            border: "4px solid #e5e7eb", 
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 1rem"
          }}></div>
          <h2 style={{ color: "#374151", marginBottom: "0.5rem" }}>Generating Interview Questions...</h2>
          <p style={{ color: "#6b7280" }}>
            We're analyzing the job description for <strong>{jobTitle}</strong> at <strong>{company}</strong> 
            to create personalized interview questions. This may take a moment.
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (phase === "questions") {
    return (
      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ 
          marginBottom: "2rem", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-start",
          gap: "2rem"
        }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem", color: "#111827" }}>
              Interview Questions Ready! 🎯
            </h1>
            <div style={{ 
              backgroundColor: "#f3f4f6", 
              padding: "1rem", 
              borderRadius: "8px",
              marginBottom: "1rem"
            }}>
              <h3 style={{ margin: "0 0 0.25rem 0", color: "#374151" }}>{jobTitle}</h3>
              <p style={{ margin: 0, color: "#6b7280" }}>{company}</p>
            </div>
            <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>
              We've generated <strong>{questions.length} personalized questions</strong> based on the job description.
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              padding: "0.5rem 1rem",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            ✕ Close
          </button>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "grid", gap: "1rem" }}>
            {questions.map((q, index) => (
              <div key={index} style={{ 
                border: "1px solid #e5e7eb", 
                borderRadius: "12px", 
                padding: "1.5rem", 
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                transition: "transform 0.2s, box-shadow 0.2s"
              }}>
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
                  <span style={{ 
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "20px",
                    fontSize: "0.875rem",
                    fontWeight: "500"
                  }}>
                    Question {index + 1}
                  </span>
                  <span style={{ 
                    backgroundColor: getCategoryColor(q.category), 
                    color: "white", 
                    padding: "0.25rem 0.75rem", 
                    borderRadius: "20px", 
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    textTransform: "capitalize"
                  }}>
                    {q.category.replace('-', ' ')}
                  </span>
                  <span style={{ 
                    backgroundColor: getDifficultyColor(q.difficulty), 
                    color: "white", 
                    padding: "0.25rem 0.75rem", 
                    borderRadius: "20px", 
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    textTransform: "capitalize"
                  }}>
                    {q.difficulty}
                  </span>
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: "1.1rem", 
                  lineHeight: "1.6",
                  color: "#374151"
                }}>
                  {q.question}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <button 
            onClick={startPractice} 
            style={{ 
              backgroundColor: "#3b82f6", 
              color: "white", 
              padding: "1rem 2rem", 
              border: "none", 
              borderRadius: "12px",
              fontSize: "1.1rem",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(59, 130, 246, 0.15)",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb"
              e.currentTarget.style.transform = "translateY(-1px)"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#3b82f6"
              e.currentTarget.style.transform = "translateY(0)"
            }}
          >
            🚀 Start Practice Session
          </button>
        </div>
      </div>
    )
  }

  if (phase === "practice") {
    const currentQuestion = questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100
    
    return (
      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ 
          marginBottom: "2rem", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-start"
        }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              Question {currentQuestionIndex + 1} of {questions.length}
            </h1>
            <div style={{ 
              backgroundColor: "#f3f4f6", 
              padding: "0.75rem 1rem", 
              borderRadius: "8px",
              display: "inline-block"
            }}>
              <span style={{ color: "#374151", fontWeight: "500" }}>{jobTitle}</span>
              <span style={{ color: "#6b7280", margin: "0 0.5rem" }}>at</span>
              <span style={{ color: "#374151", fontWeight: "500" }}>{company}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              padding: "0.5rem 1rem",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Progress</span>
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ 
            width: "100%", 
            height: "8px", 
            backgroundColor: "#e5e7eb", 
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            <div style={{ 
              width: `${progress}%`, 
              height: "100%", 
              backgroundColor: "#3b82f6",
              transition: "width 0.3s ease"
            }}></div>
          </div>
        </div>

        {/* Question Card */}
        <div style={{ 
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)"
        }}>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <span style={{ 
              backgroundColor: getCategoryColor(currentQuestion.category), 
              color: "white", 
              padding: "0.375rem 0.875rem", 
              borderRadius: "20px", 
              fontSize: "0.875rem",
              fontWeight: "500",
              textTransform: "capitalize"
            }}>
              {currentQuestion.category.replace('-', ' ')}
            </span>
            <span style={{ 
              backgroundColor: getDifficultyColor(currentQuestion.difficulty), 
              color: "white", 
              padding: "0.375rem 0.875rem", 
              borderRadius: "20px", 
              fontSize: "0.875rem",
              fontWeight: "500",
              textTransform: "capitalize"
            }}>
              {currentQuestion.difficulty}
            </span>
          </div>
          
          <h2 style={{ 
            fontSize: "1.5rem", 
            marginBottom: "1.5rem",
            lineHeight: "1.4",
            color: "#111827"
          }}>
            {currentQuestion.question}
          </h2>

          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "0.75rem", 
              fontWeight: "500",
              color: "#374151"
            }}>
              Your Answer:
            </label>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Take your time to craft a thoughtful response. Consider specific examples and quantifiable results where possible..."
              style={{ 
                width: "100%", 
                minHeight: "200px", 
                padding: "1rem", 
                border: "2px solid #e5e7eb", 
                borderRadius: "8px",
                fontSize: "1rem",
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: "1.5",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3b82f6"
                e.target.style.outline = "none"
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb"
              }}
            />
            <div style={{ 
              marginTop: "0.5rem", 
              fontSize: "0.875rem", 
              color: "#6b7280",
              textAlign: "right"
            }}>
              {currentAnswer.length} characters
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {currentQuestionIndex > 0 && (
              <button 
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                style={{ 
                  padding: "0.75rem 1.5rem", 
                  border: "2px solid #d1d5db", 
                  borderRadius: "8px",
                  backgroundColor: "white",
                  color: "#374151",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                ← Previous
              </button>
            )}
          </div>
          
          <button 
            onClick={submitAnswer}
            disabled={!currentAnswer.trim() || loading}
            style={{ 
              backgroundColor: currentAnswer.trim() ? "#10b981" : "#d1d5db", 
              color: "white", 
              padding: "0.75rem 2rem", 
              border: "none", 
              borderRadius: "8px",
              cursor: currentAnswer.trim() ? "pointer" : "not-allowed",
              fontWeight: "600",
              fontSize: "1rem",
              transition: "all 0.2s"
            }}
          >
            {loading ? "Getting Feedback..." : "Submit & Get Feedback"}
          </button>
        </div>

        {/* Question Navigator */}
        <div style={{ marginTop: "3rem", textAlign: "center" }}>
          <div style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Quick Navigation:</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "50%",
                  border: "2px solid",
                  borderColor: answers[index] ? "#10b981" : 
                              index === currentQuestionIndex ? "#3b82f6" : "#d1d5db",
                  backgroundColor: answers[index] ? "#10b981" : 
                                   index === currentQuestionIndex ? "#3b82f6" : "white",
                  color: answers[index] || index === currentQuestionIndex ? "white" : "#6b7280",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  transition: "all 0.2s"
                }}
                title={`Question ${index + 1}${answers[index] ? " (Answered)" : ""}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (phase === "review") {
    const completedQuestions = Object.keys(feedback).length
    const averageScore = completedQuestions > 0 
      ? Object.values(feedback).reduce((sum, f) => sum + f.score, 0) / completedQuestions 
      : 0

    return (
      <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ 
          marginBottom: "3rem", 
          textAlign: "center",
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)"
        }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "1rem", color: "#111827" }}>
            🎉 Interview Practice Complete!
          </h1>
          <div style={{ 
            backgroundColor: "#f3f4f6", 
            padding: "1rem", 
            borderRadius: "8px",
            marginBottom: "1.5rem",
            display: "inline-block"
          }}>
            <h3 style={{ margin: "0 0 0.25rem 0", color: "#374151" }}>{jobTitle}</h3>
            <p style={{ margin: 0, color: "#6b7280" }}>{company}</p>
          </div>
          
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1.5rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ 
                fontSize: "2.5rem", 
                fontWeight: "bold", 
                color: getScoreColor(averageScore)
              }}>
                {averageScore.toFixed(1)}
              </div>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Average Score</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#3b82f6" }}>
                {completedQuestions}
              </div>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Questions Answered</div>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            style={{ 
              position: "absolute",
              top: "1rem",
              right: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Detailed Feedback */}
        <div style={{ marginBottom: "3rem" }}>
          {questions.map((question, index) => {
            const questionFeedback = feedback[index]
            if (!questionFeedback) return null

            return (
              <div key={index} style={{ 
                border: "1px solid #e5e7eb", 
                borderRadius: "12px", 
                padding: "2rem", 
                marginBottom: "2rem",
                backgroundColor: "white",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)"
              }}>
                {/* Question Header */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
                    <span style={{ 
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      padding: "0.375rem 0.875rem",
                      borderRadius: "20px",
                      fontSize: "0.875rem",
                      fontWeight: "500"
                    }}>
                      Question {index + 1}
                    </span>
                    <span style={{ 
                      backgroundColor: getCategoryColor(question.category), 
                      color: "white", 
                      padding: "0.375rem 0.875rem", 
                      borderRadius: "20px", 
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      textTransform: "capitalize"
                    }}>
                      {question.category.replace('-', ' ')}
                    </span>
                    <span style={{ 
                      backgroundColor: getScoreColor(questionFeedback.score), 
                      color: "white", 
                      padding: "0.375rem 0.875rem", 
                      borderRadius: "20px", 
                      fontSize: "0.875rem",
                      fontWeight: "bold"
                    }}>
                      Score: {questionFeedback.score}/10
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.25rem", marginBottom: "0", color: "#111827", lineHeight: "1.4" }}>
                    {question.question}
                  </h3>
                </div>

                {/* Your Answer */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#374151", marginBottom: "0.75rem", fontSize: "1rem", fontWeight: "600" }}>
                    Your Answer:
                  </h4>
                  <div style={{ 
                    backgroundColor: "#f9fafb", 
                    padding: "1.25rem", 
                    borderRadius: "8px", 
                    border: "1px solid #e5e7eb",
                    fontSize: "0.95rem",
                    lineHeight: "1.6",
                    color: "#374151"
                  }}>
                    {questionFeedback.user_answer}
                  </div>
                </div>

                {/* AI Feedback */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#374151", marginBottom: "0.75rem", fontSize: "1rem", fontWeight: "600" }}>
                    💡 AI Feedback:
                  </h4>
                  <div style={{ 
                    backgroundColor: "#eff6ff", 
                    padding: "1.25rem", 
                    borderRadius: "8px", 
                    border: "1px solid #dbeafe",
                    fontSize: "0.95rem",
                    lineHeight: "1.6",
                    color: "#1e40af"
                  }}>
                    {questionFeedback.feedback}
                  </div>
                </div>

                {/* Improvement Suggestions & Ideal Points */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  <div>
                    <h4 style={{ color: "#374151", marginBottom: "0.75rem", fontSize: "1rem", fontWeight: "600" }}>
                      🔧 Areas for Improvement:
                    </h4>
                    <div style={{ 
                      backgroundColor: "#fef3f2", 
                      padding: "1.25rem", 
                      borderRadius: "8px", 
                      border: "1px solid #fecaca"
                    }}>
                      <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                        {questionFeedback.improvement_suggestions.map((suggestion, i) => (
                          <li key={i} style={{ 
                            marginBottom: "0.5rem", 
                            color: "#b91c1c",
                            fontSize: "0.95rem",
                            lineHeight: "1.5"
                          }}>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 style={{ color: "#374151", marginBottom: "0.75rem", fontSize: "1rem", fontWeight: "600" }}>
                      ✅ Key Points to Cover:
                    </h4>
                    <div style={{ 
                      backgroundColor: "#f0fdf4", 
                      padding: "1.25rem", 
                      borderRadius: "8px", 
                      border: "1px solid #bbf7d0"
                    }}>
                      <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                        {questionFeedback.ideal_points.map((point, i) => (
                          <li key={i} style={{ 
                            marginBottom: "0.5rem", 
                            color: "#15803d",
                            fontSize: "0.95rem",
                            lineHeight: "1.5"
                          }}>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              backgroundColor: "#3b82f6", 
              color: "white", 
              padding: "1rem 2rem", 
              border: "none", 
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              marginRight: "1rem",
              boxShadow: "0 4px 6px rgba(59, 130, 246, 0.15)"
            }}
          >
            🔄 Practice Again
          </button>
          <button 
            onClick={onClose}
            style={{ 
              backgroundColor: "#6b7280", 
              color: "white", 
              padding: "1rem 2rem", 
              border: "none", 
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            📋 Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  return null
}