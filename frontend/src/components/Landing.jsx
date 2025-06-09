import { useEffect, useState } from "react";
const API_BASE = `${window.location.origin}/api`;

export default function Landing({
  user,
  onEnterMap,
  onEnterFriends,
  onEnterProfile,
  onEnterAdmin,
}) {
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
            fontSize: "2rem",
            fontWeight: "bold",
          }}
        >
          Welcome, {user.nickname} 👋
        </h1>

        <p className="text-sm mb-4">
          You’ve visited <strong>{stats.visited}</strong> of{" "}
          <strong>{stats.total}</strong> Kwik Trip stores (
          <strong>{stats.percent}%</strong>)
        </p>

        <div className="flex flex-col gap-3 mt-4">
          <button className="btn" onClick={onEnterMap}>
            🗺️ Go to Map
          </button>
          <button className="btn">📋 Visit History</button>
          <button className="btn" onClick={onEnterFriends}>
            👥 Friends Dashboard
          </button>
          <button className="btn" onClick={onEnterProfile}>
            ⚙️ Profile Settings
          </button>

          {user.isAdmin && (
            <button className="btn" onClick={onEnterAdmin}>
              🛠️ Admin Portal
            </button>
          )}
        </div>

        <button
          className="btn mt-4"
          style={{
            fontSize: "0.85em",
            color: "var(--brand-danger)",
            background: "transparent",
            textDecoration: "underline",
          }}
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
