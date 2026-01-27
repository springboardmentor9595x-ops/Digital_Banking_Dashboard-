import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
  const [formData, setFormData] = useState({ 
    name: '',
    email: '', 
    password: '' 
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('token', res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.detail || 'Unknown error'));
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h2 className="form-title">Login</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            className="form-input" 
            type="text" 
            placeholder="Full Name" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required 
          />

          <input 
            className="form-input" 
            type="email" 
            placeholder="Email" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})} 
            required 
          />
          
          <input 
            className="form-input" 
            type="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})} 
            required 
          />
          
          <button type="submit" className="form-button">
            Login
          </button>
        </form>
        
        <p className="mt-4 text-sm text-center text-gray-600">
          Don't have an account? <Link to="/register" className="form-link">Register</Link>
        </p>
      </div>
    </div>
  );
}
