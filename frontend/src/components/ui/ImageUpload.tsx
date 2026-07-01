"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, User, Trash2 } from "lucide-react";
import { API } from "@/lib/api";

interface ImageUploadProps {
  currentImage?: string | null;
  uploadUrl: string;
  deleteUrl?: string;
  onSuccess: (data: any) => void;
  shape?: "circle" | "square";
  size?: number;
  className?: string;
  emptyIcon?: "camera" | "user";
}

export default function ImageUpload({
  currentImage,
  uploadUrl,
  deleteUrl,
  onSuccess,
  shape = "square",
  size = 120,
  className = "",
  emptyIcon = "camera",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}${uploadUrl}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        setPreview(null);
        return;
      }
      const data = await res.json();
      onSuccess(data);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!deleteUrl || deleting || uploading) return;
    if (!confirm("¿Eliminar la foto de perfil?")) return;

    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}${deleteUrl}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setPreview(null);
      onSuccess(data);
    } finally {
      setDeleting(false);
    }
  };

  const display = preview || currentImage;
  const rounded = shape === "circle" ? "rounded-full" : "rounded-2xl";
  const busy = uploading || deleting;
  const canDelete = Boolean(deleteUrl && display);

  return (
    <div
      className={`relative cursor-pointer group ${rounded} bg-gray-100 overflow-hidden border-2 border-dashed border-gray-300 hover:border-cofrade-main transition-colors ${className}`}
      style={{ width: size, height: size }}
      onClick={() => !busy && inputRef.current?.click()}
    >
      {display ? (
        <img src={display} alt="" className="w-full h-full object-cover" />
      ) : emptyIcon === "user" ? (
        <div className="w-full h-full flex items-center justify-center bg-cofrade-main/10">
          <User size={Math.round(size * 0.38)} className="text-cofrade-main/50" strokeWidth={1.75} />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <Camera size={32} />
        </div>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          title="Eliminar foto"
          aria-label="Eliminar foto de perfil"
          className={`absolute top-1 right-1 z-10 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors ${
            busy ? "opacity-60" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
          }`}
        >
          {deleting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      )}
      <div
        className={`absolute inset-0 flex items-center justify-center ${rounded} bg-black/50 transition-opacity ${
          busy ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {uploading || deleting ? (
          <Loader2 className="text-white animate-spin" size={28} />
        ) : (
          <Camera className="text-white" size={28} />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
