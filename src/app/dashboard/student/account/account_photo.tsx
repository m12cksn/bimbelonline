"use client";

import { useRef, useState } from "react";
import { useToast } from "@/app/components/ToastProvider";

type AccountPhotoProps = {
  initialAvatarUrl: string;
  displayName: string;
  email: string;
};

export default function AccountPhoto({
  initialAvatarUrl,
  displayName,
  email,
}: AccountPhotoProps) {
  const toast = useToast();
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleUpload(file: File | null) {
    if (!file) {
      toast.error("Pilih file gambar terlebih dahulu.");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/student/profile-photo", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gagal upload foto profil.");
      }
      setAvatarUrl(json.url);
      toast.success("Foto profil berhasil diperbarui.");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Foto profil"
            className="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-xl font-semibold text-white">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-slate-900">{displayName}</p>
          <p className="text-xs text-slate-500">{email}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60"
        >
          {uploading ? "Mengunggah..." : "Upload Photo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
        />
        <p className="text-[11px] text-slate-500">
          Format JPG/PNG, max 5MB.
        </p>
      </div>
    </div>
  );
}
