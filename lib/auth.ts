const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export async function signInApi(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to sign in');
  }
  return res.json();
}

export async function signUpApi(email: string, password: string, full_name: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to sign up');
  }
  return res.json();
}

export async function getMeApi(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Not authenticated');
  }
  return res.json();
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
  document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

export function removeToken(): void {
  localStorage.removeItem('auth_token');
  document.cookie = 'auth_token=; path=/; max-age=0';
}

export function getUserFromToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return {
      id: payload.sub,
      email: payload.email,
      full_name: payload.full_name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
