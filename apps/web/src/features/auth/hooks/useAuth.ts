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

export function useAuth() {
  const { data: user, isLoading, isError, refetch } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  return {
    user: (user as SafeUser | null) ?? null,
    isAuthenticated: Boolean(user),
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
