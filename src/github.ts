import type { Run } from "./stats.ts";

type FetchImpl = (url: string, init?: RequestInit) => Promise<Response>;
type Common = { repo: string; token: string; fetchImpl?: FetchImpl };

const API = "https://api.github.com";
const PER_PAGE = 100;
const CAP = 1000; // GitHub returns at most 1,000 results for one filtered query

const RETRIES = 5; // backoff 1+2+4+8+16 s rides out a half-minute network drop

class ClientError extends Error {}

/** Milliseconds to wait when GitHub says the rate limit is used up, otherwise null. */
function rateLimitWaitMs(res: Response): number | null {
  if (res.status !== 403 && res.status !== 429) return null;
  const retryAfter = res.headers.get("retry-after");
  if (retryAfter) return Number(retryAfter) * 1000;
  if (res.headers.get("x-ratelimit-remaining") !== "0") return null;
  return Math.max(0, Number(res.headers.get("x-ratelimit-reset")) * 1000 - Date.now()) + 1000;
}

// GitHub answers 502/503 or drops the connection now and then on large repos; one transient error
// must not lose an hour of paging. A 4xx is a real answer and is not retried.
async function getJson(url: string, token: string, fetchImpl: FetchImpl): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetchImpl(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      });
      if (res.ok) return await res.json();
      const wait = rateLimitWaitMs(res);
      if (wait !== null) {
        console.error(`GitHub rate limit reached; waiting ${Math.ceil(wait / 1000)} s for the reset.`);
        await new Promise((resolve) => setTimeout(resolve, wait));
        attempt--; // waiting out the limit is not a failed try
        continue;
      }
      const message = `GitHub ${res.status} for ${url}: ${(await res.text()).slice(0, 200)}`;
      throw res.status < 500 ? new ClientError(message) : new Error(message);
    } catch (error) {
      if (error instanceof ClientError || attempt >= RETRIES) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }
}

function runsUrl(repo: string, from: Date, to: Date, page: number) {
  const created = `${from.toISOString().replace(/\.\d{3}Z$/, "Z")}..${to.toISOString().replace(/\.\d{3}Z$/, "Z")}`;
  return `${API}/repos/${repo}/actions/runs?status=completed&created=${encodeURIComponent(created)}&per_page=${PER_PAGE}&page=${page}`;
}

/** All completed runs created in [from, to]. Windows over GitHub's 1,000-result cap are split in half. */
export async function fetchRuns(opts: Common & { from: Date; to: Date }): Promise<Run[]> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const first = await getJson(runsUrl(opts.repo, opts.from, opts.to, 1), opts.token, fetchImpl);
  if (first.total_count > CAP) {
    const mid = new Date(Math.floor((opts.from.getTime() + opts.to.getTime()) / 2000) * 1000);
    const left = await fetchRuns({ ...opts, to: mid });
    const right = await fetchRuns({ ...opts, from: new Date(mid.getTime() + 1000) });
    return [...left, ...right];
  }
  const pages = Array.from({ length: Math.ceil(first.total_count / PER_PAGE) - 1 }, (_, i) => i + 2);
  const rest = await mapLimit(pages, 4, (page) => getJson(runsUrl(opts.repo, opts.from, opts.to, page), opts.token, fetchImpl));
  return [first, ...rest].flatMap((body) => body.workflow_runs).map(pick);
}

/** Runs `fn` over `items` with at most `limit` calls in flight; keeps input order. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function pick(r: any): Run {
  return {
    id: r.id, name: r.name, path: r.path, event: r.event, head_sha: r.head_sha, conclusion: r.conclusion,
    run_attempt: r.run_attempt, created_at: r.created_at, run_started_at: r.run_started_at, updated_at: r.updated_at,
  };
}

export type Job = { name: string; conclusion: string | null; started_at: string | null; completed_at: string | null };

// A 100-job page of a large run (Metabase's test matrix has about 200 jobs) times out with a 502; 50 does not.
const JOBS_PER_PAGE = 50;

/** All jobs of one attempt of one run. */
export async function fetchJobs(opts: Common & { runId: number; attempt: number }): Promise<Job[]> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const jobs: Job[] = [];
  for (let page = 1; ; page++) {
    const url = `${API}/repos/${opts.repo}/actions/runs/${opts.runId}/attempts/${opts.attempt}/jobs?per_page=${JOBS_PER_PAGE}&page=${page}`;
    const body = await getJson(url, opts.token, fetchImpl);
    for (const j of body.jobs) jobs.push({ name: j.name, conclusion: j.conclusion, started_at: j.started_at, completed_at: j.completed_at });
    if (body.jobs.length < JOBS_PER_PAGE || jobs.length >= (body.total_count ?? jobs.length)) return jobs;
  }
}

/** Names of the jobs that failed in one attempt of one run. */
export async function fetchFailedJobs(opts: Common & { runId: number; attempt: number }): Promise<string[]> {
  return (await fetchJobs(opts)).filter((j) => j.conclusion === "failure").map((j) => j.name);
}

/** Workflow file path → registered workflow name (run names can carry PR numbers and authors). */
export async function fetchWorkflowNames(opts: Common): Promise<Map<string, string>> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const names = new Map<string, string>();
  for (let page = 1; ; page++) {
    const body = await getJson(`${API}/repos/${opts.repo}/actions/workflows?per_page=100&page=${page}`, opts.token, fetchImpl);
    for (const w of body.workflows) names.set(w.path, w.name);
    if (names.size >= body.total_count || body.workflows.length === 0) return names;
  }
}

/** How one attempt of a run ended ("failure", "cancelled", …). */
export async function fetchAttemptConclusion(opts: Common & { runId: number; attempt: number }): Promise<string | null> {
  const body = await getJson(`${API}/repos/${opts.repo}/actions/runs/${opts.runId}/attempts/${opts.attempt}`, opts.token, opts.fetchImpl ?? fetch);
  return body.conclusion;
}
