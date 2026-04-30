const apiBase = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");
const URLS = {
  auth: `${apiBase}/auth`,
  orders: `${apiBase}/orders`,
  admin: `${apiBase}/admin`,
};

function getToken() {
  return localStorage.getItem("token") || "";
}

// Токен передаём через query-параметр — прокси его не фильтрует
function withToken(url: string): string {
  const t = getToken();
  if (!t) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}_token=${encodeURIComponent(t)}`;
}

function jsonHeaders() {
  return { "Content-Type": "application/json" };
}

async function safeFetch(input: string, init?: RequestInit): Promise<Record<string, unknown>> {
  try {
    const r = await fetch(input, init);
    return r.json();
  } catch {
    return { error: "Ошибка сети. Проверьте подключение и попробуйте снова." };
  }
}

export async function apiLogin(login: string, password: string) {
  return safeFetch(URLS.auth, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ login, password }),
  });
}

export async function apiMe() {
  return safeFetch(withToken(`${URLS.auth}?action=me`), { headers: jsonHeaders() });
}

export async function apiGetOrders() {
  return safeFetch(withToken(`${URLS.orders}?action=list`), { headers: jsonHeaders() });
}

export async function apiCreateOrder(data: Record<string, string>) {
  return safeFetch(withToken(`${URLS.orders}?action=create`), {
    method: "POST", headers: jsonHeaders(), body: JSON.stringify(data),
  });
}

export async function apiUpdateOrder(id: number, fields: Record<string, unknown>) {
  return safeFetch(withToken(`${URLS.orders}?action=update`), {
    method: "POST", headers: jsonHeaders(), body: JSON.stringify({ id, ...fields }),
  });
}

export async function apiDeleteOrder(idOrIds: number | number[]) {
  const payload = Array.isArray(idOrIds) ? { ids: idOrIds } : { id: idOrIds };
  return safeFetch(withToken(`${URLS.orders}?action=delete`), {
    method: "POST", headers: jsonHeaders(), body: JSON.stringify(payload),
  });
}

export async function apiGetLogs() {
  return safeFetch(withToken(`${URLS.orders}?action=logs`), { headers: jsonHeaders() });
}

export async function apiGetRefs() {
  return safeFetch(withToken(`${URLS.orders}?action=refs`), { headers: jsonHeaders() });
}

// ── Admin API ──────────────────────────────────────────────────────────────
export async function apiAdminList(resource: string) {
  return safeFetch(withToken(`${URLS.admin}?resource=${resource}&action=list`), { headers: jsonHeaders() });
}

export async function apiAdminAdd(resource: string, data: Record<string, unknown>) {
  return safeFetch(withToken(`${URLS.admin}?resource=${resource}&action=add`), {
    method: "POST", headers: jsonHeaders(), body: JSON.stringify(data),
  });
}

export async function apiAdminEdit(resource: string, data: Record<string, unknown>) {
  return safeFetch(withToken(`${URLS.admin}?resource=${resource}&action=edit`), {
    method: "POST", headers: jsonHeaders(), body: JSON.stringify(data),
  });
}

export async function apiAdminDelete(resource: string, idOrIds: number | number[]) {
  const payload = Array.isArray(idOrIds) ? { ids: idOrIds } : { id: idOrIds };
  return safeFetch(withToken(`${URLS.admin}?resource=${resource}&action=delete`), {
    method: "POST", headers: jsonHeaders(), body: JSON.stringify(payload),
  });
}

export async function apiAdminSaveColumns(items: { key: string; label: string; visible: boolean; sort_order: number }[]) {
  return safeFetch(withToken(`${URLS.admin}?resource=column_config&action=save`), {
    method: "POST", headers: jsonHeaders(), body: JSON.stringify({ items }),
  });
}

export async function apiAdminImportRefs(resource: string, names: string[]) {
  return safeFetch(withToken(`${URLS.admin}?resource=${resource}&action=import`), {
    method: "POST", headers: jsonHeaders(), body: JSON.stringify({ names }),
  });
}