import { useState } from 'react';
import { login } from './api';


// ==========================================
// LOGIN COMPONENT
// ==========================================
function Login({ onLoginSuccess, onGoToRegister }) {

  // ==========================================
  // STATE VARIABLES (Data that can change)
  // ==========================================
  
  // useState Hook: Creates a reactive variable
  // Format: const [value, setValue] = useState(initialValue);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ==========================================
  // EVENT HANDLER (Runs when form is submitted)
  // ==========================================
  
  const handleSubmit = async (e) => {
    // Prevent default form behavior (page refresh)
    e.preventDefault();
    
    // Clear any previous errors
    setError('');
    
    // Show loading state
    setLoading(true);
    
    try {
      // Call API (wait for response)
      const response = await login(email, password);
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.access_token);
      
      // Tell parent component login succeeded
      onLoginSuccess();
      
    } catch (err) {
      // If API call fails, show error message
      setError(err.response?.data?.detail || 'Login failed');
      
    } finally {
         // Hide loading state (runs whether success or failure)
      setLoading(false);
    }
  };
  
  // ==========================================
  // JSX (What gets displayed on screen)
  // ==========================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center p-4">

      {/* Container Box */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

        
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-2">
          Digital Banking Dashboard
        </h1>
        <h2 className="text-xl text-gray-700 text-center mb-8">
          Login to Your Account
        </h2>

        
        {/* Error Message (only shows if error exists) */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"

              placeholder="you@example.com"
            />
          </div>
          
          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"

          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {/* Register Link */}
        <p className="text-center text-sm mt-6 text-gray-600">
          Don't have an account?{' '}
          <button onClick={onGoToRegister} className="text-blue-600 hover:underline">
                Register
            </button>
        </p>
      </div>
    </div>
  );
}
export default Login;
