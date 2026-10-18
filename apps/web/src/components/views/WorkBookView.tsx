"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useOrg } from "@/components/layout/OrgProvider";
import { ModalForm, type FormField } from "@/components/forms/ModalForm";
import { WorkBookDocument } from "@/components/views/WorkBookDocument";
import { ROLE_LABELS } from "@/lib/constants";
import { downloadWorkBookPdf } from "@/lib/work-book-pdf";
import {
  MIN_WORKBOOK_BODY,
  SAFETY_LEVELS,
  THIRD_PARTY_KINDS,
  WEATHER_OPTIONS,
  WORK_BOOK_KINDS,
  buildWorkBookDocument,
  folioLabel,
  workBookCounts,
  workBookKindMeta,
  workBookPdfFileName,
} from "@/lib/work-book";
import type { WorkBookKind, WorkBookSafetyLevel, WorkBookThirdPartyKind } from "@/lib/types";

type FilterId = "all" | WorkBookKind;

function fieldsFor(kind: WorkBookKind, activityOptions: { value: string; label: string }[]): FormField[] {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);
  const dateField: FormField = {
    name: "occurredOn",
    label: "Fecha",
    type: "date",
    required: true,
    defaultValue: today,
  };
  const timeField: FormField = {
    name: "occurredTime",
    label: "Hora",
    type: "text",
    required: true,
    defaultValue: now,
    placeholder: "08:30",
  };
  const weatherField: FormField = {
    name: "weather",
    label: "Condición climática",
    type: "select",
    options: WEATHER_OPTIONS.map((item) => ({ value: item.id, label: item.label })),
  };
  const body: FormField = {
    name: "body",
    label: "Anotación",
    type: "textarea",
    required: true,
    placeholder: `Mínimo ${MIN_WORKBOOK_BODY} caracteres. Qué ocurrió, en qué frente y qué hay que hacer.`,
  };

  if (kind === "ito") {
    return [
      dateField,
      timeField,
      { name: "issuer", label: "ITO / inspector", type: "text", required: true, placeholder: "Nombre o empresa de la inspección técnica" },
      { name: "reference", label: "N° de instrucción", type: "text", placeholder: "Folio o referencia del ITO" },
      { name: "dueOn", label: "Plazo de cumplimiento", type: "date" },
      { name: "location", label: "Frente / lugar", type: "text", placeholder: "Sector de la faena" },
      body,
    ];
  }
  if (kind === "progress") {
    return [
      dateField,
      timeField,
      weatherField,
      {
        name: "activityId",
        label: "Partida del cronograma (opcional)",
        type: "select",
        options: [{ value: "", label: "Sin partida específica" }, ...activityOptions],
      },
      { name: "location", label: "Frente / lugar", type: "text", placeholder: "Frente de trabajo" },
      body,
    ];
  }
  if (kind === "safety") {
    return [
      dateField,
      timeField,
      weatherField,
      {
        name: "safetyLevel",
        label: "Tipo",
        type: "select",
        required: true,
        options: SAFETY_LEVELS.map((item) => ({ value: item.id, label: item.label })),
      },
      { name: "location", label: "Lugar / frente", type: "text", placeholder: "Sector, piso, recinto" },
      body,
    ];
  }
  return [
    dateField,
    timeField,
    {
      name: "thirdPartyKind",
      label: "Tipo",
      type: "select",
      required: true,
      options: THIRD_PARTY_KINDS.map((item) => ({ value: item.id, label: item.label })),
    },
    { name: "thirdPartyName", label: "Tercero", type: "text", placeholder: "Vecino, otro contratista, empresa de redes…" },
    { name: "location", label: "Lugar", type: "text", placeholder: "Dónde ocurre la interferencia o el reclamo" },
    body,
  ];
}

