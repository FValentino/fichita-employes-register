"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { HiArrowLeft, HiPlus, HiDocumentText } from "react-icons/hi2";

interface Justification {
  id: string;
  date: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminComment?: string;
}

export default function JustificationsPage() {
  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      // Load justifications from API
      loadJustifications();
    });
  }, [router]);

  const loadJustifications = async () => {
    // TODO: Implement when justification API exists
    setJustifications([]);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Aprobada";
      case "REJECTED":
        return "Rechazada";
      default:
        return "Pendiente";
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/home")}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <HiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 m-0">Justificaciones</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-amber-500 text-neutral-900 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-amber-600 transition-colors"
          >
            <HiPlus className="w-4 h-4" />
            Nueva
          </button>
        </div>

        {/* Justifications list */}
        {loading ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : justifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <HiDocumentText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 m-0">No hay justificaciones</p>
            <p className="text-sm text-gray-400 mt-1 m-0">
              Crea una justificación si faltaste a trabajar
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {justifications.map((j) => (
              <div key={j.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-gray-800 m-0">{j.date}</p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                      j.status
                    )}`}
                  >
                    {getStatusLabel(j.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 m-0">{j.reason}</p>
                {j.adminComment && (
                  <p className="text-sm text-gray-500 mt-2 m-0 italic">
                    Comentario: {j.adminComment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New justification form modal */}
        {showForm && (
          <JustificationForm onClose={() => setShowForm(false)} onSuccess={loadJustifications} />
        )}
      </div>
    </div>
  );
}

function JustificationForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !reason) {
      setError("Fecha y motivo son requeridos");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // TODO: Implement when justification API exists
    // For now, just close
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-800 m-0 mb-4 text-center">
          Nueva Justificación
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1.5 text-sm text-gray-600">Fecha *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-sm text-gray-600">Motivo *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-amber-500 resize-none"
              placeholder="Describe el motivo de tu ausencia..."
            />
          </div>

          <div>
            <label className="block mb-1.5 text-sm text-gray-600">Certificado (opcional)</label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
            />
            <p className="text-xs text-gray-400 mt-1 m-0">PDF, PNG o JPEG (máx. 5MB)</p>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-lg bg-amber-500 text-neutral-900 font-semibold text-sm hover:bg-amber-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
