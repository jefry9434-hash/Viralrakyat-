import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import Admin from "./pages/Admin.jsx";
import Campaigns from "./pages/Campaigns.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Earnings from "./pages/Earnings.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import Notifications from "./pages/Notifications.jsx";
import Register from "./pages/Register.jsx";
import Upload from "./pages/Upload.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="masuk" element={<Login />} />
          <Route path="daftar" element={<Register />} />
          <Route
            path="dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="upload"
            element={
              <RequireAuth roles={["creator"]}>
                <Upload />
              </RequireAuth>
            }
          />
          <Route
            path="kampanye"
            element={
              <RequireAuth roles={["promoter"]}>
                <Campaigns />
              </RequireAuth>
            }
          />
          <Route
            path="komisi"
            element={
              <RequireAuth roles={["promoter"]}>
                <Earnings />
              </RequireAuth>
            }
          />
          <Route
            path="notifikasi"
            element={
              <RequireAuth>
                <Notifications />
              </RequireAuth>
            }
          />
          <Route
            path="admin"
            element={
              <RequireAuth roles={["admin"]}>
                <Admin />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
