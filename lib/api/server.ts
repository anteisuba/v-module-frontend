import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export class ApiRouteError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiRouteError";
  }
}

type ParseOptions = {
  code?: string;
  message?: string;
};

type ErrorResponseOptions = {
  code?: string;
  message?: string;
  status?: number;
  logMessage?: string;
};

export function parseApiInput<T>(
  schema: ZodType<T>,
  input: unknown,
  options: ParseOptions = {}
) {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ApiRouteError(
      options.code || "INVALID_INPUT",
      options.message || "Invalid request payload",
      400,
      result.error.flatten()
    );
  }

  return result.data;
}

export async function readJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
  options: ParseOptions = {}
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiRouteError(
      "INVALID_JSON",
      "Invalid JSON in request body",
      400
    );
  }

  return parseApiInput(schema, body, options);
}

export function createApiErrorResponse(
  error: unknown,
  options: ErrorResponseOptions = {}
) {
  if (error instanceof ApiRouteError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.status }
    );
  }

  if (options.logMessage) {
    console.error(options.logMessage, error);
  }

  return NextResponse.json(
    {
      error: options.message || "Internal server error",
      code: options.code || "INTERNAL_SERVER_ERROR",
    },
    { status: options.status || 500 }
  );
}
