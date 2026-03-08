import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  compareMock,
  findUniqueMock,
  ensureUserPageMock,
  getUserSessionMock,
  saveMock,
} = vi.hoisted(() => ({
  compareMock: vi.fn(),
  findUniqueMock: vi.fn(),
  ensureUserPageMock: vi.fn(),
  getUserSessionMock: vi.fn(),
  saveMock: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: compareMock,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("@/domain/page-config", () => ({
  ensureUserPage: ensureUserPageMock,
}));

vi.mock("@/lib/session/userSession", () => ({
  getUserSession: getUserSessionMock,
}));

import { POST } from "@/app/api/user/login/route";

describe("POST /api/user/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveMock.mockResolvedValue(undefined);
    getUserSessionMock.mockResolvedValue({
      user: undefined,
      save: saveMock,
    });
  });

  it("returns a specific error when the email is not registered", async () => {
    findUniqueMock.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/user/login", {
        method: "POST",
        body: JSON.stringify({
          email: "missing@example.com",
          password: "secret",
        }),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "该邮箱未注册" });
    expect(compareMock).not.toHaveBeenCalled();
  });

  it("returns a specific error when the password is incorrect", async () => {
    findUniqueMock.mockResolvedValue({
      id: "user-1",
      slug: "alice",
      email: "alice@example.com",
      displayName: "Alice",
      passwordHash: "hashed-password",
    });
    compareMock.mockResolvedValue(false);

    const response = await POST(
      new Request("http://localhost/api/user/login", {
        method: "POST",
        body: JSON.stringify({
          email: "alice@example.com",
          password: "wrong-password",
        }),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "密码不正确" });
    expect(ensureUserPageMock).not.toHaveBeenCalled();
  });

  it("creates the session and page on successful login", async () => {
    const session = {
      user: undefined,
      save: saveMock,
    };

    findUniqueMock.mockResolvedValue({
      id: "user-1",
      slug: "alice",
      email: "alice@example.com",
      displayName: "Alice",
      passwordHash: "hashed-password",
    });
    compareMock.mockResolvedValue(true);
    getUserSessionMock.mockResolvedValue(session);

    const response = await POST(
      new Request("http://localhost/api/user/login", {
        method: "POST",
        body: JSON.stringify({
          email: " alice@example.com ",
          password: "correct-password",
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(ensureUserPageMock).toHaveBeenCalledWith("user-1", "alice");
    expect(session.user).toEqual({
      id: "user-1",
      slug: "alice",
      email: "alice@example.com",
      displayName: "Alice",
    });
    expect(saveMock).toHaveBeenCalledTimes(1);
  });
});
