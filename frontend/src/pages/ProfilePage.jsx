import { useState } from "react";
import { API_URL } from "../api";
import { toast } from "react-toastify";
import { User, Lock } from "lucide-react";

export default function ProfilePage() {
  const token = localStorage.getItem("access_token");

  const [newName, setNewName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const updateName = async () => {
    if (!newName) return toast.error("Please enter new name");

    try {
      const res = await fetch(
        `${API_URL}/profile/update-name?new_name=${newName}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setNewName("");
      } else {
        toast.error(data.detail);
      }
    } catch {
      toast.error("Failed to update name");
    }
  };

  const updatePassword = async () => {
    if (!currentPassword || !newPassword)
      return toast.error("All fields required");

    try {
      const res = await fetch(
        `${API_URL}/profile/update-password?current_password=${currentPassword}&new_password=${newPassword}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setCurrentPassword("");
        setNewPassword("");
      } else {
        toast.error(data.detail);
      }
    } catch {
      toast.error("Failed to update password");
    }
  };

  return (
    <div className="relative p-10 min-h-screen bg-gradient-to-br from-[#f0f7ff] to-[#fdf2f8]">

      {/* Glow Effects */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-300 blur-[120px] opacity-30" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-pink-300 blur-[120px] opacity-30" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-10">

        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold text-[#1e3a8a]">
            Profile Settings
          </h1>
          <p className="text-gray-500 mt-2">
            Manage your account details and security
          </p>
        </div>

        {/* Change Name Card */}
        <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-3xl p-8 shadow-[0_20px_60px_rgba(162,210,255,0.25)]">

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#bde0fe] to-[#a2d2ff] shadow-md">
              <User size={20} className="text-[#1e40af]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1e3a8a]">
              Change Name
            </h2>
          </div>

          <input
            type="text"
            placeholder="Enter new name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-300 outline-none transition mb-6"
          />

          <button
            onClick={updateName}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb]
                       text-white font-semibold shadow-lg
                       hover:scale-105 transition-all duration-300"
          >
            Update Name
          </button>
        </div>

        {/* Change Password Card */}
        <div className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-3xl p-8 shadow-[0_20px_60px_rgba(255,175,204,0.25)]">

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#ffafcc] to-[#ffc8dd] shadow-md">
              <Lock size={20} className="text-[#9d174d]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1e3a8a]">
              Change Password
            </h2>
          </div>

          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-300 outline-none transition mb-4"
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-300 outline-none transition mb-6"
          />

          <button
            onClick={updatePassword}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ec4899] to-[#db2777]
                       text-white font-semibold shadow-lg
                       hover:scale-105 transition-all duration-300"
          >
            Change Password
          </button>
        </div>

      </div>
    </div>
  );
}
