  export interface User {
  id: string;
  username: string;
  created_at?: string;
  phone_number?: string;
  role?: string;
  full_name?: string;
  first_name?: string;
  family_name?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}