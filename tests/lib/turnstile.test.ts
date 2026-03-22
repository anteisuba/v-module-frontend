// tests/lib/turnstile.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyTurnstileToken, TurnstileVerificationError } from "@/lib/turnstile";

describe("verifyTurnstileToken", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("skips verification when TURNSTILE_SECRET_KEY is not set (dev mode)", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const result = await verifyTurnstileToken(undefined);
    expect(result).toBe(true);
  });

  it("throws when token is missing and secret key is set", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    await expect(verifyTurnstileToken(undefined)).rejects.toThrow(
      TurnstileVerificationError
    );
    await expect(verifyTurnstileToken(null)).rejects.toThrow(
      TurnstileVerificationError
    );
    await expect(verifyTurnstileToken("")).rejects.toThrow(
      TurnstileVerificationError
    );
  });

  it("verifies valid token against Cloudflare API", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true }))
    );

    const result = await verifyTurnstileToken("valid-token");
    expect(result).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws on failed verification", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] })
      )
    );

    await expect(verifyTurnstileToken("bad-token")).rejects.toThrow(
      TurnstileVerificationError
    );
  });
});
