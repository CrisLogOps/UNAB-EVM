"use client";

export function TrainingScheduleHints({
  startDate,
  finishDate,
}: {
  startDate?: string;
  finishDate?: string;
}) {
  const windowLabel =
    startDate && finishDate ? `Ventana inicial: ${startDate} → ${finishDate}. ` : "";

  return (
    <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
      <h2 className="font-semibold">Proyecto interno de capacitación</h2>
      <p className="mt-1 text-sky-900">
        {windowLabel}
        Este alta no asigna presupuesto. Estima un proyecto interno para capacitar al personal y
        confirma después los datos mínimos para armar el cronograma, según prácticas PMBOK y control
        por valor ganado (EVM).
      </p>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-sky-800">
        Datos mínimos del cronograma (PMBOK)
      </p>
      <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-sky-900">
        <li>
          <strong>EDT y tiempo:</strong> código EDT, nombre, fecha de inicio y de término. Desglosa en
          paquete de trabajo, actividad, inspección en terreno e hito. Asigna un responsable: terreno
          carga foto; las otras áreas suben documento desde Avance. Si hay desvío, se edita después
          sin perder la línea base.
        </li>
        <li>
          <strong>Presupuesto planificado:</strong> valor de ese elemento solo si existe; si no, déjalo en
          $0.
        </li>
        <li>
          <strong>Línea base:</strong> visto bueno del plan antes de medir avance.
        </li>
        <li>
          <strong>Control EVM:</strong> avance físico vs plan y costo real vs presupuesto, cuando esos
          datos estén.
        </li>
      </ul>
    </section>
  );
}
