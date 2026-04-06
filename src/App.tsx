import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import AdminPanel from './components/AdminPanel';
import ClientStore from './components/ClientStore';

function App() {
  return (
    <StoreProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ClientStore />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Router>
    </StoreProvider>
  );
}

export default App;
