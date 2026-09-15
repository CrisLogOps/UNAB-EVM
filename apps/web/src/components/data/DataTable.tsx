"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  accessor?: keyof T;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface TableAction<T> {
  label: string;
  onClick: (row: T) => void;
  variant?: "view" | "edit" | "delete";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  filterPlaceholder?: string;
  filterFn?: (row: T, query: string) => boolean;
  actions?: TableAction<T>[];
  rowKey: (row: T) => string;
  selectedKey?: string;
  onRowClick?: (row: T) => void;
}

const ACTION_ICON = {
  view: Eye,
  edit: Pencil,
  delete: Trash2,
};

export function DataTable<T>({
  columns,
  data,
  pageSize = 8,
  filterPlaceholder = "Filtrar…",
  filterFn,
  actions = [],
  rowKey,
  selectedKey,
  onRowClick,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query || !filterFn) return data;
    return data.filter((row) => filterFn(row, query.toLowerCase()));
  }, [data, filterFn, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const slice = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function cell(row: T, column: Column<T>) {
    if (column.render) return column.render(row);
    if (column.accessor) return String(row[column.accessor] ?? "");
    return "";
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {filterFn ? (
        <div className="border-b border-slate-100 p-3">
          <input
            className="w-full rounded-md border border-slate-200 px-3 py-2"
            placeholder={filterPlaceholder}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>
      ) : null}

      <div className="space-y-3 p-3 md:hidden">
        {slice.map((row) => {
          const selected = selectedKey != null && rowKey(row) === selectedKey;
          return (
            <article
              key={rowKey(row)}
              className={`rounded-lg border p-3 ${
                selected ? "border-[var(--accent)] bg-emerald-50" : "border-slate-200"
              } ${onRowClick ? "cursor-pointer" : ""}`}
              onClick={() => onRowClick?.(row)}
            >
              <dl className="space-y-2">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-xs text-slate-500">{column.header}</dt>
                    <dd className="min-w-0 text-right text-sm break-words">{cell(row, column)}</dd>
                  </div>
                ))}
              </dl>
              {actions.length ? (
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {actions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        action.onClick(row);
                      }}
                      className="rounded-md border border-slate-200 px-3 py-2 text-xs"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
        {!slice.length ? <p className="py-6 text-center text-sm text-slate-500">Sin registros</p> : null}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-3 py-2 font-medium ${column.className ?? ""}`}>
                  {column.header}
                </th>
              ))}
              {actions.length ? <th className="px-3 py-2 font-medium">Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => {
              const selected = selectedKey != null && rowKey(row) === selectedKey;
              return (
                <tr
                  key={rowKey(row)}
                  className={`border-t border-slate-100 ${
                    selected ? "bg-emerald-50" : ""
                  } ${onRowClick ? "cursor-pointer hover:bg-slate-50" : ""}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={`px-3 py-2 ${column.className ?? ""}`}>
                      {cell(row, column)}
                    </td>
                  ))}
                  {actions.length ? (
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {actions.map((action) => {
                          const Icon = ACTION_ICON[action.variant ?? "view"];
                          return (
                            <button
                              key={action.label}
                              type="button"
                              title={action.label}
                              onClick={(event) => {
                                event.stopPropagation();
                                action.onClick(row);
                              }}
                              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
            {!slice.length ? (
              <tr>
                <td className="px-3 py-8 text-center text-slate-500" colSpan={columns.length + 1}>
                  Sin registros
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
        <span>
          {filtered.length} registro{filtered.length === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded border border-slate-200 px-3 py-2 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="self-center">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded border border-slate-200 px-3 py-2 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
