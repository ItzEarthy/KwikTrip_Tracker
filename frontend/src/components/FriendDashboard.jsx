import { useEffect, useState } from "react";
const API_BASE = `${window.location.origin}/api`;

export default function FriendsDashboard({ onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [visits, setVisits] = useState({});
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then((res) => res.json())
      .then(setUsers);

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
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Friends Dashboard</h1>
      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Progress</th>
            <th className="p-3 text-center">View</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const progress = visits[user.id] || 0;
            const total = locations.length || 1;
            const percent = Math.round((progress / total) * 100);
            return (
              <tr key={user.id} className="border-t">
                <td className="p-3 font-medium">{user.nickname}</td>
                <td className="p-3">
                  <div className="w-full bg-gray-200 h-4 rounded">
                    <div
                      className="bg-blue-600 h-4 rounded"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">
                    {progress} of {total} visited ({percent}%)
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    onClick={() => {
                      localStorage.setItem("mode", "friend");
                      localStorage.setItem("selectedUserId", user.id);
                      onSelectUser(user.id);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
