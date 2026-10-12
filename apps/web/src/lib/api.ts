const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ApiOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
  formData?: FormData;
};

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers = new Headers();
  if (opts.token) headers.set("authorization", `Bearer ${opts.token}`);
  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? (opts.body || opts.formData ? "POST" : "GET"),
    headers,
    body,
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export { API_URL };
