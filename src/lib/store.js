"use client";
import { useEffect, useState } from "react";
import { RESTAURANTS, MENU, REVIEWS } from "@/lib/data";

// ─── Owner data store ─────────────────────────────────────────────────────────
// There's no backend yet, so a restaurant owner's data (restaurants → menus →
// sections → items, plus reviews) lives in localStorage. This is what makes the
// post-login flow work: after signing in we can detect whether the user already
// owns a restaurant, list their existing menus, and let them edit instead of
// being forced to start from scratch every time.
//
// Mirrors the pattern in `auth.js`: a custom event keeps every mounted hook in
// the same tab in sync (localStorage's native "storage" event only fires in
// *other* tabs), and reads are SSR-safe.

const KEY = "dinemap.owner";
const SEED_KEY = "dinemap.owner.seeded";
const EVENT = "dinemap:owner-change";

// ── ID helper ──
let counter = 0;
function uid(prefix) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

// ── Raw read / write ──
function readAll() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore storage failures (private mode, quota, etc.) */
  }
  window.dispatchEvent(new Event(EVENT));
}

// ── Defaults ──
export const DEFAULT_THEME = "modern";

// Per-section header styling + layout. `accent`/`bg` null means "inherit from
// the theme" (accent colour) / "transparent". Kept small but expressive enough
// to cover the spec's font/colour/background/border/alignment header controls.
export function defaultHeader() {
  return { align: "left", uppercase: true, divider: true, accent: null, bg: null };
}

export function blankSection(name = "New Section") {
  return { id: uid("sec"), name, subhead: "", icon: "", columns: 1, bg: null, header: defaultHeader(), items: [] };
}

// Backfill layout/header fields on a section loaded from an older stored menu so
// the builder and preview can rely on them existing.
export function normalizeSection(sec) {
  return {
    ...sec,
    subhead: sec.subhead ?? "",
    icon: sec.icon ?? "",
    columns: Math.min(6, Math.max(1, sec.columns ?? 1)),
    bg: sec.bg ?? null,
    header: { ...defaultHeader(), ...(sec.header ?? {}) },
    items: (sec.items ?? []).map(it => ({ featured: false, ...it })),
  };
}

export function blankItem() {
  return { id: uid("item"), name: "", description: "", price: 0, image: null, available: true, featured: false, tags: [], reviews: [] };
}

// ── Element-level design system ──
// A menu carries a `design` override layer on top of its template (theme). Every
// `color`/`bg`/`bgGradient`/`text` left null inherits the template, so switching
// templates restyles everything the user hasn't explicitly overridden while
// preserving their edits. Font ids resolve via `fontCss()` ("theme" = inherit).
function role(size, bold) {
  return { font: "theme", size, color: null, bold, italic: false };
}

export function defaultDesign() {
  return {
    page: { bg: null, bgGradient: "none", text: null },
    type: {
      title: role(30, true),
      sectionHeader: role(18, true),
      itemName: role(15, true),
      itemDesc: role(13, false),
      price: role(15, true),
    },
    spacing: { itemGap: 12, sectionGap: 30, padding: 32 },
  };
}

// Deep-merge a stored (possibly partial / legacy-absent) design over the
// defaults so the resolver can read concrete values everywhere.
export function normalizeDesign(design) {
  const d = defaultDesign();
  if (!design) return d;
  const type = {};
  for (const k of Object.keys(d.type)) type[k] = { ...d.type[k], ...(design.type?.[k] ?? {}) };
  return {
    page: { ...d.page, ...(design.page ?? {}) },
    type,
    spacing: { ...d.spacing, ...(design.spacing ?? {}) },
  };
}

export function blankMenu(name = "Main Menu") {
  return {
    id: uid("menu"),
    name,
    themeId: DEFAULT_THEME,
    design: defaultDesign(),
    sections: [{ ...blankSection("Starters") }],
    views: 0,
    updatedAt: Date.now(),
  };
}

