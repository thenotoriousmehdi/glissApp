import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDefaultRouteForRole(role?: string) {
  switch (role?.toLowerCase()) {
    case "animator":
      return "/addcontacts"
    case "admin":
    case "chef":
      return "/dashboard"
    default:
      return "/login"
  }
}
