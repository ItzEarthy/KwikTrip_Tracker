import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import L from "leaflet";
import Filters from "./Filters";
import FriendsList from "./FriendsList";
import MapFixer from "./MapFixer";
import LocationService from "./LocationService";
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
  const mode = localStorage.getItem("mode") || (friendIdParam ? "friend" : "self");
  const [filter, setFilter] = useState({
    status: "all",
    state: "all",
    city: "all",
  });
  const [locations, setLocations] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

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

  const isVisited = (storeNumber) =>
    visits.some((v) => v.storeNumber === storeNumber);

  const isFriend =
    mode === "friend" && selectedUserId !== localStorage.getItem("userId");

  function UserMarker({ position }) {
    const map = useMap();
    const didCenterRef = useRef(false);
    useEffect(() => {
      if (!position) return;
      // center map on user only on first location fix
      if (!didCenterRef.current) {
        map.setView([position.lat, position.lng], 13);
        didCenterRef.current = true;
      }
    }, [position, map]);

    if (!position) return null;

    return (
      <Marker position={[position.lat, position.lng]} icon={userIcon}>
        <Popup>You are here</Popup>
      </Marker>
    );
  }

  function RecenterControl({ position }) {
    const map = useMap();
    if (!position) return null;

    return (
      <div
        style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}
      >
        <button
          className="bg-white bg-opacity-90 text-black px-3 py-1 rounded shadow"
          onClick={() => map.setView([position.lat, position.lng], map.getZoom() || 13)}
        >
          ⤢ Center
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <div style={{ paddingTop: "4rem" }}>
        <Navbar />
      </div>

      <div className="flex-none z-10 p-2 space-y-2">
        {mode === "friend" && (
          <FriendsList
            selectedUserId={selectedUserId}
            onSelect={setSelectedUserId}
          />
        )}
        <Filters locations={locations} visits={visits} onFilter={setFilter} />
      </div>

      <div className="flex-grow relative z-0">
        <MapContainer
          center={[44.95, -92.95]}
          zoom={7}
          className="h-full w-full"
        >
          <MapFixer />
          <LocationService onLocation={handleLocationUpdate} />
          <RecenterControl position={userLocation} />
          <TileLayer
            url="https://tile.jawg.io/af06ba33-f6df-4eb7-80a2-a81fd169c187/{z}/{x}/{y}.png?access-token=eaVAmuImVyZ14hXBuyquvFt5SXhDdfbcULGgL3DBhSbqntHqoFRbNxmHhsUMHKwo"
            attribution='Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> & <a href="https://www.jawg.io">Jawg</a>'
          />
          {locations
            .filter((loc) => {
              const visited = isVisited(loc.storeNumber);

              if (filter.status === "visited" && !visited) return false;
              if (filter.status === "unvisited" && visited) return false;
              if (filter.state !== "all" && loc.state !== filter.state)
                return false;
              if (filter.city !== "all" && loc.city !== filter.city)
                return false;

              return true;
            })
            .map((loc) => (
              <Marker
                key={loc.storeNumber}
                position={[loc.latitude, loc.longitude]}
                icon={isVisited(loc.storeNumber) ? visitedIcon : unvisitedIcon}
              >
                <Popup>
                  <div className="space-y-2">
                    <div>
                      <strong>{loc.name}</strong>
                      <br />
                      {loc.address}, {loc.city}, {loc.state}
                    </div>
                    {isVisited(loc.storeNumber) ? (
                      <div className="text-green-600 font-semibold">
                        ✅ Already Visited
                      </div>
                    ) : !isFriend ? (
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                        onClick={() => {
                          const userId = localStorage.getItem("userId");
                          if (!userId) {
                            alert("No user selected.");
                            return;
                          }

                          fetch(`${API_BASE}/visits`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              storeNumber: loc.storeNumber,
                              userId: userId,
                              visitDate: new Date().toISOString(), // ✅ Add this line
                            }),
                          })
                            .then((res) => res.json())
                            .then(() => {
                              setVisits([
                                ...visits,
                                { storeNumber: loc.storeNumber, userId },
                              ]);
                            });
                        }}
                      >
                        ➕ Mark Visited
                      </button>
                    ) : null}
                    {isVisited(loc.storeNumber) && !isFriend && (
                      <button
                        className="bg-gray-300 hover:bg-gray-400 text-black px-3 py-1 rounded"
                        onClick={() => {
                          const userId = localStorage.getItem("userId");
                          fetch(`/api/visits/${userId}/${loc.storeNumber}`, {
                            method: "DELETE",
                          })
                            .then((res) => res.json())
                            .then(() => {
                              setVisits(
                                visits.filter(
                                  (v) => v.storeNumber !== loc.storeNumber
                                )
                              );
                            });
                        }}
                      >
                        ❌ Remove Visit
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          <UserMarker position={userLocation} />
        </MapContainer>
      </div>
    </div>
  );
}
