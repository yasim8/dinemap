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
- **Menu Builder** — full SaaS tool: sidebar categories, item grid, availability toggles, item editor modal

### Design System
All tokens are in `src/app/globals.css` — colors, typography, spacing, shadows, radii, animations. Zero Tailwind used — pure CSS custom properties exactly matching the DineMap brand.

### Stack
- **Next.js 16** (App Router)
- **TypeScript**
- **Lucide React** icons
- No UI library — pure custom CSS design system

### Next Steps (to connect backend)
1. Replace `src/lib/data.ts` mock data with API calls
2. Add `src/lib/api.ts` with Axios instance pointing to your NestJS backend
3. Add NextAuth.js for real Google OAuth
4. Create dynamic routes: `/restaurant/[slug]/page.tsx`

### Project Structure (per PRD spec)
```
src/
  app/
    page.tsx          ← All screens (SPA for prototyping)
    globals.css       ← Full DineMap design system
    layout.tsx
  components/
    ui/index.tsx      ← Shared primitives (Button, Badge, Rating, etc.)
    restaurant/
      RestaurantCard.tsx
  lib/
    data.ts           ← Mock data (replace with API calls)
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
