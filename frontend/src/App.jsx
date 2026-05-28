import VideoGenerator from './VideoGenerator.jsx';

export default function App() {
  return (
    <div className="page">
      <header>
        <div className="title-row">
          <img src="/logo.png" alt="Ecomdy" className="logo" />
          <h1>AI Video Generator</h1>
        </div>
        <p className="muted">Ecomdy Marketing API - Hackathon Starter</p>
      </header>
      <VideoGenerator />
    </div>
  );
}
