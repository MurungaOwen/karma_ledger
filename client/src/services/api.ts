import type {
  User,
  KarmaEvent,
  Badge,
  UserBadge,
  Suggestion,
  LoginDto,
  CreateUserDto,
  CreateKarmaEventDto,
  AuthResponse,
  LoginResponse,
  KarmaScoreResponse,
  ApiError
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          message: 'An error occurred',
          statusCode: response.status,
        }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Health check
  async healthCheck(): Promise<{ msg: string }> {
    return this.request('/healthz');
  }

  // Authentication endpoints
  async login(credentials: LoginDto): Promise<LoginResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: CreateUserDto): Promise<AuthResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // User endpoints
  async getUsers(): Promise<User[]> {
    return this.request('/users');
  }

  async getUserById(id: string): Promise<User> {
    return this.request(`/users/${id}`);
  }

  async getUserByEmail(email: string): Promise<User> {
    return this.request(`/users/lookup?email=${encodeURIComponent(email)}`);
  }

  // Karma event endpoints
  async createKarmaEvent(eventData: CreateKarmaEventDto): Promise<KarmaEvent> {
    return this.request('/karma-events/create', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async getMyKarmaEvents(): Promise<KarmaEvent[]> {
    return this.request('/karma-events/me');
  }

  async getMyKarmaScore(): Promise<KarmaScoreResponse> {
    return this.request('/karma-events/me/score');
  }

  // Dashboard endpoints
  async triggerSuggestions(): Promise<any> {
    return this.request('/dashboard/trigger-suggestions');
  }

  async getSuggestions(): Promise<Suggestion[]> {
    return this.request('/dashboard/suggestions');
  }

  async markSuggestionAsUsed(suggestionId: string): Promise<Suggestion> {
    return this.request(`/dashboard/suggestions/${suggestionId}/mark-used`, {
      method: 'PATCH',
    });
  }

  async getKarmaScores(): Promise<any> {
    return this.request('/dashboard/karma-scores');
  }

  async getLeaderboard(): Promise<any> {
    return this.request('/dashboard/leaderboard');
  }

  async getBadges(): Promise<Badge[]> {
    return this.request('/dashboard/badges');
  }

  async getMyBadges(): Promise<UserBadge[]> {
    return this.request('/dashboard/badges/me');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
