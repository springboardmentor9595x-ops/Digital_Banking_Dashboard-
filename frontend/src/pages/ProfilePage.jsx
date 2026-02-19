import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Save, ArrowLeft, Eye, EyeOff, 
  Shield, Calendar, Edit2, CheckCircle, XCircle, Clock 
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  
  // State for profile data from API
  const [profileData, setProfileData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    kyc_status: '',
    role: '',
    created_at: ''
  });

  // State for editing (separate from display data)
  const [editData, setEditData] = useState({
    name: '',
    phone: ''
  });

  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // ============================================
  // FETCH PROFILE DATA ON LOAD
  // ============================================
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Call GET /auth/profile (your new endpoint)
      const res = await api.get('/auth/profile');
      
      // Store the response data
      setProfileData(res.data);
      
      // Initialize edit form with current data
      setEditData({
        name: res.data.name,
        phone: res.data.phone || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      
      // Redirect to login if unauthorized
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLE PROFILE UPDATE (Name & Phone)
  // ============================================
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Validate phone (10 digits)
    if (editData.phone && !/^[0-9]{10}$/.test(editData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    // Validate name
    if (!editData.name.trim() || editData.name.length < 3) {
      toast.error('Name must be at least 3 characters long');
      return;
    }

    try {
      setSaving(true);
      
      // Call PATCH /auth/profile with name and phone
      await api.patch('/auth/profile', {
        name: editData.name.trim(),
        phone: editData.phone || null,
      });
      
      toast.success('Profile updated successfully! ');
      setEditingProfile(false);
      
      // Refresh profile data
      fetchProfile();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to update profile';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // HANDLE PASSWORD CHANGE
  // ============================================
  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    // Validate password length
    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setSaving(true);
      
      // Call PATCH /auth/change-password
      await api.patch('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      
      toast.success('Password changed successfully! ');
      
      // Reset form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setShowPasswordSection(false);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to change password';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // HELPER: KYC Status Badge
  // ============================================
  const getKYCBadge = (status) => {
    const badges = {
      verified: {
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: <CheckCircle size={16} />,
        text: 'Verified'
      },
      unverified: {
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: <XCircle size={16} />,
        text: 'Unverified'
      },
      pending: {
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: <Clock size={16} />,
        text: 'Pending'
      }
    };
    
    const badge = badges[status] || badges.unverified;
    
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </div>
    );
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-xl text-gray-600">Loading profile...</div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-gray-600 mt-1">Manage your account settings and security</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        
        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-xl shadow-lg text-white">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30">
              {profileData.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-1">{profileData.name}</h2>
              <p className="text-blue-100 mb-3">{profileData.email}</p>
              <div className="flex items-center gap-4">
                {getKYCBadge(profileData.kyc_status)}
                <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1.5 rounded-full">
                  <Calendar size={14} />
                  Joined {new Date(profileData.created_at).toLocaleDateString('en-IN', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <User className="text-blue-600" size={24} />
              Account Details
            </h3>
            {!editingProfile ? (
              <button
                onClick={() => setEditingProfile(true)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition"
              >
                <Edit2 size={18} />
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingProfile(false);
                  setEditData({
                    name: profileData.name,
                    phone: profileData.phone || ''
                  });
                }}
                className="text-gray-600 hover:text-gray-700 font-medium transition"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* User ID (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                User ID
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-mono">
                #{profileData.id}
              </div>
            </div>

            {/* Name (Editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                Full Name * {editingProfile && <span className="text-green-600 text-xs">(Editable)</span>}
              </label>
              {editingProfile ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full p-3 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20"
                  placeholder="Enter your full name"
                  required
                  minLength="3"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                  {profileData.name}
                </div>
              )}
            </div>

            {/* Email (Read-only - BLOCKED) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={18} className="text-red-600" />
                Email Address <span className="text-xs text-red-600 font-semibold">(Cannot be changed)</span>
              </label>
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-gray-700 flex items-center justify-between">
                <span>{profileData.email}</span>
                <span className="text-xs text-red-600 font-semibold"> Locked</span>
              </div>
            </div>

            {/* Phone (Editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone size={18} className="text-green-600" />
                Phone Number {editingProfile && <span className="text-green-600 text-xs">(Editable)</span>}
              </label>
              {editingProfile ? (
                <>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full p-3 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20"
                    placeholder="9876543210"
                    maxLength="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number</p>
                </>
              ) : (
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium">
                  {profileData.phone || 'Not provided'}
                </div>
              )}
            </div>

            {/* KYC Status (Read-only - BLOCKED) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Shield size={18} className="text-purple-600" />
                KYC Status <span className="text-xs text-purple-600 font-semibold">(Cannot be changed)</span>
              </label>
              <div className="px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                <span className="text-gray-700 font-medium capitalize">{profileData.kyc_status}</span>
                <span className="text-xs text-purple-600 font-semibold"> Locked</span>
              </div>
            </div>

            {/* Account Role (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Role
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium capitalize">
                {profileData.role}
              </div>
            </div>

            {/* Save Button (Only shown when editing) */}
            {editingProfile && (
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Shield className="text-red-600" size={24} />
              Security Settings
            </h3>
            <button
              onClick={() => {
                setShowPasswordSection(!showPasswordSection);
                if (showPasswordSection) {
                  setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: '',
                  });
                }
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                showPasswordSection
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showPasswordSection ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordSection && (
            <form onSubmit={handleChangePassword} className="space-y-4 mt-6">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20"
                    minLength="8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
