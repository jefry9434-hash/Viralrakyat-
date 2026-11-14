import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { formatDate } from "../../lib/format.js";
import StatusBadge from "../StatusBadge.jsx";
import StatusMessage from "../StatusMessage.jsx";

const EMPTY_FORM = { title: "", description: "", reward_info: "" };

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("campaigns")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false });
    if (queryError || !Array.isArray(data)) {
      setError("Daftar kampanye belum bisa dimuat.");
    } else {
      setError("");
      setCampaigns(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const { data, error: insertError } = await supabase
      .from("campaigns")
      .insert({
        title: form.title.trim(),
        description: form.description.trim(),
        reward_info: form.reward_info.trim(),
      })
      .select("id, title, status, created_at")
      .single();
    setSaving(false);
    if (insertError || !data) {
      setError("Kampanye belum bisa dibuat. Periksa isian lalu coba lagi.");
      return;
    }
    setCampaigns((current) => [data, ...current]);
    setForm(EMPTY_FORM);
  }

  async function toggleStatus(campaign) {
    const nextStatus = campaign.status === "active" ? "closed" : "active";
    setBusyId(campaign.id);
    setError("");
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({ status: nextStatus })
      .eq("id", campaign.id);
    setBusyId(null);
    if (updateError) {
      setError("Status kampanye belum bisa diubah. Coba lagi.");
      return;
    }
    setCampaigns((current) =>
      current.map((item) => (item.id === campaign.id ? { ...item, status: nextStatus } : item)),
    );
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  if (loading) return <StatusMessage message="Memuat kampanye..." />;

  return (
    <section className="section-block">
      <div className="section__header section__header--left">
        <h2>Buat kampanye</h2>
        <p>Kampanye aktif akan tampil untuk semua promotor.</p>
      </div>
      <form className="card form-card form-stack" onSubmit={handleCreate}>
        <label className="field">
          <span>Judul kampanye</span>
          <input
            className="input"
            type="text"
            maxLength={120}
            required
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
        </label>
        <label className="field">
          <span>Deskripsi</span>
          <textarea
            className="input textarea"
            rows={3}
            maxLength={2000}
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
        </label>
        <label className="field">
          <span>Keterangan komisi</span>
          <input
            className="input"
            type="text"
            maxLength={500}
            value={form.reward_info}
            onChange={(event) => updateField("reward_info", event.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Menyimpan..." : "Buat kampanye"}
        </button>
      </form>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      <ul className="list card">
        {campaigns.map((campaign) => (
          <li key={campaign.id} className="list__item">
            <div>
              <strong>{campaign.title}</strong>
              <span className="muted list__date">Dibuat {formatDate(campaign.created_at)}</span>
            </div>
            <div className="list__actions">
              <StatusBadge status={campaign.status} />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={busyId === campaign.id}
                onClick={() => toggleStatus(campaign)}
              >
                {campaign.status === "active" ? "Tutup" : "Buka kembali"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
