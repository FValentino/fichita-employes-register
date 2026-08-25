"use server";

import { revalidatePath } from "next/cache";
import { locationService } from "@/backend/services/LocationService";
import { waitForDb } from "@/backend/datasource";
import { CreateLocationDTO, UpdateLocationDTO } from "@/backend/types/locations";
import { requireAuth, requireAdmin } from "@/lib/auth/guard";

function toPlainLocation(location: any) {
  return {
    id: location.id,
    name: location.name,
    lat: location.lat != null ? Number(location.lat) : null,
    lng: location.lng != null ? Number(location.lng) : null,
    radiusMeters: location.radiusMeters,
    address: location.address,
    active: location.active,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  };
}

export async function getLocations() {
  try {
    const auth = await requireAuth();
    if (!auth) return { success: false, error: "No autenticado" };
    await waitForDb();
    const locations = await locationService.getAll();
    return { success: true, data: locations.map(toPlainLocation) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getActiveLocations() {
  try {
    const auth = await requireAuth();
    if (!auth) return { success: false, error: "No autenticado" };
    await waitForDb();
    const locations = await locationService.getActive();
    return { success: true, data: locations.map(toPlainLocation) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createLocation(data: CreateLocationDTO) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();
    const location = await locationService.create(data);
    revalidatePath("/dashboard/locations");
    return { success: true, data: toPlainLocation(location) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateLocation(id: string, data: UpdateLocationDTO) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();
    const location = await locationService.update(id, data);
    if (!location) {
      return { success: false, error: "Ubicación no encontrada" };
    }
    revalidatePath("/dashboard/locations");
    return { success: true, data: toPlainLocation(location) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteLocation(id: string) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();
    const deleted = await locationService.delete(id);
    if (deleted) {
      revalidatePath("/dashboard/locations");
    }
    return { success: deleted };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
