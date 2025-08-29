// src/Pages/Widget/services/apiClient.js
export class ApiClient {
  constructor() {
    this.projectId = import.meta.env.VITE_LANGFUSE_PROJECT_ID || "";
    // 개발 환경에서는 프록시를 통해 요청
    this.baseURL = import.meta.env.DEV
      ? ""
      : import.meta.env.VITE_LANGFUSE_BASE_URL || "http://localhost:3000";
    this.publicKey = import.meta.env.VITE_LANGFUSE_PUBLIC_KEY || "";
    this.secretKey = import.meta.env.VITE_LANGFUSE_SECRET_KEY || "";
  }

  async trpcGet(endpoint, params = {}) {
    try {
      const url = `${this.baseURL}/api/trpc/${endpoint}`;
      const query = new URLSearchParams();

      if (params.projectId) {
        query.append("input", JSON.stringify({ json: params }));
      } else {
        query.append(
          "input",
          JSON.stringify({ json: { ...params, projectId: this.projectId } })
        );
      }

      const response = await fetch(`${url}?${query}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${this.publicKey}:${this.secretKey}`)}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data?.result?.data || data;
    } catch (error) {
      console.error(`TRPC GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  async trpcPost(endpoint, payload = {}) {
    try {
      const url = `${this.baseURL}/api/trpc/${endpoint}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${this.publicKey}:${this.secretKey}`)}`,
        },
        body: JSON.stringify({
          json: { ...payload, projectId: payload.projectId || this.projectId },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data?.result?.data || data;
    } catch (error) {
      console.error(`TRPC POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  async callTRPCAsREST(endpoint, method, payload) {
    const url = `${this.baseURL}/api/trpc/${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${this.publicKey}:${this.secretKey}`)}`,
      },
      body: JSON.stringify({ json: payload }),
    });

    if (!response.ok) {
      throw new Error(`${method} ${endpoint} failed: ${response.statusText}`);
    }

    return response.json();
  }
}
