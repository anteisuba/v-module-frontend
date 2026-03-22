import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSessionMock, checkConnectAccountHealthMock } = vi.hoisted(
  () => ({
    getServerSessionMock: vi.fn(),
    checkConnectAccountHealthMock: vi.fn(),
  })
);

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/domain/shop", () => ({
  checkConnectAccountHealth: checkConnectAccountHealthMock,
}));

import { GET } from "@/app/api/admin/stripe/health-check/route";

function createRequest(query = "") {
  return new Request(
    `http://localhost/api/admin/stripe/health-check${query}`
  );
}

describe("GET /api/admin/stripe/health-check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 401 when not authenticated", async () => {
    getServerSessionMock.mockResolvedValue({ user: undefined });

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
    });
    expect(checkConnectAccountHealthMock).not.toHaveBeenCalled();
  });

  it("returns health check result with autoResync false by default", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    checkConnectAccountHealthMock.mockResolvedValue({
      checked: 2,
      drifted: 0,
      resynced: 0,
      errors: 0,
      accounts: [],
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(checkConnectAccountHealthMock).toHaveBeenCalledWith({
      autoResync: false,
    });
    await expect(response.json()).resolves.toEqual({
      checked: 2,
      drifted: 0,
      resynced: 0,
      errors: 0,
      accounts: [],
    });
  });

  it("passes autoResync=true when query param is set", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    checkConnectAccountHealthMock.mockResolvedValue({
      checked: 1,
      drifted: 1,
      resynced: 1,
      errors: 0,
      accounts: [
        {
          providerAccountId: "acct_test_1",
          userId: "user-1",
          localStatus: "PENDING",
          remoteStatus: "ACTIVE",
          drifted: true,
          resynced: true,
          error: null,
          diagnostic: {
            chargesEnabled: { local: false, remote: true },
            payoutsEnabled: { local: false, remote: true },
            requirementsAttention: [],
          },
        },
      ],
    });

    const response = await GET(createRequest("?autoResync=true"));

    expect(response.status).toBe(200);
    expect(checkConnectAccountHealthMock).toHaveBeenCalledWith({
      autoResync: true,
    });
    const body = await response.json();
    expect(body.drifted).toBe(1);
    expect(body.resynced).toBe(1);
    expect(body.accounts[0].diagnostic.chargesEnabled).toEqual({
      local: false,
      remote: true,
    });
  });

  it("returns 500 when health check throws", async () => {
    getServerSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    checkConnectAccountHealthMock.mockRejectedValue(
      new Error("Stripe API unavailable")
    );

    const response = await GET(createRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Stripe API unavailable",
    });
  });
});
