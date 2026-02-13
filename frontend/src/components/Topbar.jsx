import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { uploadProfilePhoto, getUserProfile } from "../api/userApi";
import { API_URL } from "../api";

export default function Topbar() {
  const token = localStorage.getItem("access_token");
  const location = useLocation();
  const dropdownRef = useRef();

  
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState(null);

  const pageTitleMap = {
    "/dashboard": "Dashboard",
    "/dashboard/accounts": "Accounts",
    "/dashboard/transactions": "Transactions"
  };

  const pageTitle = pageTitleMap[location.pathname] || "Digital Banking";

  useEffect(() => {
  if (!token) return;
  getUserProfile(token).then(setProfile);
}, [token]);


  const handleUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const res = await uploadProfilePhoto(file, token);

  // Force refresh image and avoid browser cache
  setProfile(prev => ({
    ...prev,
    profile_image: res.image_url + "?t=" + new Date().getTime()
  }));
};


  return (
    <header className="h-20 px-6 flex justify-between items-center bg-white shadow">

      {/* LEFT */}
      <div>
        <h1 className="text-lg font-bold">{pageTitle}</h1>
        <p className="text-sm text-gray-500">{new Date().toDateString()}</p>
      </div>

      {/* CENTER */}
      <div className="px-6 py-2 rounded-xl bg-blue-100 font-semibold">
        Welcome, {profile?.name || "User"}
      </div>

      {/* RIGHT */}
      <div className="flex gap-4 items-center" ref={dropdownRef}>

        

        {/* Profile */}
        <div className="relative">
          <img
  src={profile?.profile_image ? `${API_URL}${profile.profile_image}` : "/avatar.png"}
  className="w-10 h-10 rounded-full"
  onClick={() => setShowProfile(!showProfile)}
/>


          {showProfile && (
            <div className="absolute right-0 mt-2 bg-white shadow rounded w-40">
              <label className="block px-4 py-2 text-sm cursor-pointer">
                Upload Photo
                <input type="file" hidden onChange={handleUpload} />
              </label>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/login";
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-500"
              >
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
