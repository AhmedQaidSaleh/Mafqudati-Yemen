import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

const YEMEN_CENTER: [number, number] = [15.5527, 48.5164];

const pinIcon = new Icon({
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function Picker({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onChange(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function LocationPickerInner({
  lat,
  lng,
  onChange,
  height = 300,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}) {
  const pos: [number, number] = lat != null && lng != null ? [lat, lng] : YEMEN_CENTER;
  return (
    <div className="rounded-2xl overflow-hidden border border-border" style={{ height }}>
      <MapContainer center={pos} zoom={lat != null ? 13 : 6} className="h-full w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {lat != null && lng != null && <Marker position={[lat, lng]} icon={pinIcon} />}
        <Picker onChange={onChange} />
      </MapContainer>
    </div>
  );
}
