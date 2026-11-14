import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import StatusMessage from "./StatusMessage.jsx";

export default function RequireAuth({ roles, children }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <StatusMessage message="Memuat akun Anda..." />;
  if (!session) {
    return <Navigate to="/masuk" replace state={{ from: location.pathname }} />;
  }
  if (!profile) {
    return <StatusMessage message="Profil Anda belum bisa dimuat. Muat ulang halaman ini." />;
  }
  if (roles && !roles.includes(profile.role)) {
    return <StatusMessage message="Halaman ini tidak tersedia untuk akun Anda." />;
  }
  return children;
}
