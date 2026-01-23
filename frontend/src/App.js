import { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import { ToastContainer } from 'react-toastify';  // Notification library
import 'react-toastify/dist/ReactToastify.css';   // Notification styles

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
 return (
    <>
      <ToastContainer />

      {page === 'login' && (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onGoToRegister={() => setPage('register')}
        />
      )}

      {page === 'register' && (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onGoToLogin={() => setPage('login')}
        />
      )}

      {page === 'dashboard' && (
        <Dashboard onLogout={handleLogout} />
      )}


    </> 
  );
}

export default App;
