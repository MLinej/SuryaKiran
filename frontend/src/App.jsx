import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import InverterDetail from "./pages/InverterDetail";
import Copilot from "./pages/Copilot";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Landing />} />

        {/* Authenticated Routes with Sidebar Navigation */}
        <Route path="/" element={<AppLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inverter/:id" element={<InverterDetail />} />
          <Route path="copilot" element={<Copilot />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="alerts" element={<Alerts />} />
        </Route>
      </Routes>
    </Router>
  );
}
