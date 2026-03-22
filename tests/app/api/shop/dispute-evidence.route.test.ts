import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSessionMock, submitDisputeEvidenceMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  submitDisputeEvidenceMock: vi.fn(),
}));

vi.mock("@/lib/session/userSession", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/domain/shop/dispute-evidence", () => ({
  submitDisputeEvidence: submitDisputeEvidenceMock,
  DisputeEvidenceError: class DisputeEvidenceError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = "DisputeEvidenceError";
    }
  },
}));

import { POST } from "@/app/api/shop/disputes/[disputeId]/evidence/route";
import { DisputeEvidenceError } from "@/domain/shop/dispute-evidence";

function createFormDataRequest(
  disputeId: string,
  fields: Record<string, string> = {},
  files: Record<string, { name: string; type: string; size: number }> = {}
) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  for (const [key, meta] of Object.entries(files)) {
    const blob = new Blob([new Uint8Array(meta.size)], { type: meta.type });
    formData.append(key, new File([blob], meta.name, { type: meta.type }));
  }

  return {
    request: new Request(
      `http://localhost/api/shop/disputes/${disputeId}/evidence`,
      { method: "POST", body: formData }
    ),
    params: Promise.resolve({ disputeId }),
  };
}

describe("POST /api/shop/disputes/[disputeId]/evidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when session is missing", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const { request, params } = createFormDataRequest("dp_test_1");
    const response = await POST(request, { params });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(submitDisputeEvidenceMock).not.toHaveBeenCalled();
  });

  it("returns 200 with draft when submit=false", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    submitDisputeEvidenceMock.mockResolvedValue({
      dispute: { id: "d-1", status: "needs_response" },
      submitted: false,
    });

    const { request, params } = createFormDataRequest("dp_test_1", {
      uncategorized_text: "test evidence",
      submit: "false",
    });
    const response = await POST(request, { params });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.submitted).toBe(false);
    expect(submitDisputeEvidenceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        externalDisputeId: "dp_test_1",
        userId: "seller-1",
        submit: false,
        textFields: expect.objectContaining({ uncategorized_text: "test evidence" }),
      })
    );
  });

  it("returns 200 with submitted=true when submit=true", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    submitDisputeEvidenceMock.mockResolvedValue({
      dispute: { id: "d-1", status: "under_review" },
      submitted: true,
    });

    const { request, params } = createFormDataRequest("dp_test_1", {
      uncategorized_text: "final evidence",
      submit: "true",
    });
    const response = await POST(request, { params });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.submitted).toBe(true);
  });

  it("returns 404 when dispute is not found", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    submitDisputeEvidenceMock.mockRejectedValue(
      new DisputeEvidenceError("NOT_FOUND", "Dispute not found")
    );

    const { request, params } = createFormDataRequest("dp_nonexistent");
    const response = await POST(request, { params });

    expect(response.status).toBe(404);
  });

  it("returns 403 when dispute belongs to another user", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    submitDisputeEvidenceMock.mockRejectedValue(
      new DisputeEvidenceError("FORBIDDEN", "Not your dispute")
    );

    const { request, params } = createFormDataRequest("dp_other");
    const response = await POST(request, { params });

    expect(response.status).toBe(403);
  });

  it("returns 400 when dispute status is not actionable", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    submitDisputeEvidenceMock.mockRejectedValue(
      new DisputeEvidenceError("INVALID_STATUS", "Status does not accept evidence")
    );

    const { request, params } = createFormDataRequest("dp_closed");
    const response = await POST(request, { params });

    expect(response.status).toBe(400);
  });

  it("returns 400 when dispute is expired", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    submitDisputeEvidenceMock.mockRejectedValue(
      new DisputeEvidenceError("EXPIRED", "Evidence submission deadline has passed")
    );

    const { request, params } = createFormDataRequest("dp_expired");
    const response = await POST(request, { params });

    expect(response.status).toBe(400);
  });

  it("returns 400 when file exceeds 4MB", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });

    const { request, params } = createFormDataRequest(
      "dp_test_1",
      { submit: "false" },
      { receipt: { name: "big.pdf", type: "application/pdf", size: 5 * 1024 * 1024 } }
    );
    const response = await POST(request, { params });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toContain("4MB");
    expect(submitDisputeEvidenceMock).not.toHaveBeenCalled();
  });

  it("returns 400 when file type is not allowed", async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });

    const formData = new FormData();
    const blob = new Blob(["test"], { type: "text/plain" });
    formData.append("receipt", new File([blob], "test.txt", { type: "text/plain" }));
    formData.append("submit", "false");

    const request = new Request(
      "http://localhost/api/shop/disputes/dp_test_1/evidence",
      { method: "POST", body: formData }
    );
    const response = await POST(request, {
      params: Promise.resolve({ disputeId: "dp_test_1" }),
    });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toContain("unsupported type");
    expect(submitDisputeEvidenceMock).not.toHaveBeenCalled();
  });
});
