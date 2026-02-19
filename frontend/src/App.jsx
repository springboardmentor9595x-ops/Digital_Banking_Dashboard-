import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AccountDetail from './pages/AccountDetail';
import CategoriesManagement from './pages/CategoriesManagement';
import BudgetManagement from './pages/BudgetManagement';
import BillsPage from './pages/BillsPage'; 
import RewardsPage from './pages/RewardsPage';
import ProfilePage from './pages/ProfilePage';
import AlertsCenter from './pages/AlertsCenter';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/account/:accountId" element={<AccountDetail />} />
        <Route path="/categories-management" element={<CategoriesManagement />} />
        <Route path="/budgets" element={<BudgetManagement />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/profile" element={<ProfilePage />} /> 
        <Route path="/alerts" element={<AlertsCenter />} />
      </Routes>
    </Router>
  );
}

export default App;
