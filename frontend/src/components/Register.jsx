import { useState } from "react";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";


export default function Register({ onRegister }) {
  const [form, setForm] = useState({ username: "", password: "", nickname: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("✅ Registered:", data);
        localStorage.setItem("userId", data.id);
        localStorage.setItem("nickname", data.nickname);
        onRegister(data);
      } else {
        setError(data.error || "Registration failed.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--brand-bg)' }}>
      <div className="card w-full max-w-md">
        <h1 className="mb-4 text-center" style={{ color: 'var(--brand-success)', fontWeight: 'bold', fontSize: '2rem' }}>
          Register
        </h1>
        <input
          name="username"
          placeholder="Username"
          className="w-full mb-3"
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full mb-3"
          onChange={handleChange}
        />
        <input
          name="nickname"
          placeholder="Nickname"
          className="w-full mb-4"
          onChange={handleChange}
        />
        <button
          onClick={handleSubmit}
          className="btn w-full"
          disabled={loading}
        >
          {loading ? "Registering..." : "Create Account"}
        </button>
        {error && <p style={{ color: 'var(--brand-danger)' }} className="mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
}
