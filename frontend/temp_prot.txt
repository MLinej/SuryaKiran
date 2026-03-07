import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';

export default function ProtectedRoute() {
    const { loading, isAuthenticated } = useContext(AuthContext);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: 'white' }}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to='/login' replace />;
    }

    return <Outlet />;
}