export function blankRestaurant() {
  return {
    id: uid("rest"),
    name: "",
    countryId: "pk",
    cityId: "lahore",
    area: "Gulberg III",
    cuisine: "",
    phone: "",
    description: "",
    coverImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    discount: null,
    reviews: [],
    menus: [blankMenu()],
  };
}

// ── Queries ──
export function listRestaurants() {
  return readAll();
}

export function getRestaurant(id) {
  return readAll().find(r => r.id === id);
}

export function getMenu(restaurantId, menuId) {
  return getRestaurant(restaurantId)?.menus.find(m => m.id === menuId);
}

// ── Mutations ──
export function upsertRestaurant(restaurant) {
  const list = readAll();
  const i = list.findIndex(r => r.id === restaurant.id);
  if (i >= 0) list[i] = restaurant;
  else list.push(restaurant);
  writeAll(list);
}

export function deleteRestaurant(id) {
  writeAll(readAll().filter(r => r.id !== id));
}

// Create a new restaurant (with one blank menu) and persist it; returns it so
// the caller can open the builder on it immediately.
export function createRestaurant(partial) {
  const r = { ...blankRestaurant(), ...partial };
  upsertRestaurant(r);
  return r;
}

// Upsert a single menu inside a restaurant, stamping updatedAt.
export function saveMenu(restaurantId, menu) {
  const list = readAll();
  const r = list.find(x => x.id === restaurantId);
  if (!r) return;
  const stamped = { ...menu, updatedAt: Date.now() };
  const i = r.menus.findIndex(m => m.id === menu.id);
  if (i >= 0) r.menus[i] = stamped;
  else r.menus.push(stamped);
  writeAll(list);
}

export function addMenu(restaurantId, name = "New Menu") {
  const menu = blankMenu(name);
  saveMenu(restaurantId, menu);
  return menu;
}

export function deleteMenu(restaurantId, menuId) {
  const list = readAll();
  const r = list.find(x => x.id === restaurantId);
  if (!r) return;
  r.menus = r.menus.filter(m => m.id !== menuId);
  writeAll(list);
}

export function duplicateMenu(restaurantId, menuId) {
  const list = readAll();
  const r = list.find(x => x.id === restaurantId);
  const src = r?.menus.find(m => m.id === menuId);
  if (!r || !src) return undefined;
  // Deep clone with fresh IDs so the copy is fully independent.
  const copy = {
    ...src,
    id: uid("menu"),
    name: `${src.name} (copy)`,
    updatedAt: Date.now(),
    views: 0,
    sections: src.sections.map(s => ({
      ...s,
      id: uid("sec"),
      items: s.items.map(it => ({ ...it, id: uid("item"), reviews: [] })),
    })),
  };
  r.menus.push(copy);
  writeAll(list);
  return copy;
}

// Reply to (or update the reply on) a restaurant-level review.
export function replyToReview(restaurantId, reviewId, reply) {
  const list = readAll();
  const r = list.find(x => x.id === restaurantId);
  const rv = r?.reviews.find(v => v.id === reviewId);
  if (!rv) return;
  rv.reply = reply.trim() || null;
  writeAll(list);
}

// Reply to an item-level review.
export function replyToItemReview(restaurantId, menuId, itemId, reviewId, reply) {
  const list = readAll();
  const r = list.find(x => x.id === restaurantId);
  const menu = r?.menus.find(m => m.id === menuId);
  if (!menu) return;
  for (const sec of menu.sections) {
    const it = sec.items.find(i => i.id === itemId);
    const rv = it?.reviews.find(v => v.id === reviewId);
    if (rv) {
      rv.reply = reply.trim() || null;
      writeAll(list);
      return;
    }
  }
}

