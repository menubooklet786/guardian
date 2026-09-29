const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type SessionExpiredCallback = () => void;
let onSessionExpired: SessionExpiredCallback | null = null;

export function setSessionExpiredCallback(cb: SessionExpiredCallback | null) {
  onSessionExpired = cb;
}

class ApiClient {
  private token: string | null = null;
  private refreshing: Promise<boolean> | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        return this.request(path, options);
      }
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      onSessionExpired?.();
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${res.status}`);
    }

    return res.json();
  }

  private async refreshToken(): Promise<boolean> {
    if (this.refreshing) return this.refreshing;

    this.refreshing = (async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;

      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) return false;

        const data = await res.json();
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        this.token = data.accessToken;
        return true;
      } catch {
        return false;
      } finally {
        this.refreshing = null;
      }
    })();

    return this.refreshing;
  }

  get<T>(path: string): Promise<T> {
    return this.request(path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request(path, { method: 'POST', body: JSON.stringify(body) });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request(path, { method: 'PATCH', body: JSON.stringify(body) });
  }

  delete<T>(path: string): Promise<T> {
    return this.request(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
