import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/authApi";
import { LoginFormData, RegisterFormData } from "../schemas/authSchemas";
import { SafeUser } from "../types/authTypes";

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const response = await authApi.getMe();
        return response.user;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginFormData) => authApi.login(data),
    onSuccess: (response) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, response.user);
    }
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<RegisterFormData, "confirmPassword">) => authApi.register(data),
    onSuccess: (response) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, response.user);
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear();
    }
  });
}

export function useEmailVerificationStatus(email?: string) {
  return useQuery({
    queryKey: ["auth", "email-verification", "status", email ?? "me"] as const,
    queryFn: async () => {
      try {
        return await authApi.getVerificationStatus(email);
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 30, // 30 seconds
    retry: false
  });
}

export function useSendVerificationEmail() {
  return useMutation({
    mutationFn: (email?: string) => authApi.sendVerification(email)
  });
}

export function useVerifyEmailToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["auth", "email-verification"] });
    }
  });
}

export function useAuth() {
  const { data: user, isLoading, isError, refetch } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  return {
    user: (user as SafeUser | null) ?? null,
    isAuthenticated: Boolean(user),
    isVerified: Boolean(user?.isVerified),
    isLoading,
    isError,
    refetchUser: refetch,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending
  };
}

