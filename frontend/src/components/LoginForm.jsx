import { useState } from "react";
import { API_URL } from "../api";

export default function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("Checking...");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error("Invalid credentials");

      const data = await res.json();

      // 👉 save token to browser
      localStorage.setItem("access_token", data.access_token);

      setMessage("Login successful ✔");
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow-xl rounded-2xl p-6 mt-10">
      <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="Email"
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2" />

        <input name="password" type="password" placeholder="Password"
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2" />

        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">
          Login
        </button>
      </form>

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
