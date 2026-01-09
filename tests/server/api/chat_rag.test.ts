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

describe("POST /api/chat - Step 2 & 3: RAG Pipeline", () => {
  let mockDb: any;
  let mockAdd: any;
  let mockGet: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Firestore mock
    mockAdd = vi.fn();
    mockGet = vi.fn().mockResolvedValue({ docs: [] }); // Default return

    const mockCollection = vi.fn((name) => {
      if (name === "chat_logs") return { add: mockAdd };
      if (name === "categories") return { get: mockGet };
      if (name === "knowledge_base")
        return { where: vi.fn(() => ({ get: mockGet })), get: mockGet };
      return {
        doc: vi.fn(() => ({
          collection: mockCollection,
          get: mockGet,
        })),
      };
    });

    mockDb = { collection: mockCollection };
    (useAdminFirestore as any).mockReturnValue(mockDb);

    // Setup Gemini Mock
    const mockGenerativeModel = {
      generateContent: vi
        .fn()
        .mockResolvedValue({ response: { text: () => "AI Answer" } }),
    };
    (useGemini as any).mockReturnValue({
      getGenerativeModel: () => mockGenerativeModel,
    });
  });

  it("should fetch knowledge base using detected category", async () => {
    (readBody as any).mockResolvedValue({
      tenant_id: "tenant-123",
      message: "shipping help",
    });

    await handler({ context: {} } as any);

    // Verify tenants access
    expect(mockDb.collection).toHaveBeenCalledWith("tenants");

    // Verify Gemini was called
    const geminiInstance = useGemini();
    const model = geminiInstance.getGenerativeModel();
    expect(model.generateContent).toHaveBeenCalled();
  });
});
