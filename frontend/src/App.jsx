
import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";

import MapView from "./components/MapView";
import Login from "./components/Login";
import Register from "./components/Register";
import Landing from "./components/Landing";
import VisitHistory from "./components/VisitHistory";
import FriendDashboard from "./components/FriendDashboard";
import UserProfile from "./components/UserProfile";
import AdminPortal from "./components/AdminPortal";

import "./styles/theme.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const nickname = localStorage.getItem("nickname");

    if (id && nickname) {
      fetch(`${window.location.origin}/api/users/${id}/is-admin`)
        .then((res) => res.json())
        .then((data) => {
          setUser({ id, nickname, isAdmin: data.isAdmin });
        })
        .catch(() => {
          setUser({ id, nickname, isAdmin: false });
        });
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login");
  };

  if (!user) {
    return registering ? (
      <Register onRegister={setUser} />
    ) : (
      <Login onLogin={setUser} switchToRegister={() => setRegistering(true)} />
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing
        user={user}
        onEnterMap={() => navigate("/map")}
        onEnterFriends={() => navigate("/friends")}
        onEnterProfile={() => navigate("/profile")}
        onEnterAdmin={() => navigate("/admin")}
      />} />
      
      <Route path="/map" element={
        <>
          <MapView />
          <button
            className="fixed bottom-4 right-4 btn"
            onClick={() => setShowHistory(true)}
          >
            📋 History
          </button>
          <button onClick={logout} className="fixed top-4 right-4 btn">
            Log out
          </button>
          <VisitHistory open={showHistory} onClose={() => setShowHistory(false)} />
        </>
      } />

      <Route path="/friends" element={
        <FriendDashboard onSelectUser={(id) => navigate(`/map/${id}`)} />
      } />

      <Route path="/map/:friendId" element={
        <>
          {localStorage.setItem("mode", "friend")}
          <MapView />
          <button onClick={logout} className="fixed top-4 right-4 btn">
            Log out
          </button>
        </>
      } />

      <Route path="/profile" element={<UserProfile user={user} onBack={() => navigate("/")} />} />
      <Route path="/admin" element={<AdminPortal user={user} onBack={() => navigate("/")} />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
