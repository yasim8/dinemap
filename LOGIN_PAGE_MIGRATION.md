# Login Modal → Dedicated Login Page Migration

## Goal

Replace the in-page login/signup **modal** with a dedicated full-page **`/login`
route** that has a proper URL (bookmarkable, shareable, browser-back friendly),
and redirect users back to where they were after a successful login.

## Behaviour change

| | Before | After |
|---|---|---|
| Trigger | Opens `AuthScreen` modal overlay on the current page | Navigates to `/login` route |
| URL | Unchanged (`/`) | `/login?mode=login&redirect=<path>` |
| After login | Sets in-memory flag, jumps to a screen | Persists auth, `router.replace` back to `redirect` (or `/`) |
| Auth state | `useState(false)` (lost on reload/navigation) | localStorage-backed, survives navigation |

## New files

- **`src/app/login/page.tsx`** — full-page `/login` route. Brand panel + form
  with the Sign up / Log in toggle, social login, and a **Forgot password?**
  link. Reads `?mode=` (which tab) and `?redirect=` (where to go after auth),
  then `router.replace`s back. The redirect target is validated to be a
  same-origin path (`startsWith("/")`) to avoid open-redirects.
- **`src/app/forgot-password/page.tsx`** — minimal reset-request page so the
  Forgot password link resolves.
- **`src/lib/auth.ts`** — localStorage-backed auth flag + reactive `useAuthed()`
  hook. This is the key piece: a full-page navigation to `/login` unmounts the
  SPA, so an in-memory flag wouldn't survive the trip back. Persisting it lets
  the home page render signed-in after the redirect.

## Edited

**`src/app/page.tsx`**
- Deleted the `AuthScreen` modal component and the `"auth"` screen branch.
- Removed `"auth"` from the `Screen` type.
- All triggers now navigate to the route via `useRouter`:
  - navbar "Sign in" → `/login`
  - favourites gate (toggling a favourite while logged out) → `/login`
  - Menu Builder FAB → `/login?redirect=/?screen=menu-builder`
- On return, an effect reads `?screen=` so restaurant owners land on the menu
  builder, then cleans the URL via `history.replaceState`.

**`src/app/globals.css`**
- Added full-page auth responsive rules: single column on mobile, surface the
  in-form logo (reuses the existing rule that hides the brand panel ≤768px).

## Post-login redirect behaviour

- Navbar "Sign in" → lands on the menu builder via `?screen=menu-builder`
  (the logged-in "next page", matching the original modal behaviour).
- Menu Builder CTA → returns straight to the menu builder via `?screen=`.
- Favourites gate (tapping a heart while logged out) → returns to `/` so the
  user can re-tap.

## Navbar auth state

- When logged in, the navbar shows an avatar + **Sign out** instead of
  "Sign in", so a successful login is visibly reflected.
- **Sign out** clears the persisted auth flag and favourites and returns home.

## Known limitations (unchanged from before)

- Form inputs are uncontrolled and submit does not hit a backend (none exists
  yet); success just sets the auth flag.
- Google / Forgot-password flows are UI placeholders.
- Inner SPA screens (a specific restaurant, search results) are not real URLs,
  so "return to the exact previous screen" isn't possible for those — login
  returns the user to home. Making those bookmarkable would require routing the
  whole SPA, a larger change.

## Verification

- `npx tsc --noEmit` — clean.
- `npx next build` — clean; routes `/`, `/login`, `/forgot-password` prerendered
  as static.
- Not yet exercised in a browser (dev server).
