import axios from "axios";
import { ref } from "vue";
import { GITHUB_USER } from "@/data/profile";

export interface GithubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface Repo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  size: number; // KB
  pushed_at: string;
  created_at: string;
  topics: string[];
  fork: boolean;
  archived: boolean;
}

const CACHE_KEY = "lk.github.v1";
const TTL = 10 * 60 * 1000;

const user = ref<GithubUser | null>(null);
const repos = ref<Repo[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
let pending: Promise<void> | null = null;

const github = axios.create({
  baseURL: "https://api.github.com",
  headers: { Accept: "application/vnd.github+json" },
  timeout: 10_000,
});

async function getJson<T>(path: string, params?: Record<string, string>): Promise<T> {
  try {
    return (await github.get<T>(path, { params })).data;
  } catch (e) {
    const status = axios.isAxiosError(e) ? e.response?.status : undefined;
    throw new Error(
      status === 403
        ? "GitHub rate limit reached, try again later"
        : `GitHub ${status ?? "unreachable"}`,
    );
  }
}

async function load() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.at < TTL) {
      user.value = cached.user;
      repos.value = cached.repos;
      return;
    }
  } catch {
    /* ignore a broken cache */
  }
  loading.value = true;
  error.value = null;
  try {
    const [u, r] = await Promise.all([
      getJson<GithubUser>(`/users/${GITHUB_USER}`),
      getJson<Repo[]>(`/users/${GITHUB_USER}/repos`, { per_page: "100", sort: "pushed" }),
    ]);
    user.value = u;
    repos.value = r.filter((x) => !x.fork);
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ at: Date.now(), user: u, repos: repos.value }),
    );
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

export function useGithub() {
  if (!pending) pending = load();
  return { user, repos, loading, error, reload: () => (pending = load()) };
}
