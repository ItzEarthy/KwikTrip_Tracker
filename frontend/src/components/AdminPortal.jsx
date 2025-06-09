import { useEffect, useState } from "react";
const API_BASE = `${window.location.origin}/api`;

export default function AdminPortal({ user, onBack }) {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState({}); // temp state for edits

  useEffect(() => {
    fetch(`${API_BASE}/admin/users?userId=${user.id}`)
      .then((res) => res.json())
      .then(setUsers);
  }, [user.id]);

  const updateField = (id, field, value) => {
    setEditing((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const saveUser = async (id) => {
    const { username, nickname, password } = editing[id] || {};
    if (nickname) {
      await fetch(`${API_BASE}/users/${id}/nickname`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname }),
      });
    }
    if (username) {
      await fetch(`${API_BASE}/admin/users/${id}/username`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
    }
    if (password && password.length >= 6) {
      await fetch(`${API_BASE}/users/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
    }
    alert("✅ User updated");
    window.location.reload();
  };

  const toggleAdmin = async (id, isAdmin) => {
    await fetch(`${API_BASE}/admin/users/${id}/role?userId=${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !isAdmin }),
    });
    window.location.reload();
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await fetch(`${API_BASE}/admin/users/${id}?userId=${user.id}`, {
      method: "DELETE",
    });
    setUsers(users.filter((u) => u.id !== id));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center text-brand-primary">
        🛠 Admin Portal
      </h1>
      <button className="btn mb-4" onClick={onBack}>
        ⬅ Back
      </button>
      <div className="space-y-6">
        {users.map((u) => (
          <div key={u.id} className="card p-4 space-y-2">
            <div><strong>ID:</strong> {u.id}</div>
            <div>
              <label className="block text-sm font-semibold">Username</label>
              <input
                defaultValue={u.username}
                onChange={(e) =>
                  updateField(u.id, "username", e.target.value)
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold">Nickname</label>
              <input
                defaultValue={u.nickname}
                onChange={(e) =>
                  updateField(u.id, "nickname", e.target.value)
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold">New Password</label>
              <input
                type="password"
                placeholder="••••••"
                onChange={(e) =>
                  updateField(u.id, "password", e.target.value)
                }
                className="w-full"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button className="btn" onClick={() => saveUser(u.id)}>
                💾 Save
              </button>
              {u.id !== user.id && (
                <>
                  <button
                    className="btn"
                    onClick={() => toggleAdmin(u.id, u.isAdmin)}
                  >
                    {u.isAdmin ? "🔽 Demote" : "🔼 Promote to Admin"}
                  </button>
                  <button
                    className="btn"
                    style={{ background: "var(--brand-danger)" }}
                    onClick={() => deleteUser(u.id)}
                  >
                    🗑 Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
