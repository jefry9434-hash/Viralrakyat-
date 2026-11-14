import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const CREATOR_STEPS = [
  "Unggah video promosi Anda dalam format MP4, WebM, atau MOV.",
  "Tim admin meninjau video agar sesuai ketentuan platform.",
  "Video yang disetujui tayang dan bisa dipromosikan promotor.",
];

const PROMOTER_STEPS = [
  "Pilih kampanye aktif dan ikuti dengan satu klik.",
  "Sebarkan video yang sudah disetujui dan gunakan kode pelacakan Anda.",
  "Komisi dicatat admin, lalu masuk ke saldo setelah disetujui.",
];

export default function Home() {
  const { session } = useAuth();

  return (
    <>
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">Platform kreator dan promotor</p>
          <h1>
            Ubah video Anda menjadi <span className="text-accent">pertumbuhan nyata</span>
          </h1>
          <p className="hero__lead">
            Viral Rakyat menghubungkan kreator dengan promotor profesional. Kampanye jelas,
            komisi transparan, dan proses persetujuan yang terkontrol.
          </p>
          <div className="hero__actions">
            {session ? (
              <Link to="/dashboard" className="btn btn-accent btn-lg">
                Buka dashboard
              </Link>
            ) : (
              <>
                <Link to="/daftar" className="btn btn-accent btn-lg">
                  Mulai sekarang
                </Link>
                <Link to="/masuk" className="btn btn-outline-light btn-lg">
                  Saya sudah punya akun
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="hero__media">
          <img
            src="https://images.pexels.com/photos/8357241/pexels-photo-8357241.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            alt="Kreator merekam video dengan smartphone di dapur"
            loading="eager"
          />
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h2>Dua peran, satu ekosistem</h2>
          <p>Setiap peran punya alur kerja sendiri yang sederhana dan transparan.</p>
        </div>
        <div className="feature-grid">
          <article className="card feature-card">
            <span className="feature-card__tag">Kreator</span>
            <h3>Unggah dan kembangkan karya Anda</h3>
            <ol className="steps">
              {CREATOR_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
          <article className="card feature-card">
            <span className="feature-card__tag">Promotor</span>
            <h3>Sebarkan dan dapatkan komisi</h3>
            <ol className="steps">
              {PROMOTER_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
        </div>
      </section>
    </>
  );
}
