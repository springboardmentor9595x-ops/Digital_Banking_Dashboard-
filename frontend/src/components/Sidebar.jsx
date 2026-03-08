import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  PieChart,
  Receipt,
  Gift,
  BarChart3,
  Settings,
  Tag,
  LogOut,
  Bell,
  FileText
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";


export default function Sidebar() { 
  const [alerts, setAlerts] = useState([]);
const token = localStorage.getItem("access_token");

useEffect(() => {
  if (!token) return;

  axios.get("http://127.0.0.1:8000/alerts/", {
    headers: { Authorization: `Bearer ${token}` },
  })
  .then(res => setAlerts(res.data))
  .catch(err => console.log(err));
}, []);

const unread = alerts.filter(a => !a.read_status).length;

  const menu = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Accounts", path: "/dashboard/accounts", icon: CreditCard },
    { name: "Transactions", path: "/dashboard/transactions", icon: ArrowLeftRight },
    { name: "Categories", path: "/dashboard/categories", icon: Tag },
    { name: "Budgets", path: "/dashboard/budgets", icon: PieChart },
    { name: "Bills", path: "/dashboard/bills", icon: Receipt },
    { name: "Rewards", path: "/dashboard/rewards", icon: Gift },
    // { name: "Insights", path: "/dashboard/insights", icon: BarChart3 },
    { name: "Alerts", path: "/dashboard/alerts", icon: Bell },
    // { name: "Settings", path: "/dashboard/settings", icon: Settings },
    { name: "Profile", path: "/dashboard/profile", icon: Settings },

    { name: "Reports", path: "/dashboard/reports", icon: FileText },

  ];

  return (
  <aside className="relative w-80 min-h-screen bg-gradient-to-b from-[#f0f7ff] to-[#e6f0ff] overflow-hidden border-r border-blue-100">

    {/* Ambient Glow */}
    <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#a2d2ff] blur-[140px] opacity-40" />
    <div className="absolute bottom-0 -right-32 w-96 h-96 bg-[#ffafcc] blur-[140px] opacity-30" />

    <div className="relative z-10 flex flex-col h-full px-6 py-8">

      {/* Brand */}
      <div className="mb-14">
        <h1 className="text-3xl font-extrabold tracking-wider text-[#1e3a8a]">
          Bank<span className="text-[#60a5fa]">Sphere</span>
        </h1>
        <p className="text-xs text-[#3b82f6] tracking-widest uppercase mt-1">
          Premium Digital Finance
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4">
        {menu.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300
                ${
                  isActive
                    ? "bg-blue-500/10 shadow-[0_0_35px_#a2d2ff] scale-[1.05]"
                    : "hover:bg-blue-500/5 hover:translate-x-1"
                }`
              }
            >
              {/* Soft Border */}
              <div className="absolute inset-0 rounded-2xl border border-blue-200/40 group-hover:border-blue-400/50 transition" />

              {/* Icon */}
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-[#bde0fe] to-[#a2d2ff] shadow-[0_8px_20px_rgba(162,210,255,0.45)]">
                <Icon size={18} className="text-[#1e40af]" />
              </div>

              {/* Text */}
              <span className="relative text-sm font-semibold text-[#1e3a8a] group-hover:text-[#2563eb] tracking-wide">
                {item.name}

                {item.name === "Alerts" && unread > 0 && (
                  <span className="absolute -top-2 -right-6 bg-red-500 text-white text-xs px-2 rounded-full">
                    {unread}
                  </span>
                )}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Only */}
      <div className="mt-8">
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="flex items-center gap-2 text-sm text-[#2563eb] hover:text-[#1e40af] transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

    </div> {/* ✅ This was missing */}

  </aside>
);
}