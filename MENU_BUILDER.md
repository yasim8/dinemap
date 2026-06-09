# Menu Builder — DineMap's Core Feature

The Menu Builder is the heart of DineMap: a **fully customizable, graphic-design-style
tool** that lets logged-in restaurant owners design menus exactly how they want —
not just pick a template, but control layout, columns, typography, colours,
backgrounds, headers, spacing, and per-item styling. Menus are digital-ready and
print-ready, shareable via link or QR, and integrate customer reviews per item.

> **Guiding principle:** users have **total creative freedom**. Templates are
> *starting points, not restrictions* — every element is individually editable,
> and switching templates re-styles only what you haven't overridden.

---

## Where it lives

| Concern | File |
| --- | --- |
| Builder UI, preview, export, share, public view | [`src/app/page.jsx`](src/app/page.jsx) |
| Stored data model + CRUD (no backend; localStorage) | [`src/lib/store.js`](src/lib/store.js) |
| Templates, fonts, gradients, tags, banks | [`src/lib/data.js`](src/lib/data.js) |
| Shared UI primitives | [`src/components/ui/index.jsx`](src/components/ui/index.jsx) |
| Design tokens + responsive CSS | [`src/app/globals.css`](src/app/globals.css) |

There is **no backend** — an owner's restaurants → menus → sections → items (plus
reviews and the full design) persist to `localStorage` and stay in sync across
mounted hooks via a custom event (`useOwnerData()`).

---

## The 4 builder steps

A full-screen authoring tool with a segmented step control:

1. **Restaurant** — name, **Country → City → Area** cascade, cuisines, phone,
   description, and a cover image (file upload → data URL).
2. **Bank Discount** — enable toggle, bank, card type, percent, min spend, valid
   days, expiry — with a **live discount-badge preview**.
3. **Menu Items** — section sidebar + item cards, both **drag-and-drop reorderable**
   (native HTML5 DnD, no library). Per-section and per-item customization (below).
4. **Design** — element-level customization of the whole menu, with a **live
   preview rail** alongside the controls.

---

## Full customization

### 1. Layout & columns (per section)
- **1–6 columns per row**, set independently per section.
- Mix layouts on one page — e.g. 2-col Starters, 4-col Quick Bites, 1-col Chef's Special.
- Single-column = classic name-leader-price rows; multi-column = photo-topped cards.
- Adjustable **item gap**, **section gap**, and **page padding** (Design step sliders).
- Drag-and-drop reordering of both sections and items.

### 2. Typography (per text role)
Independent control of **restaurant name, section headers, item names,
descriptions, and prices**:
- Font family (`FONT_FAMILIES`: template default / sans / serif / display / slab / script / mono)
- Font size, text colour, **bold**, *italic*
- Any value left unset inherits the template.

### 3. Colours & backgrounds
- Page **text colour** and page **background colour**.
- **Gradient presets** (`GRADIENT_PRESETS`: sunset / gold / ink / cream / forest).
- Per-**section background** colour.
- Per-**item** highlight (`featured`): accent border + tint + "Featured" badge.
- Header **accent colour** per section; tag chips tint to the accent.

### 4. Section headers
- Custom header text + alignment (left/center), UPPERCASE toggle, divider rule.
- **Emoji icon** beside the header.
- **Sub-header / description** line under the header.
- Header background colour.

### 5. Items
- Name, description, price, image, **multi-select tags** (Vegetarian, Vegan,
  Spicy, Halal, Gluten-Free, Chef's Special, Bestseller, New).
- Availability toggle + **Featured** highlight.

### 6. Templates (starting points)
6 templates in `MENU_THEMES`: **Modern, Minimalist, Elegant, Rustic, Luxury,
Vintage**. Fully editable; switchable at any time without losing your edits.

---

## How customization is modelled (architecture)

Each menu stores a **`design` override layer** on top of its template:

- `store.js` → `defaultDesign()` builds the layer; `normalizeDesign()` deep-merges
  a stored (possibly legacy/partial) design over the defaults.
- `page.jsx` → **`resolveDesign(menu)`** merges template (theme) + overrides into
  concrete style objects.
- The **same resolver feeds both** `MenuPreview` (in-app) and `buildPrintableHtml`
  (PDF/print) — so the preview and the exported PDF are always identical.
- Fields left `null` inherit the template, so **switching templates restyles
  everything you haven't explicitly overridden**, preserving your edits.

`normalizeDesign()` / `normalizeSection()` backfill older saved menus, so menus
created before these fields existed keep rendering.

---

## Preview, export & share

- **Preview** — live render honouring the full design model, with a
  **Desktop / Mobile / Print** view toggle. Mobile forces single-column (matching
  the ≤560px public collapse, since a narrow modal in a wide window can't trigger
  viewport media queries); Print opens the export.
- **Export** — a self-contained printable HTML page (Print → Save as PDF) that
  mirrors typography, colours, backgrounds, columns, photos, tags, and spacing.
- **Share** — a **shareable link** + **scannable QR code**. The full menu snapshot
  (including `design`) is base64url-encoded into the URL hash (`#menu=…`), so the
  link **works on any device with no backend**. Opening such a link renders a
  full-screen read-only **public menu view** (`PublicMenuScreen`), bypassing the
  app chrome.
  - QR is an `<img>` from `api.qrserver.com` (only the share URL is sent).
  - Very large menus produce long URLs and a dense QR that may be hard to scan —
    the copyable link always works.

---

## Reviews & comments integration

Item-level and restaurant-level reviews persist with the menu. From the
**Dashboard → Reviews & Comments** tab, owners read feedback and reply to both
restaurant- and item-level reviews, then adjust the menu in the builder.

---

## Known limitations (no backend)

- **Background images** (vs. colour/gradient) and **per-item independent fonts**
  are not implemented; gradients cover the richer-background case.
- Letter-spacing / line-height micro-controls aren't exposed (family/size/colour/
  bold/italic are).
- Share links embed the menu in the URL, so the QR can get dense for very large
  menus; the link remains the reliable share path.

---

## Running

```bash
npm run dev     # http://localhost:3000
npm run build   # production build (also runs lint — unused vars/imports fail it)
```

> This project uses a customized Next.js (`16.2.7`). Read the relevant guide in
> `node_modules/next/dist/docs/` before changing app/routing code.
