import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "../../../app/server/api/chat.post";
import { useAdminFirestore } from "../../../app/server/utils/firebaseAdmin";
import { useGemini } from "../../../app/server/utils/gemini"; // Mock this too to avoid errors
import { readBody, createError } from "h3";

// Mock dependencies
vi.mock("../../../app/server/utils/firebaseAdmin", () => ({
  useAdminFirestore: vi.fn(),
}));

// Added mock for gemini to avoid 'GEMINI_API_KEY is not set' error
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

describe("POST /api/chat", () => {
  let mockDb: any;
  let mockCollection: any;
  let mockDoc: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Firestore mock to avoid errors in real handler execution
    const mockGet = vi.fn().mockResolvedValue({ docs: [] });
    const mockAdd = vi.fn();
    mockCollection = vi.fn((name) => {
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

  const mockEvent = () => ({ context: {} } as any);

  it("should return 400 if tenant_id is missing", async () => {
    (readBody as any).mockResolvedValue({ message: "hello" });

    try {
      await handler(mockEvent());
      expect.fail("Should have thrown error");
    } catch (e: any) {
      if (e.message === "Should have thrown error") throw e;
      expect(createError).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    }
  });

  it("should return 400 if message is missing", async () => {
    (readBody as any).mockResolvedValue({ tenant_id: "123" });

    try {
      await handler(mockEvent());
      expect.fail("Should have thrown error");
    } catch (e: any) {
      if (e.message === "Should have thrown error") throw e;
      expect(createError).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    }
  });

  it("should return 200 with response structure if valid", async () => {
    (readBody as any).mockResolvedValue({
      tenant_id: "123",
      message: "hello",
    });

    const result = await handler(mockEvent());
    expect(result).toHaveProperty("response");
  });
});
