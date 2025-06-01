import { useEffect, useState } from "react";
const API_BASE = `${window.location.origin}/api`;



export default function Landing({ user, onEnterMap }) {
  const [stats, setStats] = useState({ total: 0, visited: 0, percent: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [locationsRes, visitsRes] = await Promise.all([
        fetch(`${API_BASE}/locations`).then((r) => r.json()),
        fetch(`${API_BASE}/visits`).then((r) => r.json()),
      ]);

      const visitedByUser = visitsRes.filter((v) => v.userId === user.id);
      const total = locationsRes.length;
      const visited = visitedByUser.length;
      const percent = total ? Math.round((visited / total) * 100) : 0;

      setStats({ total, visited, percent });
    };

    fetchStats();
  }, [user]);

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-4"
      style={{ background: "var(--brand-bg)" }}
    >
      <div className="card w-full max-w-md text-center">
        <h1
          className="mb-2"
          style={{
            color: "var(--brand-primary)",
            fontWeight: "bold",
            fontSize: "2rem",
          }}
        >
          Welcome, {user.nickname} 👋
        </h1>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--brand-accent)" }}
        >
          You’ve visited{" "}
          <strong>{stats.visited}</strong> of{" "}
          <strong>{stats.total}</strong> Kwik Trip stores (
          <strong>{stats.percent}%</strong>)
        </p>

        <div className="flex flex-col gap-3 mt-4">
          <button onClick={onEnterMap} className="btn">
            🗺️ Go to Map
          </button>
          <button className="btn">📋 Visit History</button>
          <button className="btn w-full" onClick={() => window.location.href = "/friends"}>
  👥 Friends Dashboard
</button>

        </div>

        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="btn mt-4"
          style={{
            fontSize: "0.85em",
            color: "var(--brand-danger)",
            background: "transparent",
            textDecoration: "underline",
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
