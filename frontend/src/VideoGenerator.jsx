import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle'); // idle | creating | pending | processing | completed | failed
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  // Cleanup polling khi component unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  async function handleGenerate() {
    setError(null);
    setVideoUrl(null);
    setStatus('creating');

    try {
      const { data: job } = await axios.post(`${API}/api/video/generate`, { prompt });

      // Poll moi 3 giay cho toi khi status = completed
      timerRef.current = setInterval(async () => {
        try {
          const { data: j } = await axios.get(`${API}/api/video/jobs/${job.id}`);
          setStatus(j.status);
          if (j.status === 'completed') {
            setVideoUrl(j.output_url);
            clearInterval(timerRef.current);
          } else if (j.status === 'failed') {
            setError('Tao video that bai. Thu lai voi prompt khac.');
            clearInterval(timerRef.current);
          }
        } catch (err) {
          setError(err.response?.data?.message || err.message);
          clearInterval(timerRef.current);
        }
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setStatus('failed');
    }
  }

  const isBusy = status === 'creating' || status === 'pending' || status === 'processing';

  return (
    <div className="generator">
      <label htmlFor="prompt">Mo ta video ban muon tao:</label>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="VD: TikTok ad for running shoes, young athlete, urban setting..."
        rows={4}
        disabled={isBusy}
      />

      <button onClick={handleGenerate} disabled={isBusy || !prompt.trim()}>
        {isBusy ? `Dang xu ly... (${status})` : 'Tao video'}
      </button>

      {error && (
        <div className="error">
          <strong>Loi:</strong> {error}
        </div>
      )}

      {videoUrl && (
        <div className="result">
          <video src={videoUrl} controls autoPlay />
          <a href={videoUrl} download className="download">
            Tai video ve
          </a>
        </div>
      )}
    </div>
  );
}
