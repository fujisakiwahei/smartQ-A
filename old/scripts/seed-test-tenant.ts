import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
// Assumes GOOGLE_APPLICATION_CREDENTIALS or default credentials are set
// Or you can configure it manually if needed for local dev
try {
  initializeApp();
} catch (e) {
  // Ignore if already initialized
}

const db = getFirestore();

async function seed() {
  console.log("Seeding test tenant...");

  const tenantId = "test-tenant-123";

  await db
    .collection("tenants")
    .doc(tenantId)
    .set({
      name: "Test Company",
      allowed_domains: ["localhost", "127.0.0.1"], // Allow localhost for testing
      theme_color: "#3B82F6",
      created_at: new Date(),
    });

  await db
    .collection("tenants")
    .doc(tenantId)
    .collection("categories")
    .doc("cat1")
    .set({
      name: "Shipping",
      description: "Questions about delivery and shipping.",
    });

  await db
    .collection("tenants")
    .doc(tenantId)
    .collection("categories")
    .doc("cat2")
    .set({
      name: "Returns",
      description: "Questions about returns and refunds.",
    });

  await db
    .collection("tenants")
    .doc(tenantId)
    .collection("knowledge_base")
    .doc("kb1")
    .set({
      question: "How long does shipping take?",
      answer: "Shipping usually takes 3-5 business days.",
      category_ids: ["cat1"],
    });

  console.log("Seeding complete. Tenant ID:", tenantId);
}

seed().catch(console.error);
