import { useState } from "react";
import Layout from "./Layout";
const API_BASE = import.meta.env.VITE_API_URL || "/api";



export default function Login({ onLogin, switchToRegister }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("✅ Logged in:", data);
        localStorage.setItem("userId", data.id);
        localStorage.setItem("nickname", data.nickname);
        onLogin(data);
      } else {
        setError(data.error || "Login failed.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-blue-700 mb-4 text-center">Login</h1>
        <input
          name="username"
          placeholder="Username"
          className="w-full p-3 border border-gray-300 rounded mb-3"
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full p-3 border border-gray-300 rounded mb-3"
          onChange={handleChange}
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
        {error && <p className="text-red-600 mt-2 text-center">{error}</p>}
        <div className="text-center mt-4">
          <button
            onClick={switchToRegister}
            className="text-blue-600 text-sm underline"
          >
            New here? Register an account
          </button>
        </div>
      </div>
    </div>
  );
}
