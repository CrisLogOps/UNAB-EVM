const DB_NAME = "openevm-proposal-files";
const PROPOSAL = "files";
const SCHEDULE = "schedules";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROPOSAL)) db.createObjectStore(PROPOSAL);
      if (!db.objectStoreNames.contains(SCHEDULE)) db.createObjectStore(SCHEDULE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function putFile(store: string, key: string, file: Blob) {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(file, key);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

function getFile(store: string, key: string): Promise<Blob | null> {
  return openDb().then(
    (db) =>
      new Promise<Blob | null>((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const request = tx.objectStore(store).get(key);
        request.onsuccess = () => {
          db.close();
          resolve((request.result as Blob | undefined) ?? null);
        };
        request.onerror = () => {
          db.close();
          reject(request.error);
        };
      }),
  );
}

export function saveProposalFile(projectId: string, file: File) {
  return putFile(PROPOSAL, projectId, file);
}

export function loadProposalFile(projectId: string) {
  return getFile(PROPOSAL, projectId);
}

export function saveScheduleFile(projectId: string, file: File) {
  return putFile(SCHEDULE, projectId, file);
}

export function loadScheduleFile(projectId: string) {
  return getFile(SCHEDULE, projectId);
}

export function isPdfFile(file: { name: string; type: string }) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}
