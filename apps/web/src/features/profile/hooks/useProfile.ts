import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../api/profileApi";
import type { ProfileUpdateInput } from "../types/profileTypes";
import { profileKeys } from "./profileKeys";

export function useOwnProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: async () => (await profileApi.getMe()).profile,
    staleTime: 1000 * 60,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileUpdateInput) => profileApi.updateMe(data),
    onSuccess: (response) => {
      queryClient.setQueryData(profileKeys.me(), response.profile);
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}
