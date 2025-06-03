import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import L from "leaflet";
import Filters from "./Filters";
import FriendsList from "./FriendsList";
import MapFixer from "./MapFixer";
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

export default function MapView() {
  const mode = localStorage.getItem("mode") || "self";
  const [filter, setFilter] = useState({
    status: "all",
    state: "all",
    city: "all",
  });
  const [locations, setLocations] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(
    localStorage.getItem("selectedUserId") || localStorage.getItem("userId")
  );

  useEffect(() => {
    fetch(`${API_BASE}/locations`)
      .then((res) => res.json())
      .then(setLocations);
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

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Navbar />
      
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
                              setVisits(visits.filter((v) => v.storeNumber !== loc.storeNumber));
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
        </MapContainer>
      </div>
    </div>
  );
}
