import { api } from "@/services/api/client";
import type {
  ProfileResponse,
  ProfileUpdateInput,
  UpdateProfileResponse,
} from "../types/profileTypes";

export const profileApi = {
  getMe: async (): Promise<ProfileResponse> => {
    return api.get<ProfileResponse>("/api/profile/me");
  },

  updateMe: async (
    data: ProfileUpdateInput,
  ): Promise<UpdateProfileResponse> => {
    return api.patch<UpdateProfileResponse>("/api/profile/me", data);
  },
};
