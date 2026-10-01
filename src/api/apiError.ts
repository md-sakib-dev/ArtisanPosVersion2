import axios from "axios";

/*
 * Classification of what went wrong with a request. The Login page and
 * the error page use this to show the right message and route.
 */
export type ApiErrorKind =
  | "server-unreachable" /* no response at all: server down, network cut */
  | "timeout" /* request exceeded the axios timeout */
  | "server-error" /* 5xx from the backend */
  | "client-error" /* 4xx from the backend */
  | "unknown";

export interface ClassifiedApiError {
  kind: ApiErrorKind;
  status?: number;
  /** Server-provided message when available, otherwise a friendly default. */
  message: string;
}

/** Default message per error kind. */
const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  "server-unreachable":
    "We couldn't reach the server. Please check your connection and try again.",
  timeout: "The server took too long to respond. Please try again.",
  "server-error":
    "The server encountered an unexpected problem. Please try again later.",
  "client-error": "The request could not be completed.",
  unknown: "Something went wrong. Please try again.",
};

/**
 * Inspect a thrown error and classify it.
 * Returns null when the error is not an Axios error (e.g. a bug).
 */
export const classifyApiError = (error: unknown): ClassifiedApiError | null => {
  if (!axios.isAxiosError(error)) return null;

  if (error.code === "ECONNABORTED") {
    return { kind: "timeout", message: DEFAULT_MESSAGES.timeout };
  }

  if (!error.response) {
    return {
      kind: "server-unreachable",
      message: DEFAULT_MESSAGES["server-unreachable"],
    };
  }

  const status = error.response.status;
  const serverMessage =
    (error.response.data as { message?: string } | undefined)?.message ?? null;

  if (status >= 500) {
    return {
      kind: "server-error",
      status,
      message: serverMessage ?? DEFAULT_MESSAGES["server-error"],
    };
  }

  return {
    kind: "client-error",
    status,
    message: serverMessage ?? DEFAULT_MESSAGES["client-error"],
  };
};

export const apiErrorMessage = DEFAULT_MESSAGES;
