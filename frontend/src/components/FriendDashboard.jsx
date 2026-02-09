import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const API_BASE = `${window.location.origin}/api`;
import Navbar from "./Navbar";

export default function FriendsDashboard({ onSelectUser }) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [visits, setVisits] = useState({});
  const [locations, setLocations] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) {
      setUserId(id);
      loadFriends(id);
    }

    fetch(`${API_BASE}/locations`)
      .then((res) => res.json())
      .then(setLocations);
  }, []);

  const loadFriends = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/friends/${id}`);
      const friendsData = await res.json();
      setFriends(friendsData);
    } catch (err) {
      console.error("Failed to load friends:", err);
    }
  };

  useEffect(() => {
    friends.forEach((friend) => {
      fetch(`${API_BASE}/visits/${friend.id}`)
        .then((res) => res.json())
        .then((data) => {
          setVisits((prev) => ({ ...prev, [friend.id]: data.length }));
        });
    });
  }, [friends]);

  return (
    <div className="p-4 max-w-md mx-auto">
      <Navbar />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-center flex-1">Friends Dashboard</h1>
        <button
          className="btn"
          style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
          onClick={() => navigate('/friend-management')}
        >
          Manage Friends
        </button>
      </div>
      <div className="space-y-4">
        {friends.length === 0 ? (
            <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No friends yet.</p>
            <button className="btn" onClick={() => navigate('/friend-management')}>
              Add Friends
            </button>
          </div>
        ) : (
          friends.map((friend) => {
            const progress = visits[friend.id] || 0;
            const total = locations.length || 1;
            const percent = Math.round((progress / total) * 100);
            return (
              <div key={friend.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-semibold text-base">{friend.nickname}</h2>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    onClick={() => {
                      localStorage.setItem("mode", "friend");
                      localStorage.setItem("selectedUserId", friend.id);
                      onSelectUser(friend.id);
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
