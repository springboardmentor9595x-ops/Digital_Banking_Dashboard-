import { useState } from "react";
import BackgroundBubbles from "../components/BackgroundBubbles";


export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMsg("Account created — redirecting...");
        setTimeout(() => (window.location.href = "/login"), 1200);
      } else {
        const d = await res.json();
        setMsg(d.detail || "User already exists");
      }
    } catch {
      setMsg("Server error");
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-2 relative overflow-hidden">

      {/* wave background */}
      <div className="absolute inset-0 -z-10">
        <svg viewBox="0 0 1440 800" className="w-full h-full">
          <path
            fill="#ffc8dd"
            d="M0,96L80,122.7C160,149,320,203,480,224C640,245,800,235,960,240C1120,245,1280,267,1360,277.3L1440,288V800H0Z"
          ></path>
          <path
            fill="#ffafcc"
            d="M0,256L1440,352V800H0Z"
            opacity=".7"
          ></path>
          <path
            fill="#cdb4db"
            d="M0,384L1440,448V800H0Z"
            opacity=".5"
          ></path>
        </svg>
      </div>

      {/* left section */}
      <div className="flex flex-col justify-center pl-14">
        <h1 className="text-5xl font-extrabold text-gray-800 leading-tight">
          Create your account  
          <span className="text-[#a2d2ff]"> & begin your journey</span>
        </h1>

        <p className="mt-4 text-gray-600 text-lg">
          Manage money differently — colorful, calm and creative 🌷
        </p>

        <img
          className="w-72 mt-10 drop-shadow-2xl animate-bounce"
          src="https://cdn-icons-png.flaticon.com/512/7067/7067002.png"
        />
      </div>

      {/* form */}
      <div className="flex justify-center items-center pr-16">
        <form
          onSubmit={submit}
          className="bg-white/90 backdrop-blur-xl w-[420px] rounded-3xl shadow-2xl p-8 space-y-5"
        >
          <h2 className="text-2xl font-bold text-center text-[#cdb4db]">
            Sign Up
          </h2>

          <div className="flex items-center gap-2 bg-white border rounded-xl p-3">
            <span>👤</span>
            <input
              name="name"
              placeholder="Full Name"
              onChange={change}
              className="outline-none flex-1"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border rounded-xl p-3">
            <span>📧</span>
            <input
              name="email"
              placeholder="Email"
              onChange={change}
              className="outline-none flex-1"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border rounded-xl p-3">
            <span>🔒</span>
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={change}
              className="outline-none flex-1"
            />
          </div>

          <button className="w-full py-3 rounded-2xl font-semibold text-white shadow-lg bg-gradient-to-r from-[#bde0fe] to-[#a2d2ff] hover:scale-[1.04] transition">
            Create account
          </button>

          {msg && <p className="text-center text-gray-700">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
