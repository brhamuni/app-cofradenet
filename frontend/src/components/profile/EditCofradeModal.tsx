"use client";

import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import api from "@/app/api/axios";

interface EditCofradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNombre: string;
  onSuccess: (data: { nombre?: string }) => void;
}

export default function EditCofradeModal({
  isOpen,
  onClose,
  initialNombre,
  onSuccess,
}: EditCofradeModalProps) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState(initialNombre);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNombre(initialNombre);
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirm("");
      setError("");
    }
  }, [isOpen, initialNombre]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cambiaPassword = passwordNueva.length > 0;
    if (cambiaPassword) {
      if (passwordNueva.length < 6) {
        setError("La nueva contraseña debe tener al menos 6 caracteres");
        return;
      }
      if (passwordNueva !== passwordConfirm) {
        setError("Las contraseñas nuevas no coinciden");
        return;
      }
      if (!passwordActual) {
        setError("Indica tu contraseña actual para cambiarla");
        return;
      }
    }

    setCargando(true);
    try {
      const body: Record<string, string> = {};
      if (nombre.trim() && nombre.trim() !== initialNombre) {
        body.nombre = nombre.trim();
      }
      if (cambiaPassword) {
        body.passwordActual = passwordActual;
        body.passwordNueva = passwordNueva;
      }

      if (Object.keys(body).length === 0) {
        onClose();
        return;
      }

      const { data } = await api.patch("/usuarios/perfil", body);
      onSuccess({ nombre: data.nombre || nombre.trim() });
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(", ")
          : null) ||
        "No se pudo actualizar el perfil";
      setError(typeof msg === "string" ? msg : "No se pudo actualizar el perfil");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-black text-gray-900">Editar perfil</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
              Nombre visible
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cofrade-main/20"
              placeholder="Tu nombre"
            />
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">
              Cambiar contraseña (opcional)
            </p>
            <div className="space-y-3">
              <input
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                className="w-full p-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cofrade-main/20"
                placeholder="Contraseña actual"
                autoComplete="current-password"
              />
              <input
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                className="w-full p-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cofrade-main/20"
                placeholder="Nueva contraseña"
                autoComplete="new-password"
              />
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full p-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-cofrade-main/20"
                placeholder="Confirmar nueva contraseña"
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-cofrade-main text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {cargando && <Loader2 size={18} className="animate-spin" />}
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  );
}
