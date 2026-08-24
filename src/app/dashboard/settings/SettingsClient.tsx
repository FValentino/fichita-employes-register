"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPhotoRequirement } from "@/actions";

export function SettingsClient({ photoRequired }: { photoRequired: boolean }) {
  const [isEnabled, setIsEnabled] = useState(photoRequired);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const handleToggle = async () => {
    const newValue = !isEnabled;
    setIsSaving(true);
    setMessage(null);

    const result = await setPhotoRequirement(newValue);

    setIsSaving(false);

    if (result.success) {
      setIsEnabled(newValue);
      setMessage({ type: "success", text: "Configuración guardada" });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error || "Error al guardar" });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Photo requirement setting */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-800 m-0">
              Requerir foto al escanear
            </h3>
            <p className="text-sm text-gray-500 mt-1 m-0">
              Cuando está activado, los empleados deben tomar una foto al registrar entrada o salida mediante código QR.
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isEnabled ? "bg-amber-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-gray-50">
          <p className="text-sm text-gray-600 m-0">
            <span className="font-medium">Estado actual:</span>{" "}
            <span className={isEnabled ? "text-amber-600 font-medium" : "text-gray-500"}>
              {isEnabled ? "Activado" : "Desactivado"}
            </span>
          </p>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm text-center ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Future settings placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-6 opacity-60">
        <h3 className="text-base font-semibold text-gray-800 m-0">
          Más configuraciones
        </h3>
        <p className="text-sm text-gray-500 mt-2 m-0">
          Próximamente: tolerancia de tardanza, timezone, notificaciones, y más.
        </p>
      </div>
    </div>
  );
}
