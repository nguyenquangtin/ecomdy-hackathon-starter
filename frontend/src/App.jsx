import { Routes, Route, Link, NavLink } from 'react-router-dom';
import Dashboard from './dashboard.jsx';
import CreatePage from './create.jsx';
import JobDetail from './job-detail.jsx';

export default function App() {
  return (
    <div className="page">
      <header>
        <Link to="/" className="title-row">
          <img src="/logo.png" alt="Ecomdy" className="logo" />
          <h1>AI Video Generator</h1>
        </Link>
        <nav className="nav">
          <NavLink to="/" end className="nav-link">Dashboard</NavLink>
          <NavLink to="/create" className="nav-link">Create</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
      </Routes>
    </div>
  );
}
