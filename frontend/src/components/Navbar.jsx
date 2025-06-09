import PropTypes from "prop-types";
import { FaArrowLeft, FaPowerOff } from "react-icons/fa";

export default function Navbar({ title = "KwikTrip Tracker", onBack, onLogout }) {
  const goBack = () => {
    // Clear view state so app shows Landing page again
    localStorage.removeItem("selectedUserId");
    localStorage.removeItem("mode");
    window.location.reload(); // ensures App.jsx reruns logic
  };

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
  <header
    className="app-header"
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      zIndex: 50,
      background: "var(--brand-primary)",
    }}
  >
    <button
      onClick={onBack || goBack}
      aria-label="Go Back"
      className="text-white font-bold text-lg bg-transparent border-none"
    >
      <FaArrowLeft />
    </button>

    <h1 className="flex-1 text-center text-white text-xl font-bold">
      {title}
    </h1>

    <button
      onClick={onLogout || logout}
      aria-label="Logout"
      className="text-white font-bold text-lg bg-transparent border-none"
    >
      <FaPowerOff />
    </button>
  </header>
);

}

Navbar.propTypes = {
  title: PropTypes.string,
  onBack: PropTypes.func,
  onLogout: PropTypes.func,
};
