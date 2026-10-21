"use client";

import { useEffect, useRef, useState } from "react";
import { ELEMENT_KIND_LABELS, downloadBlob } from "@/lib/schedule-csv";
import { isPdfFile, loadProposalFile, loadScheduleFile } from "@/lib/proposal-file";
import type { GanttActivity, KickoffAntecedentItem, KickoffAntecedentKind, ProjectKickoff } from "@/lib/types";

export function AntecedentsStep({
  projectId,
  draft,
  activities,
  scheduleExample,
  onConditions,
  onFile,
  onItems,
  onDownloadTemplate,
  onScheduleFile,
}: {
  projectId: string;
  draft: Partial<ProjectKickoff>;
  activities: GanttActivity[];
  scheduleExample: boolean;
  onConditions: (body: string) => void;
  onFile: (file: File) => void;
  onItems: (items: KickoffAntecedentItem[]) => void;
  onDownloadTemplate: () => void;
  onScheduleFile: (file: File) => Promise<{ ok: boolean; message: string }>;
}) {
  const items = draft.antecedentItems ?? [];
  const [kind, setKind] = useState<KickoffAntecedentKind>("consideracion");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [docError, setDocError] = useState<string | null>(null);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);
  const [scheduleOk, setScheduleOk] = useState(false);
  const scheduleRef = useRef<HTMLInputElement>(null);
  const fileName = draft.proposal?.fileName ?? "";
  const fileType = draft.proposal?.fileType ?? "";
  const baselineName = draft.baselineScheduleName ?? "";

  function addItem() {
    if (title.trim().length < 3) return;
    onItems([
      ...items,
      {
        id: `ant-${Date.now()}`,
        kind,
        title: title.trim(),
        detail: detail.trim(),
      },
    ]);
    setTitle("");
    setDetail("");
  }

  async function downloadUploadedSchedule() {
    const blob = await loadScheduleFile(projectId);
    if (!blob) {
      setScheduleOk(false);
      setScheduleNotice("El archivo del cronograma está en el equipo donde se subió.");
      return;
    }
    downloadBlob(baselineName || "cronograma-base.xlsx", blob);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Repositorio del proyecto</h2>
        <p className="mt-1 text-sm text-slate-600">
          Aquí queda la documentación del cliente: el PDF con las condiciones del servicio vendido y, si se quiere, el
          cronograma base inicial. Subir el cronograma es opcional; si no se carga, se conserva el de ejemplo.
        </p>
      </div>

      <section className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/60 p-3">
        <h3 className="font-semibold">Documento El proyecto</h3>
        <p className="text-xs text-slate-600">PDF. Se ve en la vista preliminar y se puede descargar.</p>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Condiciones del servicio vendido</span>
          <textarea
            rows={4}
            value={draft.proposal?.body ?? ""}
            onChange={(event) => onConditions(event.target.value)}
            placeholder="Alcance, plazos, supuestos y exclusiones de lo vendido."
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Archivo PDF</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              if (!isPdfFile(file)) {
                setDocError("El documento debe ser un PDF.");
                return;
              }
              setDocError(null);
              onFile(file);
            }}
            className="w-full text-sm"
          />
          {fileName ? <span className="mt-1 block text-xs text-slate-600">Cargado: {fileName}</span> : null}
          {docError ? <span className="mt-1 block text-xs text-red-700">{docError}</span> : null}
        </label>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 p-3">
        <h3 className="font-semibold">Cronograma base inicial</h3>
        <p className="text-xs text-slate-600">
          Descarga la plantilla, edítala y súbela cuando quieras reemplazar el cronograma de ejemplo. Este paso no
          bloquea el kickoff.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            Descargar plantilla
          </button>
          <button
            type="button"
            onClick={() => scheduleRef.current?.click()}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            Subir cronograma
          </button>
          {baselineName ? (
            <button
              type="button"
              onClick={() => void downloadUploadedSchedule()}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              Descargar cronograma subido
            </button>
          ) : null}
          <input
            ref={scheduleRef}
            type="file"
            accept=".xlsx,.csv,.zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void onScheduleFile(file).then((result) => {
                setScheduleOk(result.ok);
                setScheduleNotice(result.message);
              });
            }}
          />
        </div>
        <p className="text-xs text-slate-600">
          {baselineName
            ? `Línea base: ${baselineName}`
            : scheduleExample
              ? "Sigue el cronograma de ejemplo."
              : activities.length
                ? "Hay un cronograma cargado en la obra."
                : "Todavía no hay cronograma."}
        </p>
        {scheduleNotice ? (
          <p className={`text-xs ${scheduleOk ? "text-emerald-800" : "text-red-700"}`}>{scheduleNotice}</p>
        ) : null}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 p-3">
        <h3 className="font-semibold">Partidas y consideraciones</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Tipo</span>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as KickoffAntecedentKind)}
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            >
              <option value="consideracion">Consideración</option>
              <option value="partida">Partida</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Título</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Detalle</span>
          <textarea
            rows={2}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2"
          />
        </label>
        <button type="button" onClick={addItem} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
          Agregar
        </button>
        {items.length ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  {item.kind === "partida" ? "Partida" : "Consideración"}
                </p>
                <p className="font-medium">{item.title}</p>
                {item.detail ? <p className="text-slate-600">{item.detail}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">Todavía no hay partidas ni consideraciones adicionales.</p>
        )}
      </section>

      <AntecedentPreview
        projectId={projectId}
        fileName={fileName}
        fileType={fileType}
        activities={activities}
        items={items}
        baselineScheduleName={baselineName}
        scheduleExample={scheduleExample}
      />
    </div>
  );
}

