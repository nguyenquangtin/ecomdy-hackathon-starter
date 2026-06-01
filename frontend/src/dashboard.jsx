import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import JobGrid from './job-grid.jsx';

const API = import.meta.env.VITE_API_URL;

// Dashboard: luoi tat ca job.
// Tu dong refetch moi 4s khi con job dang pending/processing de cap nhat trang thai.
export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const timerRef = useRef(null);

  const fetchJobs = useCallback(() => {
    axios
      .get(`${API}/api/video/jobs`)
      .then(({ data }) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => {}); // best-effort: loi list khong duoc lam vo app
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Poll khi con job chua ket thuc (pending|processing); dung lai khi tat ca da terminal.
  const hasActive = jobs.some((j) => j.status === 'pending' || j.status === 'processing');
  useEffect(() => {
    clearInterval(timerRef.current);
    if (hasActive) {
      timerRef.current = setInterval(fetchJobs, 4000);
    }
    return () => clearInterval(timerRef.current);
  }, [hasActive, fetchJobs]);

  return <JobGrid jobs={jobs} />;
}
