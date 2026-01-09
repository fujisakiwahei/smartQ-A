# Project Structure

## Directory Organization

### Root

- `.kiro/`: **AI-DLC System**
  - `steering/`: Project-wide context (product, tech, structure).
  - `specs/`: Feature specifications and task tracking.
  - `settings/`: Templates and rules.
- `app/`: **Source Code (Nuxt 4)**
  - `pages/`: Application routes.
    - `tenant-admin/`: Tenant management dashboard.
    - `admin/`: System admin dashboard.
    - `dev-admin/`: Developer tools.
  - `components/`: Vue components.
  - `composables/`: Shared logic (Vue Composables).
  - `server/`: Server-side API routes (Nitro).
- `docs/`: **Documentation**
  - `spec.md`: Master specification.
  - `db-schema.md`: Database structure.
  - `ai-logic.md`: Prompt engineering details.
  - `admin-ui.md`: UI specifications.

## Conventions

- **Files**: Kebab-case for files (e.g., `chat-logs.vue`).
- **Components**: PascalCase for component names (e.g., `AppLogo.vue`).
- **Imports**: Use Nuxt auto-imports where possible.
- **Types**: TypeScript is enforced.

## Key Paths

- **Steering**: `.kiro/steering/` (This folder)
- **Specs**: `.kiro/specs/` (Active development specs)
- **Docs**: `docs/` (Static documentation)
