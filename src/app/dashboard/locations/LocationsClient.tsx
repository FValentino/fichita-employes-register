"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createLocation,
  updateLocation,
  deleteLocation,
} from "@/actions";

interface LocationData {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  radiusMeters: number;
  address: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  address: string;
  lat: string;
  lng: string;
  radiusMeters: number;
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function LocationForm({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData?: LocationData;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name ?? "",
    address: initialData?.address ?? "",
    lat: initialData?.lat != null ? String(initialData.lat) : "",
    lng: initialData?.lng != null ? String(initialData.lng) : "",
    radiusMeters: initialData?.radiusMeters ?? 100,
  });

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Nombre es requerido";
    if (formData.lat && (isNaN(Number(formData.lat)) || Number(formData.lat) < -90 || Number(formData.lat) > 90)) {
      newErrors.lat = "Latitud inválida (-90 a 90)";
    }
    if (formData.lng && (isNaN(Number(formData.lng)) || Number(formData.lng) < -180 || Number(formData.lng) > 180)) {
      newErrors.lng = "Longitud inválida (-180 a 180)";
    }
    if (formData.radiusMeters < 10 || formData.radiusMeters > 10000) {
      newErrors.radiusMeters = "Radio debe ser entre 10 y 10000 metros";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim() || undefined,
      lat: formData.lat ? Number(formData.lat) : null,
      lng: formData.lng ? Number(formData.lng) : null,
      radiusMeters: formData.radiusMeters,
    };

