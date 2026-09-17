export interface UserDTO {
  id: string;
  email: string;
  phone?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  profileComplete: boolean;
}

export interface AuthSessionDTO {
  user: UserDTO;
  sessionId: string;
  expiresAt: string;
}
