import { useEffect, useState } from "react";
const API_BASE =
  import.meta.env.VITE_API_URL || "http://192.168.86.33:3001/api";

export default function VisitHistory({ open, onClose }) {
  const [visits, setVisits] = useState([]);

  useEffect(() => {
    if (open) {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      fetch(`${API_BASE}/visits/${userId}`)
        .then((res) => res.json())
        .then(setVisits)
        .catch((err) => {
          console.error("Failed to load visits:", err);
          setVisits([]);
        });
    }
  }, [open]);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 card max-h-[50%] overflow-y-auto transition-transform duration-300 rounded-t-xl z-50 ${
        open ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-bold">Visit History</h2>
        <button
          onClick={onClose}
          className="btn"
          style={{
            fontSize: "0.9em",
            color: "var(--brand-danger)",
            background: "transparent",
          }}
        >
          Close
        </button>
      </div>
      <ul className="divide-y">
        {visits.length === 0 ? (
          <li className="p-3 text-sm text-center text-gray-500">
            No visits recorded yet.
          </li>
        ) : (
          visits.map((v, i) => (
            <li key={i} className="p-3 text-sm">
              Visited store #{v.storeNumber}
              <br />
              <span style={{ color: "var(--brand-gray)" }}>
                {new Date(v.visitDate || v.timestamp).toLocaleString()}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
