import ky, { HTTPError } from 'ky';

import type { ApiEnvelope, ApiErrorBody, ApiRequestOptions } from './apiTypes';

export class ApiClientError extends Error {
  code: string;
  status: number;
  requestId: string;
  details: ApiErrorBody | null;

  constructor(message: string, options: { code: string; status: number; requestId?: string; details?: ApiErrorBody | null }) {
    super(message);
    this.name = 'ApiClientError';
    this.code = options.code;
    this.status = options.status;
    this.requestId = options.requestId ?? '';
    this.details = options.details ?? null;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const requestOptions = toKyOptions(options);

  try {
    const response = await apiHttp(resolveApiUrl(path), requestOptions);
    const envelope = await parseEnvelope<T>(response);

    if (envelope.error) {
      throw new ApiClientError(envelope.error.message, {
        code: envelope.error.code,
        details: envelope.error,
        requestId: envelope.requestId,
        status: response.status,
      });
    }

    return envelope.data as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    if (error instanceof HTTPError) {
      throw await apiErrorFromHttpError(error);
    }
    throw error;
  }
}

export function isUnauthorizedApiError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 401;
}

const apiHttp = ky.create({
  credentials: 'include',
  retry: 0,
  throwHttpErrors: false,
});

function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const origin = globalThis.location?.origin ?? 'http://localhost';
  return new URL(path, origin).toString();
}

function shouldSendJson(body: ApiRequestOptions['body']): body is object {
  return (
    Boolean(body) &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof ArrayBuffer) &&
    !(body instanceof ReadableStream) &&
    !ArrayBuffer.isView(body)
  );
}

function toKyOptions(options: ApiRequestOptions) {
  const { body, credentials, ...requestOptions } = options;

  if (shouldSendJson(body)) {
    return {
      ...requestOptions,
      credentials: credentials ?? 'include',
      json: body,
    };
  }

  return {
    ...requestOptions,
    body,
    credentials: credentials ?? 'include',
  };
}

async function apiErrorFromHttpError(error: HTTPError): Promise<ApiClientError> {
  let envelope: ApiEnvelope<unknown> | null = null;

  try {
    envelope = await parseEnvelope(error.response.clone());
  } catch (parseError) {
    if (parseError instanceof ApiClientError) {
      return parseError;
    }

    return new ApiClientError(error.response.statusText || 'API request failed', {
      code: 'HTTP_ERROR',
      status: error.response.status,
    });
  }

  return new ApiClientError(envelope.error?.message ?? error.response.statusText, {
    code: envelope.error?.code ?? 'HTTP_ERROR',
    details: envelope.error,
    requestId: envelope.requestId,
    status: error.response.status,
  });
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  let parsed: unknown;

  try {
    parsed = await response.json();
  } catch (error) {
    throw new ApiClientError('API response was not valid JSON', {
      code: 'INVALID_JSON',
      status: response.status,
    });
  }

  if (!isApiEnvelope<T>(parsed)) {
    throw new ApiClientError('API response envelope was invalid', {
      code: 'INVALID_ENVELOPE',
      status: response.status,
    });
  }

  return parsed;
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const envelope = value as Partial<ApiEnvelope<T>>;
  return 'data' in envelope && 'error' in envelope && typeof envelope.requestId === 'string';
}
