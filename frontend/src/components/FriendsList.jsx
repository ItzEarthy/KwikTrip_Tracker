import { useEffect, useState } from "react";
const API_BASE = `${window.location.origin}/api`;

export default function FriendsList({ selectedUserId, onSelect }) {
  const [currentFriend, setCurrentFriend] = useState(null);

  useEffect(() => {
    if (!selectedUserId) {
      setCurrentFriend(null);
      return;
    }

    // fetch all users and find the selected one (lightweight)
    fetch(`${API_BASE}/users`)
      .then((res) => res.json())
      .then((users) => {
        const u = users.find((x) => String(x.id) === String(selectedUserId));
        setCurrentFriend(u || null);
      })
      .catch(() => setCurrentFriend(null));
  }, [selectedUserId]);

  if (!selectedUserId || !currentFriend) return null;

  const viewSelf = () => {
    const selfId = localStorage.getItem("userId");
    localStorage.setItem("mode", "self");
    localStorage.setItem("selectedUserId", selfId);
    onSelect(selfId);
  };

  return (
    <div className="mb-4 p-2 bg-white rounded shadow-sm">
      <div className="text-sm text-gray-600">Viewing as</div>
      <div className="font-semibold">{currentFriend.nickname}</div>
      <div className="mt-2">
        <button className="btn" onClick={viewSelf} style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}>
          View Self
        </button>
      </div>
    </div>
  );
}
