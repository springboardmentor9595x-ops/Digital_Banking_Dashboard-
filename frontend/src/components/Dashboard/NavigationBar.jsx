import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Receipt, Settings, TrendingUp, Wallet, Award } from 'lucide-react';

const NavigationBar = ({ accountsRef }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAccountsClick = () => {
    if (location.pathname === '/dashboard') {
      accountsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/dashboard#accounts');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex items-center gap-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white px-4 py-3 hover:bg-white/20 transition-colors border-b-2 border-white font-semibold"
          >
            Dashboard
          </button>
          <button
            onClick={handleAccountsClick}
            className="flex items-center gap-2 text-white/90 px-4 py-3 hover:bg-white/20 hover:text-white transition-colors"
          >
            <Wallet size={18} />
            Accounts
          </button>
          <button
            onClick={() => navigate('/categories-management')}
            className="flex items-center gap-2 text-white/90 px-4 py-3 hover:bg-white/20 hover:text-white transition-colors"
          >
            <Settings size={18} />
            Categories
          </button>
          <button
            onClick={() => navigate('/budgets')}
            className="flex items-center gap-2 text-white/90 px-4 py-3 hover:bg-white/20 hover:text-white transition-colors"
          >
            <TrendingUp size={18} />
            Budgets
          </button>
          <button
            onClick={() => navigate('/bills')}
            className="flex items-center gap-2 text-white/90 px-4 py-3 hover:bg-white/20 hover:text-white transition-colors"
          >
            <Receipt size={18} />
            Bills
          </button>
          <button
            onClick={() => navigate('/rewards')}
            className="flex items-center gap-2 text-white/90 px-4 py-3 hover:bg-white/20 hover:text-white transition-colors"
          >
            <Award size={18} />
            Rewards
          </button>
          <button
            onClick={() => navigate('/alerts')}
            className="flex items-center gap-2 text-white/90 px-4 py-3 hover:bg-white/20 hover:text-white transition-colors"
          >
            <Bell size={18} />
            Alerts
          </button>
        </nav>
      </div>
    </div>
  );
};

export default NavigationBar;
