// src/components/MapFixer.jsx
import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapFixer() {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200); // delay ensures container is fully loaded
  }, [map]);

  return null;
}
