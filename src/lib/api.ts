import type { ApiError } from '../../shared/api'

// GET one of the site's own endpoints (the Vercel functions in api/) and return
// its JSON typed as T. Throws with the API's message on any error, including a
// non-JSON answer (e.g. index.html when the function is missing).
export async function api<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const q = new URLSearchParams(params).toString()
  const r = await fetch(`/api/${path}${q ? `?${q}` : ''}`)
  const body = (await r.json().catch(() => null)) as T | ApiError | null
  if (!r.ok || body === null) throw new Error((body as ApiError | null)?.message ?? `API ${r.status}`)
  return body as T
}
