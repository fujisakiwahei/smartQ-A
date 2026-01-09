import { defineEventHandler, readBody, createError } from "h3";
import { useAdminFirestore } from "../utils/firebaseAdmin";
import { useGemini } from "../utils/gemini";
import { buildClassificationPrompt, buildRAGPrompt } from "../utils/prompts";
import { FieldValue } from "firebase-admin/firestore";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { tenant_id, message, history } = body;

  if (!tenant_id) {
    throw createError({ statusCode: 400, statusMessage: "Missing tenant_id" });
  }

  if (!message) {
    throw createError({ statusCode: 400, statusMessage: "Missing message" });
  }

  // Skip AI/DB processing in development mode
  if (process.dev) {
    console.log("--- 🛠 開発モード: ダミー応答を返します ---");
    return {
      response: `[開発モード] 「${message}」についてのご質問ですね。ウィジェットは正常に通信できています！`,
      detected_category_ids: ["test-category-id"],
    };
  }

  const db = useAdminFirestore();
  const gemini = useGemini();

  // --- Step 1: Intent Analysis (Category Identification) ---

  // 1. Fetch categories
  const categoriesSnapshot = await db
    .collection("tenants")
    .doc(tenant_id)
    .collection("categories")
    .get();

  const categories = categoriesSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    description: doc.data().description,
  }));

  let detectedCategoryId = null;

  if (categories.length > 0) {
    // 2. Classify
    const classificationPrompt = buildClassificationPrompt(message, categories);
    const classificationModel = gemini.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    try {
      const result = await classificationModel.generateContent(
        classificationPrompt
      );
      const text = result.response.text();
      detectedCategoryId = text.trim().replace(/"/g, "");
      try {
        const json = JSON.parse(text);
        detectedCategoryId =
          json.category_id || json.id || Object.values(json)[0] || null;
      } catch (e) {
        // Not valid JSON, maybe just ID string
      }
    } catch (e) {
      console.error("Classification failed", e);
    }
  }

  // --- Step 2: Context Retrieval ---

  let knowledgeQuery = db
    .collection("tenants")
    .doc(tenant_id)
    .collection("knowledge_base");

  if (detectedCategoryId) {
    knowledgeQuery = knowledgeQuery.where(
      "category_ids",
      "array-contains",
      detectedCategoryId
    ) as any;
  }

  const knowledgeSnapshot = await knowledgeQuery.get();
  const knowledgeContext = knowledgeSnapshot.docs.map((doc) => ({
    q: doc.data().question,
    a: doc.data().answer,
  }));

  // --- Step 3: Answer Generation (RAG) ---

  const ragPrompt = buildRAGPrompt(message, knowledgeContext);
  const ragModel = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

  const ragResult = await ragModel.generateContent(ragPrompt);
  const aiResponse = ragResult.response.text();

  // --- Step 4: Logging (Task 2.4) ---

  await db.collection("chat_logs").add({
    tenant_id: tenant_id,
    user_query: message,
    ai_response: aiResponse,
    detected_category_ids: detectedCategoryId ? [detectedCategoryId] : [],
    timestamp: FieldValue.serverTimestamp(),
  });

  return {
    response: aiResponse,
    detected_category_ids: detectedCategoryId ? [detectedCategoryId] : [],
  };
});
