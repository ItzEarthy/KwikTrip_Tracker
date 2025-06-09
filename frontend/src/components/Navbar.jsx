import { useNavigate } from "react-router-dom";

export default function Navbar({
  title = "KwikTrip Tracker",
  onBack,
  onLogout,
}) {
  const navigate = useNavigate();

  return (
    <header className="navbar app-header flex items-center justify-between px-4">
      <button
        onClick={onBack || (() => navigate(-1))}
        className="text-white font-bold text-lg bg-transparent border-none"
        style={{ background: "transparent", fontSize: "1.2rem" }}
        aria-label="Back"
      >
        ⬅
      </button>

      <div className="flex items-center gap-2">
        <img
          src="/kttlogo.png"
          alt="KwikTrip Logo"
          style={{ height: "32px", width: "32px" }}
        />
        <h1 className="text-white text-xl font-bold">{title}</h1>
      </div>

      <button
        onClick={
          onLogout ||
          (() => {
            localStorage.clear();
            window.location.reload();
          })
        }
        className="text-white font-bold text-lg bg-transparent border-none"
        style={{ background: "transparent", fontSize: "1.2rem" }}
        aria-label="Logout"
      >
        ⏻
      </button>
    </header>
  );
}
