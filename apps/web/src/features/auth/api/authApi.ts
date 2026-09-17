import { api } from "@/services/api/client";
import {
  AuthResponse,
  LogoutResponse,
  LogoutAllResponse,
  SendVerificationResponse,
  VerificationStatusResponse,
  VerifyEmailResponse,
  SendPhoneOtpResponse,
  VerifyPhoneOtpResponse,
  PhoneStatusResponse,
} from "../types/authTypes";
import { LoginFormData, RegisterFormData } from "../schemas/authSchemas";

export const authApi = {
  login: async (data: LoginFormData): Promise<AuthResponse> => {
    return api.post<AuthResponse>("/api/auth/login", {
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });
  },

  register: async (
    data: Omit<RegisterFormData, "confirmPassword">,
  ): Promise<AuthResponse> => {
    return api.post<AuthResponse>("/api/auth/register", {
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });
  },

  getMe: async (): Promise<AuthResponse> => {
    return api.get<AuthResponse>("/api/auth/me");
  },

  logout: async (): Promise<LogoutResponse> => {
    return api.post<LogoutResponse>("/api/auth/logout");
  },

  logoutAll: async (): Promise<LogoutAllResponse> => {
    return api.post<LogoutAllResponse>("/api/auth/logout-all");
  },

  sendVerification: async (
    email?: string,
  ): Promise<SendVerificationResponse> => {
    return api.post<SendVerificationResponse>(
      "/api/auth/email-verification/send",
      {
        email: email ? email.trim().toLowerCase() : undefined,
      },
    );
  },

  verifyEmail: async (token: string): Promise<VerifyEmailResponse> => {
    return api.get<VerifyEmailResponse>(
      `/api/auth/email-verification/verify?token=${encodeURIComponent(token.trim())}`,
    );
  },

  getVerificationStatus: async (
    email?: string,
  ): Promise<VerificationStatusResponse> => {
    return api.get<VerificationStatusResponse>(
      "/api/auth/email-verification/status",
      {
        params: email ? { email: email.trim().toLowerCase() } : undefined,
      },
    );
  },

  sendPhoneOtp: async (phoneNumber: string): Promise<SendPhoneOtpResponse> => {
    return api.post<SendPhoneOtpResponse>("/api/auth/phone/send-otp", {
      phoneNumber: phoneNumber.trim(),
    });
  },

  verifyPhoneOtp: async (
    phoneNumber: string,
    otp: string,
  ): Promise<VerifyPhoneOtpResponse> => {
    return api.post<VerifyPhoneOtpResponse>("/api/auth/phone/verify-otp", {
      phoneNumber: phoneNumber.trim(),
      otp: otp.trim(),
    });
  },

  getPhoneStatus: async (): Promise<PhoneStatusResponse> => {
    return api.get<PhoneStatusResponse>("/api/auth/phone/status");
  },
};
