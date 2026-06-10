# DineMap — Features & Architecture

A restaurant discovery + beautiful-menu-builder platform. Guests can browse
restaurants and menus freely; creating/managing menus requires login.

> **Note on this Next.js build:** this project uses a customized Next.js
> (`16.2.7`). Read the relevant guide in `node_modules/next/dist/docs/` before
> changing app/routing code — APIs and conventions may differ from upstream.

---

## App structure

Single-page client app driven by a `Screen` state machine in
[`src/app/page.tsx`](src/app/page.tsx):

| Screen         | Purpose                                              | Chrome (navbar/FAB) |
| -------------- | ---------------------------------------------------- | ------------------- |
| `home`         | Hero, cuisines, bank spotlight, restaurant grid      | ✅                  |
| `search`       | Query + filter restaurants                           | ✅                  |
| `restaurant`   | Detail: Menu / Info (map) / Reviews tabs             | ✅                  |
| `discounts`    | Bank-card deals by bank & card type                  | ✅                  |
| `dashboard`    | Owner home: My Menus / Reviews & Comments / Analytics | ✅ (FAB hidden)     |
| `menu-builder` | 3-step authoring tool, editing one stored menu        | ❌                  |

Login / sign-up is a dedicated route (`/login`), not a `Screen`.

- **Seed data:** browse-side dummy data lives in [`src/lib/data.ts`](src/lib/data.ts).
- **Owner data:** each signed-in owner's restaurants → menus → sections → items
  + reviews are persisted to `localStorage` via [`src/lib/store.ts`](src/lib/store.ts)
  (no backend yet). On first login a demo restaurant is seeded once so the
  dashboard shows existing menus to edit rather than looking empty.
- **UI kit:** shared primitives in [`src/components/ui/index.tsx`](src/components/ui/index.tsx).
- **Styling:** design tokens + responsive utilities in [`src/app/globals.css`](src/app/globals.css).

---

## Authentication & post-login flow

- "Sign in", the **Dashboard** navbar button, and the FAB **navigate to the
  dedicated `/login` route** (navbar/FAB hidden there so it reads as a full page).
- On successful login the user is **redirected to the Restaurant Dashboard**
  (`/?screen=dashboard`). The dashboard detects whether the user already owns a
  restaurant:
  - **Owns ≥1 restaurant →** lists their menus with **Edit / Preview / Export /
    Duplicate / Delete**, plus **Reviews & Comments** (reply to restaurant- and
    item-level reviews) and an **Analytics** panel (views, popular items, rating
    breakdown).
  - **None →** an empty state prompting **Create restaurant & first menu**.
- The **Menu Builder** now edits one *stored* menu (loaded from `store.ts` by
  `{ restaurantId, menuId }`); **Publish** writes the restaurant metadata/discount
  and the menu back to `localStorage`, then returns to the dashboard. "Create new"
  / "Add menu" start a blank restaurant/menu. A bare `?screen=menu-builder`
  (no target) falls back to the dashboard.
- Unauthenticated users hitting favourites or the dashboard are routed to login first.

---

## Smart Location System (discovery only)

Affects **home / listing / filtering only**. The menu builder, designer, and
review system are login-based and unaffected.

### Data model
Each area carries an approximate centre coordinate:

```ts
type Area = { name: string; lat: number; lng: number };
// COUNTRIES → cities → areas (with lat/lng)
```

Countries seeded: 🇵🇰 Pakistan (Lahore / Karachi / Islamabad),
🇦🇪 UAE (Dubai / Abu Dhabi), 🇬🇧 UK (London / Manchester).

### Mapping logic ([`src/lib/data.ts`](src/lib/data.ts))
- `nearestArea(lat, lng)` — haversine-compares a GPS reading against **every**
  predefined area and returns the closest
  `{ countryId, cityId, area, distanceKm }`.
- `locationForArea(area)` — resolves an area name back to its city/country
  (used for map queries).

### A. Auto location (main flow)
1. On **app open**, a `useEffect` requests GPS via `navigator.geolocation`.
2. On success → `nearestArea()` maps the coordinate to the nearest area →
   restaurants in that area are shown automatically.
3. Denied/unavailable → silently keeps the manual default (no forced modal, no crash).
4. The Location Picker also has a **"Use my current location"** button that
   re-runs detection on demand and reports e.g. *"Detected: Clifton · ~3 km away"*.

```
APP OPEN
  └── Ask GPS permission
        ├── YES → detect → map to City + Area → show restaurants automatically
        └── NO  → manual: Country → City → Area → show restaurants
```

