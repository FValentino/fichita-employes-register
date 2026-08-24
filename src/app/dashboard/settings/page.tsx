export const dynamic = "force-dynamic";

import { getPhotoRequirement } from "@/actions";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const result = await getPhotoRequirement();
  const photoRequired = result.success ? result.data ?? false : false;

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 m-0">
          Configuración
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Administra los ajustes de la aplicación
        </p>
      </div>

      <div className="max-w-2xl">
        <SettingsClient photoRequired={photoRequired} />
      </div>
    </div>
  );
}
