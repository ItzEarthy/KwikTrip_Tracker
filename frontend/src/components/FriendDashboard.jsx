import { useEffect, useState } from "react";
import Layout from "./Layout";
import { useNavigate } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_URL || "/api";


export default function FriendDashboard() {
  const [users, setUsers] = useState([]);
  const [visitsByUser, setVisitsByUser] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        data.forEach((user) => {
          fetch(`/api/visits/${user.id}`)
            .then((res) => res.json())
            .then((visits) => {
              setVisitsByUser((prev) => ({
                ...prev,
                [user.id]: visits.length,
              }));
            });
        });
      });
  }, []);

  const totalLocations = 831; // update if this changes

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Friends’ Progress</h2>
        <ul className="space-y-3">
          {users.map((user) => (
            <li key={user.id} className="card flex justify-between items-center">
              <div>
                <div className="font-semibold">{user.nickname}</div>
                <div className="text-sm text-gray-500">
                  {visitsByUser[user.id] || 0} / {totalLocations} visited
                </div>
              </div>
              <button
                className="btn"
                onClick={() => {
                  localStorage.setItem("mode", "friend");
                  navigate("/map");
                  setTimeout(() => {
                    localStorage.setItem("userId", user.id);
                  }, 100);
                }}
              >
                View Map
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
