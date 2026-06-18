export type ApiError = {
  status: number;
  statusText: string;
  message: string;
  errors?: unknown;
  errorList?: string[];
  data?: unknown;
};

export async function isAuthFailure(response: Response): Promise<boolean> {
  if (response.status === 401) return true;

  if (response.status === 403) {
    try {
      const data = await response.clone().json();
      const message = String(data?.message ?? "").toLowerCase();
      return message.includes("token");
    } catch {
      return false;
    }
  }

  return false;
}

export function buildUrl(endpoint: string): string {
  if (endpoint.startsWith("http")) return endpoint;

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const baseUrl = process.env.BASE_URL ?? "";
  return `${baseUrl}${baseUrl.endsWith("/") ? "" : "/"}${cleanEndpoint}`;
}

function extractNestedErrors(errorObj: Record<string, unknown>, prefix = ""): string[] {
  const errors: string[] = [];

  for (const key of Object.keys(errorObj)) {
    const value = errorObj[key];
    const fieldName = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          errors.push(...extractNestedErrors(item as Record<string, unknown>, `${fieldName}[${index}]`));
        } else {
          errors.push(`${fieldName}[${index}]: ${String(item)}`);
        }
      });
      continue;
    }

    if (typeof value === "object" && value !== null) {
      errors.push(...extractNestedErrors(value as Record<string, unknown>, fieldName));
      continue;
    }

    errors.push(`${fieldName}: ${String(value)}`);
  }

  return errors;
}

function extractErrorMessage(errorData: Record<string, unknown>): string {
  const errorMessages: string[] = [];
  const errors = errorData.errors;

  if (errors && typeof errors === "object") {
    const typedErrors = errors as Record<string, unknown>;

    if (Array.isArray(typedErrors.non_field_errors)) {
      errorMessages.push(...typedErrors.non_field_errors.map(String));
    }

    for (const field of Object.keys(typedErrors)) {
      if (field === "non_field_errors") continue;
      const fieldError = typedErrors[field];

      if (Array.isArray(fieldError)) {
        fieldError.forEach((err, index) => {
          if (typeof err === "object" && err !== null) {
            errorMessages.push(...extractNestedErrors(err as Record<string, unknown>, `${field}[${index}]`));
          } else {
            errorMessages.push(`${field}: ${String(err)}`);
          }
        });
      } else if (typeof fieldError === "object" && fieldError !== null) {
        errorMessages.push(...extractNestedErrors(fieldError as Record<string, unknown>, field));
      } else if (fieldError) {
        errorMessages.push(`${field}: ${String(fieldError)}`);
      }
    }
  }

  if (errorMessages.length > 0) return errorMessages.join(", ");

  return String(errorData.message ?? errorData.error ?? errorData.detail ?? "Request failed");
}

function extractErrorList(errorData: Record<string, unknown>): string[] {
  const lines: string[] = [];
  const pushLine = (value: unknown) => {
    if (!value) return;
    const text = String(value).trim();
    if (!text) return;
    const split = text
      .split(/\n|;|,\s(?=Row\s\d+:)|,\s(?=errors?:\sRow\s\d+:)/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (split.length > 1) lines.push(...split);
    else lines.push(text);
  };

  const walk = (obj: unknown) => {
    if (!obj || typeof obj !== "object") return;
    Object.entries(obj as Record<string, unknown>).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach((item) => {
          if (typeof item === "object" && item !== null) walk(item);
          else pushLine(typeof item === "string" ? item : `${key}: ${String(item)}`);
        });
      } else if (typeof val === "object" && val !== null) {
        walk(val);
      } else if (val) {
        pushLine(`${key}: ${String(val)}`);
      }
    });
  };

  const errors = errorData.errors;
  if (Array.isArray(errors)) errors.forEach(pushLine);
  if (errors && typeof errors === "object") {
    const errorsObj = errors as Record<string, unknown>;
    if (Array.isArray(errorsObj.errors)) errorsObj.errors.forEach(pushLine);
    walk(errorsObj);
  }

  if (lines.length === 0 && errorData.message) pushLine(errorData.message);
  if (lines.length === 0 && errorData.detail) pushLine(errorData.detail);

  const seen = new Set<string>();
  return lines.filter((line) => {
    if (seen.has(line)) return false;
    seen.add(line);
    return true;
  });
}

export async function parseResponse(response: Response): Promise<Record<string, unknown>> {
  if (response.status === 204) return { success: true };

  if (!response.ok) {
    const contentType = response.headers.get("Content-Type");
    const errorBody = await response.text();

    if (contentType?.includes("application/json")) {
      try {
        const errorJson = JSON.parse(errorBody) as Record<string, unknown>;
        const error: ApiError = {
          status: response.status,
          statusText: response.statusText,
          message: extractErrorMessage(errorJson),
          errors: errorJson.errors,
          errorList: extractErrorList(errorJson),
          data: errorJson,
        };
        throw error;
      } catch (parseError) {
        if (parseError instanceof SyntaxError) {
          throw {
            status: response.status,
            statusText: response.statusText,
            message: `Request failed (Status: ${response.status})`,
            data: errorBody,
          } as ApiError;
        }
        throw parseError;
      }
    }

    throw {
      status: response.status,
      statusText: response.statusText,
      message: `Request failed (Status: ${response.status})`,
      data: errorBody,
    } as ApiError;
  }

  return (await response.json()) as Record<string, unknown>;
}
