import { useEffect, useState } from "react";
const API_BASE = `${window.location.origin}/api`;
import Navbar from "./Navbar";

export default function UserProfile() {
  const [nickname, setNickname] = useState("");
  const [userId, setUserId] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const nick = localStorage.getItem("nickname");
    if (id && nick) {
      setUserId(id);
      setNickname(nick);
    }
  }, []);

  const saveNickname = async () => {
    const res = await fetch(`${API_BASE}/users/${userId}/nickname`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });

    if (res.ok) {
      localStorage.setItem("nickname", nickname);
      alert("Nickname updated!");
    } else {
      alert("Failed to update nickname.");
    }
  };

  const submitPasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        alert("Password updated successfully.");
        setShowPasswordModal(false);
        setNewPassword("");
      } else {
        const { error } = await res.json();
        alert(`Failed: ${error || "Unknown error"}`);
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--brand-bg)" }}>
      <Navbar />
      <div className="card w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--brand-primary)" }}>
          Your Profile
        </h2>

        <div className="mb-4 text-sm text-left">
          <strong>User ID:</strong>
          <div className="mt-1 bg-gray-100 p-2 rounded text-xs break-all">{userId}</div>
        </div>

        <div className="mb-4 text-left">
          <label className="block mb-1 font-semibold text-sm">Nickname</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full"
          />
        </div>

        <button className="btn w-full mb-3" onClick={saveNickname}>
          Save Nickname
        </button>

        <button
          className="btn w-full"
          style={{ background: "var(--brand-danger)" }}
          onClick={() => setShowPasswordModal(true)}
        >
          Reset Password
        </button>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card w-full max-w-sm bg-white text-center">
            <h3 className="text-lg font-semibold mb-2">Reset Password</h3>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mb-2"
            />
            <div className="flex gap-2 justify-center">
              <button className="btn" onClick={submitPasswordChange}>
                Submit
              </button>
              <button
                className="btn"
                style={{ background: "var(--brand-gray)", color: "#333" }}
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
