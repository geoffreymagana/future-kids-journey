// API Service for Frontend-Backend Communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface FormData {
  name: string;
  whatsapp: string;
  ageRange: string;
  numberOfKids?: number;
  source?: string;
  sessionId?: string;
}

export interface FormStats {
  totalSubmissions: number;
  uniqueShares: number;
  totalShares: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface LoginResponse {
  token: string;
  admin: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

interface AdminData {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  status: 'success' | 'error';
  errorMessage?: string;
  timestamp: string;
  ipAddress?: string;
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getAdminRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      );

      return payload.role || null;
    } catch {
      return null;
    }
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  }

  // ---------------- STATS API (FIXED) ----------------
  async getStats(): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/forms/stats`, {
      headers: this.getHeaders(true)
    });

    return this.handleResponse<unknown>(response);
  }

  async getPublicStats(): Promise<ApiResponse<FormStats>> {
    const response = await fetch(`${API_BASE_URL}/forms/public-stats`, {
      headers: this.getHeaders(false)
    });

    return this.handleResponse<FormStats>(response);
  }

  // ---------------- OTHER APIs (UNCHANGED) ----------------
  async submitForm(formData: FormData): Promise<ApiResponse<{ id: string; isDuplicate?: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/forms/submit`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(formData)
    });

    return this.handleResponse(response);
  }

  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ email, password })
    });

    const data = await this.handleResponse<LoginResponse>(response);

    // Extract token from response data
    if (data.success && data.data?.token) {
      localStorage.setItem('authToken', data.data.token);
    }

    return data;
  }

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders(true)
    });

    localStorage.removeItem('authToken');
  }

  // Generic request method for flexible API calls
  async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options?: { params?: Record<string, unknown> }
  ): Promise<ApiResponse<T>> {
    let url = `${API_BASE_URL}${endpoint}`;
    
    // Add query parameters if provided
    if (options?.params) {
      const params = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    const fetchOptions: RequestInit = {
      method,
      headers: this.getHeaders(true)
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    return this.handleResponse<T>(response);
  }

  // Share tracking
  async recordShare(submissionId: string, platform: string): Promise<ApiResponse<unknown>> {
    const response = await fetch(`${API_BASE_URL}/forms/submissions/${submissionId}/share`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ platform })
    });

    return this.handleResponse(response);
  }

  // Submissions management
  async getSubmissions(filters?: Record<string, unknown>, sort?: string): Promise<ApiResponse<unknown>> {
    const params: Record<string, unknown> = filters || {};
    if (sort) {
      params['sort'] = sort;
    }
    return this.request('GET', '/forms/submissions', undefined, { params });
  }

  async updateSubmission(id: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return this.request('PATCH', `/forms/submissions/${id}`, data);
  }

  async deleteSubmission(id: string): Promise<ApiResponse<unknown>> {
    return this.request('DELETE', `/forms/submissions/${id}`);
  }

  // Enrollment management
  async getEnrollment(submissionId: string): Promise<ApiResponse<unknown>> {
    return this.request('GET', `/enrollments/${submissionId}`);
  }

  async createEnrollment(data: Record<string, unknown> & { submissionId?: string }): Promise<ApiResponse<unknown>> {
    const submissionId = data.submissionId || '';
    return this.request('POST', `/enrollments`, data);
  }

  async recordPayment(submissionId: string, data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return this.request('POST', `/enrollments/${submissionId}/payment`, data);
  }

  // Activity logs
  async getActivityLogs(filters?: Record<string, unknown>): Promise<ApiResponse<{ logs: ActivityLog[]; pagination: { pages: number; total: number } }>> {
    return this.request('GET', '/admin/logs', undefined, { params: filters });
  }

  // Get current admin info from token
  getCurrentAdmin(): AdminData | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      );

      return {
        _id: payload.userId || '',
        email: payload.email || '',
        fullName: payload.fullName || '',
        role: payload.role || '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch {
      return null;
    }
  }
}

export const apiService = new ApiService();
