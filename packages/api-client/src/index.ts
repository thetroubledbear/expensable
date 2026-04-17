import type { ApiResponse } from "@expensable/types"

export class ApiClient {
  private baseUrl: string
  private token?: string

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl
    this.token = token
  }

  private async request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...options?.headers,
      },
    })
    return res.json() as Promise<ApiResponse<T>>
  }

  get<T>(path: string) {
    return this.request<T>(path)
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body) })
  }

  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: "PATCH", body: JSON.stringify(body) })
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" })
  }
}
