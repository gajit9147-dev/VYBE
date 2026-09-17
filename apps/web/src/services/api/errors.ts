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

  static fromHttp(status: number, data?: { message?: string; code?: string; errors?: Array<{ field: string; message: string }> }): ApiClientError {
    let kind: ApiErrorKind = "HTTP_ERROR";
    let fallbackMessage = "An unexpected server error occurred.";

    if (status === 401) {
      kind = "AUTHENTICATION_ERROR";
      fallbackMessage = "Authentication required. Please log in.";
    } else if (status === 403) {
      kind = "AUTHORIZATION_ERROR";
      fallbackMessage = "You do not have permission to perform this action.";
    } else if (status === 404) {
      kind = "NOT_FOUND";
      fallbackMessage = "The requested resource was not found.";
    } else if (status === 400 || status === 422) {
      kind = "VALIDATION_ERROR";
      fallbackMessage = "The request could not be processed due to invalid input.";
    }

    return new ApiClientError({
      message: data?.message || fallbackMessage,
      kind,
      status,
      code: data?.code,
      validationErrors: data?.errors
    });
  }

  static fromNetwork(_error?: unknown): ApiClientError {
    return new ApiClientError({
      message: "Unable to connect to the server. Please check your network connection.",
      kind: "NETWORK_ERROR"
    });
  }
}
