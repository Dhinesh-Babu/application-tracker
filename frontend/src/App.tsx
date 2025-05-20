import JobTable from "./components/JobTable"
import AddJobForm from "./components/AddJobForm"
import { useState } from "react"

function App() {
  const [reload, setReload] = useState(false)

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Job Tracker</h1>
      <AddJobForm onJobAdded={() => setReload(prev => !prev)} />
      <JobTable key={reload.toString()} />
    </div>
  )
}

export default App
