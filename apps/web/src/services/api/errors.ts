export type ApiErrorKind =
  | "NETWORK_ERROR"
  | "HTTP_ERROR"
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "UNKNOWN_ERROR";

export class ApiClientError extends Error {
  public readonly kind: ApiErrorKind;
  public readonly status?: number;
  public readonly code?: string;
  public readonly validationErrors?: Array<{ field: string; message: string }>;

  constructor({
    message,
    kind,
    status,
    code,
    validationErrors
  }: {
    message: string;
    kind: ApiErrorKind;
    status?: number;
    code?: string;
    validationErrors?: Array<{ field: string; message: string }>;
  }) {
    super(message);
    this.name = "ApiClientError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.validationErrors = validationErrors;

    // Maintain prototype chain
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }

  static fromHttp(
    status: number,
    data?: unknown
  ): ApiClientError {
    let kind: ApiErrorKind = "HTTP_ERROR";
    let fallbackMessage = "An unexpected server error occurred.";

    if (status === 401) {
      kind = "AUTHENTICATION_ERROR";
      fallbackMessage = "Invalid email or password.";
    } else if (status === 403) {
      kind = "AUTHORIZATION_ERROR";
      fallbackMessage = "You do not have permission to perform this action.";
    } else if (status === 404) {
      kind = "NOT_FOUND";
      fallbackMessage = "The requested resource was not found.";
    } else if (status === 400 || status === 422) {
      kind = "VALIDATION_ERROR";
      fallbackMessage = "The request could not be processed due to invalid input.";
    } else if (status === 429) {
      kind = "HTTP_ERROR";
      fallbackMessage = "Too many requests. Please wait a moment and try again.";
    }

    const payload = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : null;
    const errorObj = payload && typeof payload.error === "object" && payload.error !== null ? (payload.error as Record<string, unknown>) : null;

    const message =
      (typeof errorObj?.message === "string" ? errorObj.message : null) ||
      (typeof payload?.message === "string" ? payload.message : null) ||
      (typeof data === "string" ? data : fallbackMessage);

    const details = Array.isArray(errorObj?.details) ? (errorObj.details as Array<{ path?: string; field?: string; message?: string }>) : undefined;
    const errorsArr = Array.isArray(payload?.errors) ? (payload.errors as Array<{ field: string; message: string }>) : undefined;

    const validationErrors =
      details?.map((d) => ({
        field: d.path || d.field || "",
        message: d.message || ""
      })) || errorsArr;

    return new ApiClientError({
      message,
      kind,
      status,
      code: (typeof errorObj?.code === "string" ? errorObj.code : undefined) || (typeof payload?.code === "string" ? payload.code : undefined),
      validationErrors
    });
  }

  static fromNetwork(_error?: unknown): ApiClientError {
    return new ApiClientError({
      message: "Unable to connect to the server. Please check your network connection.",
      kind: "NETWORK_ERROR"
    });
  }
}
