import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

export default function VideoGenerator({ onJobChange }) {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle | creating | pending | processing | completed | failed
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  async function handleGenerate() {
    setError(null);
    setVideoUrl(null);
    setStatus('creating');

    // Ecomdy default engine (Symphony) requires both prompt and image_url
    const body = { prompt, image_url: imageUrl.trim() };

    try {
      const { data: job } = await axios.post(`${API}/api/video/generate`, body);
      onJobChange?.(); // new pending job logged -> refresh history

      // Poll every 3 seconds until status = completed
      timerRef.current = setInterval(async () => {
        try {
          const { data: j } = await axios.get(`${API}/api/video/jobs/${job.id}`);
          setStatus(j.status);
          if (j.status === 'completed') {
            setVideoUrl(j.output_url);
            clearInterval(timerRef.current);
            onJobChange?.(); // status transitioned -> refresh history
          } else if (j.status === 'failed') {
            // Surface the real error message from Ecomdy (e.g. "image_url is required for Symphony")
            // Spec: failed VideoJob carries flat `error_message`; keep legacy fallbacks for safety
            const reason = j.error_message || j.error?.message || j.error?.code || 'Video generation failed. Try a different prompt.';
            setError(reason);
            clearInterval(timerRef.current);
            onJobChange?.(); // status transitioned -> refresh history
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
      <label htmlFor="prompt">Describe the video you want to create:</label>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. TikTok ad for running shoes, young athlete, urban setting..."
        rows={4}
        disabled={isBusy}
      />

      <label htmlFor="image_url">Image URL (required):</label>
      <input
        id="image_url"
        type="url"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="https://..."
        disabled={isBusy}
        required
      />

      <button onClick={handleGenerate} disabled={isBusy || !prompt.trim() || !imageUrl.trim()}>
        {isBusy ? `Processing... (${status})` : 'Generate video'}
      </button>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {videoUrl && (
        <div className="result">
          <video src={videoUrl} controls autoPlay />
          <a href={videoUrl} download className="download">
            Download video
          </a>
        </div>
      )}
    </div>
  );
}
