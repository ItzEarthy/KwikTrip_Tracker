import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const createIcon = (type) => {
  if (type === "user") {
    return new L.Icon({
      iconUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="10" fill="%23007bff"/></svg>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  if (type === "visited") {
    return new L.Icon({
      iconUrl: "/icons/travel.png",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -36],
    });
  }

  return new L.Icon({
    iconUrl: "/icons/location.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -36],
  });
};

function buildPopupHtml(loc, visited) {
  const phone = loc.phone ? `<br/>📞 ${loc.phone}` : "";
  const amenities = loc.amenities
    ? `<div class=\"text-sm\"><strong>Amenities:</strong><div style=\"display:flex;flex-wrap:wrap;gap:6px;margin-top:6px\">${
        loc.amenities.gas ? '<span style=\"background:#ebf8ff;color:#0366d6;padding:4px 6px;border-radius:6px;font-size:12px\">⛽ Gas</span>' : ""
      }${
        loc.amenities.diesel ? '<span style=\"background:#e6ffed;color:#064e3b;padding:4px 6px;border-radius:6px;font-size:12px\">🚛 Diesel</span>' : ""
      }${
        loc.amenities.carWash ? '<span style=\"background:#f3e8ff;color:#6b21a8;padding:4px 6px;border-radius:6px;font-size:12px\">🚗 Car Wash</span>' : ""
      }${
        loc.amenities.e85 ? '<span style=\"background:#fffaeb;color:#92400e;padding:4px 6px;border-radius:6px;font-size:12px\">🌽 E85</span>' : ""
      }${
        loc.amenities.def ? '<span style=\"background:#f3f4f6;color:#111827;padding:4px 6px;border-radius:6px;font-size:12px\">💧 DEF</span>' : ""
      }${
        loc.amenities.cng ? '<span style=\"background:#eef2ff;color:#3730a3;padding:4px 6px;border-radius:6px;font-size:12px\">🔋 CNG</span>' : ""
      }${
        loc.amenities.lng ? '<span style=\"background:#ecfeff;color:#0f766e;padding:4px 6px;border-radius:6px;font-size:12px\">⚡ LNG</span>' : ""
      }</div></div>`
    : "";

  const visitedHtml = visited
    ? '<div style=\"color:#16a34a;font-weight:600;margin-top:8px\">✅ Already Visited</div>'
    : "";

  const checkInBtn = !visited
    ? `<button id=\"checkin-btn-${loc.storeNumber}\" style=\"margin-top:8px;background:#dc2626;color:white;padding:8px 10px;border-radius:6px;border:none;width:100%;cursor:pointer\" data-store=\"${loc.storeNumber}\">✅ Check In / Mark Visited</button>`
    : "";

  return `
    <div style="font-family:inherit">
      <div><strong>${loc.name}</strong><br/>${loc.address}<br/>${loc.city}, ${loc.state} ${loc.zip}${phone}</div>
      ${amenities}
      ${visitedHtml}
      ${checkInBtn}
    </div>
  `;
}

export default function ClusteredMarkers({ locations = [], visits = [], onCheckIn }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const clusterGroup = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      chunkedLoading: true,
      maxClusterRadius: 60,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        const size = count < 10 ? 40 : count < 100 ? 52 : 64;
        const html = `
          <div class="kwik-cluster-icon" style="width:${size}px;height:${size}px;line-height:${size}px;font-size:${size/3.2}px;display:flex;align-items:center;justify-content:center;background:#dc2626;color:#fff;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.25)">
            ${count}
          </div>`;

        return L.divIcon({ html, className: "", iconSize: L.point(size, size) });
      },
    });

    // Handle check-in button clicks inside popups using a document-level listener
    const handlePopupClick = (e) => {
      // find the closest element that matches our checkin button id pattern
      const btn = e.target && e.target.closest && e.target.closest('[id^="checkin-btn-"]');
      if (!btn) return;
      const storeNumber = btn.getAttribute('data-store');
      if (storeNumber && onCheckIn) {
        btn.textContent = '⏳ Checking in...';
        btn.disabled = true;
        onCheckIn(storeNumber);
      }
    };

    document.addEventListener('click', handlePopupClick);

    // Separate unvisited locations (clustered) from already visited (standalone)
    const directMarkers = [];

    const unvisitedLocations = locations.filter(
      (loc) => !visits.some((v) => v.storeNumber === loc.storeNumber)
    );

    const visitedLocations = locations.filter((loc) =>
      visits.some((v) => v.storeNumber === loc.storeNumber)
    );

    const markers = unvisitedLocations.map((loc) => {
      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: createIcon("unvisited"),
      });

      marker.bindPopup(buildPopupHtml(loc, false));
      return marker;
    });

    markers.forEach((m) => clusterGroup.addLayer(m));

    // Add visited locations as standalone markers (not part of clusters)
    visitedLocations.forEach((loc) => {
      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: createIcon("visited"),
      });
      marker.bindPopup(buildPopupHtml(loc, true));
      marker.addTo(map);
      directMarkers.push(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      try {
        document.removeEventListener('click', handlePopupClick);
        map.removeLayer(clusterGroup);
        // remove standalone visited markers
        directMarkers.forEach((m) => {
          try {
            map.removeLayer(m);
          } catch (e) {}
        });
      } catch (e) {}
    };
  }, [map, locations, visits, onCheckIn]);

  return null;
}
