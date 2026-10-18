import { folioLabel, formatWorkBookDay, type WorkBookDocumentModel } from "@/lib/work-book";

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-black/40 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wide text-zinc-600">{label}</p>
      <p className="text-[12px] text-zinc-950">{value.trim() || "—"}</p>
    </div>
  );
}

export function WorkBookDocument({ model }: { model: WorkBookDocumentModel }) {
  const { header, folios } = model;
  const total = folios.length + 1;

  return (
    <div id="workbook-document" className="space-y-6 font-serif text-zinc-950">
      <article className="workbook-sheet mx-auto w-full max-w-[210mm] bg-white p-8 shadow-sm print:shadow-none">
        <header className="border-b-2 border-black pb-3">
          <p className="text-[11px] uppercase tracking-[0.2em]">República de Chile · Copia de trabajo</p>
          <h2 className="mt-1 text-2xl font-bold tracking-wide">LIBRO DE OBRA</h2>
          <p className="mt-1 text-[11px] text-zinc-700">
            Documento para fiscalización o registro de evento. No constituye el libro electrónico inmutable
            exigido por organismos como el MOP. Los folios son correlativos en OpenEVM.
          </p>
        </header>
        <div className="mt-4 grid grid-cols-2 border border-black/50">
          <Cell label="Nombre de la obra" value={header.obra} />
          <Cell label="Código / N° contrato" value={`${header.code} · ${header.contractNumber}`} />
          <Cell label="Mandante" value={`${header.mandante}${header.mandanteRut ? ` · RUT ${header.mandanteRut}` : ""}`} />
          <Cell label="Contratista" value={`${header.contratista}${header.contratistaRut ? ` · RUT ${header.contratistaRut}` : ""}`} />
          <Cell label="Ubicación de la faena" value={header.location} />
          <Cell label="ITO titular" value={header.itoName} />
          <Cell label="Representante del contratista" value={header.contractorRep} />
          <Cell label="Tipo de contrato" value={header.contractType} />
          <Cell
            label="Plazo contractual"
            value={`${formatWorkBookDay(header.startDate)} al ${formatWorkBookDay(header.finishDate)}`}
          />
          <Cell
            label="Folios de este ejemplar"
            value={header.folioCount ? `${folioLabel(header.folioFrom)} a ${folioLabel(header.folioTo)} (${header.folioCount})` : "Sin anotaciones"}
          />
        </div>
        <p className="mt-3 text-[10px] text-zinc-600">Emisión de esta copia: {formatWorkBookDay(header.issuedAt)} · Hoja 1 de {total}</p>
        <h3 className="mt-5 text-sm font-bold">Índice de anotaciones</h3>
        {folios.length ? (
          <table className="mt-2 w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1 text-left font-semibold">Folio</th>
                <th className="py-1 text-left font-semibold">Fecha</th>
                <th className="py-1 text-left font-semibold">Tipo</th>
                <th className="py-1 text-left font-semibold">Extracto</th>
              </tr>
            </thead>
            <tbody>
              {folios.map((item) => (
                <tr key={item.folio} className="border-b border-black/20">
                  <td className="py-1">{folioLabel(item.folio)}</td>
                  <td className="py-1">{formatWorkBookDay(item.occurredOn)}</td>
                  <td className="py-1">{item.kindLabel}</td>
                  <td className="py-1">{item.body.slice(0, 90)}{item.body.length > 90 ? "…" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">Aún no hay folios. La carátula puede descargarse igual, con los datos mínimos de la obra.</p>
        )}
        <div className="mt-10 grid grid-cols-2 gap-8 text-[11px]">
          <div>
            <p className="border-t border-black pt-2">Contratista / representante</p>
            <p className="mt-1">{header.contractorRep || "Nombre y firma"}</p>
          </div>
          <div>
            <p className="border-t border-black pt-2">ITO / Inspección Técnica de Obra</p>
            <p className="mt-1">{header.itoName || "Nombre y V°B°"}</p>
          </div>
        </div>
      </article>

      {folios.map((item, index) => (
        <article
          key={item.folio}
          className="workbook-sheet mx-auto w-full max-w-[210mm] bg-white p-8 shadow-sm print:shadow-none"
        >
          <header className="flex items-start justify-between border-b-2 border-black pb-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em]">Libro de obra · copia de trabajo</p>
              <h2 className="text-xl font-bold">{folioLabel(item.folio)}</h2>
              <p className="text-[11px]">{header.obra} · {header.contractNumber}</p>
            </div>
            <p className="text-[11px]">Hoja {index + 2} de {total}</p>
          </header>
          <div className="mt-3 grid grid-cols-2 border border-black/50 sm:grid-cols-3">
            <Cell label="Fecha" value={formatWorkBookDay(item.occurredOn)} />
            <Cell label="Hora" value={item.occurredTime} />
            <Cell label="Tipo de anotación" value={item.kindLabel} />
            <Cell label="Condición climática" value={item.weather} />
            <Cell label="Frente / lugar" value={item.location} />
            <Cell label="Registrado por" value={`${item.recordedBy} · ${item.recordedRole}`} />
          </div>
          {item.extra ? (
            <p className="mt-3 text-[12px]">
              <span className="font-semibold">Referencia: </span>
              {item.extra}
            </p>
          ) : null}
          <div className="mt-4 min-h-40 border border-black/50 p-3">
            <p className="text-[9px] uppercase tracking-wide text-zinc-600">Anotación</p>
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed">{item.body}</p>
          </div>
          {item.evidenceFileName ? (
            <p className="mt-2 text-[11px]">Respaldo adjunto en plataforma: {item.evidenceFileName}</p>
          ) : (
            <p className="mt-2 text-[11px] text-zinc-600">Sin archivo de respaldo en este folio.</p>
          )}
          <div className="mt-10 grid grid-cols-2 gap-8 text-[11px]">
            <div>
              <p className="border-t border-black pt-2">Firma contratista</p>
              <p className="mt-1">{header.contractorRep || "—"}</p>
            </div>
            <div>
              <p className="border-t border-black pt-2">V°B° ITO / Inspección Técnica</p>
              <p className="mt-1">{header.itoName || "—"}</p>
            </div>
          </div>
          <p className="mt-6 text-[9px] text-zinc-600">
            Mandante: {header.mandante || "—"}
            {header.mandanteRut ? ` · RUT ${header.mandanteRut}` : ""} · Contratista: {header.contratista || "—"}
            {header.contratistaRut ? ` · RUT ${header.contratistaRut}` : ""}. Espacios de firma para completar a
            mano. Esta hoja no tiene sello de inmutabilidad.
          </p>
        </article>
      ))}
    </div>
  );
}
