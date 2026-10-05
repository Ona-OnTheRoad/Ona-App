import { useMapEvents } from "react-leaflet";
import L from "leaflet";

export function pinIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;margin-left:-14px;margin-top:-28px;border-radius:9999px 9999px 0 9999px;transform:rotate(45deg);background:#ef4444;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

export function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
