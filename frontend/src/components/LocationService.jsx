import { useEffect, useState, useRef } from "react";

export default function LocationService({ onLocation, watch = true }) {
  const [permission, setPermission] = useState("prompt");
  const lastSentRef = useRef(0);
  const lastPosRef = useRef(null);
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setPermission("unsupported");
      return;
    }

    let watcher = null;

    // get an initial, high-accuracy fix, then switch to lower-power watch
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermission("granted");
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        lastPosRef.current = coords;
        lastSentRef.current = Date.now();
        onLocation?.(coords);
        postLocation(coords);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermission("denied");
        else setPermission("error");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    if (watch) {
      // lower-power continuous updates: less accuracy and less frequent
      watcher = navigator.geolocation.watchPosition(
        (pos) => {
          setPermission("granted");
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };

          // throttle updates: only when moved >25m or 15s passed
          const now = Date.now();
          const prev = lastPosRef.current;
          const moved = prev ? haversineMeters(prev, coords) : Infinity;
          if (moved >= 25 || now - (lastSentRef.current || 0) > 60000) {
            lastPosRef.current = coords;
            onLocation?.(coords);
            postLocation(coords);
          }
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) setPermission("denied");
        },
        { enableHighAccuracy: false, maximumAge: 20000, timeout: 10000 }
      );
    }

    return () => {
      if (watch && watcher != null) navigator.geolocation.clearWatch(watcher);
    };

    // helper: post to backend with simple throttling
    function postLocation(coords) {
      try {
        const last = lastSentRef.current || 0;
        const now = Date.now();
        // throttle to at most one send every 5s
        if (now - last < 5000) return;
        lastSentRef.current = now;

        const payload = {
          userId: localStorage.getItem("userId") || null,
          latitude: coords.lat,
          longitude: coords.lng,
          timestamp: new Date().toISOString(),
        };

        fetch(`${window.location.origin}/api/user-locations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => {});
      } catch (e) {
        // ignore errors
      }
    }

    function haversineMeters(a, b) {
      const toRad = (v) => (v * Math.PI) / 180;
      const R = 6371000; // meters
      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.lng - a.lng);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);

      const sinDLat = Math.sin(dLat / 2);
      const sinDLon = Math.sin(dLon / 2);
      const x = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
      return R * c;
    }
  }, [onLocation, watch]);

  return null; // invisible helper component
}
