import { useState } from "react"

interface Props {
  jobId: string
  currentStatus: string
  onStatusChange: () => void
}

export default function StatusDropdown({ jobId, currentStatus, onStatusChange }: Props) {
  const [value, setValue] = useState(currentStatus)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    setValue(newStatus)  // ✅ update immediately

    await fetch(`http://localhost:8000/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })

    onStatusChange()  // optional: refresh full table
  }

  return (
    <select value={value} onChange={handleChange}>
      <option value="Applied">Applied</option>
      <option value="Interview">Interview</option>
      <option value="Rejected">Rejected</option>
    </select>
  )
}
