export type MvpSnapshot = {
  setupPhase?: string;
  ownerManagesAll?: boolean;
  tenant?: Record<string, unknown>;
  clients?: unknown[];
  kickoffs?: unknown[];
  knowledge?: unknown[];
  invites?: unknown[];
  users?: unknown[];
  projects?: unknown[];
  assignments?: unknown[];
  gantt?: unknown[];
  reports?: unknown[];
  profiles?: unknown[];
  areas?: unknown[];
  sessionUserId?: string;
  projectId?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export function mvpApiEnabled() {
  return Boolean(API_URL);
}

export async function fetchMvpSnapshot(): Promise<MvpSnapshot | null> {
  if (!API_URL) return null;
  try {
    const response = await fetch(`${API_URL}/api/v1/mvp/snapshot`);
    if (response.status === 404) return null;
    if (!response.ok) return null;
    return (await response.json()) as MvpSnapshot;
  } catch {
    return null;
  }
}

export async function saveMvpSnapshot(payload: MvpSnapshot) {
  if (!API_URL) return;
  try {
    await fetch(`${API_URL}/api/v1/mvp/snapshot`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* la copia local sigue siendo el respaldo si la API no está */
  }
}
