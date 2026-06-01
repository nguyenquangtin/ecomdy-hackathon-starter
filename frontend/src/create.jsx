import { useNavigate } from 'react-router-dom';
import VideoGenerator from './VideoGenerator.jsx';

// Trang /create: chi chua form tao video.
// Khi job moi duoc tao, dieu huong ve dashboard de xem trang thai/luoi job.
export default function CreatePage() {
  const navigate = useNavigate();

  return (
    <section className="create">
      <h2>Create a video</h2>
      <VideoGenerator onJobChange={() => navigate('/')} />
    </section>
  );
}
