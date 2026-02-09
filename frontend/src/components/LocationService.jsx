import { useEffect, useState, useRef } from "react";

export default function LocationService({ onLocation, watch = true }) {
  const [permission, setPermission] = useState("prompt");
  const lastSentRef = useRef(0);
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setPermission("unsupported");
      return;
    }

    let watcher = null;

    // try to get current position first
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermission("granted");
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onLocation?.(coords);
        postLocation(coords);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermission("denied");
        else setPermission("error");
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    if (watch) {
      watcher = navigator.geolocation.watchPosition(
        (pos) => {
          setPermission("granted");
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          onLocation?.(coords);
          postLocation(coords);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) setPermission("denied");
        },
        { enableHighAccuracy: true, maximumAge: 5000 }
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
  }, [onLocation, watch]);

  return null; // invisible helper component
}
