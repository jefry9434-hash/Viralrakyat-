export const ROLE_LABELS = {
  creator: "Kreator",
  promoter: "Promotor",
  admin: "Admin",
};

export const STATUS_META = {
  pending: { label: "Menunggu", tone: "warning" },
  approved: { label: "Disetujui", tone: "success" },
  rejected: { label: "Ditolak", tone: "error" },
  active: { label: "Aktif", tone: "success" },
  closed: { label: "Ditutup", tone: "neutral" },
};

export function formatRupiah(value) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
