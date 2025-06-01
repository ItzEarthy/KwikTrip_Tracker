import { useState, useEffect } from "react";
import MapView from "./components/MapView";
import Login from "./components/Login";
import Register from "./components/Register";
import Landing from "./components/Landing";
import VisitHistory from "./components/VisitHistory";
import './styles/theme.css';
import FriendDashboard from "./components/FriendDashboard";




function App() {
  const [user, setUser] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [atMap, setAtMap] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const nickname = localStorage.getItem("nickname");
    if (id && nickname) setUser({ id, nickname });
  }, []);

  if (!user) {
    return registering ? (
      <Register onRegister={(u) => setUser(u)} />
    ) : (
      <Login onLogin={(u) => setUser(u)} switchToRegister={() => setRegistering(true)} />
    );
  }

  if (!atMap) {
    return <Landing user={user} onEnterMap={() => setAtMap(true)} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <MapView />
      <button
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-md z-50"
        onClick={() => setShowHistory(true)}
      >
        📋 History
      </button>
      <button
        className="fixed top-4 right-4 bg-gray-300 text-black px-4 py-1 rounded-full z-50 text-sm"
        onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}
      >
        Log out
      </button>
      <VisitHistory open={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
}

export default App;