function formatDay(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

export function WorkBookView() {
  const {
    project,
    tenant,
    gantt,
    workBook,
    users,
    addWorkBookEntry,
    saveWorkBookMeta,
    workBookMetaFor,
    clientFor,
    kickoffFor,
    canOperate,
    role,
    sessionUser,
  } = useOrg();
  const [filter, setFilter] = useState<FilterId>("all");
  const [draftKind, setDraftKind] = useState<WorkBookKind | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const canWrite = canOperate("evidence:upload");
  const storedMeta = workBookMetaFor(project.id);
  const [metaDraft, setMetaDraft] = useState({
    location: storedMeta.location,
    contractNumber: storedMeta.contractNumber || project.code,
    itoName: storedMeta.itoName,
    contractorRep: storedMeta.contractorRep || sessionUser.name,
  });

  useEffect(() => {
    setMetaDraft({
      location: storedMeta.location,
      contractNumber: storedMeta.contractNumber || project.code,
      itoName: storedMeta.itoName,
      contractorRep: storedMeta.contractorRep || sessionUser.name,
    });
  }, [project.id, project.code, storedMeta.location, storedMeta.contractNumber, storedMeta.itoName, storedMeta.contractorRep, sessionUser.name]);

  const rows = useMemo(() => {
    return workBook
      .filter((item) => item.projectId === project.id)
      .filter((item) => (filter === "all" ? true : item.kind === filter))
      .sort((a, b) => b.folio - a.folio);
  }, [workBook, project.id, filter]);

  const counts = useMemo(
    () => workBookCounts(workBook.filter((item) => item.projectId === project.id)),
    [workBook, project.id],
  );

  const activityOptions = useMemo(
    () =>
      gantt
        .filter((item) => item.projectId === project.id && item.elementKind !== "paquete")
        .map((item) => ({
          value: item.id,
          label: item.code ? `${item.code} · ${item.name}` : item.name,
        })),
    [gantt, project.id],
  );

  const documentModel = useMemo(
    () =>
      buildWorkBookDocument({
        project,
        tenant,
        client: clientFor(project.clientId),
        kickoff: kickoffFor(project.id),
        meta: {
          projectId: project.id,
          location: metaDraft.location || storedMeta.location,
          contractNumber: metaDraft.contractNumber || storedMeta.contractNumber || project.code,
          itoName: metaDraft.itoName || storedMeta.itoName,
          contractorRep: metaDraft.contractorRep || storedMeta.contractorRep || sessionUser.name,
        },
        entries: workBook.filter((item) => item.projectId === project.id),
        users,
        contractorRepFallback: sessionUser.name,
      }),
    [project, tenant, clientFor, kickoffFor, metaDraft, storedMeta, workBook, users, sessionUser.name],
  );

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const draftMeta = draftKind ? workBookKindMeta(draftKind) : null;

  function persistHeader() {
    saveWorkBookMeta(project.id, metaDraft);
    setMessage("Datos mínimos del documento guardados. Ya podés generar la vista previa o el PDF.");
  }

  function handleDownload() {
    saveWorkBookMeta(project.id, metaDraft);
    downloadWorkBookPdf(documentModel, workBookPdfFileName(documentModel.header));
    setMessage(`Se descargó ${workBookPdfFileName(documentModel.header)}. Es una copia de trabajo, sin sello de inmutabilidad.`);
  }

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Expediente de faena · {ROLE_LABELS[role]}
        </p>
        <h1 className="text-xl font-semibold sm:text-2xl">Libro de obra</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          {project.name} · {project.code}. Registro para fiscalización o evento: carátula con los datos mínimos
          exigidos en Chile y un folio por anotación, con espacio de firma del contratista y del ITO. El PDF es
          copia de trabajo; no reemplaza el libro inmutable del MOP.
        </p>
      </div>

      <div className="print:hidden flex flex-wrap gap-2">
        {canWrite
          ? WORK_BOOK_KINDS.map((kind) => (
              <button
                key={kind.id}
                type="button"
                onClick={() => {
                  setMessage(null);
                  setPreview(false);
                  setDraftKind(kind.id);
                }}
                className="rounded-md bg-[var(--brand)] px-3 py-2 text-sm text-white hover:bg-[var(--brand-dark)]"
              >
                {kind.short}
              </button>
            ))
          : null}
        <button
          type="button"
          onClick={() => setPreview((current) => !current)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
        >
          {preview ? "Volver al registro" : "Vista previa"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
        >
          Descargar PDF
        </button>
        <Link href="/progress" className="rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
          Cargar avance
        </Link>
      </div>

      <section className="print:hidden rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold">Datos mínimos del documento</h2>
        <p className="mt-1 text-xs text-slate-500">
          Identificación de obra, mandante, contratista, ITO y ubicación. Sin estos datos la copia de
          fiscalización queda incompleta.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Ubicación de la faena</span>
            <input
              value={metaDraft.location}
              onChange={(event) => setMetaDraft((current) => ({ ...current, location: event.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2"
              placeholder="Comuna, km, recinto"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">N° de contrato</span>
            <input
              value={metaDraft.contractNumber}
              onChange={(event) => setMetaDraft((current) => ({ ...current, contractNumber: event.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2"
              placeholder={project.code}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">ITO titular</span>
            <input
              value={metaDraft.itoName}
              onChange={(event) => setMetaDraft((current) => ({ ...current, itoName: event.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2"
              placeholder="Nombre de la inspección técnica"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Representante del contratista</span>
            <input
              value={metaDraft.contractorRep}
              onChange={(event) => setMetaDraft((current) => ({ ...current, contractorRep: event.target.value }))}
              className="w-full rounded-md border border-slate-200 px-3 py-2"
              placeholder="Quien firma el libro"
            />
          </label>
        </div>
        {documentModel.gaps.length ? (
          <p className="mt-3 text-sm text-amber-800">
            Falta completar: {documentModel.gaps.join(", ")}. El PDF se puede generar igual, con esos campos en blanco
            para rellenar a mano.
          </p>
        ) : (
          <p className="mt-3 text-sm text-emerald-800">La carátula tiene los datos mínimos para esta copia.</p>
        )}
        {canWrite ? (
          <button
            type="button"
            onClick={persistHeader}
            className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Guardar datos del documento
          </button>
        ) : null}
      </section>

      {message ? (
        <p className="print:hidden rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">{message}</p>
      ) : null}

      <div className={preview ? "block" : "workbook-print-only"}>
        <WorkBookDocument model={documentModel} />
      </div>

      <div className={preview ? "hidden print:hidden" : "space-y-4 print:hidden"}>
      {canWrite ? null : (
        <p className="text-sm text-slate-500">Este puesto consulta el libro. Quien carga avance o faena deja las anotaciones.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {WORK_BOOK_KINDS.map((kind) => (
          <button
            key={kind.id}
            type="button"
            onClick={() => setFilter(kind.id)}
            className={`rounded-xl border px-3 py-3 text-left ${
              filter === kind.id ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-slate-200 bg-white"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">{kind.short}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{counts[kind.id]}</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{kind.label}</p>
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-600">
        {WORK_BOOK_KINDS.find((item) => item.id === filter)?.hint ??
          "Filtrá por tipo o registrá una anotación. Las notas de Avance también entran acá, con folio correlativo."}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1 text-xs ${
            filter === "all" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          Todas · {total}
        </button>
        {WORK_BOOK_KINDS.map((kind) => (
          <button
            key={kind.id}
            type="button"
            onClick={() => setFilter(kind.id)}
            className={`rounded-full px-3 py-1 text-xs ${
              filter === kind.id ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {kind.short} · {counts[kind.id]}
          </button>
        ))}
      </div>

      {rows.length ? (
        <ol className="space-y-3">
          {rows.map((item) => {
            const who = users.find((user) => user.id === item.recordedBy);
            const activity = gantt.find((row) => row.id === item.activityId);
            const meta = workBookKindMeta(item.kind);
            const safety = SAFETY_LEVELS.find((entry) => entry.id === item.safetyLevel)?.label;
            const third = THIRD_PARTY_KINDS.find((entry) => entry.id === item.thirdPartyKind)?.label;
            return (
              <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {folioLabel(item.folio)} · {meta.short} · {formatDay(item.occurredOn)}
                    {item.occurredTime ? ` · ${item.occurredTime}` : ""}
                    {item.source === "progress" ? " · desde Avance" : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {who?.name || ROLE_LABELS[who?.role ?? "field"]}
                  </p>
                </div>
                <p className="mt-1 font-medium text-slate-900">{meta.label}</p>
                {item.issuer ? (
                  <p className="text-sm text-slate-600">
                    ITO: {item.issuer}
                    {item.reference ? ` · ${item.reference}` : ""}
                    {item.dueOn ? ` · plazo ${formatDay(item.dueOn)}` : ""}
                  </p>
                ) : null}
                {safety ? <p className="text-sm text-slate-600">{safety}{item.location ? ` · ${item.location}` : ""}</p> : null}
                {third ? (
                  <p className="text-sm text-slate-600">
                    {third}
                    {item.thirdPartyName ? ` · ${item.thirdPartyName}` : ""}
                    {item.location ? ` · ${item.location}` : ""}
                  </p>
                ) : null}
                {activity ? (
                  <p className="text-sm text-slate-600">
                    {activity.code ? `${activity.code} · ` : ""}
                    {activity.name}
                  </p>
                ) : null}
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{item.body}</p>
                {item.evidenceFileName ? (
                  <p className="mt-2 text-xs text-slate-500">Respaldo: {item.evidenceFileName}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          Todavía no hay anotaciones en este filtro. Registrá una instrucción del ITO, un parte diario, una
          observación de seguridad o un reclamo de terceros. Si ya hay avance cargado, esas notas aparecen acá.
        </p>
      )}
      </div>

      <ModalForm
        open={Boolean(draftKind)}
        onClose={() => setDraftKind(null)}
        title={draftMeta ? draftMeta.label : "Anotación"}
        optionalEvidence
        fieldEvidence={draftKind === "progress" || draftKind === "safety"}
        submitLabel="Ingresar al libro"
        fields={draftKind ? fieldsFor(draftKind, activityOptions) : []}
        onSubmit={(values, file) => {
          if (!draftKind) return;
          const ok = addWorkBookEntry({
            kind: draftKind,
            body: values.body,
            occurredOn: values.occurredOn,
            occurredTime: values.occurredTime,
            weather: values.weather,
            evidenceFileName: file?.name,
            evidenceFileType: file?.type,
            evidenceFileSize: file?.size,
            issuer: values.issuer,
            reference: values.reference,
            dueOn: values.dueOn,
            safetyLevel: values.safetyLevel as WorkBookSafetyLevel,
            location: values.location,
            thirdPartyKind: values.thirdPartyKind as WorkBookThirdPartyKind,
            thirdPartyName: values.thirdPartyName,
            activityId: values.activityId,
          });
          setDraftKind(null);
          setMessage(
            ok
              ? `${draftMeta?.label ?? "Anotación"} ingresada al libro de obra.`
              : `Falta el relato (mínimo ${MIN_WORKBOOK_BODY} caracteres) o un dato obligatorio del tipo de anotación.`,
          );
        }}
      />
    </div>
  );
}
