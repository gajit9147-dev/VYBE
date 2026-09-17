import { api } from "@/services/api/client";
import { AuthResponse, LogoutResponse } from "../types/authTypes";
import { LoginFormData, RegisterFormData } from "../schemas/authSchemas";

export const authApi = {
  login: async (data: LoginFormData): Promise<AuthResponse> => {
    return api.post<AuthResponse>("/api/auth/login", {
      email: data.email.trim().toLowerCase(),
      password: data.password
    });
  },

  register: async (data: Omit<RegisterFormData, "confirmPassword">): Promise<AuthResponse> => {
    return api.post<AuthResponse>("/api/auth/register", {
      email: data.email.trim().toLowerCase(),
      password: data.password
    });
  },

  getMe: async (): Promise<AuthResponse> => {
    return api.get<AuthResponse>("/api/auth/me");
  },

  logout: async (): Promise<LogoutResponse> => {
    return api.post<LogoutResponse>("/api/auth/logout");
  }
};
