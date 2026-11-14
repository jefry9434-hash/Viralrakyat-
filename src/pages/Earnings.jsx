import { useMemo } from "react";
import { useCommissions } from "../hooks/useCommissions.js";
import { formatDate, formatRupiah } from "../lib/format.js";
import StatusBadge from "../components/StatusBadge.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

export default function Earnings() {
  const { commissions, loading, error, reload } = useCommissions();

  const totals = useMemo(() => {
    const sumWhere = (status) =>
      commissions
        .filter((item) => item.status === status)
        .reduce((sum, item) => sum + Number(item.amount), 0);
    return { balance: sumWhere("approved"), pending: sumWhere("pending") };
  }, [commissions]);

  if (loading) return <StatusMessage message="Memuat komisi Anda..." />;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Komisi dan saldo</p>
          <h1>Komisi & Saldo</h1>
        </div>
        <button type="button" className="btn btn-ghost" onClick={reload}>
          Muat ulang
        </button>
      </header>

      <div className="stat-grid">
        <div className="card stat-card stat-card--highlight">
          <span className="stat-card__label">Saldo tersedia</span>
          <strong className="stat-card__value">{formatRupiah(totals.balance)}</strong>
          <span className="stat-card__hint">Komisi yang sudah disetujui admin</span>
        </div>
        <div className="card stat-card">
          <span className="stat-card__label">Menunggu persetujuan</span>
          <strong className="stat-card__value">{formatRupiah(totals.pending)}</strong>
        </div>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      {commissions.length === 0 && !error ? (
        <div className="empty-state">
          <p>Belum ada komisi. Ikuti kampanye dan mulai sebarkan video untuk mendapatkannya.</p>
        </div>
      ) : (
        <ul className="list card">
          {commissions.map((item) => (
            <li key={item.id} className="list__item">
              <div>
                <strong>{formatRupiah(item.amount)}</strong>
                <span className="muted list__date">{formatDate(item.created_at)}</span>
              </div>
              <StatusBadge status={item.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
