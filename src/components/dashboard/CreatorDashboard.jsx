import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import { formatDate } from "../../lib/format.js";
import StatusBadge from "../StatusBadge.jsx";
import StatusMessage from "../StatusMessage.jsx";
import VideoPreview from "../VideoPreview.jsx";

export default function CreatorDashboard({ profile }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error: queryError } = await supabase
        .from("videos")
        .select("id, title, status, file_path, created_at")
        .eq("owner_id", profile.id)
        .order("created_at", { ascending: false });
      if (queryError || !Array.isArray(data)) {
        setError("Video Anda belum bisa dimuat. Muat ulang halaman ini.");
      } else {
        setVideos(data);
      }
      setLoading(false);
    })();
  }, [profile.id]);

  if (loading) return <StatusMessage message="Memuat video Anda..." />;

  const approvedCount = videos.filter((video) => video.status === "approved").length;
  const pendingCount = videos.filter((video) => video.status === "pending").length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard kreator</p>
          <h1>Halo, {profile.display_name || "Kreator"}</h1>
        </div>
        <Link to="/upload" className="btn btn-primary">
          Unggah video baru
        </Link>
      </header>

      <div className="stat-grid">
        <div className="card stat-card">
          <span className="stat-card__label">Total video</span>
          <strong className="stat-card__value">{videos.length}</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-card__label">Tayang</span>
          <strong className="stat-card__value">{approvedCount}</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-card__label">Menunggu review</span>
          <strong className="stat-card__value">{pendingCount}</strong>
        </div>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      {videos.length === 0 && !error ? (
        <div className="empty-state">
          <h2>Belum ada video</h2>
          <p>Unggah video pertama Anda untuk mulai dipromosikan.</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <article key={video.id} className="card video-card">
              <VideoPreview filePath={video.file_path} title={video.title} />
              <div className="video-card__body">
                <div className="video-card__meta">
                  <StatusBadge status={video.status} />
                  <span className="muted">{formatDate(video.created_at)}</span>
                </div>
                <h3>{video.title}</h3>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
