import { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/";


export default function VisitHistory({ open, onClose }) {
  const [visits, setVisits] = useState([]);

  useEffect(() => {
    if (open) {
      fetch(`${API_BASE}/visits`)
        .then((res) => res.json())
        .then(setVisits);
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
        <button onClick={onClose} className="btn" style={{ fontSize: '0.9em', color: 'var(--brand-danger)', background: 'transparent' }}>
          Close
        </button>
      </div>
      <ul className="divide-y">
        {visits.map((v, i) => (
          <li key={i} className="p-3 text-sm">
            <strong>{v.nickname}</strong> visited store #{v.storeNumber}
            <br />
            <span style={{ color: 'var(--brand-gray)' }}>
              {new Date(v.timestamp).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
