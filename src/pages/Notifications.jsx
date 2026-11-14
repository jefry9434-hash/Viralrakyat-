import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { formatDate } from "../lib/format.js";
import StatusMessage from "../components/StatusMessage.jsx";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("notifications")
      .select("id, title, body, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (queryError || !Array.isArray(data)) {
      setError("Notifikasi belum bisa dimuat. Coba lagi beberapa saat.");
    } else {
      setError("");
      setItems(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id) {
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (updateError) {
      setError("Notifikasi belum bisa ditandai. Coba lagi.");
      return;
    }
    setItems((current) => current.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
  }

  async function markAllRead() {
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);
    if (updateError) {
      setError("Notifikasi belum bisa ditandai. Coba lagi.");
      return;
    }
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
  }

  if (loading) return <StatusMessage message="Memuat notifikasi..." />;

  const hasUnread = items.some((item) => !item.is_read);

  return (
    <div className="page page--narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">Notifikasi</p>
          <h1>Pemberitahuan Anda</h1>
        </div>
        <button type="button" className="btn btn-ghost" disabled={!hasUnread} onClick={markAllRead}>
          Tandai semua dibaca
        </button>
      </header>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      {items.length === 0 && !error ? (
        <div className="empty-state">
          <p>Belum ada notifikasi.</p>
        </div>
      ) : (
        <ul className="notification-list">
          {items.map((item) => (
            <li key={item.id} className={`card notification-item${item.is_read ? "" : " is-unread"}`}>
              <div className="notification-item__body">
                <div className="notification-item__head">
                  <strong>{item.title}</strong>
                  <span className="muted">{formatDate(item.created_at)}</span>
                </div>
                {item.body && <p>{item.body}</p>}
              </div>
              {!item.is_read && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => markRead(item.id)}>
                  Tandai dibaca
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
