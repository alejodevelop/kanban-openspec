import { loadWebEnv } from "./env";

export class ApiClientError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

type ApiClientOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

const normalizePath = (path: string): string => {
  return path.startsWith("/") ? path : `/${path}`;
};

const buildUrl = (baseUrl: string, path: string): string => {
  return new URL(normalizePath(path), `${baseUrl}/`).toString();
};

const readResponseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return await response.json();
  }

  const text = await response.text();
  return text === "" ? undefined : text;
};

export const createApiClient = ({ baseUrl, fetchImpl = fetch }: ApiClientOptions) => {
  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetchImpl(buildUrl(baseUrl, path), {
      ...init,
      headers: {
        Accept: "application/json",
        ...init.headers,
      },
    });

    const body = await readResponseBody(response);
    if (!response.ok) {
      throw new ApiClientError(`Request failed with status ${response.status}`, response.status, body);
    }

    return body as T;
  };

  return {
    baseUrl,
    request,
    get: <T>(path: string, init: RequestInit = {}) => request<T>(path, { ...init, method: "GET" }),
    post: <T>(path: string, body: unknown, init: RequestInit = {}) =>
      request<T>(path, {
        ...init,
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          ...init.headers,
        },
      }),
  };
};

export const apiClient = createApiClient({ baseUrl: loadWebEnv().apiBaseUrl });
