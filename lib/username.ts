/** Members sign in with a username; internally it maps to a private email address. */
export const USERNAME_DOMAIN = "sheikhvilla.app";

/** "rahim" -> "rahim@sheikhvilla.app"; real emails (admin) are kept as they are. */
export function toLoginEmail(input: string): string {
  const v = input.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${USERNAME_DOMAIN}`;
}

export const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;
