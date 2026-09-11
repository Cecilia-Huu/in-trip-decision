import type { Coordinates } from "./decision-engine";

// Called by the location button only; no permission request on mount or import.
export function requestCoordinates(geolocation: Geolocation | undefined): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!geolocation) { reject(new Error("Location unavailable")); return; }
    geolocation.getCurrentPosition(({ coords }) => {
      const { latitude, longitude } = coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        reject(new Error("Invalid coordinates")); return;
      }
      resolve({ latitude, longitude });
    }, reject, { enableHighAccuracy:false, timeout:10000, maximumAge:60000 });
  });
}
