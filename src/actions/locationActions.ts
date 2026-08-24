"use server";

import { revalidatePath } from "next/cache";
import { locationService } from "@/backend/services/LocationService";
import { waitForDb } from "@/backend/datasource";
import { CreateLocationDTO, UpdateLocationDTO } from "@/backend/types/locations";

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
    await waitForDb();
    const locations = await locationService.getAll();
    return { success: true, data: locations.map(toPlainLocation) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getActiveLocations() {
  try {
    await waitForDb();
    const locations = await locationService.getActive();
    return { success: true, data: locations.map(toPlainLocation) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createLocation(data: CreateLocationDTO) {
  try {
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
