import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackgroundBubbles from "../components/BackgroundBubbles";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();

    const res = await fetch("http://127.0.0.1:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const d = await res.json();

    if (res.ok) {
      localStorage.setItem("access_token", d.access_token);
      nav("/dashboard");
    } else setMsg(d.detail || "Wrong credentials");
  }

  return (
    <div className="min-h-screen grid grid-cols-2 bg-[#bde0fe] relative overflow-hidden">

      <div className="absolute w-[500px] h-[500px] bg-[#ffc8dd] rounded-full blur-3xl -top-12 left-10 opacity-70"></div>

      {/* left message */}
      <div className="flex flex-col justify-center pl-14">
        <h1 className="text-5xl font-extrabold text-gray-800">
          Welcome back 🫶
        </h1>

        <p className="mt-4 text-gray-700 text-lg max-w-md">
          Continue securely — your data stays safe while you explore.
        </p>

        <img
          className="w-72 mt-10 animate-pulse"
          src="https://cdn-icons-png.flaticon.com/512/9463/9463844.png"
        />
      </div>

      {/* login */}
      <div className="flex justify-center items-center pr-16">
        <form
          onSubmit={submit}
          className="bg-white/90 backdrop-blur-xl w-[420px] rounded-3xl shadow-2xl p-8 space-y-5"
        >
          <h2 className="text-2xl font-bold text-center text-[#a2d2ff]">
            Login
          </h2>

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

          <button className="w-full py-3 rounded-2xl font-semibold text-white shadow-lg bg-gradient-to-r from-[#ffafcc] to-[#ffc8dd] hover:scale-[1.04] transition">
            Login
          </button>

          {msg && <p className="text-center text-red-500">{msg}</p>}

          <p className="text-center mt-3 text-sm">
            New here?
            <a href="/register" className="ml-2 text-[#cdb4db] underline">
              Create account
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
