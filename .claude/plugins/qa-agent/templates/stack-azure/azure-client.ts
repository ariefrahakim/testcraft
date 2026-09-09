import { env } from "../shared/env.js";
import { logger } from "./logger.js";

const log = logger.scope("azure");

/**
 * Shared Azure DevOps REST plumbing for the Test Plans and Boards helpers.
 *
 * Auth is a Personal Access Token sent as HTTP Basic with an empty username —
 * the scheme Azure DevOps documents for PATs. The token needs, at minimum:
 *   - **Test Management (read & write)** for plans, suites and result upload
 *   - **Work Items (read & write)** for reading Epics/Stories and commenting
 *
 * Every response is checked and failures throw with the status, the URL and
 * the body. A silent `undefined` from a failed API call is how a run reports
 * "0 cases" instead of "your token cannot see this project".
 */

/** `https://dev.azure.com/{org}` — trailing slashes stripped. */
function orgUrl(): string {
  const base = env.azure.orgUrl.replace(/\/+$/, "");
  if (!base) {
    throw new Error(
      "AZURE_ORG_URL is empty — set it to https://dev.azure.com/<org> in .env",
    );
  }
  return base;
}

function authHeader(): string {
  const pat = env.azure.pat;
  if (!pat) {
    throw new Error("AZURE_PAT is empty — set a Personal Access Token in .env");
  }
  // Azure DevOps PAT auth: Basic with an empty username.
  return `Basic ${Buffer.from(`:${pat}`).toString("base64")}`;
}

/**
 * Build a project-scoped API URL.
 *
 * `apiVersion` is explicit per call rather than global: Azure ships different
 * GA versions per area (Test Plans, Work Items, Test Results), and pinning one
 * number for everything is how a call starts failing after an org upgrade.
 */
export function apiUrl(
  path: string,
  apiVersion: string,
  query: Record<string, string | number | undefined> = {},
  opts: { projectScoped?: boolean } = {},
): string {
  const { projectScoped = true } = opts;
  const project = projectScoped ? `/${encodeURIComponent(env.azure.project)}` : "";
  const url = new URL(`${orgUrl()}${project}/_apis${path}`);
  url.searchParams.set("api-version", apiVersion);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  contentType = "application/json",
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": contentType }),
    },
    body:
      body === undefined
        ? undefined
        : contentType === "application/json" || contentType === "application/json-patch+json"
          ? JSON.stringify(body)
          : (body as BodyInit),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Azure DevOps ${method} ${url} → ${res.status} ${res.statusText}${
        text ? `\n${text.slice(0, 600)}` : ""
      }`,
    );
  }

  // 204 and empty bodies are legitimate for PATCH/DELETE.
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const azure = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body: unknown) => request<T>("POST", url, body),
  /** Work-item writes use the JSON Patch content type, not plain JSON. */
  patchWorkItem: <T>(url: string, ops: unknown[]) =>
    request<T>("PATCH", url, ops, "application/json-patch+json"),
  patch: <T>(url: string, body: unknown) => request<T>("PATCH", url, body),

  /** Raw byte upload (attachments). Returns the parsed JSON response. */
  async postBinary<T>(url: string, data: Buffer): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        Accept: "application/json",
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(data),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Azure DevOps POST ${url} → ${res.status} ${res.statusText}${
          text ? `\n${text.slice(0, 400)}` : ""
        }`,
      );
    }
    return (await res.json()) as T;
  },

  log,
};

/**
 * Decode the HTML entities Azure stores inside `parameterizedString` payloads.
 * Test-case steps come back as XML whose text nodes are themselves
 * HTML-escaped, so a step reads `&lt;P&gt;Click Save&lt;/P&gt;` and needs two
 * passes: unescape, then strip the markup.
 */
export function decodeAzureHtml(value: string): string {
  const unescaped = value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
  return unescaped
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Escape a plain string for embedding in the HTML body of a Boards comment. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
