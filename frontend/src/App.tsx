import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Loader2 } from 'lucide-react';

import AdminDashboard from './pages/AdminDashboard';
import LoginAdmin from './pages/LoginAdmin';
import LoginParceiro from './pages/LoginParceiro';
import PortalParceiro from './pages/PortalParceiro';

export default function App() {
  const [adminSession, setAdminSession] = useState<any>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  // Verifica Autenticação Oficial (Gestão)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdminSession(session);
      setLoadingAdmin(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAdminSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loadingAdmin) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-blue-500">
        <Loader2 className="animate-spin mb-4" size={40} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* ÁREA DA GESTÃO */}
        <Route path="/login-admin" element={!adminSession ? <LoginAdmin /> : <Navigate to="/admin" replace />} />
        <Route path="/admin" element={adminSession ? <AdminDashboard /> : <Navigate to="/login-admin" replace />} />
        
        {/* ÁREA DO PARCEIRO */}
        <Route path="/login-parceiro" element={<LoginParceiro />} />
        <Route path="/portal-parceiro" element={<PortalParceiro />} />
      </Routes>
    </BrowserRouter>
  );
}