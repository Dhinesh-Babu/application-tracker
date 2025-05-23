import { useState } from "react"

interface JobFormData {
  title: string
  company: string
  url: string
  status: string
  date_applied: string
}

interface Props {
  onJobAdded: () => void
}

export default function AddJobForm({ onJobAdded }: Props) {

  const getLocalDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    company: "",
    url: "",
    status: "Applied",
    date_applied: getLocalDateString(),
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await fetch("http://localhost:8000/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    })

    setFormData({ 
      title: "", 
      company: "", 
      url: "",
      status: "Applied",
      date_applied: new Date().toISOString().split("T")[0]
    })
    onJobAdded()
  }

  return (
    <div style={{ 
      backgroundColor: "white", 
      padding: "2rem", 
      borderRadius: "12px", 
      border: "1px solid #e5e7eb",
      marginBottom: "2rem",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
    }}>
      <h2 style={{ marginBottom: "1.5rem", color: "#111827" }}>Add New Job Application</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ 
            display: "block", 
            marginBottom: "0.5rem", 
            fontWeight: "500",
            color: "#374151"
          }}>
            Job URL *
          </label>
          <input 
            name="url" 
            placeholder="https://company.com/jobs/..." 
            value={formData.url} 
            onChange={handleChange} 
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "1rem"
            }}
          />
          <p style={{ 
            color: "#6b7280", 
            fontSize: "0.875rem", 
            marginTop: "0.5rem" 
          }}>
            💡 Job description will be automatically generated from this URL
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "0.5rem", 
              fontWeight: "500",
              color: "#374151"
            }}>
              Job Title *
            </label>
            <input 
              name="title" 
              placeholder="Software Engineer" 
              value={formData.title} 
              onChange={handleChange} 
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "1rem"
              }}
            />
          </div>
          
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "0.5rem", 
              fontWeight: "500",
              color: "#374151"
            }}>
              Company *
            </label>
            <input 
              name="company" 
              placeholder="Company Name" 
              value={formData.company} 
              onChange={handleChange} 
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "1rem"
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "0.5rem", 
              fontWeight: "500",
              color: "#374151"
            }}>
              Status
            </label>
            <select 
              name="status" 
              value={formData.status} 
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "1rem"
              }}
            >
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "0.5rem", 
              fontWeight: "500",
              color: "#374151"
            }}>
              Date Applied *
            </label>
            <input 
              name="date_applied" 
              type="date" 
              value={formData.date_applied} 
              onChange={handleChange} 
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "1rem"
              }}
            />
          </div>
        </div>

        <button 
          type="submit"
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            padding: "0.75rem 2rem",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)"
          }}
        >
          ✅ Add Job Application
        </button>
      </form>
    </div>
  )
}