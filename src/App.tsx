import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerView from './views/CustomerView';
import AdminView from './views/AdminView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CustomerView />} />
        <Route path="/admin" element={<AdminView />} />
      </Routes>
    </Router>
  );
}

export default App;
