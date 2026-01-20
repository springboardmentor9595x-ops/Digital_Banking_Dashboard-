import { useState } from 'react';
import { register } from './api';
import { showSuccess, showError } from './utils/toast'; // Notification library

function Register({ onRegisterSuccess, onGoToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [kycStatus, setKycStatus] = useState('unverified');  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, phone);

      showSuccess('Account created successfully');
      onRegisterSuccess();

    } catch (err) {
      // showError(err.response?.data?.detail || 'Registration failed');
    } finally {
            setLoading(false);
        }
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center p-4">

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

        
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-2">
          Digital Banking Dashboard
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Create Your Account
        </p>


        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Test User"
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="test@example.com"
            />
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="9876543210"
            />
          </div>

          {/* KYC Status */}
          <div>
            <label className="block text-sm font-medium mb-2">
              KYC Status
            </label>
            <select
              value={kycStatus}
              onChange={(e) => setKycStatus(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="unverified">Unverified</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm mt-6 text-gray-600">
          Already have an account?{' '}
          <button onClick={onGoToLogin} className="text-blue-600 hover:underline">
            Login
        </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
