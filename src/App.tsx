
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './store/DataContext';
import ClientPage from './pages/ClientPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ClientPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
