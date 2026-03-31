import { env } from '@/lib/env';

export interface ApiResponse<T> {
  data: T;
  meta: {
    status: number;
    message: string;
  };
  hasError: boolean;
}

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const { token, headers, ...restOptions } = options;

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
      ...headers,
    },
  });

  let body: ApiResponse<T> | null = null;

  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }

  return { response, body };
}
