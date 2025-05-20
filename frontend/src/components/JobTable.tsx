import { useEffect, useState } from "react"
import StatusDropdown from "./StatusDropdown"

export interface Job {
    id: string
    title: string
    company: string
    status: string
    date_applied: string
}

export default function JobTable() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)

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

    if (loading) return <p>Loading jobs...</p>


    const handleDelete = async (id: string) => {
        await fetch(`http://localhost:8000/jobs/${id}`, {
            method: "DELETE",
        })

        const res = await fetch("http://localhost:8000/jobs")
        const data = await res.json()
        setJobs(data)
    }



    return (
        <table border={1} cellPadding={8} cellSpacing={0}>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Date Applied</th>
                </tr>
            </thead>
            <tbody>
                {jobs.map(job => (
                    <tr key={job.id}>
                        <td>{job.title}</td>
                        <td>{job.company}</td>
                        <td>
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
                        <td>{job.date_applied}</td>
                        <td>
                            <button onClick={() => handleDelete(job.id)}>
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>

        </table>
    )
}
