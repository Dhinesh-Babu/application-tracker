import { useState } from "react"

interface JobFormData {
  title: string
  company: string
  description: string
  url: string
  status: string
  date_applied: string
}

interface Props {
  onJobAdded: () => void
}

export default function AddJobForm({ onJobAdded }: Props) {
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    company: "",
    description: "",
    url: "",
    status: "Applied",
    date_applied: new Date().toISOString().split("T")[0],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    setFormData({ ...formData, title: "", company: "", description: "", url: "" })
    onJobAdded()  // notify parent to reload job list
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <h2>Add a Job</h2>
      <input name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
      <input name="company" placeholder="Company" value={formData.company} onChange={handleChange} required />
      <input name="url" placeholder="URL" value={formData.url} onChange={handleChange} required />
      <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
      <select name="status" value={formData.status} onChange={handleChange}>
        <option value="Applied">Applied</option>
        <option value="Interview">Interview</option>
        <option value="Rejected">Rejected</option>
      </select>
      <input name="date_applied" type="date" value={formData.date_applied} onChange={handleChange} required />
      <button type="submit">Add Job</button>
    </form>
  )
}
