import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Client from './pages/Client';
import Admin from './pages/Admin';
import { useStore } from './store/useStore';
import { useEffect } from 'react';

function App() {
  const { config } = useStore();

  useEffect(() => {
    // Apply primary color to CSS variables for dynamic styling
    document.documentElement.style.setProperty('--color-primary', config.primaryColor);
  }, [config.primaryColor]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Client />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;