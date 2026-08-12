# Sahaba - AI and Team Instructions

Welcome to the Sahaba project! If you are an AI assistant or a new developer joining the team, please read this file to understand our architecture and coding conventions.

## 1. Technology Stack
- **Frontend**: React (Vite), React Router, `@radix-ui/themes`. (Do NOT use Tailwind or Material UI).
- **Public Backend (`web-api`)**: Node.js, Express, Prisma.
- **Internal Backend (`internal-backend`)**: Python, FastAPI.
- **Scanner Workers (`scanner`)**: Python daemon triggered via Redis.
- **Authentication**: Supabase GoTrue service (Proxied via `web-api`).
- **Database**: PostgreSQL (with Row-Level Security).

## 2. Architecture Guidelines
- **Authentication**: The frontend uses `AuthContext.jsx` as the single source of truth for session management. We store tokens in `localStorage` and handle interceptors in a clean `apiClient.js`. 
- **Error Handling**: Do not use `alert()` anywhere in the frontend. Use Radix UI's `<Callout>` component or inline text to display errors gracefully.
- **Decoupling**: The Internal Backend and Scanner Workers are on a private Docker network. The frontend must never talk to them directly; it only talks to the `web-api`.

## 3. UI/UX Rules
- Maintain a premium, modern aesthetic using Radix UI tokens.
- Ensure all components are responsive, utilizing `display={{ initial: 'none', sm: 'block' }}` for mobile handling where appropriate.
