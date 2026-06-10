# DineMap — Restaurant Discovery & Menu Builder

Lahore's food guide. Full design system with all screens clickable.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## What's Inside

### Screens (all clickable, fully designed)
- **Home** — hero, cuisine pills, bank discount spotlight, restaurant grid with filters
- **Search** — live filter chips, result count, Open Now / Has Discount toggles  
- **Restaurant Detail** — hero with back button, Menu / Reviews / Info tabs, discount box, item modal
- **Bank Discounts** — bank selector cards, card type filter, results grid
- **Auth** — sign up / log in modal with Google option
- **Menu Builder** — the core feature: a fully customizable, design-tool-style menu builder (see below)

### Menu Builder (core feature)

A 4-step authoring tool (**Restaurant · Bank Discount · Menu Items · Design**) giving
owners total creative control — templates are starting points, not restrictions:

- **Layout** — 1–6 columns per section (mix layouts on one page), adjustable item/
  section/page spacing, drag-and-drop reordering of sections and items.
- **Typography** — per text role (restaurant name, section headers, item names,
  descriptions, prices): font family, size, colour, bold, italic.
- **Colours & backgrounds** — page text/background colour, gradient presets,
  per-section backgrounds, per-item "Featured" highlight.
- **Headers** — alignment, UPPERCASE, divider rule, accent colour, emoji icon,
  sub-header/description.
- **Items** — name, description, price, image, multi-select tags, availability.
- **Templates** — Modern / Minimalist / Elegant / Rustic / Luxury / Vintage; fully
  editable and switchable anytime (your edits are preserved).
- **Preview / Export / Share** — live Desktop/Mobile/Print preview, print-ready PDF,
  and a shareable link + QR code that work cross-device with no backend.

Each menu stores a `design` override layer on top of its template; one
`resolveDesign()` resolver feeds both the live preview and the PDF export so they
stay identical. **Full details:** [`MENU_BUILDER.md`](MENU_BUILDER.md).

### Design System
All tokens are in `src/app/globals.css` — colors, typography, spacing, shadows, radii, animations. Zero Tailwind used — pure CSS custom properties exactly matching the DineMap brand.

### Stack
- **Next.js 16** (App Router, customized — read `node_modules/next/dist/docs/` before touching routing)
- **Plain JavaScript** (`.jsx`; `@/` alias in `jsconfig.json`)
- **Lucide React** icons
- No UI library — pure custom CSS design system
- No backend — owner data persists to `localStorage` ([`src/lib/store.js`](src/lib/store.js))

### Next Steps (to connect a backend)
1. Replace the `localStorage` layer in `src/lib/store.js` (and mock data in `src/lib/data.js`) with API calls
2. Add `src/lib/api.js` with an HTTP client pointing to your backend
3. Add NextAuth.js for real Google OAuth (replacing the `dinemap.authed` flag in `src/lib/auth.js`)
4. Move shareable menus server-side so links/QRs don't have to embed the menu in the URL

### Project Structure
```
src/
  app/
    page.jsx          ← All screens (SPA state machine) + Menu Builder
    globals.css       ← Full DineMap design system
    layout.jsx
    login/, forgot-password/   ← the only real routes
  components/
    ui/index.jsx      ← Shared primitives (Button, Badge, Rating, etc.)
    restaurant/
      RestaurantCard.jsx
  lib/
    data.js           ← Browse-side mock data + templates/fonts/gradients
    store.js          ← Owner data (restaurants → menus → sections → items) in localStorage
    auth.js           ← Auth flag + useAuthed()
```

### Environment Variables (for Phase 2)
Copy `.env.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MAPS_KEY=your_google_maps_key
NEXTAUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```
# dinemap
