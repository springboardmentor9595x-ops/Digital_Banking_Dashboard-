import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <>
      {/* Burger Button (Mobile) */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow border"
      >
        ☰
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-50 top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 px-6 py-8 transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xl font-semibold text-slate-800">
            Digital Bank
          </h2>
          <button
            className="md:hidden text-xl"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav>
          <ul className="space-y-2">
            <NavItem label="Dashboard" />
            <NavItem label="Accounts" />
            <NavItem label="Transactions" />
            <NavItem label="Budgets" />
            <NavItem label="Bills" />
          </ul>
        </nav>

        {/* Logout */}
        <div className="mt-12">
          <button
            onClick={logout}
            className="w-full text-sm font-medium text-red-600 border border-red-200 rounded-lg py-2 hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

/* Reusable Nav Item */
function NavItem({ label }) {
  return (
    <li className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition">
      {label}
    </li>
  );
}