export function AntecedentPreview({
  projectId,
  fileName,
  fileType,
  activities,
  items,
  baselineScheduleName = "",
  scheduleExample = false,
}: {
  projectId: string;
  fileName: string;
  fileType: string;
  activities: GanttActivity[];
  items: KickoffAntecedentItem[];
  baselineScheduleName?: string;
  scheduleExample?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  useEffect(() => {
    let active = true;
    let current = "";
    if (!projectId || !fileName) {
      setUrl(null);
      setBlob(null);
      return;
    }
    void loadProposalFile(projectId)
      .then((file) => {
        if (!active || !file) return;
        current = URL.createObjectURL(file);
        setBlob(file);
        setUrl(current);
      })
      .catch(() => {
        if (active) {
          setUrl(null);
          setBlob(null);
        }
      });
    return () => {
      active = false;
      if (current) URL.revokeObjectURL(current);
    };
  }, [projectId, fileName, fileType]);

  const isPdf = fileType === "application/pdf" || /\.pdf$/i.test(fileName);
  const rows = activities.slice(0, 8);

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Vista preliminar</h3>
        {blob && fileName ? (
          <button
            type="button"
            onClick={() => downloadBlob(fileName, blob)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Descargar documento
          </button>
        ) : null}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="min-h-40 rounded-md border border-slate-200 bg-slate-50 p-2">
          {!fileName ? (
            <p className="p-3 text-sm text-slate-500">El PDF del proyecto aparece aquí al cargarlo.</p>
          ) : url && isPdf ? (
            <iframe title={fileName} src={url} className="h-80 w-full rounded-md bg-white" />
          ) : (
            <p className="p-3 text-sm text-slate-600">
              {fileName}. La vista previa corresponde a un PDF cargado en este equipo.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cronograma</p>
          <p className="text-xs text-slate-500">
            {baselineScheduleName
              ? `Línea base: ${baselineScheduleName}`
              : scheduleExample
                ? "Ejemplo de plantilla, pendiente de reemplazo."
                : "Cronograma de la obra."}
          </p>
          {rows.length ? (
            <ul className="space-y-1 text-sm">
              {rows.map((item) => (
                <li key={item.id}>
                  <span className="font-medium">{item.code || "s/c"}</span> {item.name}
                  <span className="block text-xs text-slate-500">
                    {ELEMENT_KIND_LABELS[item.elementKind]} · {item.start || "s/f"} → {item.end || "s/f"}
                  </span>
                </li>
              ))}
              {activities.length > rows.length ? (
                <li className="text-xs text-slate-500">Y {activities.length - rows.length} actividades más.</li>
              ) : null}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">El cronograma aparece cuando el proyecto tiene presupuesto inicial.</p>
          )}
          <p className="pt-2 text-xs font-medium uppercase tracking-wide text-slate-500">Consideraciones</p>
          {items.length ? (
            <ul className="space-y-1 text-sm">
              {items.map((item) => (
                <li key={item.id}>
                  <span className="font-medium">{item.kind === "partida" ? "Partida" : "Consideración"}:</span>{" "}
                  {item.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Sin consideraciones adicionales.</p>
          )}
        </div>
      </div>
    </section>
  );
}
