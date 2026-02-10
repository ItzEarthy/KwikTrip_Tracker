import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFocus } from "../contexts/FocusContext";
import StoreStats from "./StoreStats";
const API_BASE = `${window.location.origin}/api`;

export default function VisitHistory({ open, onClose }) {
  const [visits, setVisits] = useState([]);
  const [locations, setLocations] = useState([]);
  const [photosByStore, setPhotosByStore] = useState({});
  const navigate = useNavigate();
  const { requestFocus } = useFocus();

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

  // fetch photos for each visit's store
  useEffect(() => {
    if (!open || visits.length === 0) return;
    const userId = localStorage.getItem('userId');
    const uniq = Array.from(new Set(visits.map(v => String(v.storeNumber)))).slice(0, 20);
    uniq.forEach((store) => {
      fetch(`${API_BASE}/locations/${store}/activity?requesterId=${userId}`)
        .then((r) => r.json())
        .then((act) => {
          if (act && act.reviews) {
            const photos = [];
            act.reviews.forEach((rv) => {
              if (rv.photos && rv.photos.length) {
                rv.photos.forEach(p => photos.push(p.filePath));
              }
            });
            setPhotosByStore((prev) => ({ ...prev, [store]: photos }));
          }
        })
        .catch(() => {});
    });
  }, [open, visits]);

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
                    {photosByStore[String(v.storeNumber)] && photosByStore[String(v.storeNumber)].length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {photosByStore[String(v.storeNumber)].slice(0,4).map((p, idx) => (
                          <img
                            key={idx}
                            src={`${API_BASE}/uploads/${p}`}
                            alt="visit photo"
                            className="w-20 h-20 object-cover rounded border cursor-pointer"
                            onClick={() => window.open(`${API_BASE}/uploads/${p}`, '_blank')}
                          />
                        ))}
                      </div>
                    )}
                    <div className="mt-2">
                      <button
                        className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
                        onClick={() => {
                          requestFocus(v.storeNumber);
                          navigate('/map');
                          onClose?.();
                        }}
                      >
                        Bring me to
                      </button>
                    </div>
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
