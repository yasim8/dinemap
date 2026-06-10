<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# DineMap

Lahore restaurant-discovery + menu-builder web app. **No backend** — all state lives in the browser. Two audiences in one app: diners browse restaurants/menus/bank-card discounts, and restaurant owners build & publish menus.

## Stack
- **Next.js 16.2.7** (App Router) + **React 19** — heavily customized; ALWAYS read `node_modules/next/dist/docs/` before touching routing/config.
- **Plain JavaScript** `.jsx` (no TypeScript). `@/*` → `./src/*` (see `jsconfig.json`).
- **lucide-react** for icons (re-exported centrally from `src/components/ui/index.jsx`).
- **Pure custom CSS design system** in `src/app/globals.css` — CSS custom properties (`--brand`, `--font-display`, `--radius-pill`, etc.), `dm-*` class names. **Tailwind is installed but NOT used for app styling** — do not add Tailwind utility classes; use the existing tokens/classes or inline styles referencing `var(--token)`.

## Commands
- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build (use this to verify changes; there are no tests)
- `npm run lint` — eslint
- `npm start` — serve production build

## Architecture
- **SPA state machine.** `src/app/page.jsx` is the whole app (~2000 lines): a single `App()` component with a `screen` state var switching between `home / search / restaurant / discounts / dashboard / template-gallery / menu-builder`. Every screen + the menu builder live in this one file as local components. Navigation is `nav(screen)`, not Next.js routes.
- **Only real routes** are `/login` and `/forgot-password` (full-page auth). Returning from `/login` uses `?screen=` + `?redirect=` params; the App reads them after mount.
- **Persistence layer** (`src/lib/`):
  - `auth.js` — client-only auth *flag* in `localStorage` (`dinemap.authed`). `useAuthed()` reactive hook. No real auth/backend.
  - `store.js` — owner data: `restaurants → menus → sections → items` (+ reviews) in `localStorage` (`dinemap.owner`). `useOwnerData()` reactive hook. CRUD helpers (`createRestaurant`, `saveMenu`, `addMenuFromTemplate`, `duplicateMenu`, `replyToReview`, …). `seedIfEmpty()` seeds one demo restaurant ("Salt Restaurant") on first login.
  - `data.js` — browse-side mock data + templates, fonts, gradients, and the Country→City→Area hierarchy with coordinates (powers "smart location" GPS-to-nearest-area).
- **Shared UI primitives** in `src/components/ui/index.jsx`: `Btn`, `IconBtn`, `Badge`, `Tag`, `Pill`, `Rating`, `Avatar`, `Input`, `Switch`, `SearchInput`, `Logo`, plus helpers `rupee()` / `formatDistance()` and all lucide icon re-exports. Import icons from here, not directly from `lucide-react`.

## Key conventions & gotchas
- **SSR-safe localStorage**: every read guards `typeof window === "undefined"` and wraps in try/catch. Reactive hooks init to empty/false for a stable first render, then sync in `useEffect` after mount (avoids hydration mismatches). Don't read `localStorage` during render.
- **Same-tab sync**: the native `storage` event only fires in *other* tabs, so writes dispatch a custom event (`dinemap:owner-change` / `dinemap:authed-change`) that hooks also listen for. Preserve this pattern on any new store mutation (call `writeAll` / dispatch the event).
- **Design override system** (the core of the menu builder): each menu has a `design` layer on top of its template (`themeId`). Any `color`/`bg`/`font`/`text` left `null` **inherits** the template, so switching templates restyles only un-overridden elements. `normalizeDesign()` / `normalizeSection()` backfill legacy/partial stored data — keep them in sync when adding design fields. One `resolveDesign()` resolver feeds BOTH the live preview and the PDF export so they stay identical.
- **No backend share**: a menu is shared by encoding its whole snapshot into the URL hash (`#menu=…`), decoded on load into a read-only `PublicMenuScreen`. QR points at the same URL. Large menus → long URLs / dense QR; the copyable link is the primary mechanism.
- **IDs** come from the `uid(prefix)` counter helper in `store.js` (e.g. `menu_…`, `sec_…`, `item_…`). Don't hand-roll IDs.
- **`"use client"`** is required on any file using hooks/`localStorage`/browser APIs.
- Currency is PKR — format via `rupee()`. Locale strings are Lahore-specific (areas, banks).

## Companion docs (read for deep dives)
- `README.md` — feature overview + "connect a backend" next steps.
- `MENU_BUILDER.md` — full menu-builder design-system spec.
- `FEATURES.md` — feature checklist.
- `LOGIN_PAGE_MIGRATION.md` — why auth moved from modal to a real `/login` route.
