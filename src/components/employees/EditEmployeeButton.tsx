"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEmployee } from "@/actions";

interface Employee {
  id: string;
  name: string;
  lastName: string;
  hourlyRate: number;
}

interface FormData {
  name: string;
  lastName: string;
  hourlyRate: number;
}

interface EditEmployeeButtonProps {
  employee: Employee;
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function EditEmployeeButton({ employee }: EditEmployeeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const router = useRouter();

  const validateForm = (data: FormData): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!data.name.trim()) newErrors.name = "El nombre es requerido";
    if (!data.lastName.trim()) newErrors.lastName = "El apellido es requerido";
    if (data.hourlyRate < 0) newErrors.hourlyRate = "El precio debe ser mayor o igual a 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data: FormData = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      lastName: (form.elements.namedItem("lastName") as HTMLInputElement).value,
      hourlyRate: Number((form.elements.namedItem("hourlyRate") as HTMLInputElement).value),
    };
    if (!validateForm(data)) return;
    setIsSubmitting(true);
    const result = await updateEmployee(employee.id, data);
    setIsSubmitting(false);
    if (result.success) {
      form.reset();
      setIsOpen(false);
      setErrors({});
      router.refresh();
    } else {
      alert(result.error || "Error al actualizar empleado");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setErrors({});
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 rounded-md border border-amber-500 bg-white text-gray-700 text-xs font-medium cursor-pointer hover:bg-amber-50 transition-colors"
      >
        Editar
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
          <div className="bg-white p-6 md:p-8 rounded-xl w-full max-w-md shadow-lg relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleClose} className="absolute top-4 right-4 bg-transparent border-none text-red-500 cursor-pointer p-1">
              <CloseIcon />
            </button>

            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mt-0 mb-6 text-center">Editar Empleado</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block mb-1.5 text-sm text-gray-600">Nombre</label>
                <input
                  name="name"
                  defaultValue={employee.name}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                    errors.name ? "border-red-500" : "border-gray-300 focus:border-amber-500"
                  }`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block mb-1.5 text-sm text-gray-600">Apellido</label>
                <input
                  name="lastName"
                  defaultValue={employee.lastName}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                    errors.lastName ? "border-red-500" : "border-gray-300 focus:border-amber-500"
                  }`}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block mb-1.5 text-sm text-gray-600">Precio por Hora ($)</label>
                <input
                  name="hourlyRate"
                  type="number"
                  min="0"
                  defaultValue={employee.hourlyRate}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                    errors.hourlyRate ? "border-red-500" : "border-gray-300 focus:border-amber-500"
                  }`}
                />
                {errors.hourlyRate && <p className="text-red-500 text-xs mt-1">{errors.hourlyRate}</p>}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleClose}
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
      )}
    </>
  );
}