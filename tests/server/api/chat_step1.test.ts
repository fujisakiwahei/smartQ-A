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

describe("POST /api/chat - Step 1: Intent Analysis", () => {
  let mockDb: any;
  let mockCollection: any;
  let mockDoc: any;
  let mockGet: any;
  let mockAdd: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Firestore mock for Categories
    mockGet = vi.fn().mockResolvedValue({ docs: [] });
    mockAdd = vi.fn();

    // Complex collection mock to handle tenants -> categories AND chat_logs -> add
    mockCollection = vi.fn((name) => {
      if (name === "chat_logs") return { add: mockAdd };
      if (name === "categories") return { get: mockGet };
      if (name === "knowledge_base")
        return { where: vi.fn(() => ({ get: mockGet })), get: mockGet };
      // Default collection (e.g. tenants)
      return {
        doc: vi.fn(() => ({
          collection: mockCollection,
          get: mockGet,
        })),
      };
    });

    mockDb = { collection: mockCollection };
    (useAdminFirestore as any).mockReturnValue(mockDb);

    // Mock Gemini
    const mockGenerativeModel = {
      generateContent: vi
        .fn()
        .mockResolvedValue({ response: { text: () => "AI Answer" } }),
    };
    (useGemini as any).mockReturnValue({
      getGenerativeModel: () => mockGenerativeModel,
    });
  });

  const mockEvent = () => ({ context: {} } as any);

  it("should fetch categories from firestore", async () => {
    (readBody as any).mockResolvedValue({
      tenant_id: "tenant-123",
      message: "shipping question",
    });

    try {
      await handler(mockEvent());
    } catch (e) {
      // ignore
    }

    expect(mockCollection).toHaveBeenCalledWith("tenants");
  });
});
