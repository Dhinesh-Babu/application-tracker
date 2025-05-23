import { useEffect, useState } from "react"
import StatusDropdown from "./StatusDropdown"
import InterviewPrep from "./InterviewPrep"

export interface Job {
    id: string
    title: string
    company: string
    description: string  // Auto-generated from URL
    url: string
    status: string
    date_applied: string
}

export default function JobTable() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedJobForInterview, setSelectedJobForInterview] = useState<Job | null>(null)
    const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetch("http://localhost:8000/jobs")
            .then(res => res.json())
            .then(data => {
                setJobs(data)
                setLoading(false)
            })
            .catch(() => {
                setLoading(false)
            })
    }, [])

    const toggleDescription = (jobId: string) => {
        const newExpanded = new Set(expandedDescriptions)
        if (newExpanded.has(jobId)) {
            newExpanded.delete(jobId)
        } else {
            newExpanded.add(jobId)
        }
        setExpandedDescriptions(newExpanded)
    }

    if (loading) return <p>Loading jobs...</p>

    const handleDelete = async (id: string) => {
        await fetch(`http://localhost:8000/jobs/${id}`, {
            method: "DELETE",
        })

        const res = await fetch("http://localhost:8000/jobs")
        const data = await res.json()
        setJobs(data)
    }

    const handleInterviewPrep = (job: Job) => {
        setSelectedJobForInterview(job)
    }

    const formatDate = (dateString: string) => {
        // Parse date as local date to avoid timezone issues
        const [year, month, day] = dateString.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })
    }

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text
        return text.slice(0, maxLength) + "..."
    }

    if (selectedJobForInterview) {
        return (
            <InterviewPrep 
                jobId={selectedJobForInterview.id}
                jobTitle={selectedJobForInterview.title}
                company={selectedJobForInterview.company}
                onClose={() => setSelectedJobForInterview(null)}
            />
        )
    }

    return (
        <div>
            <h2 style={{ marginBottom: "1rem" }}>Your Job Applications</h2>
            
            {jobs.length === 0 ? (
                <p style={{ textAlign: "center", marginTop: "2rem", color: "#6b7280" }}>
                    No job applications yet. Add your first job above to get started!
                </p>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table border={1} cellPadding={12} cellSpacing={0} style={{ 
                        width: "100%", 
                        borderCollapse: "collapse",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        overflow: "hidden",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc" }}>
                                <th style={{ textAlign: "left", fontWeight: "600", color: "#374151", minWidth: "150px" }}>
                                    Title
                                </th>
                                <th style={{ textAlign: "left", fontWeight: "600", color: "#374151", minWidth: "130px" }}>
                                    Company
                                </th>
                                <th style={{ textAlign: "left", fontWeight: "600", color: "#374151", minWidth: "300px" }}>
                                    Description (AI Generated)
                                </th>
                                <th style={{ textAlign: "left", fontWeight: "600", color: "#374151", minWidth: "100px" }}>
                                    Status
                                </th>
                                <th style={{ textAlign: "left", fontWeight: "600", color: "#374151", minWidth: "120px" }}>
                                    Date Applied
                                </th>
                                <th style={{ textAlign: "left", fontWeight: "600", color: "#374151", minWidth: "150px" }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map(job => {
                                const isExpanded = expandedDescriptions.has(job.id)
                                const shortDescription = truncateText(job.description, 150)
                                
                                return (
                                    <tr key={job.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                        <td style={{ verticalAlign: "top" }}>
                                            <div style={{ fontWeight: "500", color: "#111827" }}>
                                                {job.title}
                                            </div>
                                        </td>
                                        <td style={{ verticalAlign: "top" }}>
                                            <div style={{ color: "#374151" }}>
                                                {job.company}
                                            </div>
                                        </td>
                                        <td style={{ verticalAlign: "top", maxWidth: "300px" }}>
                                            <div style={{ 
                                                color: "#6b7280", 
                                                fontSize: "0.875rem",
                                                lineHeight: "1.4"
                                            }}>
                                                {isExpanded ? job.description : shortDescription}
                                                {job.description.length > 150 && (
                                                    <button
                                                        onClick={() => toggleDescription(job.id)}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            color: "#3b82f6",
                                                            cursor: "pointer",
                                                            fontSize: "0.875rem",
                                                            marginLeft: "0.5rem",
                                                            textDecoration: "underline",
                                                            padding: "0"
                                                        }}
                                                    >
                                                        {isExpanded ? "Show less" : "Show more"}
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ marginTop: "0.5rem" }}>
                                                <a 
                                                    href={job.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ 
                                                        color: "#3b82f6", 
                                                        fontSize: "0.75rem",
                                                        textDecoration: "none"
                                                    }}
                                                >
                                                    🔗 View Original Job Post
                                                </a>
                                            </div>
                                        </td>
                                        <td style={{ verticalAlign: "top" }}>
                                            <StatusDropdown
                                                jobId={job.id}
                                                currentStatus={job.status}
                                                onStatusChange={() => {
                                                    fetch("http://localhost:8000/jobs")
                                                        .then(res => res.json())
                                                        .then(setJobs)
                                                }}
                                            />
                                        </td>
                                        <td style={{ verticalAlign: "top" }}>
                                            <div style={{ color: "#374151" }}>
                                                {formatDate(job.date_applied)}
                                            </div>
                                        </td>
                                        <td style={{ verticalAlign: "top" }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                <button 
                                                    onClick={() => handleInterviewPrep(job)}
                                                    style={{
                                                        backgroundColor: "#10b981",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "6px",
                                                        padding: "0.5rem 0.75rem",
                                                        fontSize: "0.875rem",
                                                        fontWeight: "500",
                                                        cursor: "pointer",
                                                        transition: "background-color 0.2s"
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.backgroundColor = "#059669"
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.backgroundColor = "#10b981"
                                                    }}
                                                    title="Practice interview questions for this role"
                                                >
                                                    🎯 Interview Prep
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(job.id)}
                                                    style={{
                                                        backgroundColor: "#ef4444",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "6px",
                                                        padding: "0.5rem 0.75rem",
                                                        fontSize: "0.875rem",
                                                        fontWeight: "500",
                                                        cursor: "pointer",
                                                        transition: "background-color 0.2s"
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.backgroundColor = "#dc2626"
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.backgroundColor = "#ef4444"
                                                    }}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}