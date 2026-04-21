"use client";

import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";

export default function EditHermandadModal({ hermandad, isOpen, onClose }: any) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    nombre: "", templo: "", añoFundacion: "", direccion: "", 
    codigoPostal: "", diaSalida: "", descripcion: "", historia: "", patrimonio: ""
  });

  // Sincronizar datos cuando llega la hermandad
  useEffect(() => {
    if (hermandad) {
      setFormData({
        nombre: hermandad.nombre || "",
        templo: hermandad.templo || "",
        añoFundacion: hermandad.añoFundacion || "",
        direccion: hermandad.direccion || "",
        codigoPostal: hermandad.codigoPostal || "",
        diaSalida: hermandad.diaSalida || "",
        descripcion: hermandad.descripcion || "",
        historia: hermandad.historia || "",
        patrimonio: hermandad.patrimonio || "",
      });
    }
  }, [hermandad, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/hermandades/${hermandad.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          añoFundacion: formData.añoFundacion ? Number(formData.añoFundacion) : null
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar");
      
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
          <h2 className="text-xl font-black">Editar Perfil</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre</label>
              <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Templo</label>
              <input type="text" value={formData.templo} onChange={e => setFormData({...formData, templo: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Biografía</label>
              <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl" rows={3}></textarea>
            </div>
          </form>
        </div>

        <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
          <button type="button" onClick={onClose} className="px-6 py-2 font-bold text-gray-500">Cancelar</button>
          <button type="submit" form="edit-form" disabled={cargando} className="px-8 py-2 bg-red-700 text-white rounded-full font-bold flex items-center disabled:opacity-50">
            {cargando && <Loader2 className="animate-spin mr-2" size={16} />}
            {cargando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}