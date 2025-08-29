// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layouts/Layout";

// Tracing
import Tracing from "./Pages/Tracing/Tracing";
import Sessions from "./Pages/Tracing/Sessions/Sessions";
import SessionDetail from "./Pages/Tracing/Sessions/SessionDetail";

// Prompts
import Prompts from "./Pages/Prompts/Prompts";
import PromptsDetail from "./Pages/Prompts/PromptsDetail";
import PromptsNew from "./Pages/Prompts/PromptsNew";

// Dashboards
import Dashboards from "./Pages/DashBoard/Dashboards";
import DashboardDetail from "./Pages/DashBoard/DashboardDetail";
import DashboardNew from "./Pages/DashBoard/DashboardNew.jsx";

// Widgets
import NewWidgetPage from "./Pages/Widget/pages/NewWidgetPage.jsx"; // ✅
import WidgetDetail from "./Pages/Widget/pages/WidgetDetail.jsx"; // ✅

// Settings
import SettingsPage from "./Pages/Settings/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* 홈 -> /trace */}
        <Route index element={<Navigate to="/trace" replace />} />

        {/* Tracing */}
        <Route path="trace" element={<Tracing />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="sessions/:sessionId" element={<SessionDetail />} />

        {/* Prompts */}
        <Route path="prompts" element={<Prompts />} />
        <Route path="prompts/:id" element={<PromptsDetail />} />
        <Route path="prompts/new" element={<PromptsNew />} />

        {/* Dashboards */}
        <Route path="dashboards" element={<Dashboards />} />
        <Route path="dashboards/new" element={<DashboardNew />} />
        <Route path="dashboards/:dashboardId" element={<DashboardDetail />} />

        {/* Widgets */}
        <Route path="widgets/new" element={<NewWidgetPage />} />
        <Route path="dashboards/widgets/new" element={<NewWidgetPage />} />
        <Route path="widgets/:widgetId" element={<WidgetDetail />} />

        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
