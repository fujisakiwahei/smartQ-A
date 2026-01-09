# Technology Stack

## Core Stack

- **Framework**: Nuxt 4 (running with `future: { compatibilityVersion: 4 }`)
- **UI Library**: Nuxt UI (Tailwind CSS based)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (for Admins), Domain-based custom auth (for Widgets)
- **AI**: Gemini 3.0 Flash (via Google Generative AI SDK)
- **Hosting**: Vercel (recommended)

## Key Technical Decisions

- **Nuxt 4 Compatibility**: Project is set up for Nuxt 4, using `app/` directory structure.
- **Server-Side AI**: Gemini API interactions occur on the server (Nitro routes/Server components) to protect API keys.
- **Firestore Data Model**:
  - `tenants`: Stores configuration and allowed domains.
  - `knowledge`: Stores Q&A pairs/chunks.
  - `chat_logs`: Stores conversation history.
- **Styling**: Tailwind CSS via Nuxt UI.
- **Linting**: ESLint with Nuxt presets.

## Environment Variables

- `GEMINI_API_KEY`: Server-side only.
- `NUXT_PUBLIC_FIREBASE_*`: Public configuration for client-side Firebase SDK.

## AI Pipeline

1. **Input**: User message.
2. **Context**: Tenant ID (derived from domain).
3. **Process**:
   - Identify Category (AI).
   - Retrieve Knowledge (Firestore query).
   - Generate Answer (AI with context).
