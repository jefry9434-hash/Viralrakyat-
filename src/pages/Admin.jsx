import { useState } from "react";
import AdminVideos from "../components/admin/AdminVideos.jsx";
import AdminCampaigns from "../components/admin/AdminCampaigns.jsx";
import AdminCommissions from "../components/admin/AdminCommissions.jsx";

const TABS = [
  { id: "videos", label: "Review video", Component: AdminVideos },
  { id: "campaigns", label: "Kampanye", Component: AdminCampaigns },
  { id: "commissions", label: "Komisi", Component: AdminCommissions },
];

export default function Admin() {
  const [activeId, setActiveId] = useState(TABS[0].id);
  const active = TABS.find((tab) => tab.id === activeId) ?? TABS[0];
  const ActiveComponent = active.Component;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Panel admin</p>
          <h1>Kelola platform</h1>
        </div>
      </header>

      <div className="tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={tab.id === active.id}
            className={`tab${tab.id === active.id ? " is-active" : ""}`}
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </div>
  );
}
