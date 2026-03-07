import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Landing from '@/pages/Landing';
import AppLayout from '@/layouts/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Inverters from '@/pages/Inverters';
import InverterDetail from '@/pages/InverterDetail';
import Copilot from '@/pages/Copilot';
import Analytics from '@/pages/Analytics';
import Alerts from '@/pages/Alerts';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Maintenance from '@/pages/Maintenance';
import EnergyImpact from '@/pages/EnergyImpact';
import Reports from '@/pages/Reports';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/layouts/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path='/' element={<Landing />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/inverter' element={<Inverters />} />
              <Route path='/inverter/:id' element={<InverterDetail />} />
              <Route path='/copilot' element={<Copilot />} />
              <Route path='/analytics' element={<Analytics />} />
              <Route path='/alerts' element={<Alerts />} />
              <Route path='/maintenance' element={<Maintenance />} />
              <Route path='/energy' element={<EnergyImpact />} />
              <Route path='/reports' element={<Reports />} />
            </Route>
          </Route>

          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
