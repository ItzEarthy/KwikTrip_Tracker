import { useEffect, useState } from "react";
import StoreStats from "./StoreStats";
const API_BASE = `${window.location.origin}/api`;

export default function VisitHistory({ open, onClose }) {
  const [visits, setVisits] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (open) {
      const userId = localStorage.getItem("userId");
      console.log("🔍 VisitHistory fetching for userId:", userId);
      if (!userId) return;

      // Load locations map for nicer display
      fetch(`${API_BASE}/locations`)
        .then((r) => r.json())
        .then(setLocations)
        .catch(() => setLocations([]));

      fetch(`${API_BASE}/visits/${userId}`)
        .then((res) => res.json())
        .then(setVisits)
        .catch((err) => {
          console.error("Failed to load visits:", err);
          setVisits([]);
        });
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed bottom-0 left-0 right-0 mx-auto w-full max-w-xl bg-white shadow-xl max-h-[60%] overflow-y-auto transition-transform duration-300 rounded-t-xl z-50 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">Visit History</h2>
            <p className="text-sm text-slate-500">{visits.length} visit{visits.length !== 1 ? "s" : ""}</p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close visit history"
            className="px-3 py-1 rounded-md hover:bg-gray-100"
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
            <li className="p-6 text-sm text-center text-gray-500">No visits recorded yet.</li>
          ) : (
            visits.map((v, i) => (
              <li key={i} className="p-4 flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                  #{v.storeNumber}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {(() => {
                      const loc = locations.find(l => String(l.storeNumber) === String(v.storeNumber));
                      return loc ? loc.name : `Kwik Trip #${v.storeNumber}`;
                    })()}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(v.visitDate || v.timestamp).toLocaleString()}
                  </div>
                  <div className="mt-2">
                    <StoreStats storeNumber={v.storeNumber} compact />
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
}
