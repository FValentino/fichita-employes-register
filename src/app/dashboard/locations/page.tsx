export const dynamic = "force-dynamic";

import { getLocations } from "@/actions";
import { LocationsClient } from "./LocationsClient";

export default async function LocationsPage() {
  const result = await getLocations();

  const locations = result.success ? result.data ?? [] : [];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 m-0">
          Ubicaciones / Sedes
        </h1>
        <LocationsClient initialLocations={locations} />
      </div>
    </div>
  );
}
