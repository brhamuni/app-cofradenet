"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { API } from "@/lib/api";

interface BannerUploadProps {
  currentImage?: string | null;
  uploadUrl: string;
  onSuccess: (data: any) => void;
  fallbackImage: string;
  className?: string;
}

export default function BannerUpload({
  currentImage,
  uploadUrl,
  onSuccess,
  fallbackImage,
  className = "",
}: BannerUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
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

  const display = preview || currentImage || fallbackImage;

  return (
    <div
      className={`relative w-full h-40 sm:h-48 md:h-56 overflow-hidden bg-cofrade-main cursor-pointer group ${className}`}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      <img src={display} alt="" className="w-full h-full object-cover opacity-35" />
      <div className="absolute inset-0 bg-linear-to-t from-cofrade-main/90 via-cofrade-main/40 to-cofrade-main/20" />
      <div
        className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
          uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {uploading ? (
          <Loader2 className="text-white animate-spin" size={32} />
        ) : (
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Camera size={20} />
            Cambiar banner
          </div>
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
