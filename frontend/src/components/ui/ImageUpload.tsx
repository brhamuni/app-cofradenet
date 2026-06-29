"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { API } from "@/lib/api";

interface ImageUploadProps {
  currentImage?: string | null;
  uploadUrl: string;
  onSuccess: (data: any) => void;
  shape?: "circle" | "square";
  size?: number;
  className?: string;
}

export default function ImageUpload({
  currentImage,
  uploadUrl,
  onSuccess,
  shape = "square",
  size = 120,
  className = "",
}: ImageUploadProps) {
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

  const display = preview || currentImage;
  const rounded = shape === "circle" ? "rounded-full" : "rounded-2xl";

  return (
    <div
      className={`relative cursor-pointer group ${rounded} bg-gray-100 overflow-hidden border-2 border-dashed border-gray-300 hover:border-cofrade-main transition-colors ${className}`}
      style={{ width: size, height: size }}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      {display ? (
        <img src={display} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <Camera size={32} />
        </div>
      )}
      <div
        className={`absolute inset-0 flex items-center justify-center ${rounded} bg-black/50 transition-opacity ${
          uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {uploading ? (
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
