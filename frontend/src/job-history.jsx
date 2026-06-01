import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

// Relative time ngan gon: "5s", "3m", "2h", "1d"
function ago(iso) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// Panel lich su: list cac job da tao. Refetch moi khi refreshKey thay doi.
export default function JobHistory({ refreshKey }) {
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/api/video/jobs`)
      .then(({ data }) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => {}); // best-effort: history loi khong duoc lam vo app
  }, [refreshKey]);

  if (jobs.length === 0) {
    return (
      <div className="history">
        <h2>History</h2>
        <p className="muted">No videos yet.</p>
      </div>
    );
  }

  return (
    <div className="history">
      <h2>History</h2>
      <ul className="history-list">
        {jobs.map((j) => (
          <li
            key={j.id}
            className={`history-item${j.status === 'completed' ? ' clickable' : ''}`}
            onClick={() => j.status === 'completed' && setSelected(j)}
          >
            <span className="history-prompt">{j.prompt}</span>
            <span className="history-meta">
              <span className={`badge badge-${j.status}`}>{j.status}</span>
              <span className="muted">{ago(j.createdAt)}</span>
            </span>
          </li>
        ))}
      </ul>

      {selected?.outputUrl && (
        <div className="result">
          <video src={selected.outputUrl} controls autoPlay />
          <a href={selected.outputUrl} download className="download">
            Download video
          </a>
        </div>
      )}
    </div>
  );
}
