import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAdminFirestore } from "../../../app/server/utils/firebaseAdmin";
import handler from "../../../app/server/middleware/widget-validation";

// Mock dependencies
vi.mock("../../../app/server/utils/firebaseAdmin", () => ({
  useAdminFirestore: vi.fn(),
}));

// Mock h3 utils
vi.mock("h3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("h3")>();
  return {
    ...actual,
    getQuery: vi.fn(),
    getRequestHeader: vi.fn(),
    createError: vi.fn((opts) => opts),
    defineEventHandler: (fn: any) => fn,
  };
});

import { getQuery, getRequestHeader, createError } from "h3";

describe("Widget Validation Middleware", () => {
  let mockDb: any;
  let mockCollection: any;
  let mockDoc: any;
  let mockGet: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Firestore mock
    mockGet = vi.fn();
    mockDoc = vi.fn(() => ({ get: mockGet }));
    mockCollection = vi.fn(() => ({ doc: mockDoc }));
    mockDb = { collection: mockCollection };
    (useAdminFirestore as any).mockReturnValue(mockDb);
  });

  // Helper to simulate request path
  const mockEventWithPath = (path: string) =>
    ({
      path,
      node: { req: { url: path } },
    } as any);

  it("should ignore requests not starting with /widget", async () => {
    await handler(mockEventWithPath("/api/other"));
    // Should not throw and not call Firestore
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("should return 400 if tenant_id is missing on /widget", async () => {
    (getQuery as any).mockReturnValue({}); // No tenant_id

    try {
      await handler(mockEventWithPath("/widget"));
      expect.fail("Should have thrown an error");
    } catch (e: any) {
      if (e.message === "Should have thrown an error") throw e;
      expect(createError).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    }
  });

  it("should return 403 if tenant does not exist", async () => {
    (getQuery as any).mockReturnValue({ tenant_id: "non-existent" });
    mockGet.mockResolvedValue({ exists: false });

    try {
      await handler(mockEventWithPath("/widget"));
      expect.fail("Should have thrown an error");
    } catch (e: any) {
      if (e.message === "Should have thrown an error") throw e;
      expect(createError).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    }
  });

  it("should return 403 if Referer is missing", async () => {
    (getQuery as any).mockReturnValue({ tenant_id: "valid-tenant" });
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ allowed_domains: ["example.com"] }),
    });
    (getRequestHeader as any).mockReturnValue(undefined);

    try {
      await handler(mockEventWithPath("/widget"));
      expect.fail("Should have thrown an error");
    } catch (e: any) {
      if (e.message === "Should have thrown an error") throw e;
      expect(createError).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    }
  });

  it("should return 403 if Referer is not in allowed_domains", async () => {
    (getQuery as any).mockReturnValue({ tenant_id: "valid-tenant" });
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ allowed_domains: ["example.com"] }),
    });
    (getRequestHeader as any).mockReturnValue("https://malicious.com");

    try {
      await handler(mockEventWithPath("/widget"));
      expect.fail("Should have thrown an error");
    } catch (e: any) {
      if (e.message === "Should have thrown an error") throw e;
      expect(createError).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    }
  });

  it("should pass (not throw) if validation passes", async () => {
    (getQuery as any).mockReturnValue({ tenant_id: "valid-tenant" });
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ allowed_domains: ["example.com"] }),
    });
    (getRequestHeader as any).mockReturnValue("https://example.com/page");

    await handler(mockEventWithPath("/widget"));
    // Assertion: No error thrown
  });
});
