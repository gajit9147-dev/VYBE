import { hash, verify } from "@node-rs/argon2";

// Algorithm 2 corresponds to Argon2id
const ARGON2ID_ALGORITHM = 2;

const ARGON2ID_OPTIONS = {
  algorithm: ARGON2ID_ALGORITHM,
  memoryCost: 65536,
  timeCost: 3,
  outputLen: 32,
  parallelism: 4
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2ID_OPTIONS);
}

export async function verifyPassword(hashedPassword: string, candidate: string): Promise<boolean> {
  try {
    return await verify(hashedPassword, candidate, ARGON2ID_OPTIONS);
  } catch {
    return false;
  }
}
