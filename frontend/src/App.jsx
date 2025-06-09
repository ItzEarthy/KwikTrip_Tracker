import { useState, useEffect } from "react";
import MapView from "./components/MapView";
import Login from "./components/Login";
import Register from "./components/Register";
import Landing from "./components/Landing";
import VisitHistory from "./components/VisitHistory";
import FriendDashboard from "./components/FriendDashboard";
import UserProfile from "./components/UserProfile";
import AdminPortal from "./components/AdminPortal";

import "./styles/theme.css";

function App() {
  const [user, setUser] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingMapForUserId, setViewingMapForUserId] = useState(null);

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
          setUser({ id, nickname, isAdmin: false }); // fallback if request fails
        });
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setViewingMapForUserId(null);
  };

  // 🔒 Not logged in
  if (!user) {
    return registering ? (
      <Register onRegister={setUser} />
    ) : (
      <Login onLogin={setUser} switchToRegister={() => setRegistering(true)} />
    );
  }

  // 🧑‍💻 Profile Page
  if (viewingMapForUserId === "profile") {
    return (
      <UserProfile user={user} onBack={() => setViewingMapForUserId(null)} />
    );
  }

  if (viewingMapForUserId === "adminPortal") {
    return (
      <AdminPortal user={user} onBack={() => setViewingMapForUserId(null)} />
    );
  }

  // 👥 Friends Dashboard
  if (viewingMapForUserId === "friends") {
    return (
      <FriendDashboard
        onSelectUser={(friendId) => setViewingMapForUserId(friendId)}
      />
    );
  }

  // 🗺️ Viewing another user's map
  if (
    viewingMapForUserId &&
    viewingMapForUserId !== user.id &&
    viewingMapForUserId !== "friends"
  ) {
    localStorage.setItem("mode", "friend");
    localStorage.setItem("selectedUserId", viewingMapForUserId);
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden">
        <MapView />
        <button onClick={logout} className="fixed top-4 right-4 btn">
          Log out
        </button>
      </div>
    );
  }

  // 🧭 Personal map view
  if (viewingMapForUserId === user.id) {
    localStorage.setItem("mode", "self");
    localStorage.setItem("selectedUserId", user.id);
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden">
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
        <VisitHistory
          open={showHistory}
          onClose={() => setShowHistory(false)}
        />
      </div>
    );
  }

  // 🏠 Landing Page
  return (
    <Landing
      user={user}
      onEnterMap={() => setViewingMapForUserId(user.id)}
      onEnterFriends={() => setViewingMapForUserId("friends")}
      onEnterProfile={() => setViewingMapForUserId("profile")}
      onEnterAdmin={() => setViewingMapForUserId("adminPortal")} // ✅ add this line
    />
  );
}

export default App;
