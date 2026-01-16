import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { jwtDecode } from "jwt-decode";

export default function Dashboard() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : null;

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 px-8 py-6">
        {/* Header */}
        <header className="mb-8 ml-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Dashboard Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back to your digital banking space
            </p>
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="w-10 h-10 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center"
            >
              {user?.sub?.charAt(0).toUpperCase() || "U"}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg border border-slate-200 shadow-md">
                <div className="px-4 py-2 border-b text-sm text-slate-600">
                  {user?.sub}
                </div>

                <button
                  onClick={() => navigate("/profile")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                >
                  Profile
                </button>

                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Balance" value="₹ 0.00" />
          <StatCard title="Monthly Spend" value="₹ 0.00" />
          <StatCard title="Upcoming Bills" value="0" />
        </section>
      </main>
    </div>
  );
}

/* Reusable Minimal Card */
function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
