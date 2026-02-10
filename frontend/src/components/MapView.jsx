import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import L from "leaflet";
import Filters from "./Filters";
import FriendsList from "./FriendsList";
import MapFixer from "./MapFixer";
import LocationService from "./LocationService";
import ClusteredMarkers from "./ClusteredMarkers";
import Modal from "./Modal";
import ReviewForm from "./ReviewForm";
import StoreActivity from "./StoreActivity";
import { useFocus } from "../contexts/FocusContext";
const API_BASE = `${window.location.origin}/api`;

import Navbar from "./Navbar";

// Custom hook to fix map size
function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

const visitedIcon = new L.Icon({
  iconUrl: "/icons/travel.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -36],
});

const unvisitedIcon = new L.Icon({
  iconUrl: "/icons/location.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -36],
});

const friendVisitedIcon = new L.Icon({
  iconUrl: "/icons/friend.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -30],
});

const userIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="10" fill="%23007bff"/></svg>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function MapView() {
  // mode can be 'self' or 'friend' (persisted in localStorage)
  const routeParams = useParams();
  const friendIdParam = routeParams?.friendId;
  const mode =
    localStorage.getItem("mode") || (friendIdParam ? "friend" : "self");
  const [filter, setFilter] = useState({
    status: "all",
    state: "all",
    city: "all",
  });
  const [locations, setLocations] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const userCenteredRef = useRef(false);

  // Search state
  

  // Review modal state
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    visitId: null,
    storeNumber: null,
    existingReview: null,
  });
  const [activityModal, setActivityModal] = useState({
    isOpen: false,
    storeNumber: null,
  });

  const handleLocationUpdate = useCallback((coords) => {
    setUserLocation(coords);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/locations`)
      .then((res) => res.json())
      .then(setLocations);

    // Determine the selected user (priority: route param -> stored selected -> self)
    const storedSelected = localStorage.getItem("selectedUserId");
    const selfId = localStorage.getItem("userId");

    // helper to keep state + localStorage in sync
    const selectUser = (id, newMode) => {
      if (!id) return;
      const sid = String(id);
      setSelectedUserId(sid);
      localStorage.setItem("selectedUserId", sid);
      if (newMode) localStorage.setItem("mode", newMode);
    };

    if (friendIdParam) {
      selectUser(friendIdParam, "friend");
    } else if (localStorage.getItem("mode") === "friend" && storedSelected) {
      selectUser(storedSelected, "friend");
    } else if (selfId) {
      selectUser(selfId, "self");
    }
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    fetch(`${API_BASE}/visits/${selectedUserId}`)
      .then((res) => res.json())
      .then(setVisits);
  }, [selectedUserId]);

  useEffect(() => {
    if (focus) {
      focusStore(focus.storeNumber);
    }
  }, [focus]);

  const handleCheckIn = async (storeNumber) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please log in to check in.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeNumber,
          userId,
          visitDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh visits data without page reload
        const visitsRes = await fetch(`${API_BASE}/visits/${userId}`);
        const visitsData = await visitsRes.json();
        setVisits(visitsData);

        // Open review modal
        setReviewModal({ isOpen: true, visitId: result.id, storeNumber, existingReview: null });

        // Optional: Show a toast notification
        const notification = document.createElement("div");
        notification.style.cssText =
          "position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#16a34a;color:white;padding:12px 24px;border-radius:8px;z-index:10000;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.15);";
        notification.textContent = `✅ Store #${storeNumber} added!`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
      } else {
        alert("Failed to check in. Please try again.");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleAddReview = (visitId, storeNumber) => {
    setReviewModal({ isOpen: true, visitId, storeNumber, existingReview: null });
  };

  const handleViewActivity = (storeNumber) => {
    setActivityModal({ isOpen: true, storeNumber });
  };

  const handleReviewSuccess = () => {
    setReviewModal({ isOpen: false, visitId: null, storeNumber: null });
    // Refresh visits to update any stats
    const userId = localStorage.getItem("userId");
    if (userId && selectedUserId) {
      fetch(`${API_BASE}/visits/${selectedUserId}`)
        .then((res) => res.json())
        .then(setVisits)
        .catch((e) => console.error("Failed to refresh visits:", e));
    }
  };

  const isVisited = (storeNumber) =>
    visits.some((v) => v.storeNumber === storeNumber);

  const isFriend =
    mode === "friend" && selectedUserId !== localStorage.getItem("userId");

  

  const openLocationPopup = (loc) => {
    if (!mapInstance || !loc) return;
    const visited = isVisited(loc.storeNumber);
    const html = `
      <div style="font-family:inherit;max-width:300px">
        <div><strong>${loc.name}</strong><br/>${loc.address}<br/>${loc.city}, ${loc.state} ${loc.zip}</div>
        ${visited ? '<div style="color:#16a34a;font-weight:600;margin-top:6px">✅ Already Visited</div>' : ""}
      </div>
    `;

    // Ensure numeric coordinates
    const lat = parseFloat(loc.latitude);
    const lng = parseFloat(loc.longitude);

    // Some environments may have the map not fully ready/laid out when we try to center.
    // Use whenReady + invalidateSize, then setView and open popup after a short delay.
    try {
      mapInstance.whenReady(() => {
        try {
          mapInstance.invalidateSize();
        } catch (e) {}
        setTimeout(() => {
          mapInstance.setView([lat, lng], 15);
          L.popup({ maxWidth: 360, className: "kwik-search-popup" })
            .setLatLng([lat, lng])
            .setContent(html)
            .openOn(mapInstance);
        }, 120);
      });
    } catch (e) {
      // Fallback: try immediately
      mapInstance.setView([lat, lng], 15);
      L.popup({ maxWidth: 360, className: "kwik-search-popup" })
        .setLatLng([lat, lng])
        .setContent(html)
        .openOn(mapInstance);
    }

    // clear any previous search UI state (search removed)
  };

  // If another component requested a focus on a store, handle it once locations are loaded
  useEffect(() => {
    const focusKey = "focusStoreNumber";
    const focus = localStorage.getItem(focusKey);
    if (!focus) return;

    // delegate to centralized helper which will retry until ready
    focusStore(focus);
  }, [locations, mapInstance]);

  // Also support focusing via a `?focus=<storeNumber>` query param (more reliable when navigating)
  const location = useLocation();
  const navigate = useNavigate();
  // Centralized focus helper: retry until mapInstance and locations are ready
  const focusStore = (storeNumber) => {
    if (!storeNumber) return;
    let attempts = 0;
    const maxAttempts = 12;

    const attempt = () => {
      attempts += 1;
      const loc = locations.find((l) => String(l.storeNumber) === String(storeNumber));
      if (loc && mapInstance) {
        openLocationPopup(loc);
        // cleanup localStorage marker
        try { localStorage.removeItem('focusStoreNumber'); } catch (e) {}
        return;
      }

      if (attempts < maxAttempts) setTimeout(attempt, 300);
    };

    attempt();
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focus = params.get("focus");
    if (!focus) return;

    focusStore(focus);
    // remove the query param from history
    try { navigate(location.pathname, { replace: true }); } catch (e) {}
  }, [location.search, locations, mapInstance, navigate]);

  // Listen for same-window focus requests (dispatched by other components)
  useEffect(() => {
    const handler = (e) => {
      const store = e?.detail || localStorage.getItem('focusStoreNumber');
      if (!store) return;
      focusStore(store);
    };

    window.addEventListener('kwik:focusStore', handler);
    return () => window.removeEventListener('kwik:focusStore', handler);
  }, [locations, mapInstance]);

  function RecenterControl({ position }) {
    const map = useMap();
    if (!position) return null;

    return (
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
        <button
          className="bg-white bg-opacity-90 text-black px-3 py-1 rounded shadow"
          onClick={() =>
            map.setView([position.lat, position.lng], map.getZoom() || 13)
          }
        >
          ⤢ Center
        </button>
      </div>
    );
  }

  function UserMarkerWrapper({ position }) {
    const map = useMap();
    useEffect(() => {
      if (!position) return;
      // center map on user only on first location fix (persistent across renders)
      if (!userCenteredRef.current) {
        map.setView([position.lat, position.lng], 13);
        userCenteredRef.current = true;
      }
    }, [position, map]);

    if (!position) return null;

    return (
      <Marker position={[position.lat, position.lng]} icon={userIcon}>
        <Popup>You are here</Popup>
      </Marker>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex-none z-10 p-2 space-y-2 relative">
        {mode === "friend" && (
          <FriendsList
            selectedUserId={selectedUserId}
            onSelect={setSelectedUserId}
          />
        )}
        <div className="flex items-center gap-2">
          <Filters locations={locations} visits={visits} onFilter={setFilter} />
        </div>
      </div>

      <div className="flex-grow relative z-0">
        <MapContainer
          center={[44.95, -92.95]}
          zoom={7}
          className="h-full w-full"
          whenCreated={(map) => setMapInstance(map)}
        >
          <TileLayer
            url="https://tile.jawg.io/af06ba33-f6df-4eb7-80a2-a81fd169c187/{z}/{x}/{y}.png?access-token=eaVAmuImVyZ14hXBuyquvFt5SXhDdfbcULGgL3DBhSbqntHqoFRbNxmHhsUMHKwo"
            attribution='Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> & <a href="https://www.jawg.io">Jawg</a>'
          />
          {(() => {
            const filteredLocations = locations.filter((loc) => {
              const visited = isVisited(loc.storeNumber);

              if (filter.status === "visited" && !visited) return false;
              if (filter.status === "unvisited" && visited) return false;
              if (filter.state !== "all" && loc.state !== filter.state)
                return false;
              if (filter.city !== "all" && loc.city !== filter.city)
                return false;

              return true;
            });

            return (
              <ClusteredMarkers
                locations={filteredLocations}
                visits={visits}
                onCheckIn={handleCheckIn}
                onAddReview={handleAddReview}
                onViewActivity={handleViewActivity}
              />
            );
          })()}
          <UserMarkerWrapper position={userLocation} />
          <RecenterControl position={userLocation} />
          <LocationService onLocationUpdate={handleLocationUpdate} />
          <MapFixer />
          <ResizeMap />
        </MapContainer>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModal.isOpen}
          onClose={() =>
          setReviewModal({ isOpen: false, visitId: null, storeNumber: null, existingReview: null })
        }
        title={`Review Store #${reviewModal.storeNumber}`}
      >
        <ReviewForm
          visitId={reviewModal.visitId}
          storeNumber={reviewModal.storeNumber}
          existingReview={reviewModal.existingReview}
          onSuccess={handleReviewSuccess}
          onCancel={() =>
            setReviewModal({ isOpen: false, visitId: null, storeNumber: null, existingReview: null })
          }
        />
      </Modal>

      {/* Activity Modal */}
      <Modal
        isOpen={activityModal.isOpen}
        onClose={() => setActivityModal({ isOpen: false, storeNumber: null })}
        title={`Reviews for Store #${activityModal.storeNumber}`}
      >
        <StoreActivity
          storeNumber={activityModal.storeNumber}
          onClose={() => setActivityModal({ isOpen: false, storeNumber: null })}
            onEdit={(review) => {
            // Open review modal to edit existing review
            setActivityModal({ isOpen: false, storeNumber: null });
            setReviewModal({ isOpen: true, visitId: review.visitId, storeNumber: activityModal.storeNumber, existingReview: review });
          }}
            onBringTo={(storeNumber) => {
                const loc = locations.find((l) => String(l.storeNumber) === String(storeNumber));
                if (loc) openLocationPopup(loc);
                setActivityModal({ isOpen: false, storeNumber: null });
            }}
        />
      </Modal>
    </div>
  );
}
