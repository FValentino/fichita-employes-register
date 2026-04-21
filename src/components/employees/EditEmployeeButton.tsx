"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaTimes } from "react-icons/fa";
import { theme } from "@/lib/theme";
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
        style={{
          padding: "6px 12px",
          borderRadius: "6px",
          border: `1px solid ${theme.colors.primary}`,
          backgroundColor: theme.colors.white,
          color: theme.colors.neutral,
          fontSize: "12px",
          fontWeight: "500",
          cursor: "pointer",
          marginRight: "8px",
        }}
      >
        Editar
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleClose}
        >
          <div
            style={{
              backgroundColor: theme.colors.white,
              padding: "32px",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "400px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#EF4444",
                fontSize: "20px",
                padding: "4px",
              }}
            >
              <FaTimes />
            </button>

            <h2 style={{ 
              color: theme.colors.neutral, 
              marginTop: 0, 
              marginBottom: "24px",
              fontSize: "24px",
              fontWeight: "bold",
              textAlign: "center",
              paddingRight: "24px"
            }}>
              Editar Empleado
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: theme.colors.gray[500] }}>
                  Nombre
                </label>
                <input
                  name="name"
                  defaultValue={employee.name}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${errors.name ? "#EF4444" : theme.colors.gray[300]}`,
                    fontSize: "14px",
                    color: theme.colors.neutral,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {errors.name && (
                  <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0 0" }}>
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: theme.colors.gray[500] }}>
                  Apellido
                </label>
                <input
                  name="lastName"
                  defaultValue={employee.lastName}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${errors.lastName ? "#EF4444" : theme.colors.gray[300]}`,
                    fontSize: "14px",
                    color: theme.colors.neutral,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {errors.lastName && (
                  <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0 0" }}>
                    {errors.lastName}
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: theme.colors.gray[500] }}>
                  Precio por Hora ($)
                </label>
                <input
                  name="hourlyRate"
                  type="number"
                  min="0"
                  defaultValue={employee.hourlyRate}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${errors.hourlyRate ? "#EF4444" : theme.colors.gray[300]}`,
                    fontSize: "14px",
                    color: theme.colors.neutral,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {errors.hourlyRate && (
                  <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0 0" }}>
                    {errors.hourlyRate}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: `1px solid ${theme.colors.gray[300]}`,
                    backgroundColor: theme.colors.white,
                    color: theme.colors.neutral,
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: isSubmitting ? theme.colors.gray[300] : theme.colors.primary,
                    color: theme.colors.neutral,
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
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
