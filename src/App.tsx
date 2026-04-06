import { useState, useEffect } from 'react';
import { getSettings } from './store';
import type { StoreSettings } from './types';
import AdminPanel from './pages/AdminPanel';
import CustomerSite from './pages/CustomerSite';

function App() {
  const [view, setView] = useState<'customer' | 'admin'>('customer');
  const [settings, setSettings] = useState<StoreSettings>(getSettings());

  useEffect(() => {
    const handleStorage = () => {
      setSettings(getSettings());
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Check URL hash for routing
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#/admin') {
      setView('admin');
    } else {
      setView('customer');
    }

    const handleHash = () => {
      if (window.location.hash === '#/admin') {
        setView('admin');
      } else {
        setView('customer');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (view === 'admin') {
    return <AdminPanel />;
  }

  return <CustomerSite settings={settings} />;
}

export default App;
