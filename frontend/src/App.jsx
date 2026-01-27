import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AccountDetail from './pages/AccountDetail';  // ← Make sure this is here
import CategoriesManagement from './pages/CategoriesManagement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/account/:accountId" element={<AccountDetail />} />  {/* ← THIS LINE */}
        <Route path="/categories-management" element={<CategoriesManagement />} />
      </Routes>
    </Router>
  );
}

export default App;

