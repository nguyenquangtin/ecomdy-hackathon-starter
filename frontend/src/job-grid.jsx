import { Link } from 'react-router-dom';
import { ago } from './time-ago.js';

// Luoi card hien thi tat ca job. Click card -> /jobs/:id (trang chi tiet).
// List endpoint tra DB row: { id, prompt, imageUrl, status, outputUrl, error, createdAt }.
export default function JobGrid({ jobs }) {
  if (jobs.length === 0) {
    return (
      <section className="dashboard">
        <h2>Dashboard</h2>
        <p className="muted">No videos yet. <Link to="/create" className="inline-link">Create your first one</Link>.</p>
      </section>
    );
  }

  return (
    <section className="dashboard">
      <h2>Dashboard</h2>
      <div className="job-grid">
        {jobs.map((j) => (
          <Link key={j.id} to={`/jobs/${j.id}`} className="job-card">
            <div className="job-thumb">
              {j.status === 'completed' && j.outputUrl ? (
                <video src={`${j.outputUrl}#t=0.1`} muted preload="metadata" playsInline />
              ) : (
                <span className={`thumb-placeholder thumb-${j.status}`}>
                  {j.status === 'failed' ? 'Failed' : 'Generating...'}
                </span>
              )}
              <span className={`badge badge-${j.status}`}>{j.status}</span>
            </div>
            <div className="job-card-body">
              <span className="job-prompt">{j.prompt}</span>
              <span className="muted">{ago(j.createdAt)} ago</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