    const result = initialData
      ? await updateLocation(initialData.id, payload)
      : await createLocation(payload);

    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || "Error al guardar ubicación");
    }
  };

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-6 md:p-8 rounded-xl w-full max-w-md shadow-lg relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 bg-transparent border-none text-red-500 cursor-pointer p-1">
          <CloseIcon />
        </button>

        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mt-0 mb-6 text-center">
          {initialData ? "Editar Ubicación" : "Nueva Ubicación"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1.5 text-sm text-gray-600">Nombre *</label>
            <input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                errors.name ? "border-red-500" : "border-gray-300 focus:border-amber-500"
              }`}
              placeholder="Ej: Sede Central"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block mb-1.5 text-sm text-gray-600">Dirección</label>
            <input
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none transition-colors focus:border-amber-500"
              placeholder="Ej: Av. Corrientes 1234"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1.5 text-sm text-gray-600">Latitud</label>
              <input
                value={formData.lat}
                onChange={(e) => handleChange("lat", e.target.value)}
                type="number"
                step="any"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                  errors.lat ? "border-red-500" : "border-gray-300 focus:border-amber-500"
                }`}
                placeholder="-34.6037"
              />
              {errors.lat && <p className="text-red-500 text-xs mt-1">{errors.lat}</p>}
            </div>
            <div>
              <label className="block mb-1.5 text-sm text-gray-600">Longitud</label>
              <input
                value={formData.lng}
                onChange={(e) => handleChange("lng", e.target.value)}
                type="number"
                step="any"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                  errors.lng ? "border-red-500" : "border-gray-300 focus:border-amber-500"
                }`}
                placeholder="-58.3816"
              />
              {errors.lng && <p className="text-red-500 text-xs mt-1">{errors.lng}</p>}
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-sm text-gray-600">Radio (metros)</label>
            <input
              value={formData.radiusMeters}
              onChange={(e) => handleChange("radiusMeters", Number(e.target.value))}
              type="number"
              min={10}
              max={10000}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                errors.radiusMeters ? "border-red-500" : "border-gray-300 focus:border-amber-500"
              }`}
            />
            {errors.radiusMeters && <p className="text-red-500 text-xs mt-1">{errors.radiusMeters}</p>}
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold text-sm cursor-pointer hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-lg bg-amber-500 text-neutral-900 font-semibold text-sm cursor-pointer hover:bg-amber-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LocationsClient({ initialLocations }: { initialLocations: LocationData[] }) {
  const [locations, setLocations] = useState<LocationData[]>(initialLocations);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationData | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  const handleEdit = (location: LocationData) => {
    setEditingLocation(location);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async (id: string) => {
    const result = await deleteLocation(id);
    if (result.success) {
      setLocations((prev) => prev.filter((l) => l.id !== id));
      router.refresh();
    }
    setDeletingId(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLocation(undefined);
  };

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="bg-amber-500 text-neutral-900 px-4 md:px-6 py-2.5 rounded-lg border-none font-semibold text-sm cursor-pointer hover:bg-amber-600 transition-colors w-full md:w-auto"
      >
        + Nueva Ubicación
      </button>

      {showForm && (
        <LocationForm
          initialData={editingLocation}
          onClose={handleFormClose}
          onSuccess={handleSuccess}
        />
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden mt-4">
        {locations.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-base m-0">No hay ubicaciones registradas</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-4 text-center text-gray-500 text-sm font-medium">Nombre</th>
                <th className="p-4 text-center text-gray-500 text-sm font-medium">Dirección</th>
                <th className="p-4 text-center text-gray-500 text-sm font-medium">Coordenadas</th>
                <th className="p-4 text-center text-gray-500 text-sm font-medium">Radio</th>
                <th className="p-4 text-center text-gray-500 text-sm font-medium">Estado</th>
                <th className="p-4 text-center text-gray-500 text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location, index) => (
                <tr
                  key={location.id}
                  className={index > 0 ? "border-t border-gray-200" : ""}
                >
                  <td className="p-4 text-center text-gray-800 text-sm font-semibold">
                    {location.name}
                  </td>
                  <td className="p-4 text-center text-gray-700 text-sm">
                    {location.address || "—"}
                  </td>
                  <td className="p-4 text-center text-gray-700 text-sm">
                    {location.lat != null && location.lng != null
                      ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                      : "—"}
                  </td>
                  <td className="p-4 text-center text-gray-700 text-sm">
                    {location.radiusMeters}m
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        location.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {location.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(location)}
                        className="px-3 py-1.5 rounded-md border border-amber-500 bg-white text-gray-700 text-xs font-medium cursor-pointer hover:bg-amber-50 transition-colors"
                      >
                        Editar
                      </button>
                      {deletingId === location.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => confirmDelete(location.id)}
                            className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs font-medium cursor-pointer hover:bg-red-700 transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDelete(location.id)}
                          className="px-3 py-1.5 rounded-md border border-red-500 bg-white text-red-500 text-xs font-medium cursor-pointer hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3 mt-4">
        {locations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500 text-base m-0">No hay ubicaciones registradas</p>
          </div>
        ) : (
          locations.map((location) => (
            <div key={location.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-800 m-0">{location.name}</p>
                  {location.address && (
                    <p className="text-sm text-gray-500 m-0 mt-1">{location.address}</p>
                  )}
                </div>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    location.active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {location.active ? "Activa" : "Inactiva"}
                </span>
              </div>

              {location.lat != null && location.lng != null && (
                <p className="text-sm text-gray-600 m-0 mb-2">
                  📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)} · Radio: {location.radiusMeters}m
                </p>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleEdit(location)}
                  className="flex-1 py-2 rounded-lg border border-amber-500 bg-white text-gray-700 text-xs font-medium cursor-pointer hover:bg-amber-50 transition-colors"
                >
                  Editar
                </button>
                {deletingId === location.id ? (
                  <>
                    <button
                      onClick={() => confirmDelete(location.id)}
                      className="flex-1 py-2 rounded-lg bg-red-600 text-white text-xs font-medium cursor-pointer hover:bg-red-700 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="flex-1 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleDelete(location.id)}
                    className="flex-1 py-2 rounded-lg border border-red-500 bg-white text-red-500 text-xs font-medium cursor-pointer hover:bg-red-50 transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
