# @davna/client-app

The front end: Next.js 15 (App Router, Turbopack) with React 19, deployed on Vercel. It holds the landing page with lead capture, the login, the dashboard, the classroom (audio recording and playback over socket.io) and the privacy policy (`/politica-de-privacidade`), with Google Tag Manager behind a consent banner and Vercel Analytics. It imports no `@davna/*` package: it talks to `apps/monolith.api` only by HTTP and WebSocket.

```bash
yarn workspace @davna/client-app dev     # next dev --turbopack
yarn workspace @davna/client-app build   # next build --turbopack
yarn workspace @davna/client-app start   # next start, after a build
yarn workspace @davna/client-app lint    # eslint, with the root eslint.config.mjs
```

- **Layout:** `src/app/` holds the routes and the `app/api/*` route handlers; `src/modules/{account,classroom,feedback}/` hold each area's `pages`, `components`, `controllers`, `services`, `actions` and `contexts`; `src/shared/` the common components, assets, fonts and styles. Imports use the `@/` alias for `src/`.
- **The API key never reaches the browser.** The browser calls the app's own `app/api/*` routes and server actions; the server-side services (`src/modules/*/services/`, marked `server-only`) call the API with `API_BASE_URL` and the header `X-Api-Key: apikey=<API_ACCESS_TOKEN>`. Only `NEXT_PUBLIC_*` values may be read in client code. The header name must match the API's `API_KEY_HEADER_NAME`. The one direct connection from the browser is the classroom socket (`src/modules/classroom/contexts/classroom.context.tsx`): it connects to `NEXT_PUBLIC_WS_BASE_URL` with the session token it gets from `/api/classroom/session` and the `classroom_id` in the handshake `auth`.
- **Session:** `src/middleware.ts` protects `/dashboard` and `/api/classroom` (`/login` is public), validating the `session_token` cookie with `ensureAuth` or renewing it from `session_refresh_token` with `refreshAuth`. The API receives the tokens as `Authorization: Bearer <token>` and `X-Refresh-Authorization: Bearer <token>`. The cookie names are in `src/config/client.ts` and `src/config/server.ts`.
- **Configuration** (`docs/recommendations.md` RG05): `src/config/` groups `API_BASE_URL`, `NEXT_PUBLIC_WS_BASE_URL` and `NEXT_PUBLIC_GTM_ID` without validation, yet several services still read `process.env.API_BASE_URL` and `API_ACCESS_TOKEN` directly; new code reads them only through `src/config/`. The variable names are in `.env.example` (local values in a gitignored `.env*`, production ones in the Vercel project, set by the user). `NEXT_PUBLIC_GTM_ID` is the id **without** the `GTM-` prefix, which `src/app/layout.tsx` adds; `NEXT_PUBLIC_APP_URL` is listed but not read by the code yet.
- **Deployment-specific values are hard-coded** (RG08): the site URL in `src/app/sitemap.ts` and `src/app/robots.txt`, and the site and contact e-mail in `src/modules/feedback/pages/privacy.politics.tsx`. Do not copy them into new code; they move to configuration.
- The privacy policy must describe what the system actually does with personal data (the lead's phone number, the account, the recorded audio, the analytics cookies): a change that alters that updates the page in the same change.
- The interface copy is in Brazilian Portuguese, the product's language; code comments are English (several existing ones are still Portuguese, translate them when you touch the file).
- Tailwind is mixed: `tailwindcss` 3 with `tailwind.config.js` and `@tailwindcss/postcss` 4 in `postcss.config.js` (RG09); check a styling change in the browser, including at 375px width.
- **No tests yet** (RG13 covers the shared packages; the client has no Jest setup at all). Logic worth testing goes into plain functions (`src/modules/*/logic/`, `utils/`) so a spec can be added under `src/**/__tests__/` when the client adopts tests.
- The `.tsx` files carry no license header (`yarn add:header` only covers `.ts`); the `.ts` files in `src/` do.
