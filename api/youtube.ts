import axios from "axios";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { ApiError, VideoMatch } from "../shared/api";

const youtubeApi = axios.create({
  baseURL: "https://www.googleapis.com/youtube/v3/",
  timeout: 5000,
});

interface SearchResponse {
  items?: {
    id: { videoId: string };
    snippet: { title: string; channelTitle: string };
  }[];
}

const fail = (res: VercelResponse, status: number, message: string) =>
  res.status(status).json({ error: status, message } satisfies ApiError);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return fail(res, 503, "YOUTUBE_API_KEY is not set");

  const raw = req.query.q;
  const q = String((Array.isArray(raw) ? raw[0] : raw) ?? "")
    .trim()
    .slice(0, 200);
  if (!q) return fail(res, 400, "q is required");

  try {
    const { data } = await youtubeApi.get<SearchResponse>("search", {
      params: {
        part: "snippet",
        type: "video",
        videoEmbeddable: "true",
        maxResults: "1",
        q,
        key,
      },
    });
    const hit = data.items?.[0];
    res.setHeader("Vercel-CDN-Cache-Control", "max-age=604800");
    return res.status(200).json(
      (hit
        ? {
            id: hit.id.videoId,
            title: hit.snippet.title,
            channel: hit.snippet.channelTitle,
          }
        : { id: null }) satisfies VideoMatch,
    );
  } catch (e) {
    if (axios.isAxiosError<{ error?: { message?: string } }>(e) && e.response)
      return fail(
        res,
        e.response.status,
        e.response.data?.error?.message || "YouTube error",
      );
    return fail(res, 502, e instanceof Error ? e.message : "YouTube error");
  }
}