### B. Manual selection (fallback)
The Location Picker supports **Country → City → Area**, including an
**"All areas in {city}"** option, with a live map preview of the selection.

### Discovery wiring ([`src/app/page.tsx`](src/app/page.tsx))
- Global location state: `{ countryId, cityId, area }`.
- Home filters to the exact area when set (`r.area === area`), otherwise the
  whole city (`cityAreas.has(r.area)`).
- Heading reads **"Restaurants in {area or city}"**; navbar label shows
  `{Area}, {City}`.
- Empty-area state offers **Clear filters · Change location**.

> **GPS caveat:** browsers grant geolocation only over **HTTPS or localhost**,
> so it works in `npm run dev` and real deployments; a plain-HTTP preview hits
> the manual fallback.

---

## Maps

`MapEmbed` ([`src/app/page.tsx`](src/app/page.tsx)) renders a **Google Maps
embed** via `<iframe>` — no API key required (works while `NEXT_PUBLIC_MAPS_KEY`
is empty). Used in the restaurant **Info tab** and the **Location Picker** preview.

---

## Menu Builder (4 steps)

A full-screen authoring tool with a segmented step control:

1. **Restaurant** — name, **Country → City → Area** cascade, cuisines, phone,
   description, cover image. **Replace cover** opens a hidden `<input type="file">`,
   reads the picked image via `FileReader` → data URL into `meta.coverImage`, and
   persists on save — so it works when both **creating and editing** a restaurant.
2. **Bank Discount** — enable toggle, bank, card type, percent, min spend,
   valid days, expiry — with a **live discount-badge preview**.
3. **Menu Items** — section sidebar with **drag-and-drop reordering** + item
   cards (also drag-to-reorder). Per-section **layout & header**: **1–6 columns**,
   header alignment, uppercase, divider rule, accent colour, **emoji icon**,
   **sub-header/description**, and **section background**. The item editor
   supports add / edit / delete, **multi-select tags**, price, photo,
   availability, and a **Featured highlight** (accent border + tint + badge).
4. **Design** — full element-level customisation (see below) + a live preview rail.

### Full customisation (the `design` model)

Templates are **editable starting points, not fixed looks**. Each menu stores a
`design` override layer (`store.js` → `defaultDesign()` / `normalizeDesign()`)
on top of its template (theme). `resolveDesign(menu)` merges them into concrete
styles consumed by **both** the live preview and the PDF export. Anything left
`null` inherits the template, so **switching templates restyles everything you
haven't explicitly overridden** while preserving your edits.

- **Typography** — per text role (restaurant name, section headers, item names,
  descriptions, prices): font family (`FONT_FAMILIES`), size, colour, bold, italic.
- **Colours & background** — page text colour, page background colour, and
  **gradient presets** (`GRADIENT_PRESETS`).
- **Spacing** — item gap, section gap, page padding (sliders).

**Preview / export / share** (top bar + dashboard menu cards):
- **Preview** — live themed render honouring the full design model, with a
  **Desktop / Mobile / Print** view toggle (Mobile forces single-column to match
  the ≤560px public collapse; Print opens the export).
- **Export** — a self-contained printable HTML page (Print → Save as PDF) that
  mirrors typography, colours, backgrounds, columns, photos, tags, and spacing.
- **Share** — a `ShareModal` with a **scannable QR code** and a **shareable
  link**. The full menu snapshot (incl. `design`) is encoded into the URL hash
  (`#menu=…`), so the link works on **any device with no backend**. Opening such
  a link renders a full-screen read-only **public menu view** (`PublicMenuScreen`).
  Very large menus make a dense QR — the copyable link always works.

> Per-menu `design` and per-section `columns`/`header`/`subhead`/`icon`/`bg`
> + per-item `featured` live on stored menus; `normalizeDesign()`/
> `normalizeSection()` in `store.js` backfill them so older saved menus keep
> rendering. The QR image is fetched from `api.qrserver.com` (only the share
> URL is sent).

---

## Responsiveness

Mobile-first overrides in [`src/app/globals.css`](src/app/globals.css) at the
1024 / 768 / 640px breakpoints:

- Card grids collapse 3 → 2 → 1 columns; typography scales down.
- Navbar hides desktop links + location chip; wrappers (`.dm-wrap`) tighten padding.
- Two-column blocks (discount spotlight, reviews, info, **auth modal**) stack.
- The Menu Builder reflows from sidebar + main to a vertical stack; the floating
  CTA shrinks.

---

## Running

```bash
npm run dev     # http://localhost:3000  (GPS works on localhost)
npm run build   # production build
npm run lint
```
