export const SESSION_EXPIRED_CODE = "SESSION_EXPIRED";

export type SessionExpiredError = Error & {
  digest?: string;
  code?: string;
  status?: number;
};

export function createSessionExpiredError(): SessionExpiredError {
  const error = new Error("Your session has expired. Please log in again.") as SessionExpiredError;
  error.digest = SESSION_EXPIRED_CODE;
  error.code = SESSION_EXPIRED_CODE;
  error.status = 401;
  return error;
}

export function isSessionExpired(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const typedError = error as {
    digest?: string;
    code?: string;
    status?: number;
    message?: string;
  };

  return (
    typedError.digest === SESSION_EXPIRED_CODE ||
    typedError.code === SESSION_EXPIRED_CODE ||
    (typedError.status === 401 &&
      typeof typedError.message === "string" &&
      typedError.message.toLowerCase().includes("session"))
  );
}
