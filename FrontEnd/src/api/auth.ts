/* eslint-disable @typescript-eslint/no-unused-vars */
import type { User } from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";


export async function login(username: string, password: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", 
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();
  return data.user;
}


export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }
}


export async function refreshAccessToken(): Promise<void> {
  
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });


  if (!response.ok) {
    const error = await response.json();
    console.log("⚠️ Token refresh failed:", error);
    throw new Error(error.error || "Token refresh failed");
  }

  const data = await response.json();
  return data.message;
}


export async function getMe(): Promise<User> {
  console.log("🔍 getMe: Fetching user info...");
  
  const response = await authenticatedFetch("/auth/me", {
    method: "GET",
    credentials: "include",
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

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });


  if (response.status === 401 && !options._retried) {
    try {
      await refreshAccessToken();
      const retryOptions = {
        ...options,
        _retried: true,
        credentials: "include" as const,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      };
      return fetch(url, retryOptions as RequestInit);
    } catch (err) {

      throw new Error("Session expired");
    }
  }

  return response;
}