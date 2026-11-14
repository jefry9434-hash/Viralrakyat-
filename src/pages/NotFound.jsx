import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="status-message">
      <h1>Halaman tidak ditemukan</h1>
      <p>Alamat yang Anda buka tidak tersedia.</p>
      <Link to="/" className="btn btn-primary">
        Kembali ke beranda
      </Link>
    </section>
  );
}
