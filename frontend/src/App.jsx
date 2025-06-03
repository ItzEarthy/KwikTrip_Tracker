import { useState, useEffect } from "react";
import MapView from "./components/MapView";
import Login from "./components/Login";
import Register from "./components/Register";
import Landing from "./components/Landing";
import VisitHistory from "./components/VisitHistory";
import FriendDashboard from "./components/FriendDashboard";
import Profile from "./components/Profile";

import "./styles/theme.css";

function App() {
  const [user, setUser] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewingMapForUserId, setViewingMapForUserId] = useState(null); // New

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const nickname = localStorage.getItem("nickname");
    if (id && nickname) setUser({ id, nickname });
  }, []);

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setViewingMapForUserId(null);
  };

  if (!user) {
    return registering ? (
      <Register onRegister={setUser} />
    ) : (
      <Login onLogin={setUser} switchToRegister={() => setRegistering(true)} />
    );
  }

  if (viewingMapForUserId === "friends") {
    return (
      <FriendDashboard
        onSelectUser={(friendId) => setViewingMapForUserId(friendId)}
      />
    );
  }

  // 👤 Show friend's map view
  if (viewingMapForUserId && viewingMapForUserId !== user.id) {
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
  if (viewingMapForUserId === "profile") {
    return <Profile user={user} onBack={() => setViewingMapForUserId(null)} />;
  }

  // 🧭 Show personal map view
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

  // 🏠 Show landing dashboard
  return (
    <Landing
      user={user}
      onEnterMap={() => setViewingMapForUserId(user.id)}
      onEnterFriends={() => setViewingMapForUserId("friends")}
      onEnterProfile={() => setViewingMapForUserId("profile")}
    />
  );
}

export default App;
