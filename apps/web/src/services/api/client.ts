import { env } from "@/config/env";
import { ApiClientError } from "./errors";
import type { ApiResponse, RequestOptions } from "@/types/api";

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = env.VITE_API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private buildUrl(path: string, params?: RequestOptions["params"]): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, data, headers, ...restOptions } = options;
    const url = this.buildUrl(path, params);

    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;

    const requestHeaders = new Headers(headers);
    requestHeaders.set("Accept", "application/json");

    if (!isFormData && data !== undefined) {
      requestHeaders.set("Content-Type", "application/json");
    }

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        credentials: "include", // Essential: backend uses cookie-based session auth
        body: isFormData ? (data as FormData) : data !== undefined ? JSON.stringify(data) : undefined,
        ...restOptions
      });

      let responseData: { message?: string; code?: string; errors?: Array<{ field: string; message: string }> } | null = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          responseData = (await response.json()) as typeof responseData;
        } catch {
          responseData = null;
        }
      }

      if (!response.ok) {
        throw ApiClientError.fromHttp(response.status, responseData ?? undefined);
      }

      return (responseData as unknown) as ApiResponse<T>;
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw ApiClientError.fromNetwork(error);
    }
  }

  public get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, options);
  }

  public post<T>(path: string, data?: unknown, options?: Omit<RequestOptions, "data">): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, { ...options, data });
  }

  public patch<T>(path: string, data?: unknown, options?: Omit<RequestOptions, "data">): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, { ...options, data });
  }

  public put<T>(path: string, data?: unknown, options?: Omit<RequestOptions, "data">): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, { ...options, data });
  }

  public delete<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path, options);
  }
}

export const api = new ApiClient();
export { ApiClient };
