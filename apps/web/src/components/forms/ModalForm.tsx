"use client";

import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { EvidenceCapture } from "@/components/forms/EvidenceCapture";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "textarea";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string;
}

interface ModalFormProps {
  title: string;
  open: boolean;
  onClose: () => void;
  fields: FormField[];
  requireEvidence?: boolean;
  fieldEvidence?: boolean;
  submitLabel?: string;
  onSubmit: (values: Record<string, string>, file: File | null) => void;
}

export function ModalForm({
  title,
  open,
  onClose,
  fields,
  requireEvidence = false,
  fieldEvidence = false,
  submitLabel = "Guardar",
  onSubmit,
}: ModalFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values: Record<string, string> = {};
    fields.forEach((field) => {
      values[field.name] = String(form.get(field.name) ?? "");
    });
    if (requireEvidence && !file) {
      setError("Falta la evidencia. Sin ella el avance no cuenta.");
      return;
    }
    setError(null);
    onSubmit(values, file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="pr-4 text-base font-semibold">{title}</h2>
          <button type="button" className="p-2" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4 p-4 pb-[max(1rem,var(--safe-bottom))]" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <label key={field.name} className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">{field.label}</span>
              {field.type === "select" ? (
                <select
                  name={field.name}
                  required={field.required}
                  defaultValue={field.defaultValue}
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                >
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  required={field.required}
                  placeholder={field.placeholder}
                  defaultValue={field.defaultValue}
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                  rows={3}
                />
              ) : (
                <input
                  name={field.name}
                  type={field.type}
                  required={field.required}
                  step={field.type === "number" ? "any" : undefined}
                  placeholder={field.placeholder}
                  defaultValue={field.defaultValue}
                  className="w-full rounded-md border border-slate-200 px-3 py-2"
                />
              )}
            </label>
          ))}

          {requireEvidence ? <EvidenceCapture file={file} onFile={setFile} fieldMode={fieldEvidence} /> : null}

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-11 rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
