import { useState } from "react";
import { loginUser, registerUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        const res = await loginUser({
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("token", res.data.access_token);
        navigate("/dashboard");
      } else {
        await registerUser(form);
        alert("Registration successful! Please login.");
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "Login" : "Register"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              name="name"
              placeholder="Full Name"
              onChange={handleChange}
              className="w-full p-3 border rounded"
              required
            />
          )}

          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full p-3 border rounded"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full p-3 border rounded"
            required
          />

          <button className="w-full bg-indigo-600 text-white py-3 rounded hover:bg-indigo-700">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          {isLogin ? "New user?" : "Already have an account?"}{" "}
          <button
            className="text-indigo-600 font-semibold"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
