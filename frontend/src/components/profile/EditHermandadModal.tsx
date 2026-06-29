"use client";

import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { API, resolveImg } from '@/lib/api';
import ImageUpload from "@/components/ui/ImageUpload";

export default function EditHermandadModal({ hermandad, isOpen, onClose }: any) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    nombrePopular: "",
    titulares: "",
    añoFundacion: "",
    templo: "",
    direccion: "",
    codigoPostal: "",
    diaSalida: "",
    descripcion: "",
    imagenEscudo: "",
  });

  useEffect(() => {
    if (hermandad && isOpen) {
      setFormData({
        nombre: hermandad.nombre || "",
        nombrePopular: hermandad.nombrePopular || "",
        titulares: Array.isArray(hermandad.titulares) ? hermandad.titulares.join(", ") : (hermandad.titulares || ""),
        añoFundacion: hermandad.añoFundacion ? String(hermandad.añoFundacion) : "",
        templo: hermandad.templo || "",
        direccion: hermandad.direccion || "",
        codigoPostal: hermandad.codigoPostal || "",
        diaSalida: hermandad.diaSalida || "",
        descripcion: hermandad.descripcion || "",
        imagenEscudo: hermandad.imagenEscudo || "",
      });
      setError("");
    }
  }, [hermandad, isOpen]);

  if (!isOpen) return null;

  const field = (label: string, key: keyof typeof formData, type = "text") => (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</label>
      <input
        type={type}
        value={formData[key]}
        onChange={e => setFormData({ ...formData, [key]: e.target.value })}
        className="w-full p-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700/20"
      />
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/hermandades/${hermandad.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          añoFundacion: formData.añoFundacion ? Number(formData.añoFundacion) : null,
          titulares: formData.titulares
            ? formData.titulares.split(",").map(t => t.trim()).filter(Boolean)
            : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error ${res.status}: no se pudo actualizar`);
      }
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-black">Editar Hermandad</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          <form id="edit-hermandad-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {field("Nombre oficial", "nombre")}
              {field("Nombre popular", "nombrePopular")}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Titulares</label>
              <input
                type="text"
                value={formData.titulares}
                onChange={e => setFormData({ ...formData, titulares: e.target.value })}
                placeholder="Ej: Nuestro Padre Jesús, La Virgen de la Paz"
                className="w-full p-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700/20"
              />
              <p className="text-[10px] text-gray-400 mt-1">Separa los titulares con comas</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {field("Año de fundación", "añoFundacion", "number")}
              {field("Día de salida", "diaSalida")}
            </div>

            {field("Templo / Sede canónica", "templo")}

            <div className="grid grid-cols-2 gap-4">
              {field("Dirección", "direccion")}
              {field("Código postal", "codigoPostal")}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full p-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-700/20"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Escudo</label>
              <div className="flex items-center gap-4">
                <ImageUpload
                  currentImage={resolveImg(formData.imagenEscudo) || undefined}
                  uploadUrl={`/hermandades/${hermandad.id}/logo`}
                  onSuccess={(data) => setFormData(f => ({ ...f, imagenEscudo: data.imagenEscudo ?? f.imagenEscudo }))}
                  shape="square"
                  size={88}
                />
                <p className="text-xs text-gray-400 leading-relaxed">Haz clic en la imagen<br/>para subir un nuevo escudo</p>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
          <button type="button" onClick={onClose} className="px-6 py-2 font-bold text-gray-500">
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-hermandad-form"
            disabled={cargando}
            className="px-8 py-2 bg-cofrade-main text-white rounded-full font-bold flex items-center disabled:opacity-50"
          >
            {cargando && <Loader2 className="animate-spin mr-2" size={16} />}
            {cargando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
