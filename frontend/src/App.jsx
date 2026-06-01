import { useState } from 'react';
import VideoGenerator from './VideoGenerator.jsx';
import JobHistory from './job-history.jsx';

export default function App() {
  // Bump refresh de JobHistory refetch moi khi co job moi / doi trang thai
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="page">
      <header>
        <div className="title-row">
          <img src="/logo.png" alt="Ecomdy" className="logo" />
          <h1>AI Video Generator</h1>
        </div>
        <p className="muted">Ecomdy Marketing API - Hackathon Starter</p>
      </header>
      <VideoGenerator onJobChange={() => setRefresh((n) => n + 1)} />
      <JobHistory refreshKey={refresh} />
    </div>
  );
}
