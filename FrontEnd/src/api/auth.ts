/* eslint-disable @typescript-eslint/no-unused-vars */
import type { User } from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ACCESS_TOKEN_KEY = "gliss_access_token";
const REFRESH_TOKEN_KEY = "gliss_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}


export async function login(username: string, password: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();
  if (data?.accessToken && data?.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
  }
  return data.user;
}


export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  clearTokens();

  if (!response.ok) {
    throw new Error("Logout failed");
  }
}


export async function refreshAccessToken(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });


  if (!response.ok) {
    const error = await response.json();
    console.log("⚠️ Token refresh failed:", error);
    throw new Error(error.error || "Token refresh failed");
  }

  const data = await response.json();
  if (data?.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  }
}


export async function getMe(): Promise<User> {
  console.log("🔍 getMe: Fetching user info...");
  
  const response = await authenticatedFetch("/auth/me", {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to parse error" }));
    throw new Error(errorData.error || "Failed to get user info");
  }

  const data = await response.json();
  return data.user;
}


export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit & { _retried?: boolean } = {}
): Promise<Response> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const accessToken = getAccessToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });


  if (response.status === 401 && !options._retried) {
    try {
      await refreshAccessToken();
      const newAccessToken = getAccessToken();
      const retryOptions = {
        ...options,
        _retried: true,
        headers: {
          "Content-Type": "application/json",
          ...(newAccessToken ? { Authorization: `Bearer ${newAccessToken}` } : {}),
          ...options.headers,
        },
      };
      return fetch(url, retryOptions as RequestInit);
    } catch (err) {
      clearTokens();
      throw new Error("Session expired");
    }
  }

  return response;
}