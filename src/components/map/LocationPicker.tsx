import { GoogleLocationPicker } from "./GoogleLocationPicker";

export function LocationPicker(props: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}) {
  return <GoogleLocationPicker {...props} />;
}
