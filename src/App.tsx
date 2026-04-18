import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Pages - to be created
import CustomerSite from './pages/CustomerSite';
import AdminPanel from './pages/AdminPanel';
import PDVPanel from './pages/PDVPanel';
import Login from './pages/Login';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    const unsubscribeConfig = onSnapshot(doc(db, 'config', 'main'), (doc) => {
      if (doc.exists()) {
        setConfig(doc.data());
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeConfig();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerSite config={config} />} />
        <Route path="/admin/*" element={user ? <AdminPanel user={user} config={config} /> : <Navigate to="/login" />} />
        <Route path="/pdv" element={user ? <PDVPanel user={user} config={config} /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
