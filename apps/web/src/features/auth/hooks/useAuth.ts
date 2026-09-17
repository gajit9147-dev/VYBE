import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import { authApi } from "../api/authApi";
import { LoginFormData, RegisterFormData } from "../schemas/authSchemas";
import { SafeUser, AuthStatus } from "../types/authTypes";
import { authKeys } from "./authKeys";
import { ApiClientError } from "@/services/api/errors";

export const AUTH_QUERY_KEY = authKeys.currentUser();

/**
 * Completely purges all authenticated user data and cached queries from TanStack Query cache.
 * Guarantees zero cache bleed between accounts.
 */
export function clearAuthSession(queryClient: QueryClient): void {
  queryClient.setQueryData(authKeys.currentUser(), null);
  queryClient.removeQueries({ queryKey: authKeys.all });
  queryClient.removeQueries({ queryKey: ["profile"] });
  queryClient.removeQueries({ queryKey: ["conversations"] });
  queryClient.removeQueries({ queryKey: ["matches"] });
  queryClient.removeQueries({ queryKey: ["discovery"] });
  queryClient.removeQueries({ queryKey: ["messages"] });
  queryClient.removeQueries({ queryKey: ["notifications"] });
  queryClient.clear();
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      try {
        const response = await authApi.getMe();
        return response.user;
      } catch (err: unknown) {
        if (err instanceof ApiClientError) {
          // 401 means no active session (unauthenticated)
          if (err.status === 401) {
            return null;
          }
        }
        // Network or server error — rethrow so React Query marks isError
        throw err;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error) => {
      // Never retry 401 unauthenticated responses
      if (error instanceof ApiClientError && error.status === 401) {
        return false;
      }
      return failureCount < 2;
    }
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginFormData) => authApi.login(data),
    onSuccess: (response) => {
      clearAuthSession(queryClient);
      queryClient.setQueryData(authKeys.currentUser(), response.user);
    }
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<RegisterFormData, "confirmPassword">) => authApi.register(data),
    onSuccess: (response) => {
      clearAuthSession(queryClient);
      queryClient.setQueryData(authKeys.currentUser(), response.user);
    }
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearAuthSession(queryClient);
    }
  });
}

export function useLogoutAll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSuccess: () => {
      clearAuthSession(queryClient);
    }
  });
}

export function useEmailVerificationStatus(email?: string) {
  return useQuery({
    queryKey: authKeys.verificationStatus(email),
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
    onSuccess: (result) => {
      queryClient.setQueryData(authKeys.currentUser(), (old: SafeUser | null | undefined) => {
        if (!old) return old;
        return {
          ...old,
          isVerified: true,
          emailVerifiedAt: result.verifiedAt || new Date().toISOString()
        };
      });
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      queryClient.invalidateQueries({ queryKey: authKeys.verification() });
    }
  });
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError, error, refetch } = useCurrentUser();
  const { data: verificationStatus } = useEmailVerificationStatus(user?.email || undefined);
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const logoutAllMutation = useLogoutAll();

  // Centralized session expiration listener from ApiClient
  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthSession(queryClient);
    };

    window.addEventListener("vybe:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("vybe:unauthorized", handleUnauthorized);
    };
  }, [queryClient]);

  const isVerified = Boolean(user?.isVerified || verificationStatus?.isVerified);

  // Derive explicit 5-state auth status model
  let authStatus: AuthStatus = "AUTH_LOADING";
  if (isLoading) {
    authStatus = "AUTH_LOADING";
  } else if (isError) {
    authStatus = "AUTH_ERROR";
  } else if (user) {
    authStatus = isVerified ? "AUTHENTICATED_VERIFIED" : "AUTHENTICATED_UNVERIFIED";
  } else {
    authStatus = "UNAUTHENTICATED";
  }

  return {
    user: user ? { ...user, isVerified } : null,
    authStatus,
    isAuthenticated: Boolean(user),
    isVerified,
    isLoading,
    isError,
    error,
    refetchUser: refetch,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    logoutAll: logoutAllMutation.mutateAsync,
    isLoggingOutAll: logoutAllMutation.isPending
  };
}
export { authKeys };
