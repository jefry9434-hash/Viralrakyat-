import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const MIN_PASSWORD_LENGTH = 8;

const ROLE_OPTIONS = [
  { value: "creator", title: "Kreator", description: "Unggah video dan biarkan promotor menyebarkannya." },
  { value: "promoter", title: "Promotor", description: "Ikuti kampanye dan dapatkan komisi dari setiap hasil." },
];

export default function Register() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("creator");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setInfo("");
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      return;
    }
    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: displayName.trim(), role } },
    });
    setSubmitting(false);
    if (signUpError) {
      setError(
        /already registered/i.test(signUpError.message)
          ? "Email ini sudah terdaftar. Silakan masuk."
          : "Pendaftaran belum berhasil. Periksa data Anda lalu coba lagi.",
      );
      return;
    }
    if (data.session) {
      navigate("/dashboard", { replace: true });
      return;
    }
    setInfo("Akun berhasil dibuat. Silakan masuk dengan email dan kata sandi Anda.");
  }

  return (
    <section className="auth-page">
      <div className="auth-card auth-card--wide">
        <h1>Buat akun baru</h1>
        <p className="auth-card__lead">Pilih peran Anda di Viral Rakyat.</p>
        <form onSubmit={handleSubmit} className="form-stack">
          <fieldset className="role-options">
            <legend>Saya ingin menjadi</legend>
            {ROLE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`role-option${role === option.value ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                />
                <span className="role-option__title">{option.title}</span>
                <span className="role-option__text">{option.description}</span>
              </label>
            ))}
          </fieldset>
          <label className="field">
            <span>Nama tampilan</span>
            <input
              className="input"
              type="text"
              maxLength={80}
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Kata sandi</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <small className="field__hint">Minimal {MIN_PASSWORD_LENGTH} karakter.</small>
          </label>
          {error && <p className="alert alert-error" role="alert">{error}</p>}
          {info && <p className="alert alert-success" role="status">{info}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Membuat akun..." : "Daftar"}
          </button>
        </form>
        <p className="auth-card__footer">
          Sudah punya akun? <Link to="/masuk">Masuk</Link>
        </p>
      </div>
    </section>
  );
}
