import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Email atau kata sandi salah."
          : "Tidak dapat masuk saat ini. Periksa koneksi Anda lalu coba lagi.",
      );
      return;
    }
    navigate(location.state?.from ?? "/dashboard", { replace: true });
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Masuk ke akun Anda</h1>
        <p className="auth-card__lead">Lanjutkan ke dashboard kreator atau promotor Anda.</p>
        <form onSubmit={handleSubmit} className="form-stack">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="alert alert-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Memproses..." : "Masuk"}
          </button>
        </form>
        <p className="auth-card__footer">
          Belum punya akun? <Link to="/daftar">Daftar sekarang</Link>
        </p>
      </div>
    </section>
  );
}
