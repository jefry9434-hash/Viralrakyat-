import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { formatDate } from "../../lib/format.js";
import StatusMessage from "../StatusMessage.jsx";
import VideoPreview from "../VideoPreview.jsx";

export default function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("videos")
      .select("id, title, description, file_path, created_at, owner:profiles!videos_owner_id_fkey(display_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (queryError || !Array.isArray(data)) {
      setError("Antrean video belum bisa dimuat.");
    } else {
      setError("");
      setVideos(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function review(id, status) {
    setBusyId(id);
    setError("");
    const { error: updateError } = await supabase.from("videos").update({ status }).eq("id", id);
    setBusyId(null);
    if (updateError) {
      setError("Status video belum bisa diubah. Coba lagi.");
      return;
    }
    setVideos((current) => current.filter((video) => video.id !== id));
  }

  if (loading) return <StatusMessage message="Memuat antrean video..." />;

  return (
    <section className="section-block">
      <div className="section__header section__header--left">
        <h2>Antrean review video</h2>
        <p>{videos.length} video menunggu keputusan.</p>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {videos.length === 0 && !error ? (
        <div className="empty-state">
          <p>Tidak ada video yang menunggu review.</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <article key={video.id} className="card video-card">
              <VideoPreview filePath={video.file_path} title={video.title} />
              <div className="video-card__body">
                <h3>{video.title}</h3>
                <p className="muted">
                  {video.owner?.display_name || "Kreator"} · {formatDate(video.created_at)}
                </p>
                {video.description && <p>{video.description}</p>}
                <div className="button-row">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busyId === video.id}
                    onClick={() => review(video.id, "approved")}
                  >
                    Setujui
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={busyId === video.id}
                    onClick={() => review(video.id, "rejected")}
                  >
                    Tolak
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
