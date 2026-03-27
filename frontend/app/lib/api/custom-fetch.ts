const BASE_URL = import.meta.env.VITE_BASE_URL ?? "http://localhost:8000";

export const customFetch = async <T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> => {
  const url = typeof input === "string" ? `${BASE_URL}${input}` : input;
  const response = await fetch(url, { ...init });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
};

export default customFetch;
