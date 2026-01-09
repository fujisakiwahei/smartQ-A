import { describe, it, expect } from "vitest";
import {
  buildClassificationPrompt,
  buildRAGPrompt,
} from "../../../app/server/utils/prompts";

describe("Prompt Utils", () => {
  describe("buildClassificationPrompt", () => {
    it("should construct prompt with categories and query", () => {
      const categories = [
        { id: "1", name: "Shipping", description: "Questions about delivery" },
        { id: "2", name: "Returns", description: "Questions about refunds" },
      ];
      const query = "Where is my package?";

      const prompt = buildClassificationPrompt(query, categories);

      expect(prompt).toContain("Shipping");
      expect(prompt).toContain("Questions about delivery");
      expect(prompt).toContain("Where is my package?");
      // expect(prompt).toContain("JSON");
    });
  });

  describe("buildRAGPrompt", () => {
    it("should construct prompt with JSON context and query", () => {
      const context = [{ q: "How do I return?", a: "Go to settings." }];
      const query = "I want to return item";

      const prompt = buildRAGPrompt(query, context);

      expect(prompt).toContain("JSON"); // Context is in JSON
      expect(prompt).toContain("How do I return?");
      expect(prompt).toContain("Go to settings.");
      expect(prompt).toContain(query);
      expect(prompt).toContain("Strictly"); // Strict adherence to context
    });
  });
});
