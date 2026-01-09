(function () {
  // Widget Loader
  // Reads tenant_id and injects iframe

  const script = document.currentScript;
  const tenantId = script.getAttribute("data-tenant-id");

  if (!tenantId) {
    console.error("Smart Q&A Widget: data-tenant-id attribute is missing.");
    return;
  }

  // Configuration
  const IFRAME_ID = "smart-qa-widget-iframe";
  // Use current script src to determine base URL, or default to known host
  // For development, we assume localhost:3000 or the same origin if hosted there
  // const BASE_URL = 'http://localhost:3000';
  // Better: Derive from script src if possible, or assume same origin for now if served from same domain
  // But usually widget is cross-origin. Let's hardcode dev origin or inject it.
  // For this task, we'll use a placeholder or relative path if testing locally.
  const BASE_URL = new URL(script.src).origin;

  if (document.getElementById(IFRAME_ID)) return; // Already injected

  const iframe = document.createElement("iframe");
  iframe.id = IFRAME_ID;
  iframe.src = `${BASE_URL}/widget?tenant_id=${tenantId}`;

  // Initial Styles (Closed state)
  Object.assign(iframe.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "60px",
    height: "60px",
    border: "none",
    borderRadius: "30px", // Round for launcher
    zIndex: "999999",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "width 0.3s ease, height 0.3s ease, border-radius 0.3s ease",
  });

  document.body.appendChild(iframe);

  // Task 3.2: Cross-Origin Communication
  window.addEventListener("message", (event) => {
    // Security check: validate origin if possible, or at least check event type
    // if (event.origin !== BASE_URL) return; // Optional strict check

    const data = event.data;
    if (!data || data.type !== "smart-qa:resize") return;

    if (data.mode === "open") {
      // Expand
      Object.assign(iframe.style, {
        width: "350px",
        height: "600px",
        borderRadius: "12px",
        maxHeight: "80vh", // Responsive constraint
      });
      // Mobile handling could go here (width 100%, etc)
    } else if (data.mode === "closed") {
      // Shrink
      Object.assign(iframe.style, {
        width: "60px",
        height: "60px",
        borderRadius: "30px",
      });
    }
  });
})();
