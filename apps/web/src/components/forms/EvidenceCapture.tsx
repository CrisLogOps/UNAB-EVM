"use client";

import { Camera, MonitorUp, X } from "lucide-react";
import { useRef, useState } from "react";

const ACCEPT =
  "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function EvidenceCapture({
  file,
  onFile,
  fieldMode = false,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  fieldMode?: boolean;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function takeFile(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    if (next?.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(next));
    } else {
      setPreview(null);
    }
    onFile(next);
  }

  return (
    <div className="space-y-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-800">Evidencia del avance (obligatoria)</p>
      <p className="text-xs text-slate-500">
        {fieldMode
          ? "En terreno puedes usar la cámara del celular. Desde escritorio sube foto, PDF o planilla."
          : "Desde el computador sube PDF, planilla, informe o imagen. También puedes tomar foto si el equipo tiene cámara."}
      </p>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => takeFile(event.target.files?.[0] ?? null)}
      />
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => takeFile(event.target.files?.[0] ?? null)}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-[var(--brand)] px-3 py-3 text-sm font-medium text-white"
        >
          <MonitorUp className="h-5 w-5" />
          Subir desde el computador
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm"
        >
          <Camera className="h-5 w-5" />
          Tomar foto
        </button>
      </div>

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Vista previa de evidencia" className="max-h-48 w-full rounded-md object-cover" />
      ) : null}

      {file ? (
        <div className="flex items-center justify-between gap-2 text-xs text-emerald-800">
          <span className="min-w-0 truncate">{file.name}</span>
          <button type="button" onClick={() => takeFile(null)} aria-label="Quitar archivo">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <p className="text-center text-xs text-amber-800">Sin evidencia validada, el avance no cuenta en el control.</p>
    </div>
  );
}
