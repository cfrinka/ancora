export type Role = "admin" | "therapist" | "patient";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  therapist_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Emotion {
  id: number;
  label: string;
  is_active: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  emotions: Emotion[];
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
}

export interface ApiError {
  error: string;
}
