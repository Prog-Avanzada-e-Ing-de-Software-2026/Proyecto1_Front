import type { FieldValues, FieldPath, UseFormSetError } from "react-hook-form";

const DEFAULT_ERROR_MESSAGE = "Ocurrió un error inesperado.";
const VALIDATION_ERROR_MESSAGE = "Error de validación.";
const BAD_REQUEST_LITERAL = "Bad Request Exception";

export interface ApiFieldError {
  field: string;
  messages: string[];
}

export interface ParsedApiError {
  status?: number;
  message: string;
  fieldErrors: ApiFieldError[];
}

export type ApiFieldMap<T extends FieldValues> = Readonly<
  Partial<Record<string, FieldPath<T>>>
>;

type ErrorResponse = {
  response?: {
    data?: unknown;
    status?: number;
  };
};

function isErrorResponse(error: unknown): error is ErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (typeof (error as ErrorResponse).response === "object" ||
      typeof (error as ErrorResponse).response === "undefined")
  );
}

function getResponseData(error: unknown): unknown {
  if (!isErrorResponse(error)) return undefined;
  return error.response?.data;
}

function getResponseStatus(error: unknown): number | undefined {
  if (!isErrorResponse(error)) return undefined;

  const data = error.response?.data;
  if (
    typeof data === "object" &&
    data !== null &&
    "statusCode" in data &&
    typeof (data as Record<string, unknown>).statusCode === "number"
  ) {
    return (data as Record<string, unknown>).statusCode as number;
  }

  const status = error.response?.status;
  return typeof status === "number" ? status : undefined;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isApiFieldError(value: unknown): value is ApiFieldError {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).field === "string" &&
    isStringArray((value as Record<string, unknown>).messages)
  );
}

function normalizeFieldErrors(data: unknown): ApiFieldError[] {
  if (!Array.isArray(data)) return [];
  return data.filter(isApiFieldError);
}

function extractMessage(data: unknown): string | undefined {
  if (typeof data === "string") return data;

  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;

    if (typeof record.message === "string") {
      return record.message;
    }

    if (isStringArray(record.message)) {
      const joined = record.message.join(", ");
      return joined || undefined;
    }

    if (
      typeof record.message === "object" &&
      record.message !== null &&
      "message" in record.message
    ) {
      const nestedMessage = (record.message as Record<string, unknown>).message;
      if (typeof nestedMessage === "string") return nestedMessage;
    }
  }

  return undefined;
}

export function parseApiErrorDetails(error: unknown): ParsedApiError {
  const responseData = getResponseData(error);
  const status = getResponseStatus(error);

  const fieldErrors =
    typeof responseData === "object" && responseData !== null
      ? normalizeFieldErrors(
          (responseData as Record<string, unknown>).fieldErrors,
        )
      : [];

  let message = extractMessage(responseData);

  if (!message) {
    message =
      fieldErrors.length > 0 ? VALIDATION_ERROR_MESSAGE : DEFAULT_ERROR_MESSAGE;
  }

  // Evita presentar "Bad Request Exception" como mensaje raíz cuando hay
  // errores de campo utilizables provenientes de una validación 400.
  if (
    status === 400 &&
    fieldErrors.length > 0 &&
    message === BAD_REQUEST_LITERAL
  ) {
    message = VALIDATION_ERROR_MESSAGE;
  }

  return { status, message, fieldErrors };
}

/**
 * Adaptador compatible con consumidores existentes.
 * Devuelve únicamente el mensaje global del parser estructurado.
 */
export function parseApiError(error: unknown): string {
  return parseApiErrorDetails(error).message;
}

export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMap: ApiFieldMap<T>,
): ParsedApiError {
  const parsed = parseApiErrorDetails(error);

  if (parsed.fieldErrors.length === 0) {
    setError("root", { type: "server", message: parsed.message });
    return parsed;
  }

  const unknownMessages: string[] = [];
  let focused = false;

  for (const { field, messages } of parsed.fieldErrors) {
    const text = messages.join(", ");
    const rhfField = fieldMap[field];

    if (rhfField) {
      if (focused) {
        setError(rhfField, { type: "server", message: text });
      } else {
        setError(
          rhfField,
          { type: "server", message: text },
          { shouldFocus: true },
        );
        focused = true;
      }
    } else {
      unknownMessages.push(text);
    }
  }

  if (unknownMessages.length > 0) {
    setError("root", { type: "server", message: unknownMessages.join(" ") });
  }

  return parsed;
}
