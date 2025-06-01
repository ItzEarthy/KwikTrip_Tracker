import { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function FriendsDashboard({ onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [visits, setVisits] = useState({});
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then((res) => res.json())
      .then((allUsers) => {
        const selfId = localStorage.getItem("userId");
        const filteredUsers = allUsers.filter((u) => u.id !== selfId);
        setUsers(filteredUsers);
      });

    fetch(`${API_BASE}/locations`)
      .then((res) => res.json())
      .then(setLocations);
  }, []);

  useEffect(() => {
    users.forEach((user) => {
      fetch(`${API_BASE}/visits/${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setVisits((prev) => ({ ...prev, [user.id]: data.length }));
        });
    });
  }, [users]);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4 text-center">Friends Dashboard</h1>
      <div className="space-y-4">
        {users.length === 0 ? (
          <p className="text-center text-gray-500">No friends found.</p>
        ) : (
          users.map((user) => {
            const progress = visits[user.id] || 0;
            const total = locations.length || 1;
            const percent = Math.round((progress / total) * 100);
            return (
              <div key={user.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-semibold text-base">{user.nickname}</h2>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    onClick={() => {
                      localStorage.setItem("mode", "friend");
                      localStorage.setItem("selectedUserId", user.id);
                      onSelectUser(user.id);
                    }}
                  >
                    View
                  </button>
                </div>
                <div className="w-full bg-gray-200 h-3 rounded">
                  <div
                    className="bg-blue-600 h-3 rounded"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {progress} of {total} visited ({percent}%)
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
