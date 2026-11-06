import axios from "axios";
import type { ApiError } from "../../shared/api";

const http = axios.create({ baseURL: "/api", timeout: 10_000 });

export async function api<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  try {
    const { data } = await http.get<T>(path, { params });
    if (typeof data !== "object" || data === null)
      throw new Error(`/api/${path} did not answer with JSON`);
    return data;
  } catch (e) {
    const body = axios.isAxiosError<ApiError>(e) ? e.response?.data : undefined;
    throw new Error(
      body?.message ?? (e instanceof Error ? e.message : "API error"),
    );
  }
}
