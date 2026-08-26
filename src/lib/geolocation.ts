import { waitForDb } from "@/backend/datasource";
import { locationRepository } from "@/backend/repositories/LocationRepository";

/**
 * Coordinates returned by the device GPS.
 */
export interface GeoCoordinates {
  lat: number;
  lng: number;
}

/**
 * Result of server-side geolocation validation.
 */
export type LocationValidationResult =
  | { valid: true }
  | { valid: false; error: string; code: string };

const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Haversine formula — calculates the great-circle distance between two
 * points on Earth using their latitude and longitude.
 *
 * @returns distance in meters
 */
export function haversineDistance(a: GeoCoordinates, b: GeoCoordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/**
 * Server-side validation: checks whether the given GPS coordinates fall
 * within the configured radius of any active business location.
 *
 * Graceful fallback rules:
 * - If no active locations exist → allow (no restriction configured).
 * - If the active location has null lat/lng → allow (coordinates not configured).
 * - If coordinates are provided but the employee is outside radius → reject.
 *
 * Admins should bypass this check entirely (handle in the caller).
 */
export async function validateLocation(
  coordinates: GeoCoordinates | null
): Promise<LocationValidationResult> {
  await waitForDb();
  const locations = await locationRepository.findActive();

  // No active locations → no restriction
  if (locations.length === 0) {
    return { valid: true };
  }

  // If no coordinates provided and there are locations with coordinates, reject
  if (!coordinates) {
    const hasConfigured = locations.some((loc) => loc.lat != null && loc.lng != null);
    if (hasConfigured) {
      return {
        valid: false,
        error: "Debes permitir el acceso a tu ubicación",
        code: "geolocation_required",
      };
    }
    return { valid: true };
  }

  // Check against each active location — employee must be within at least one
  for (const location of locations) {
    if (location.lat == null || location.lng == null) {
      continue; // Skip locations without configured coordinates
    }

    const distance = haversineDistance(coordinates, {
      lat: Number(location.lat),
      lng: Number(location.lng),
    });

    if (distance <= location.radiusMeters) {
      return { valid: true };
    }
  }

  return {
    valid: false,
    error: "Debes estar dentro del establecimiento para registrar asistencia",
    code: "geolocation_out_of_range",
  };
}
