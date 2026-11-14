import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { formatDate } from "../lib/format.js";
import StatusBadge from "../components/StatusBadge.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joiningId, setJoiningId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [campaignResult, promotionResult] = await Promise.all([
      supabase
        .from("campaigns")
        .select("id, title, description, reward_info, status, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("promotions").select("id, campaign_id, tracking_code"),
    ]);
    if (campaignResult.error || !Array.isArray(campaignResult.data) || promotionResult.error) {
      setError("Kampanye belum bisa dimuat. Coba lagi beberapa saat.");
    } else {
      setError("");
      setCampaigns(campaignResult.data);
      setPromotions(promotionResult.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleJoin(campaignId) {
    setError("");
    setJoiningId(campaignId);
    const { data, error: joinError } = await supabase
      .from("promotions")
      .insert({ campaign_id: campaignId })
      .select("id, campaign_id, tracking_code")
      .single();
    setJoiningId(null);
    if (joinError || !data) {
      setError("Anda belum bisa mengikuti kampanye ini. Coba lagi beberapa saat.");
      return;
    }
    setPromotions((current) => [...current, data]);
  }

  if (loading) return <StatusMessage message="Memuat kampanye..." />;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Kampanye</p>
          <h1>Kampanye aktif</h1>
        </div>
      </header>
      {error && <p className="alert alert-error" role="alert">{error}</p>}

      {campaigns.length === 0 && !error ? (
        <div className="empty-state">
          <p>Belum ada kampanye. Pantau terus halaman ini.</p>
        </div>
      ) : (
        <div className="campaign-grid">
          {campaigns.map((campaign) => {
            const promotion = promotions.find((item) => item.campaign_id === campaign.id);
            return (
              <article key={campaign.id} className="card campaign-card">
                <div className="campaign-card__header">
                  <StatusBadge status={campaign.status} />
                  <span className="muted">{formatDate(campaign.created_at)}</span>
                </div>
                <h2>{campaign.title}</h2>
                {campaign.description && <p>{campaign.description}</p>}
                {campaign.reward_info && (
                  <p className="campaign-card__reward">Komisi: {campaign.reward_info}</p>
                )}
                {promotion ? (
                  <div className="tracking-box">
                    <span className="muted">Kode pelacakan Anda</span>
                    <strong className="tracking-code">{promotion.tracking_code}</strong>
                  </div>
                ) : campaign.status === "active" ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    disabled={joiningId === campaign.id}
                    onClick={() => handleJoin(campaign.id)}
                  >
                    {joiningId === campaign.id ? "Bergabung..." : "Ikuti kampanye"}
                  </button>
                ) : (
                  <p className="muted">Kampanye ini sudah ditutup.</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
