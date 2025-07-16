export interface User {
  user_id: string;
  username: string;
  email: string;
}

export interface KarmaEvent {
  event_id: string;
  user_id: string;
  action: string;
  intensity: number;
  reflection: string;
  feedback: string;
  feedback_generated: boolean;
  occurred_at: Date;
}

export interface Badge {
  badge_id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
}

export interface UserBadge {
  user_badge_id: string;
  user_id: string;
  badge_id: string;
  awarded_at: Date;
  badge?: Badge;
}

export interface Suggestion {
  id: string;
  user_id: string;
  suggestion_text: string;
  week: number;
  used: boolean;
  created_at: Date;
}

// API DTOs
export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
}

export interface CreateKarmaEventDto {
  action: string;
  reflection?: string;
  occurred_at?: string;
}

// API Response types
export interface AuthResponse {
  message: string;
  access_token: string;
  data: User;
}

export interface LoginResponse {
  access_token: string;
}

export interface KarmaScoreResponse {
  total_percentage: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: CreateUserDto) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}
