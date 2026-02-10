import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const API_BASE = `${window.location.origin}/api`;

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

function buildPopupHtml(loc, visited, visitId = null) {
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

  // Stats placeholder that will be populated async
  const statsDiv = `<div id=\"stats-${loc.storeNumber}\" style=\"margin-top:8px\"></div>`;

  // Action buttons
  const actionButtons = visited 
    ? `<div style=\"display:flex;gap:6px;margin-top:8px\">
         <button id=\"review-btn-${loc.storeNumber}\" style=\"flex:1;background:#2563eb;color:white;padding:6px 8px;border-radius:6px;border:none;cursor:pointer;font-size:13px\" data-store=\"${loc.storeNumber}\" data-visit=\"${visitId}\">✏️ Add Review</button>
         <button id=\"activity-btn-${loc.storeNumber}\" style=\"flex:1;background:#059669;color:white;padding:6px 8px;border-radius:6px;border:none;cursor:pointer;font-size:13px\" data-store=\"${loc.storeNumber}\">📋 See Reviews</button>
       </div>`
    : `<button id=\"activity-btn-${loc.storeNumber}\" style=\"margin-top:8px;background:#059669;color:white;padding:6px 8px;border-radius:6px;border:none;width:100%;cursor:pointer;font-size:13px\" data-store=\"${loc.storeNumber}\">📋 See Reviews</button>`;

  return `
    <div style="font-family:inherit;max-width:320px">
      <div><strong>${loc.name}</strong><br/>${loc.address}<br/>${loc.city}, ${loc.state} ${loc.zip}${phone}</div>
      ${amenities}
      ${statsDiv}
      ${visitedHtml}
      ${checkInBtn}
      ${actionButtons}
    </div>
  `;
}

async function loadStoreStats(storeNumber) {
  try {
    const response = await fetch(`${API_BASE}/locations/${storeNumber}/stats`);
    const data = await response.json();
    
    if (data.totalReviews === 0) {
      return '<div style="font-size:12px;color:#6b7280;font-style:italic;margin-top:4px">No ratings yet</div>';
    }

    const ratings = data.ratings;
    const avgRating = ratings.overall || 
      (Object.values(ratings).filter(r => r !== null).reduce((a, b) => a + b, 0) / 
       Object.values(ratings).filter(r => r !== null).length);

    if (!avgRating) {
      return '<div style="font-size:12px;color:#6b7280;font-style:italic">No ratings yet</div>';
    }

    const stars = '★'.repeat(Math.round(avgRating)) + '☆'.repeat(5 - Math.round(avgRating));
    
    return `
      <div style="background:#f9fafb;padding:8px;border-radius:6px;margin-top:4px">
        <div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:4px">Overall Store Rating</div>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="color:#facc15;font-size:16px">${stars}</span>
          <span style="font-size:13px;font-weight:600">${avgRating.toFixed(1)}</span>
          <span style="font-size:11px;color:#6b7280">(${data.totalReviews})</span>
        </div>
      </div>
    `;
  } catch (error) {
    return '';
  }
}

export default function ClusteredMarkers({ locations = [], visits = [], onCheckIn, onAddReview, onViewActivity }) {
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
          <div class="kwik-cluster-icon" style="width:${size}px;height:${size}px;line-height:${size}px;font-size:${size/3.2}px;display:flex;align-items:center;justify-content:center;background:#dc2626;color:#fff;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.25);position:relative;z-index:1000;">
            ${count}
          </div>`;

        return L.divIcon({ html, className: "", iconSize: L.point(size, size) });
      },
    });

    // Handle button clicks inside popups using a document-level listener
    const handlePopupClick = (e) => {
      // Check-in button
      const checkinBtn = e.target && e.target.closest && e.target.closest('[id^="checkin-btn-"]');
      if (checkinBtn) {
        const storeNumber = checkinBtn.getAttribute('data-store');
        if (storeNumber && onCheckIn) {
          checkinBtn.textContent = '⏳ Checking in...';
          checkinBtn.disabled = true;
          onCheckIn(storeNumber);
        }
        return;
      }

      // Review button
      const reviewBtn = e.target && e.target.closest && e.target.closest('[id^="review-btn-"]');
      if (reviewBtn) {
        const storeNumber = reviewBtn.getAttribute('data-store');
        const visitId = reviewBtn.getAttribute('data-visit');
        if (storeNumber && visitId && onAddReview) {
          onAddReview(visitId, storeNumber);
        }
        return;
      }

      // Activity button
      const activityBtn = e.target && e.target.closest && e.target.closest('[id^="activity-btn-"]');
      if (activityBtn) {
        const storeNumber = activityBtn.getAttribute('data-store');
        if (storeNumber && onViewActivity) {
          onViewActivity(storeNumber);
        }
        return;
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
        zIndexOffset: -1000,
      });

      const popupContent = buildPopupHtml(loc, false);
      const popup = L.popup({ maxWidth: 360, className: "kwik-popup" }).setContent(popupContent);
      
      marker.bindPopup(popup);
      
      // Load stats when popup opens
      marker.on('popupopen', async () => {
        const statsDiv = document.getElementById(`stats-${loc.storeNumber}`);
        if (statsDiv) {
          statsDiv.innerHTML = '<div style="font-size:12px;color:#6b7280">Loading...</div>';
          const statsHtml = await loadStoreStats(loc.storeNumber);
          statsDiv.innerHTML = statsHtml;
        }
      });

      return marker;
    });

    markers.forEach((m) => clusterGroup.addLayer(m));

    // Add visited locations as standalone markers (not part of clusters)
    visitedLocations.forEach((loc) => {
      const visitMatch = visits.find(v => v.storeNumber === loc.storeNumber);
      const visitId = visitMatch?.id || 1;
      
      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: createIcon("visited"),
        zIndexOffset: -1000,
      });
      
      const popupContent = buildPopupHtml(loc, true, visitId);
      const popup = L.popup({ maxWidth: 360, className: "kwik-popup" }).setContent(popupContent);
      
      marker.bindPopup(popup);
      
      // Load stats when popup opens
      marker.on('popupopen', async () => {
        const statsDiv = document.getElementById(`stats-${loc.storeNumber}`);
        if (statsDiv) {
          statsDiv.innerHTML = '<div style="font-size:12px;color:#6b7280">Loading...</div>';
          const statsHtml = await loadStoreStats(loc.storeNumber);
          statsDiv.innerHTML = statsHtml;
        }
      });
      
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
  }, [map, locations, visits, onCheckIn, onAddReview, onViewActivity]);

  return null;
}

