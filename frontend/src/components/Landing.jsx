import { useEffect, useState } from "react";
import logo from "/kttlogo.png";
const API_BASE = `${window.location.origin}/api`;

export default function Landing({
  user,
  onEnterMap,
  onEnterFriends,
  onEnterFriendManagement,
  onEnterProfile,
  onEnterAdmin,
  onOpenHistory,
}) {
  const [stats, setStats] = useState({ total: 0, visited: 0, percent: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await fetch(`${API_BASE}/stats/${user.id}`);
        const data = await resp.json();
        // Expecting { total, visited, percent } from server
        setStats({
          total: data.total || 0,
          visited: data.visited || 0,
          percent: data.percent || 0,
        });
      } catch (err) {
        console.error('Failed to load stats', err);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-4"
      style={{ background: "var(--brand-bg)" }}
    >
      {/* Add the logo */}
      <img
        src={logo}
        alt="KwikTrip Tracker Logo"
        className="mb-4 w-24 h-24"
      />

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
          <button className="btn" onClick={onOpenHistory}>📋 Visit History</button>
          <button className="btn" onClick={onEnterFriends}>
            👥 Friends Dashboard
          </button>
          <button className="btn" onClick={onEnterFriendManagement}>
            🤝 Manage Friends
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
