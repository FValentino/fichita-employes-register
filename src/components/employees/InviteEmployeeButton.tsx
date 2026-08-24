"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inviteEmployee } from "@/actions";

interface InviteEmployeeButtonProps {
  employee: {
    id: string;
    name: string;
    lastName: string;
    email?: string | null;
    authUserId?: string | null;
  };
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

export function InviteEmployeeButton({ employee }: InviteEmployeeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(employee.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Don't show if already invited
  if (employee.authUserId) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("El email es requerido");
      return;
    }
    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsSubmitting(true);

    const result = await inviteEmployee(employee.id, email.trim(), password);

    setIsSubmitting(false);

    if (result.success) {
      setIsOpen(false);
      setEmail("");
      setPassword("");
      router.refresh();
    } else {
      setError(result.error || "Error al invitar empleado");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setEmail(employee.email ?? "");
    setPassword("");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 rounded-md border border-green-500 bg-white text-green-600 text-xs font-medium cursor-pointer hover:bg-green-50 transition-colors"
      >
        <span className="flex items-center gap-1">
          <MailIcon />
          Invitar
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
          <div className="bg-white p-6 md:p-8 rounded-xl w-full max-w-md shadow-lg relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleClose} className="absolute top-4 right-4 bg-transparent border-none text-red-500 cursor-pointer p-1">
              <CloseIcon />
            </button>

            <h2 className="text-xl font-bold text-gray-800 mt-0 mb-1 text-center">
              Invitar Empleado
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              {employee.lastName}, {employee.name}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block mb-1.5 text-sm text-gray-600">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none transition-colors focus:border-amber-500"
                  placeholder="empleado@empresa.com"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-sm text-gray-600">Contraseña *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none transition-colors focus:border-amber-500 pr-16"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs cursor-pointer bg-transparent border-none hover:text-gray-700"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
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
                  className="flex-1 py-3 rounded-lg bg-green-600 text-white font-semibold text-sm cursor-pointer hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Invitando..." : "Invitar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
