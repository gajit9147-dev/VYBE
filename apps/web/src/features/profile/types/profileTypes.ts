export type ProfileGender =
  | "WOMAN"
  | "MAN"
  | "NON_BINARY"
  | "GENDERQUEER"
  | "OTHER";

export interface ProfilePhotoSummary {
  id: string;
  cdnUrl: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ProfileInterestSummary {
  id: string;
  name: string;
  slug: string;
}

export interface ProfileRelationshipIntentSummary {
  code: string;
  label: string;
  description: string;
  isPrimary: boolean;
  customClarification: string | null;
}

export interface ProfilePromptSummary {
  templateId: string;
  question: string;
  category: string;
  answerText: string;
  displayOrder: number;
}

export interface OwnProfile {
  id: string;
  displayName: string;
  username: string | null;
  birthDate: string;
  age: number | null;
  gender: string;
  pronouns: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  heightCm: number | null;
  occupation: string | null;
  company: string | null;
  education: string | null;
  drinking: string | null;
  smoking: string | null;
  exercise: string | null;
  starSign: string | null;
  languages: string[];
  isDiscoverable: boolean;
  showAge: boolean;
  showDistance: boolean;
  crossedPathOptIn: boolean;
  completionScore: number;
  photos: ProfilePhotoSummary[];
  interests: ProfileInterestSummary[];
  relationshipIntents: ProfileRelationshipIntentSummary[];
  prompts: ProfilePromptSummary[];
}

export interface ProfileResponse {
  profile: OwnProfile | null;
  message?: string;
}

export interface UpdateProfileResponse {
  message: string;
  profile: OwnProfile;
}

export interface ProfileUpdateInput {
  displayName?: string;
  username?: string;
  birthDate?: string;
  gender?: ProfileGender;
  pronouns?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
}
