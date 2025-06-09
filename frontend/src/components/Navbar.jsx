import { useNavigate } from "react-router-dom";

export default function Navbar({
  title = "KwikTrip Tracker",
  onBack,
  onLogout,
}) {
  const navigate = useNavigate();

  return (
    <header className="navbar app-header">
      <button
        onClick={onBack || (() => navigate(-1))}
        className="text-white font-bold text-lg bg-transparent border-none"
        style={{ background: "transparent", fontSize: "1.2rem" }}
      >
        ⬅
      </button>

      <h1 className="flex-1 text-center text-white text-xl font-bold">
        {title}
      </h1>

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
      >
        ⏻
      </button>
    </header>
  );
}
