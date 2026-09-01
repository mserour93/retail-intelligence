const BASE = "/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let currentUserId: string | null = localStorage.getItem("ri.userId");

export function setCurrentUserId(id: string | null) {
  currentUserId = id;
  if (id) localStorage.setItem("ri.userId", id);
  else localStorage.removeItem("ri.userId");
}

export function getCurrentUserId() {
  return currentUserId;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(init?.headers as Record<string, string>) };
  if (currentUserId) headers["x-user-id"] = currentUserId;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(init?.headers as Record<string, string>) };
  if (currentUserId) headers["x-user-id"] = currentUserId;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  return res.blob();
}

/** Downloads a POST response's blob body as a file in the browser (used for report exports). */
export async function downloadFile(path: string, body: unknown, filename: string) {
  const blob = await requestBlob(path, { method: "POST", body: JSON.stringify(body) });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
