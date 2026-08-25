"use server";

import { revalidatePath } from "next/cache";
import { settingService } from "@/backend/services/SettingService";
import { waitForDb } from "@/backend/datasource";
import { requireAuth, requireAdmin } from "@/lib/auth/guard";

import { Setting } from "@/backend/models/Setting";

function toPlainSetting(setting: Setting) {
  return {
    key: setting.key,
    value: setting.value,
    description: setting.description,
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt,
  };
}

export async function getSettings() {
  try {
    const auth = await requireAuth();
    if (!auth) return { success: false, error: "No autenticado" };
    await waitForDb();
    const settings = await settingService.getAll();
    return { success: true, data: settings.map(toPlainSetting) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getSetting(key: string) {
  try {
    const auth = await requireAuth();
    if (!auth) return { success: false, error: "No autenticado" };
    await waitForDb();
    const value = await settingService.get(key);
    return { success: true, data: value };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function setSetting(key: string, value: string, description?: string) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return { success: false, error: guard.error };
    await waitForDb();
    await settingService.set(key, value, description);
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function setPhotoRequirement(enabled: boolean) {
  return setSetting(
    "require_scan_photo",
    enabled ? "true" : "false",
    "Requerir foto al escanear código QR"
  );
}

export async function getPhotoRequirement() {
  try {
    const auth = await requireAuth();
    if (!auth) return { success: false, error: "No autenticado" };
    await waitForDb();
    const enabled = await settingService.getBoolean("require_scan_photo", false);
    return { success: true, data: enabled };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
