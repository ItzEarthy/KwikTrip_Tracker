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
    ? `<button style=\"margin-top:8px;background:#dc2626;color:white;padding:8px 10px;border-radius:6px;border:none;width:100%\" onclick=\"(function(){fetch('/api/visits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({storeNumber:${loc.storeNumber},userId:localStorage.getItem('userId'),visitDate:new Date().toISOString()})}).then(()=>location.reload())})()\">✅ Check In / Mark Visited</button>`
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

export default function ClusteredMarkers({ locations = [], visits = [] }) {
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
          <div class="kwik-cluster-icon" style="width:${size}px;height:${size}px;line-height:${size}px;font-size:${size/3.2}px">
            ${count}
          </div>`;

        return L.divIcon({ html, className: "", iconSize: L.point(size, size) });
      },
    });

    const markers = locations.map((loc) => {
      const visited = visits.some((v) => v.storeNumber === loc.storeNumber);
      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: createIcon(visited ? "visited" : "unvisited"),
      });

      marker.bindPopup(buildPopupHtml(loc, visited));
      return marker;
    });

    markers.forEach((m) => clusterGroup.addLayer(m));

    map.addLayer(clusterGroup);

    return () => {
      try {
        map.removeLayer(clusterGroup);
      } catch (e) {}
    };
  }, [map, locations, visits]);

  return null;
}
