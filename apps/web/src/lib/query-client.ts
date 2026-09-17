import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error: unknown) => {
        // Do not retry 401/403/404 errors automatically
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          (error.status === 401 || error.status === 403 || error.status === 404)
        ) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: false
    }
  }
});