// ── One-time seed ──
// On a user's first login we seed one demo restaurant ("Salt Restaurant") with a
// full menu and reviews, so the dashboard immediately demonstrates the
// view/edit-existing-menus flow rather than looking empty. Guarded so we never
// re-seed after the user has started managing their own data.
export function seedIfEmpty() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_KEY) === "1") return;
  window.localStorage.setItem(SEED_KEY, "1");
  if (readAll().length > 0) return;

  const src = RESTAURANTS.find(r => r.slug === "salt-restaurant") ?? RESTAURANTS[1];

  // A couple of item-level reviews seeded onto the signature dish for analytics.
  const itemReviews = {
    5: [
      { id: uid("ir"), name: "Bilal Khan", avatar: null, rating: 5, date: "3 days ago", text: "The Mutton Karahi is the best in town — perfectly spiced.", photos: [], reply: null },
      { id: uid("ir"), name: "Sana Tariq", avatar: null, rating: 4, date: "1 week ago", text: "Generous portion, great flavour. A little oily for me.", photos: [], reply: null },
    ],
    6: [
      { id: uid("ir"), name: "Omar Farooq", avatar: null, rating: 5, date: "5 days ago", text: "Butter Chicken was creamy and rich. Loved it.", photos: [], reply: null },
    ],
  };
  // Seeded popularity (menu item view counts) drives the analytics panel.
  const itemViews = { 5: 1240, 6: 980, 2: 760, 11: 540, 4: 430 };

  const sectionIcons = ["🥗", "🍛", "🫓", "🥤", "🍮"];
  const sections = MENU.map((cat, ci) => ({
    id: uid("sec"),
    name: cat.name,
    icon: sectionIcons[ci] ?? "",
    subhead: ci === 1 ? "Slow-cooked, served with fresh naan" : "",
    bg: null,
    // Showcase the layout system in the demo: a couple of compact 2-column
    // sections among the classic single-column ones.
    columns: ci === 0 || ci === 3 ? 2 : 1,
    header: defaultHeader(),
    items: cat.items.map(it => ({
      id: uid("item"),
      name: it.name,
      description: it.description,
      price: it.price,
      image: it.image,
      available: it.available,
      // Spotlight the signature dish to demo the "featured" highlight.
      featured: it.id === 5,
      tags: [
        ...(it.vegetarian ? ["veg"] : []),
        ...(it.spicy ? ["spicy"] : []),
      ],
      reviews: itemReviews[it.id] ?? [],
      // stash a seeded view count on the item for analytics
      ...(itemViews[it.id] ? { views: itemViews[it.id] } : {}),
    })),
  }));

  const reviews = REVIEWS.map(rv => ({
    id: uid("rv"),
    name: rv.name,
    avatar: rv.avatar,
    rating: rv.rating,
    date: rv.date,
    text: rv.text,
    photos: rv.photos,
    reply: rv.reply,
  }));

  const restaurant = {
    id: uid("rest"),
    name: src.name,
    countryId: "pk",
    cityId: "lahore",
    area: src.area,
    cuisine: src.cuisines.join(", "),
    phone: src.phone,
    description: src.description,
    coverImage: src.image,
    discount: src.discount
      ? {
          enabled: true,
          bankId: src.discount.bankId,
          cardType: src.discount.cardType,
          percent: src.discount.percent,
          minSpend: src.discount.minSpend ?? 0,
          days: src.discount.days,
          expires: src.discount.expires,
        }
      : null,
    reviews,
    menus: [
      { id: uid("menu"), name: "Main Menu", themeId: "modern", design: defaultDesign(), sections, views: 3420, updatedAt: Date.now() },
    ],
  };

  writeAll([restaurant]);
}

// ── Reactive hook ──
// Initialises empty for a stable server/first-client render, then syncs from
// localStorage after mount and on every change event (this tab) or storage
// event (other tabs).
export function useOwnerData() {
  const [data, setData] = useState([]);
  useEffect(() => {
    const sync = () => setData(readAll());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return data;
}
