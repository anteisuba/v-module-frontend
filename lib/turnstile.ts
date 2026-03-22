// lib/turnstile.ts
// Server-side Turnstile token verification

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export class TurnstileVerificationError extends Error {
  constructor(message = "Turnstile verification failed") {
    super(message);
    this.name = "TurnstileVerificationError";
  }
}

/**
 * Verify a Turnstile token server-side.
 * Returns true if valid, throws TurnstileVerificationError if not.
 * Skips verification if TURNSTILE_SECRET_KEY is not set (dev mode).
 */
export async function verifyTurnstileToken(token: string | undefined | null): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // 开发环境没有 secret key 时跳过验证
  if (!secretKey) {
    return true;
  }

  if (!token) {
    throw new TurnstileVerificationError("Missing Turnstile token");
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: secretKey,
      response: token,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new TurnstileVerificationError(
      `Turnstile verification failed: ${(data["error-codes"] || []).join(", ")}`
    );
  }

  return true;
}
