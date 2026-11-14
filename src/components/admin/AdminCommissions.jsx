import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { formatDate, formatRupiah } from "../../lib/format.js";
import StatusBadge from "../StatusBadge.jsx";
import StatusMessage from "../StatusMessage.jsx";

const MAX_COMMISSION = 100000000;

export default function AdminCommissions() {
  const [promotions, setPromotions] = useState([]);
  const [pendingCommissions, setPendingCommissions] = useState([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [promotionResult, commissionResult] = await Promise.all([
      supabase
        .from("promotions")
        .select(
          "id, promoter_id, tracking_code, campaign:campaigns(title), promoter:profiles!promotions_promoter_id_fkey(display_name)",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("commissions")
        .select("id, amount, created_at, status, promoter:profiles!commissions_promoter_id_fkey(display_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
    ]);
    if (promotionResult.error || commissionResult.error) {
      setError("Data komisi belum bisa dimuat.");
    } else {
      setError("");
      setPromotions(promotionResult.data ?? []);
      setPendingCommissions(commissionResult.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRecord(event) {
    event.preventDefault();
    setError("");
    setInfo("");
    const selected = promotions.find((item) => item.id === selectedPromotionId);
    const value = Number(amount);
    if (!selected) {
      setError("Pilih promosi terlebih dahulu.");
      return;
    }
    if (!Number.isInteger(value) || value <= 0 || value > MAX_COMMISSION) {
      setError("Nominal komisi harus bilangan bulat antara 1 dan 100.000.000.");
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from("commissions").insert({
      promotion_id: selected.id,
      promoter_id: selected.promoter_id,
      amount: value,
    });
    setSaving(false);
    if (insertError) {
      setError("Komisi belum bisa dicatat. Coba lagi.");
      return;
    }
    setInfo("Komisi berhasil dicatat dan menunggu persetujuan.");
    setAmount("");
    setSelectedPromotionId("");
    load();
  }

  async function approve(id) {
    setBusyId(id);
    setError("");
    const { error: updateError } = await supabase
      .from("commissions")
      .update({ status: "approved" })
      .eq("id", id);
    setBusyId(null);
    if (updateError) {
      setError("Komisi belum bisa disetujui. Coba lagi.");
      return;
    }
    setPendingCommissions((current) => current.filter((item) => item.id !== id));
  }

  if (loading) return <StatusMessage message="Memuat data komisi..." />;

  return (
    <div className="admin-commissions">
      <section className="section-block">
        <div className="section__header section__header--left">
          <h2>Catat komisi</h2>
          <p>Pilih promosi promotor, lalu masukkan nominal komisi.</p>
        </div>
        <form className="card form-card form-stack" onSubmit={handleRecord}>
          <label className="field">
            <span>Promosi</span>
            <select
              className="input"
              required
              value={selectedPromotionId}
              onChange={(event) => setSelectedPromotionId(event.target.value)}
            >
              <option value="">Pilih promosi</option>
              {promotions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.promoter?.display_name || "Promotor"} · {item.campaign?.title || "Kampanye"} · {item.tracking_code}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Nominal (Rupiah)</span>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Mencatat..." : "Catat komisi"}
          </button>
          {info && <p className="alert alert-success" role="status">{info}</p>}
        </form>
      </section>

      <section className="section-block">
        <div className="section__header section__header--left">
          <h2>Menunggu persetujuan</h2>
          <p>{pendingCommissions.length} komisi belum disetujui.</p>
        </div>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        {pendingCommissions.length === 0 && !error ? (
          <div className="empty-state">
            <p>Tidak ada komisi yang menunggu persetujuan.</p>
          </div>
        ) : (
          <ul className="list card">
            {pendingCommissions.map((item) => (
              <li key={item.id} className="list__item">
                <div>
                  <strong>{item.promoter?.display_name || "Promotor"}</strong>
                  <span className="muted list__date">
                    {formatRupiah(item.amount)} · {formatDate(item.created_at)}
                  </span>
                </div>
                <div className="list__actions">
                  <StatusBadge status={item.status} />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busyId === item.id}
                    onClick={() => approve(item.id)}
                  >
                    Setujui
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
