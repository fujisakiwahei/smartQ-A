import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "../../../app/server/api/chat.post";
import { useAdminFirestore } from "../../../app/server/utils/firebaseAdmin";
import { useGemini } from "../../../app/server/utils/gemini";
import { readBody } from "h3";

// Mock dependencies
vi.mock("../../../app/server/utils/firebaseAdmin", () => ({
  useAdminFirestore: vi.fn(),
}));

vi.mock("../../../app/server/utils/gemini", () => ({
  useGemini: vi.fn(),
}));

vi.mock("h3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("h3")>();
  return {
    ...actual,
    readBody: vi.fn(),
    createError: vi.fn((opts) => opts),
    defineEventHandler: (fn: any) => fn,
  };
});

describe("POST /api/chat - Step 4: Logging", () => {
  let mockDb: any;
  let mockAdd: any;
  let mockCollection: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Firestore mock
    // We need to mock chat_logs collection and add method
    mockAdd = vi.fn();
    mockCollection = vi.fn((name) => {
      if (name === "chat_logs") return { add: mockAdd };
      // Return minimal mocks for other collections to avoid errors in previous steps
      return {
        doc: () => ({
          collection: () => ({ get: vi.fn().mockResolvedValue({ docs: [] }) }),
        }),
      };
    });

    mockDb = { collection: mockCollection };
    (useAdminFirestore as any).mockReturnValue(mockDb);

    // Setup Gemini Mock (minimal)
    const mockGenerativeModel = {
      generateContent: vi
        .fn()
        .mockResolvedValue({ response: { text: () => "AI Answer" } }),
    };
    (useGemini as any).mockReturnValue({
      getGenerativeModel: () => mockGenerativeModel,
    });
  });

  it("should log chat interaction to firestore", async () => {
    (readBody as any).mockResolvedValue({
      tenant_id: "tenant-123",
      message: "log me",
    });

    await handler({ context: {} } as any);

    expect(mockCollection).toHaveBeenCalledWith("chat_logs");
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: "tenant-123",
        user_query: "log me",
        ai_response: "AI Answer",
        // detected_category_ids: expect.any(Array), // Optional check
        timestamp: expect.anything(), // Should check it's a timestamp or Date
      })
    );
  });
});
