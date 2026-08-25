"use server";

import { revalidatePath } from "next/cache";
import { locationService } from "@/backend/services/LocationService";
import { waitForDb } from "@/backend/datasource";
import { requireAuth, requireAdmin } from "@/lib/auth/guard";
import { createLocationSchema, updateLocationSchema } from "@/lib/validations";

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

export async function createLocation(data: unknown) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();

    const parsed = createLocationSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const location = await locationService.create(parsed.data as any);
    revalidatePath("/dashboard/locations");
    return { success: true, data: toPlainLocation(location) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateLocation(id: string, data: unknown) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();

    const parsed = updateLocationSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const location = await locationService.update(id, parsed.data as any);
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
