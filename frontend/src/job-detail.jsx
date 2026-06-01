import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ago } from './time-ago.js';

const API = import.meta.env.VITE_API_URL;

// Trang chi tiet job: /jobs/:id
// getJob goi Ecomdy live -> { ...d, id, status (lowercase), output_url, error_message? }
// Poll moi 3s khi job con pending/processing; dung khi completed/failed hoac unmount.
export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data } = await axios.get(`${API}/api/video/jobs/${id}`);
        if (!active) return;
        setJob(data);
        // Job da ket thuc -> ngung poll
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(timerRef.current);
        }
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || err.message);
        clearInterval(timerRef.current);
      }
    }

    load();
    timerRef.current = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(timerRef.current);
    };
  }, [id]);

  const status = job?.status;
  const isBusy = status === 'pending' || status === 'processing';
  const reason = job?.error_message || job?.error?.message || job?.error;

  return (
    <section className="detail">
      <Link to="/" className="back-link">&larr; Back to dashboard</Link>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!job && !error && <p className="muted">Loading...</p>}

      {job && (
        <>
          <div className="detail-head">
            <span className={`badge badge-${status}`}>{status}</span>
            {job.createdAt && <span className="muted">{ago(job.createdAt)} ago</span>}
          </div>

          {job.prompt && (
            <div className="detail-field">
              <label>Prompt</label>
              <p>{job.prompt}</p>
            </div>
          )}

          {status === 'completed' && job.output_url && (
            <div className="result">
              <video src={job.output_url} controls autoPlay />
              <a href={job.output_url} download className="download">
                Download video
              </a>
            </div>
          )}

          {status === 'failed' && (
            <div className="error">
              <strong>Generation failed:</strong> {reason || 'Unknown error.'}
            </div>
          )}

          {isBusy && (
            <p className="muted">Video is being generated, this can take 10-60s. This page updates automatically.</p>
          )}
        </>
      )}
    </section>
  );
}
