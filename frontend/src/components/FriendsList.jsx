import { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_URL || "http://192.168.86.33:3001/api/";

export default function FriendsList({ selectedUserId, onSelect }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then((res) => res.json())
      .then(setUsers);
  }, []);

  return (
    <div className="mb-4">
      <label className="block mb-1 font-semibold text-sm text-gray-700">View as:</label>
      <select
        className="w-full border px-3 py-2 rounded"
        value={selectedUserId}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">-- Select User --</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.nickname}
          </option>
        ))}
      </select>
    </div>
  );
}
