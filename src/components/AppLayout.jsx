import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabase.js";

const NAV_BY_ROLE = {
  creator: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/upload", label: "Upload Video" },
  ],
  promoter: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/kampanye", label: "Kampanye" },
    { to: "/komisi", label: "Komisi & Saldo" },
  ],
  admin: [{ to: "/admin", label: "Admin" }],
};

export default function AppLayout() {
  const { session, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!session) {
      setUnreadCount(0);
      return;
    }
    (async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      if (!error) setUnreadCount(count ?? 0);
    })();
  }, [session, location.pathname]);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  const links = profile
    ? [
        ...(NAV_BY_ROLE[profile.role] ?? []),
        { to: "/notifikasi", label: "Notifikasi", badge: unreadCount },
      ]
    : [];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/" className="brand">
            Viral Rakyat
          </Link>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <nav className={`app-nav${menuOpen ? " is-open" : ""}`}>
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className="app-nav__link">
                {link.label}
                {link.badge > 0 && <span className="nav-badge">{link.badge}</span>}
              </NavLink>
            ))}
            {session ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleSignOut}>
                Keluar
              </button>
            ) : (
              <>
                <NavLink to="/masuk" className="app-nav__link">
                  Masuk
                </NavLink>
                <Link to="/daftar" className="btn btn-accent btn-sm">
                  Daftar
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Viral Rakyat. Platform kreator, promotor, dan komunitas digital.</p>
      </footer>
    </div>
  );
}
