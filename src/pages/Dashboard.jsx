import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import CreatorDashboard from "../components/dashboard/CreatorDashboard.jsx";
import PromoterDashboard from "../components/dashboard/PromoterDashboard.jsx";

export default function Dashboard() {
  const { profile } = useAuth();

  if (profile.role === "admin") return <Navigate to="/admin" replace />;
  return profile.role === "promoter" ? <PromoterDashboard profile={profile} /> : <CreatorDashboard profile={profile} />;
}
