export interface ApiEnvelope<T> {
  data: T | null;
  error: ApiErrorBody | null;
  requestId: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'credentials'> {
  body?: BodyInit | object | null;
  credentials?: RequestCredentials;
}
