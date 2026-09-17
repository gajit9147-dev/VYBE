export interface SafeUser {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: SafeUser;
}

export interface LogoutResponse {
  message: string;
}

export interface SendVerificationResponse {
  message: string;
}

export interface VerifyEmailResponse {
  message: string;
  email: string | null;
  isVerified: boolean;
  verifiedAt: string;
}

export interface VerificationStatusResponse {
  email: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
}

export type AuthStatus =
  | "AUTH_LOADING"
  | "AUTHENTICATED_UNVERIFIED"
  | "AUTHENTICATED_VERIFIED"
  | "UNAUTHENTICATED"
  | "AUTH_ERROR";

export interface LogoutAllResponse {
  message: string;
}

