import {
  defineEventHandler,
  getQuery,
  getRequestHeader,
  createError,
} from "h3";
import { useAdminFirestore } from "../utils/firebaseAdmin";

export default defineEventHandler(async (event) => {
  const path = event.path.split("?")[0];
  if (path !== "/widget") return;

  // Skip validation in development mode
  if (process.dev) {
    console.log(
      "--- 🛠 開発モード: ウィジェット配信のバリデーションをスキップしました ---"
    );
    return;
  }

  const query = getQuery(event);
  const tenantId = query.tenant_id as string;

  if (!tenantId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing tenant_id",
    });
  }

  const db = useAdminFirestore();
  const tenantDoc = await db.collection("tenants").doc(tenantId).get();

  if (!tenantDoc.exists) {
    throw createError({
      statusCode: 403,
      statusMessage: "Invalid tenant",
    });
  }

  const allowedDomains = tenantDoc.data()?.allowed_domains || [];
  const referer =
    getRequestHeader(event, "referer") || getRequestHeader(event, "origin");

  if (!referer) {
    throw createError({
      statusCode: 403,
      statusMessage: "Missing Referer/Origin",
    });
  }

  try {
    const refererUrl = new URL(referer);
    // Allow if hostname matches exactly, OR if the list includes the protocol+host (flexible)
    // Design implied simple domain list. Let's assume list of domains (e.g. "example.com").
    // We compare hostname.
    const hostname = refererUrl.hostname;

    // Check if any allowed domain matches the hostname
    // We might want to allow subdomains if the stored domain is generic, but strict for now
    const isAllowed = allowedDomains.includes(hostname);

    if (!isAllowed) {
      // Optional: Check if the list contains full origin
      // const origin = refererUrl.origin;
      // if (allowedDomains.includes(origin)) ...

      throw new Error("Not allowed");
    }
  } catch (e) {
    throw createError({
      statusCode: 403,
      statusMessage: "Domain not allowed",
    });
  }
});
