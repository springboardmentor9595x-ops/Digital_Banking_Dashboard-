import { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';

function App() {
  // Which page to show
  const [page, setPage] = useState('login');

  // Check login on first load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setPage('dashboard');
    }
  }, []);

  // Handlers
  const handleLoginSuccess = () => {
    setPage('dashboard');
  };

  const handleRegisterSuccess = () => {
    setPage('login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setPage('login');
  };

  // Render
  if (page === 'register') {
    return (
      <Register
        onRegisterSuccess={handleRegisterSuccess}
        onGoToLogin={() => setPage('login')}
      />
    );
  }

  if (page === 'dashboard') {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onGoToRegister={() => setPage('register')}
    />
  );
}

export default App;
