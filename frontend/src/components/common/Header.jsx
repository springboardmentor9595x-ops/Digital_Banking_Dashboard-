import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ title = "Modern Digital Banking", showLogout = false }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="w-full bg-blue-600 py-4 px-6 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">{title}</h1>
        {showLogout && (
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;