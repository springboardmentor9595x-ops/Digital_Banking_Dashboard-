import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user'
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      alert('Registration Successful! Please login.');
      navigate('/login');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || 'Registration failed'));
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h2 className="form-title">Register</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="form-input"
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <input
            className="form-input"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <input
            className="form-input"
            type="password"
            placeholder="Password (min 6 characters)"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <input
            className="form-input"
            type="tel"
            placeholder="Phone Number (Optional)"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <select
            className="form-input"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
          >
            <option value="user">Register as User</option>
            <option value="admin">Register as Admin</option>
          </select>

          <button type="submit" className="form-button">
            Register
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account? <Link to="/login" className="form-link">Login here</Link>
        </p>
      </div>
    </div>
  );
}
