import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useCommissions } from "../../hooks/useCommissions.js";
import { supabase } from "../../lib/supabase.js";
import { formatDate, formatRupiah } from "../../lib/format.js";
import StatusMessage from "../StatusMessage.jsx";
import VideoPreview from "../VideoPreview.jsx";

export default function PromoterDashboard({ profile }) {
  const { commissions, loading: commissionsLoading, error: commissionsError } = useCommissions();
  const [joinedCount, setJoinedCount] = useState(0);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState("");

  const loadVideos = useCallback(async () => {
    setVideosLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select("id, title, file_path, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (error || !Array.isArray(data)) {
      setVideosError("Daftar video belum bisa dimuat.");
    } else {
      setVideosError("");
      setVideos(data);
    }
    setVideosLoading(false);
  }, []);

  useEffect(() => {
    loadVideos();
    (async () => {
      const { count, error } = await supabase
        .from("promotions")
        .select("id", { count: "exact", head: true });
      if (!error) setJoinedCount(count ?? 0);
    })();
  }, [loadVideos]);

  if (commissionsLoading || videosLoading) return <StatusMessage message="Memuat dashboard Anda..." />;

  const balance = commissions
    .filter((item) => item.status === "approved")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const pending = commissions
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Dashboard promotor</p>
          <h1>Halo, {profile.display_name || "Promotor"}</h1>
        </div>
        <Link to="/kampanye" className="btn btn-primary">
          Jelajahi kampanye
        </Link>
      </header>

      <div className="stat-grid">
        <div className="card stat-card stat-card--highlight">
          <span className="stat-card__label">Saldo tersedia</span>
          <strong className="stat-card__value">{formatRupiah(balance)}</strong>
          <Link to="/komisi" className="stat-card__link">Lihat riwayat komisi</Link>
        </div>
        <div className="card stat-card">
          <span className="stat-card__label">Menunggu persetujuan</span>
          <strong className="stat-card__value">{formatRupiah(pending)}</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-card__label">Kampanye diikuti</span>
          <strong className="stat-card__value">{joinedCount}</strong>
        </div>
      </div>
      {commissionsError && <p className="alert alert-error" role="alert">{commissionsError}</p>}

      <section className="section-block">
        <div className="section__header section__header--left">
          <h2>Video siap dipromosikan</h2>
          <p>Video yang sudah disetujui admin dan bisa Anda sebarkan.</p>
        </div>
        {videosError && <p className="alert alert-error" role="alert">{videosError}</p>}
        {videos.length === 0 && !videosError ? (
          <div className="empty-state">
            <p>Belum ada video yang tayang. Silakan cek kembali nanti.</p>
          </div>
        ) : (
          <div className="video-grid">
            {videos.map((video) => (
              <article key={video.id} className="card video-card">
                <VideoPreview filePath={video.file_path} title={video.title} />
                <div className="video-card__body">
                  <h3>{video.title}</h3>
                  <span className="muted">Tayang {formatDate(video.created_at)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
