'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '@/app/api/axios';
import ImageUpload from '@/components/ui/ImageUpload';
import { resolveImg } from '@/lib/api';

interface EditBandaModalProps {
  banda: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditBandaModal({ banda, isOpen, onClose }: EditBandaModalProps) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    estiloMusical: '',
    localidad: '',
    numeroComponentes: '',
    imagenLogo: '',
    historia: '',
  });

  useEffect(() => {
    if (banda && isOpen) {
      setForm({
        nombre: banda.nombre ?? '',
        estiloMusical: banda.estiloMusical ?? '',
        localidad: banda.ciudad?.nombre ?? banda.localidad ?? '',
        numeroComponentes: banda.numeroComponentes ? String(banda.numeroComponentes) : '',
        imagenLogo: banda.imagenLogo ?? '',
        historia: banda.historia ?? '',
      });
      setError('');
    }
  }, [banda, isOpen]);

  if (!isOpen) return null;

  const cambiar = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      await api.patch(`/bandas/${banda.id}`, {
        nombre: form.nombre,
        estiloMusical: form.estiloMusical,
        localidad: form.localidad || undefined,
        numeroComponentes: form.numeroComponentes ? Number(form.numeroComponentes) : undefined,
        imagenLogo: form.imagenLogo || undefined,
        historia: form.historia || undefined,
      });
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const field = (label: string, name: keyof typeof form, type = 'text') => (
    <div key={name}>
      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={cambiar}
        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cofrade-main/20 text-sm font-semibold"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-black">Editar Banda</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

          <form id="edit-banda-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Nombre', 'nombre')}
              {field('Estilo musical', 'estiloMusical')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Localidad', 'localidad')}
              {field('Nº componentes', 'numeroComponentes', 'number')}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <ImageUpload
                  currentImage={resolveImg(form.imagenLogo) || undefined}
                  uploadUrl={`/bandas/${banda.id}/logo`}
                  onSuccess={(data) => setForm(f => ({ ...f, imagenLogo: data.imagenLogo ?? f.imagenLogo }))}
                  shape="square"
                  size={88}
                />
                <p className="text-xs text-gray-400 leading-relaxed">Haz clic en la imagen<br/>para subir un nuevo logo</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Historia</label>
              <textarea
                name="historia"
                value={form.historia}
                onChange={cambiar}
                rows={5}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cofrade-main/20 text-sm font-semibold resize-none"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t flex justify-end gap-3 bg-gray-50">
          <button type="button" onClick={onClose} className="px-6 py-2 font-bold text-gray-500">
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-banda-form"
            disabled={cargando || !form.nombre || !form.estiloMusical}
            className="px-8 py-2 bg-cofrade-main text-white rounded-full font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {cargando && <Loader2 className="animate-spin" size={16} />}
            {cargando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
