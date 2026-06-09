"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthed, setAuthed } from "@/lib/auth";
import {
  useOwnerData, seedIfEmpty, getRestaurant, upsertRestaurant, saveMenu,
  createRestaurant, addMenu, deleteMenu, duplicateMenu,
  replyToReview, replyToItemReview, blankSection, normalizeSection, defaultHeader,
  defaultDesign, normalizeDesign,
} from "@/lib/store";
import { CATEGORIES, BANKS, RESTAURANTS, MENU, REVIEWS, RATING_DISTRIBUTION, COUNTRIES, ITEM_TAGS, MENU_THEMES, CARD_TYPES, FONT_FAMILIES, GRADIENT_PRESETS, fontCss, gradientCss, locationForArea, nearestArea } from "@/lib/data";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import {
  Logo, Rating, PriceRange, Tag, Badge, Avatar, IconBtn, Btn, Pill,
  SearchInput, Switch, Input, rupee, formatDistance,
  Search, MapPin, Heart, Star, ChevronDown, ChevronLeft, ChevronRight,
  ArrowRight, Share2, X, Plus, Percent, Phone, Clock, Bookmark,
  Flame, CreditCard, User, Eye, Pencil, Trash2, Camera, GripVertical, Check,
  LayoutGrid, BarChart3, MessageSquare, Download, Copy, TrendingUp, Reply, Store,
  ExternalLink, Palette
} from "@/components/ui";

// Wrap the browser geolocation API in a promise
function getGeoPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

// ─── Map embed (Google Maps, no API key needed) ──────────────────────────────
function MapEmbed({ query, height = 200 }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;
  return (
    <iframe
      title={`Map of ${query}`}
      src={src}
      width="100%"
      height={height}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      style={{ border: 0, borderRadius: "var(--radius-lg)", display: "block" }}
    />
  );
}

// ─── Location Picker (auto GPS + manual fallback) ─────────────────────────────
function LocationPicker({ initial, onClose, onConfirm }) {
  const [countryId, setCountryId] = useState(initial.countryId);
  const [cityId, setCityId] = useState(initial.cityId);
  const [area, setArea] = useState(initial.area);
  const [detecting, setDetecting] = useState(false);
  const [geoErr, setGeoErr] = useState(null);
  const [detected, setDetected] = useState(null);

  const country = COUNTRIES.find(c => c.id === countryId) ?? COUNTRIES[0];
  const city = country.cities.find(c => c.id === cityId) ?? country.cities[0];
  const pickCountry = (id) => { const c = COUNTRIES.find(x => x.id === id) ?? COUNTRIES[0]; setCountryId(id); setCityId(c.cities[0].id); setArea(null); setDetected(null); };
  const pickCity = (id) => { setCityId(id); setArea(null); setDetected(null); };

  const detect = () => {
    setDetecting(true); setGeoErr(null); setDetected(null);
    getGeoPosition()
      .then(({ lat, lng }) => {
        const m = nearestArea(lat, lng);
        setCountryId(m.countryId); setCityId(m.cityId); setArea(m.area);
        setDetected(`${m.area} · ~${m.distanceKm < 1 ? "<1" : Math.round(m.distanceKm)} km away`);
        setDetecting(false);
      })
      .catch((err) => {
        setGeoErr(err && err.code === 1 ? "Location permission denied — pick a city & area below." : "Couldn't detect your location — pick a city & area below.");
        setDetecting(false);
      });
  };

  const mapQuery = area ? `${area}, ${city.name}, ${country.name}` : `${city.name}, ${country.name}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(10,15,30,0.55)", backdropFilter: "blur(4px)" }} />
      <div className="dm-card dm-modal-pop" style={{ position: "relative", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-modal)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--divider)" }}>
          <div>
            <h3 className="dm-h3" style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={20} color="var(--brand)" /> Choose your location</h3>
            <p className="dm-small" style={{ marginTop: 4 }}>We'll show restaurants and deals near you.</p>
          </div>
          <IconBtn onClick={onClose}><X size={20} /></IconBtn>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Auto-detect */}
          <button onClick={detect} disabled={detecting} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: "var(--radius-md)", border: "2px solid var(--brand)", background: "var(--surface-tint)", cursor: detecting ? "wait" : "pointer" }}>
            <span style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--brand)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MapPin size={18} color="#fff" /></span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--brand)" }}>{detecting ? "Detecting your location…" : "Use my current location"}</span>
              <span className="dm-small" style={{ display: "block" }}>{detected ? `Detected: ${detected}` : "Auto-map GPS to the nearest area"}</span>
            </span>
            {!detecting && <ArrowRight size={18} color="var(--brand)" />}
          </button>
          {geoErr && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "rgba(239,68,68,0.08)", color: "var(--red-500)", fontSize: 13, fontFamily: "var(--font-body)" }}>{geoErr}</div>}

          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-secondary)", fontSize: 13 }}>
            <div style={{ flex: 1, height: 1, background: "var(--divider)" }} /> or choose manually <div style={{ flex: 1, height: 1, background: "var(--divider)" }} />
          </div>

          <label className="dm-field">
            <span className="dm-field__label">Country</span>
            <select className="dm-input" value={countryId} onChange={e => pickCountry(e.target.value)}>
              {COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
            </select>
          </label>
          <div>
            <span className="dm-field__label" style={{ display: "block", marginBottom: 10 }}>City</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {country.cities.map(c => (
                <Pill key={c.id} active={cityId === c.id} onClick={() => pickCity(c.id)} style={{ height: 38 }}>{c.name}</Pill>
              ))}
            </div>
          </div>
          <label className="dm-field">
            <span className="dm-field__label">Area</span>
            <select className="dm-input" value={area ?? ""} onChange={e => setArea(e.target.value || null)}>
              <option value="">All areas in {city.name}</option>
              {city.areas.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
            </select>
          </label>
          <div>
            <span className="dm-label" style={{ display: "block", marginBottom: 10 }}>Preview</span>
            <MapEmbed query={mapQuery} height={200} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "18px 24px", borderTop: "1px solid var(--divider)" }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => onConfirm({ countryId, cityId, area })} icon={<MapPin size={16} />}>Show restaurants</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ─────────────────────────────────────────────────────────────────
function Navbar({ active, onNav, onSignIn, onSignOut, onDashboard, authed, locationLabel, onPickLocation }) {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="dm-wrap dm-nav-inner" style={{ maxWidth: 1280, margin: "0 auto", height: 72, padding: "0 32px", display: "flex", alignItems: "center", gap: 32 }}>
        <button onClick={() => onNav("home")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <Logo />
        </button>
        <nav className="dm-navlinks" style={{ display: "flex", gap: 4 }}>
          {[ ["home","Discover"], ["search","Search"], ["discounts","Bank Discounts"] ].map(([id, label]) => (
            <button key={id} onClick={() => onNav(id)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "0 16px", height: 72,
              fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15,
              color: active === id ? "var(--brand)" : "var(--text-primary)",
              borderBottom: active === id ? "2px solid var(--brand)" : "2px solid transparent",
              transition: "color 0.2s",
            }}>{label}</button>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <button onClick={onPickLocation} className="dm-hide-mobile" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 14px", borderRadius: "var(--radius-pill)", border: "1px solid var(--border)", background: "var(--white)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-primary)" }}>
          <MapPin size={15} color="var(--brand)" /> {locationLabel} <ChevronDown size={15} color="var(--text-secondary)" />
        </button>
        {authed ? (
          <>
            <Btn variant={active === "dashboard" ? "primary" : "ghost"} onClick={onDashboard} icon={<LayoutGrid size={16} />} className="dm-hide-mobile">Dashboard</Btn>
            <button onClick={onDashboard} title="Restaurant dashboard" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><Avatar name="You" size={36} /></button>
            <Btn variant="ghost" onClick={onSignOut}>Sign out</Btn>
          </>
        ) : (
          <Btn variant="ghost" onClick={onSignIn} icon={<User size={17} />}>Sign in</Btn>
        )}
        <IconBtn variant="solid"><Bookmark size={18} /></IconBtn>
      </div>
    </header>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────
function HomeScreen({ onOpenRestaurant, onSearch, onDiscounts, favourites, onToggleFav, locationLabel, cityName, area, cityAreas, onPickLocation }) {
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("nearest");
  const [openNow, setOpenNow] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(false);
  const placeName = area ?? cityName;

  let list = RESTAURANTS.slice();
  if (area) list = list.filter(r => r.area === area);
  else if (cityAreas) list = list.filter(r => cityAreas.has(r.area));
  if (openNow) list = list.filter(r => r.open);
  if (hasDiscount) list = list.filter(r => r.discount);
  if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
  else if (sort === "reviews") list.sort((a, b) => b.reviewCount - a.reviewCount);
  else list.sort((a, b) => a.distanceMeters - b.distanceMeters);

  return (
    <div className="page-enter">
      {/* Hero */}
      <section style={{ position: "relative", background: "var(--surface-dark)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=80)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.5 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,15,30,0.72) 0%, rgba(10,15,30,0.86) 55%, #0A0F1E 100%)" }} />
        <div className="dm-wrap dm-hero" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "96px 32px 88px", textAlign: "center" }}>
          <span className="dm-badge dm-badge--discount" style={{ marginBottom: 24, display: "inline-flex" }}>🍽️ Lahore's Food Guide</span>
          <h1 className="dm-display" style={{ color: "var(--white)", margin: "0 auto 20px", maxWidth: 820 }}>
            Find your next<br /><span className="dm-brush" style={{ color: "var(--white)" }}>favourite</span> restaurant
          </h1>
          <p className="dm-body-lg" style={{ color: "var(--text-on-dark)", opacity: 0.65, maxWidth: 560, margin: "0 auto 36px", textAlign: "center" }}>
            Browse full menus, discover bank card discounts, and find the best food near you.
          </p>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <SearchInput onSearch={onSearch} />
          </div>
          <button onClick={onPickLocation} style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 16px", borderRadius: "var(--radius-pill)", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "var(--white)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14 }}>
            <MapPin size={15} color="var(--brand)" /> {locationLabel} <ChevronDown size={15} />
          </button>
        </div>
      </section>

      <div className="dm-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 32px 96px", display: "flex", flexDirection: "column", gap: 72 }}>
        {/* Category pills */}
        <div>
          <h2 className="dm-h2" style={{ marginBottom: 20 }}>Browse by cuisine</h2>
          <div className="dm-no-scrollbar" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {CATEGORIES.map(c => <Pill key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Pill>)}
          </div>
        </div>

        {/* Bank discount spotlight */}
        <section style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", background: "var(--grad-navy)" }}>
          <div className="dm-stack-mobile dm-pad-relax" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "center", padding: "48px 48px" }}>
            <div>
              <span className="dm-badge dm-badge--teal" style={{ marginBottom: 16, display: "inline-flex" }}>💳 Bank Offers</span>
              <h2 className="dm-h1" style={{ color: "var(--white)", marginBottom: 12 }}>Save with your bank card</h2>
              <p className="dm-body-lg" style={{ color: "var(--text-on-dark)", opacity: 0.7, marginBottom: 24, maxWidth: 460 }}>
                Exclusive discounts for HBL, Meezan, UBL & MCB cardholders — up to 30% off at hundreds of restaurants across Lahore.
              </p>
              <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
                {BANKS.map(b => (
                  <span key={b.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: "var(--radius-pill)", background: "rgba(255,255,255,0.1)", color: "var(--white)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: b.color }} /> {b.name}
                  </span>
                ))}
              </div>
              <Btn variant="outline-light" onClick={onDiscounts} iconRight={<ArrowRight size={17} />}>View all discount deals</Btn>
            </div>
            <div className="dm-hide-mobile" style={{ position: "relative", height: 280 }}>
              {RESTAURANTS.filter(r => r.discount).slice(0, 3).map((r, i) => {
                const rotations = [-8, 0, 8]; const txs = [-40, 0, 40]; const tys = [20, -10, 20];
                return (
                  <div key={r.id} style={{ position: "absolute", top: "50%", left: "50%", width: 200, transform: `translate(-50%,-50%) translate(${txs[i]}px,${tys[i]}px) rotate(${rotations[i]}deg)`, borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-modal)", zIndex: i === 1 ? 3 : 1, background: "var(--white)" }}>
                    <div style={{ aspectRatio: "4/3", backgroundImage: `url(${r.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                      <div style={{ marginTop: 4 }}><Badge tone="discount">{r.discount?.percent}% Off</Badge></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Restaurant grid */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
            <h2 className="dm-h2" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              Restaurants in {placeName}
              <span style={{ background: "var(--surface-muted)", color: "var(--text-secondary)", fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, padding: "4px 10px", borderRadius: "var(--radius-pill)" }}>{list.length} places</span>
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <select value={sort} onChange={e => setSort(e.target.value)} className="dm-input" style={{ height: 44, paddingRight: 36, width: "auto", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, appearance: "none", cursor: "pointer", paddingLeft: 14 }}>
                  <option value="nearest">Nearest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviewed</option>
                </select>
                <span style={{ position: "absolute", right: 12, top: 13, pointerEvents: "none" }}><ChevronDown size={17} color="var(--text-secondary)" /></span>
              </div>
              <Switch label="Open Now" checked={openNow} onChange={setOpenNow} />
              <Switch label="Has Discount" checked={hasDiscount} onChange={setHasDiscount} />
            </div>
          </div>
          {list.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-secondary)" }}>
              <p className="dm-body-lg" style={{ marginBottom: 8 }}>No restaurants in {placeName} match your filters yet.</p>
              <p className="dm-body">
                <button onClick={() => { setOpenNow(false); setHasDiscount(false); }} style={{ color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear filters</button>
                {" · "}
                <button onClick={onPickLocation} style={{ color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Change location</button>
              </p>
            </div>
          ) : (
            <div className="dm-grid-3">
              {list.map(r => <RestaurantCard key={r.id} r={r} favourite={favourites.has(r.id)} onToggleFav={() => onToggleFav(r.id)} onClick={() => onOpenRestaurant(r)} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Search Screen ────────────────────────────────────────────────────────────
function SearchScreen({ query, onOpenRestaurant, favourites, onToggleFav }) {
  const [q, setQ] = useState(query || "");
  const [filters, setFilters] = useState(["Open Now"]);
  let list = RESTAURANTS.slice();
  if (filters.includes("Open Now")) list = list.filter(r => r.open);
  if (filters.includes("Has Discount")) list = list.filter(r => r.discount);
  if (q) list = list.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || r.cuisines.some(c => c.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="page-enter" style={{ background: "var(--surface-page)", minHeight: "100vh" }}>
      <div style={{ position: "sticky", top: 72, zIndex: 30, background: "var(--surface-page)", paddingTop: 24, paddingBottom: 16, boxShadow: "0 8px 16px -12px rgba(10,15,30,0.15)" }}>
        <div className="dm-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div className="dm-search">
                <Search size={22} className="dm-search__icon" />
                <input className="dm-search__input" placeholder="Search restaurants, dishes, cuisines..." value={q} onChange={e => setQ(e.target.value)} />
                <Btn onClick={() => {}}>Search</Btn>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <span className="dm-small">{list.length} results{q ? ` for "${q}"` : ""}</span>
            {["Open Now", "Has Discount"].map(f => (
              <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 6px 0 14px", borderRadius: "var(--radius-pill)", background: filters.includes(f) ? "var(--surface-tint)" : "var(--white)", border: `1px solid ${filters.includes(f) ? "var(--brand)" : "var(--border)"}`, fontFamily: "var(--font-body)", fontSize: 14, color: filters.includes(f) ? "var(--brand)" : "var(--text-primary)", cursor: "pointer" }} onClick={() => setFilters(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f])}>
                {f}
                {filters.includes(f) && <button onClick={e => { e.stopPropagation(); setFilters(p => p.filter(x => x !== f)); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, border: "none", background: "transparent", cursor: "pointer", color: "var(--brand)", borderRadius: "50%" }}><X size={13} /></button>}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="dm-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 32px 96px" }}>
        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", maxWidth: 460, margin: "0 auto" }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--surface-tint)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <Search size={40} color="var(--brand)" />
            </div>
            <h2 className="dm-h2" style={{ marginBottom: 10 }}>No results found</h2>
            <p className="dm-body-lg" style={{ color: "var(--text-secondary)", margin: "0 0 28px", textAlign: "center" }}>Try a broader search or clear your filters.</p>
            <Btn onClick={() => { setQ(""); setFilters([]); }}>Clear all filters</Btn>
          </div>
        ) : (
          <div className="dm-grid-3">
            {list.map(r => <RestaurantCard key={r.id} r={r} favourite={favourites.has(r.id)} onToggleFav={() => onToggleFav(r.id)} onClick={() => onOpenRestaurant(r)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Restaurant Detail Screen ─────────────────────────────────────────────────
function RestaurantScreen({ r, onBack, favourite, onToggleFav }) {
  const [tab, setTab] = useState("menu");
  const [menuCat, setMenuCat] = useState(MENU[0].id);
  const [openItem, setOpenItem] = useState(null);
  const activeCat = MENU.find(m => m.id === menuCat);

  return (
    <div className="page-enter" style={{ background: "var(--surface-page)", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ position: "relative", height: 380 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${r.image})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "var(--img-warm-overlay)", backgroundBlendMode: "multiply" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,15,30,0.9) 0%, rgba(10,15,30,0.1) 60%)" }} />
        <div style={{ position: "absolute", top: 24, left: 0, right: 0 }}>
          <div className="dm-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "flex", justifyContent: "space-between" }}>
            <IconBtn variant="glass" onClick={onBack}><ChevronLeft size={22} /></IconBtn>
            <div style={{ display: "flex", gap: 10 }}>
              <IconBtn variant="glass"><Share2 size={20} /></IconBtn>
              <IconBtn variant="glass" active={favourite} onClick={onToggleFav}>
                <Heart size={20} fill={favourite ? "var(--brand)" : "none"} color={favourite ? "var(--brand)" : "currentColor"} />
              </IconBtn>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 28, left: 0, right: 0 }}>
          <div className="dm-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
            <h1 className="dm-h1" style={{ color: "var(--white)", marginBottom: 12 }}>{r.name}</h1>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {r.cuisines.map(c => <Tag key={c} glass>{c}</Tag>)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, color: "var(--white)", flexWrap: "wrap" }}>
              <Rating value={r.rating} count={r.reviewCount} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14 }}><MapPin size={15} color="var(--white)" /> {r.area} · {formatDistance(r.distanceMeters)}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14 }}><Phone size={14} color="var(--white)" /> {r.phone}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky tab bar */}
      <div style={{ position: "sticky", top: 72, zIndex: 40, background: "var(--white)", borderBottom: "1px solid var(--divider)" }}>
        <div className="dm-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="dm-tabs" style={{ border: "none" }}>
            {[["menu","Menu"],["info","Info"],["reviews","Reviews"]].map(([id, label]) => (
              <button key={id} className={["dm-tab", tab === id ? "dm-tab--active" : ""].join(" ")} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>
          <div className="dm-hide-mobile" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {r.discount && <Badge tone="discount"><Percent size={11} />{r.discount.percent}% with {r.discount.bank}</Badge>}
            <Btn variant="ghost" disabled>Reserve Table</Btn>
          </div>
        </div>
      </div>

      <div className="dm-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 32px 96px" }}>
        {/* Discount box */}
        {r.discount && (
          <div className="dm-discount-box" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
            <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "var(--shadow-card)" }}>
              <CreditCard size={22} color="var(--brand)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{r.discount.percent}% off with {r.discount.bank} {r.discount.cardType} Card</div>
              <div className="dm-small" style={{ marginTop: 2 }}>{r.discount.minSpend ? `Min spend ₨${r.discount.minSpend.toLocaleString()} · ` : ""}{r.discount.days} · Expires {r.discount.expires}</div>
            </div>
            <span style={{ color: "var(--brand)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4 }}>How to redeem <ArrowRight size={14} color="var(--brand)" /></span>
          </div>
        )}

        {/* Menu tab */}
        {tab === "menu" && (
          <div>
            <div className="dm-no-scrollbar" style={{ display: "flex", gap: 10, overflowX: "auto", marginBottom: 28 }}>
              {MENU.map(m => <Pill key={m.id} active={menuCat === m.id} onClick={() => setMenuCat(m.id)}>{m.name}</Pill>)}
            </div>
            <div className="dm-grid-2">
              {activeCat?.items.map(it => (
                <div key={it.id} className="dm-menu-item" onClick={() => setOpenItem(it)} style={{ opacity: it.available ? 1 : 0.5 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15 }}>{it.name}</div>
                      {it.vegetarian && <span className="dm-diet dm-diet--veg">V</span>}
                      {it.spicy && <span className="dm-diet dm-diet--spicy"><Flame size={12} style={{ display: "block" }} /></span>}
                      {!it.available && <span style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", background: "var(--surface-muted)", padding: "2px 8px", borderRadius: "var(--radius-pill)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Unavailable</span>}
                    </div>
                    <p className="dm-menu-item__desc dm-small" style={{ marginBottom: 10 }}>{it.description}</p>
                    <span className="dm-price">{rupee(it.price)}</span>
                  </div>
                  {it.image
                    ? <div className="dm-menu-item__photo" style={{ backgroundImage: `url(${it.image})` }} />
                    : <div className="dm-menu-item__photo dm-fallback" style={{ fontSize: 28 }}>{it.name[0]}</div>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews tab */}
        {tab === "reviews" && (
          <div className="dm-stack-mobile" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 48 }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 56, letterSpacing: "-2px", lineHeight: 1 }}>{r.rating}</div>
              <div style={{ margin: "8px 0 4px" }}><Rating value={r.rating} showNumber={false} size={18} /></div>
              <div className="dm-small">Based on {r.reviewCount.toLocaleString()} reviews</div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {RATING_DISTRIBUTION.map(d => (
                  <div key={d.stars} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="dm-small" style={{ width: 12 }}>{d.stars}</span>
                    <Star size={13} fill="var(--accent-gold)" color="var(--accent-gold)" />
                    <div style={{ flex: 1, height: 8, borderRadius: 999, background: "var(--surface-muted)", overflow: "hidden" }}>
                      <div style={{ width: `${d.pct}%`, height: "100%", background: "var(--accent-gold)" }} />
                    </div>
                    <span className="dm-small" style={{ width: 32, textAlign: "right" }}>{d.pct}%</span>
                  </div>
                ))}
              </div>
              <Btn variant="secondary" full style={{ marginTop: 24 }}>Write a review</Btn>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {REVIEWS.map(rv => (
                <div key={rv.id} style={{ paddingBottom: 24, borderBottom: "1px solid var(--divider)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <Avatar src={rv.avatar} name={rv.name} size={44} />
                    <div><div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15 }}>{rv.name}</div><div className="dm-small">{rv.date}</div></div>
                    <div style={{ marginLeft: "auto" }}><Rating value={rv.rating} showNumber={false} /></div>
                  </div>
                  <p className="dm-body" style={{ margin: 0 }}>{rv.text}</p>
                  {rv.photos.length > 0 && <div style={{ display: "flex", gap: 8, marginTop: 12 }}>{rv.photos.map((p, i) => <div key={i} style={{ width: 88, height: 88, borderRadius: "var(--radius-md)", backgroundImage: `url(${p})`, backgroundSize: "cover", flexShrink: 0 }} />)}</div>}
                  {rv.reply && (
                    <div style={{ marginTop: 14, marginLeft: 24, padding: 14, background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>🏪 Owner replied</div>
                      <p className="dm-small" style={{ margin: 0, color: "var(--text-primary)" }}>{rv.reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info tab */}
        {tab === "info" && (
          <div className="dm-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, maxWidth: 900 }}>
            <div>
              <h3 className="dm-h3" style={{ marginBottom: 14 }}>Opening hours</h3>
              {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day, i) => (
                <div key={day} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--divider)", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: i === 0 ? 700 : 400 }}>
                  <span style={{ color: i === 0 ? "var(--brand)" : "var(--text-primary)" }}>{day}{i === 0 ? " · Today" : ""}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{i === 5 || i === 6 ? "1:00 PM – 2:00 AM" : "12:00 PM – 1:00 AM"}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="dm-h3" style={{ marginBottom: 14 }}>About</h3>
              <p className="dm-body" style={{ color: "var(--text-secondary)", marginBottom: 20 }}>{r.description}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <MapPin size={18} color="var(--brand)" />
                  <span className="dm-body">{r.area}, Lahore, Pakistan</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Phone size={18} color="var(--brand)" />
                  <span className="dm-body">{r.phone}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Clock size={18} color="var(--brand)" />
                  <span className="dm-body">Open until 1:00 AM</span>
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <MapEmbed query={`${r.name}, ${r.area}, ${locationForArea(r.area).city}, ${locationForArea(r.area).country}`} height={220} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Item modal */}
      {openItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={() => setOpenItem(null)} style={{ position: "absolute", inset: 0, background: "rgba(10,15,30,0.5)" }} />
          <div className="dm-card dm-modal-pop" style={{ position: "relative", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-modal)" }}>
            {openItem.image
              ? <div style={{ height: 200, backgroundImage: `url(${openItem.image})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}><button className="dm-iconbtn dm-iconbtn--glass" style={{ position: "absolute", top: 14, right: 14 }} onClick={() => setOpenItem(null)}><X size={18} /></button></div>
              : <div className="dm-fallback" style={{ height: 160, fontSize: 64, position: "relative" }}>{openItem.name[0]}<button className="dm-iconbtn dm-iconbtn--glass" style={{ position: "absolute", top: 14, right: 14 }} onClick={() => setOpenItem(null)}><X size={18} /></button></div>
            }
            <div style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h2 className="dm-h2" style={{ margin: 0 }}>{openItem.name}</h2>
                    {openItem.vegetarian && <span className="dm-diet dm-diet--veg">V</span>}
                    {openItem.spicy && <span className="dm-diet dm-diet--spicy"><Flame size={13} /></span>}
                  </div>
                  <div style={{ marginTop: 8 }}><Rating value={4.6} count={28} /></div>
                </div>
                <span className="dm-price" style={{ fontSize: 24, whiteSpace: "nowrap" }}>{rupee(openItem.price)}</span>
              </div>
              <p className="dm-body" style={{ color: "var(--text-secondary)", marginTop: 12 }}>{openItem.description}</p>
              {!openItem.available && <div style={{ marginTop: 12, padding: "10px 16px", background: "var(--surface-muted)", borderRadius: "var(--radius-md)", fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>Currently unavailable</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bank Discounts Screen ─────────────────────────────────────────────────────
function DiscountsScreen({ onOpenRestaurant, favourites, onToggleFav }) {
  const [bank, setBank] = useState("hbl");
  const [cardType, setCardType] = useState("all");
  const selectedBank = BANKS.find(b => b.id === bank);
  const results = RESTAURANTS.filter(r => r.discount && r.discount.bankId === bank);

  return (
    <div className="page-enter" style={{ background: "var(--surface-page)", minHeight: "100vh" }}>
      <section className="dm-wrap dm-hero" style={{ background: "var(--grad-navy)", padding: "64px 32px 56px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <span className="dm-badge dm-badge--teal" style={{ display: "inline-flex", marginBottom: 16 }}>💳 Bank Offers</span>
          <h1 className="dm-h1" style={{ color: "var(--white)", marginBottom: 12 }}>Save with your bank card</h1>
          <p className="dm-body-lg" style={{ color: "var(--text-on-dark)", opacity: 0.7, maxWidth: 540, margin: 0 }}>Pick your bank to see every restaurant where your card unlocks a discount — updated daily.</p>
        </div>
      </section>
      <div className="dm-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 32px 96px" }}>
        <h2 className="dm-h3" style={{ marginBottom: 16 }}>Choose your bank</h2>
        <div className="dm-grid-4" style={{ marginBottom: 36 }}>
          {BANKS.map(b => (
            <button key={b.id} onClick={() => setBank(b.id)} style={{ textAlign: "left", cursor: "pointer", padding: 20, borderRadius: "var(--radius-xl)", background: "var(--white)", border: bank === b.id ? "2px solid var(--brand)" : "2px solid transparent", boxShadow: "var(--shadow-card)", backgroundColor: bank === b.id ? "var(--surface-tint)" : "var(--white)", transition: "var(--transition-card)", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", background: b.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>{b.name.slice(0,2)}</div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: bank === b.id ? "var(--brand)" : "var(--text-primary)" }}>{b.name}</div>
                <div className="dm-small" style={{ marginTop: 2 }}>{b.count} restaurants</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <h2 className="dm-h2">{results.length} deals for {selectedBank.name} cardholders</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {[["all","All"],["credit","Credit"],["debit","Debit"]].map(([id,label]) => (
              <Pill key={id} active={cardType === id} onClick={() => setCardType(id)} style={{ height: 38 }}>{label}</Pill>
            ))}
          </div>
        </div>
        {results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 20px", color: "var(--text-secondary)" }}>
            <CreditCard size={40} color="var(--text-secondary)" style={{ margin: "0 auto 16px", display: "block" }} />
            <p className="dm-body-lg" style={{ margin: 0 }}>No active {selectedBank.name} deals right now — check back soon.</p>
          </div>
        ) : (
          <div className="dm-grid-3">
            {results.map(r => <RestaurantCard key={r.id} r={r} favourite={favourites.has(r.id)} onToggleFav={() => onToggleFav(r.id)} onClick={() => onOpenRestaurant(r)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Menu preview + export ────────────────────────────────────────────────────
function themeOf(themeId) {
  return MENU_THEMES.find(t => t.id === themeId) ?? MENU_THEMES[0];
}

// Resolve a menu's template (theme) + design overrides into concrete values the
// preview and the export both consume. Anything left null in `design` falls back
// to the template, so switching templates restyles un-overridden elements.
function resolveDesign(menu) {
  const t = themeOf(menu.themeId);
  const d = normalizeDesign(menu.design);
  const serif = t.font === "Serif";
  const baseFont = serif ? "Georgia, 'Times New Roman', serif" : "var(--font-body)";
  const text = d.page.text || t.colors.text;
  // Default colour per text role (used when the role's own colour is null).
  const roleColor = { title: text, sectionHeader: t.colors.accent, itemName: text, itemDesc: text, price: t.colors.accent };
  const styleFor = (key) => {
    const r = d.type[key];
    return {
      fontFamily: fontCss(r.font) || baseFont,
      fontSize: r.size,
      color: r.color || roleColor[key],
      fontWeight: r.bold ? 700 : 400,
      fontStyle: r.italic ? "italic" : "normal",
    };
  };
  return {
    t, text, accent: t.colors.accent,
    pageBg: gradientCss(d.page.bgGradient) || d.page.bg || t.colors.bg,
    spacing: d.spacing,
    title: styleFor("title"),
    sectionHeader: styleFor("sectionHeader"),
    itemName: styleFor("itemName"),
    itemDesc: styleFor("itemDesc"),
    price: styleFor("price"),
  };
}

// One menu item rendered for the read-only preview / public view. When a
// section is laid out in multiple columns the photo sits on top (card style);
// in a single column it reads as a classic name-leader-price row. `featured`
// items get an accent border + tint to spotlight them.
function PreviewItem({ it, rd, multi }) {
  const tags = (it.tags ?? []).map(id => ITEM_TAGS.find(x => x.id === id)?.label ?? id);
  const meta = (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <div style={rd.itemName}>{it.name}{!it.available && <span style={{ fontSize: 11, opacity: 0.6 }}> · unavailable</span>}</div>
        <span style={{ ...rd.price, whiteSpace: "nowrap" }}>{rupee(it.price)}</span>
      </div>
      {it.description && <div style={{ ...rd.itemDesc, opacity: 0.78, marginTop: 3 }}>{it.description}</div>}
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
          {tags.map(label => <span key={label} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: `${rd.accent}1A`, color: rd.accent }}>{label}</span>)}
        </div>
      )}
    </>
  );
  const feat = it.featured
    ? { border: `2px solid ${rd.accent}`, background: `${rd.accent}0F` }
    : { border: `1px solid ${rd.accent}22` };
  if (multi) {
    return (
      <div style={{ borderRadius: 12, overflow: "hidden", opacity: it.available ? 1 : 0.45, ...feat }}>
        {it.image && <div style={{ aspectRatio: "4/3", backgroundImage: `url(${it.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />}
        <div style={{ padding: "12px 14px" }}>{meta}</div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 14, padding: it.featured ? "12px 14px" : "12px 0", borderRadius: it.featured ? 12 : 0, opacity: it.available ? 1 : 0.45, ...(it.featured ? feat : { borderBottom: `1px solid ${rd.accent}22` }) }}>
      {it.image && <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 10, backgroundImage: `url(${it.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />}
      <div style={{ flex: 1 }}>{meta}</div>
    </div>
  );
}

// Read-only render of a restaurant + a single menu. Honours the full design
// system: template, typography overrides, page/section backgrounds, per-section
// columns + header styling + sub-header/icon, item highlights, and spacing.
// Used by the in-app Preview modal, the public share view, and mirrored by the
// print/PDF export below.
function MenuPreview({ restaurant, menu, device }) {
  const rd = resolveDesign(menu);
  // Mobile preview forces single column, matching the public view's ≤560px
  // collapse (viewport media queries can't see a narrow modal in a wide window).
  const mobile = device === "mobile";
  return (
    <div style={{ background: rd.pageBg, color: rd.text, borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <div style={{ height: 140, backgroundImage: `url(${restaurant.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <div style={{ padding: `${rd.spacing.padding - 4}px ${rd.spacing.padding}px ${rd.spacing.padding + 4}px` }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={rd.title}>{restaurant.name || "Your Restaurant"}</div>
          {restaurant.cuisine && <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>{restaurant.cuisine}</div>}
          <div style={{ width: 60, height: 3, background: rd.accent, margin: "16px auto 0", borderRadius: 2 }} />
        </div>
        {menu.sections.map(raw => {
          const sec = normalizeSection(raw);
          const h = sec.header;
          const accent = h.accent || rd.sectionHeader.color;
          const cols = mobile ? 1 : sec.columns;
          const multi = cols > 1;
          return (
            <div key={sec.id} style={{ marginBottom: rd.spacing.sectionGap, ...(sec.bg ? { background: sec.bg, padding: 16, borderRadius: 12 } : {}) }}>
              <div style={{ marginBottom: 14, textAlign: h.align, ...(h.bg ? { background: h.bg, padding: "8px 12px", borderRadius: 8 } : {}), ...(h.divider ? { borderBottom: `2px solid ${accent}`, paddingBottom: 8 } : {}) }}>
                <span style={{ ...rd.sectionHeader, color: accent, textTransform: h.uppercase ? "uppercase" : "none", letterSpacing: h.uppercase ? "1px" : 0 }}>{sec.icon ? `${sec.icon} ` : ""}{sec.name}</span>
                {sec.subhead && <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{sec.subhead}</div>}
              </div>
              {sec.items.length === 0 && <div style={{ fontSize: 13, opacity: 0.5 }}>No items yet.</div>}
              <div className={multi ? "dm-preview-grid" : ""} style={multi ? { "--cols": cols, gap: rd.spacing.itemGap } : {}}>
                {sec.items.map(it => <PreviewItem key={it.id} it={it} rd={rd} multi={multi} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Build a standalone printable HTML document for the menu (used for "Export as
// PDF" — opens a print window the user can save as PDF — and as a shareable
// digital page).
function buildPrintableHtml(restaurant, menu) {
  const rd = resolveDesign(menu);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Serialise a resolved role style object into a CSS declaration string. CSS
  // vars (var(--font-body)/--font-display) are declared on :root below so they
  // resolve inside this standalone document.
  const ss = (o) => `font-family:${o.fontFamily};font-size:${o.fontSize}px;color:${o.color};font-weight:${o.fontWeight};font-style:${o.fontStyle}`;
  const tagHtml = (it) => {
    const tags = (it.tags ?? []).map(id => ITEM_TAGS.find(x => x.id === id)?.label ?? id);
    return tags.length ? `<div class="tags">${tags.map(tg => `<span class="tag">${esc(tg)}</span>`).join("")}</div>` : "";
  };
  const sections = menu.sections.map(raw => {
    const sec = normalizeSection(raw);
    const h = sec.header;
    const accent = h.accent || rd.sectionHeader.color;
    const cols = sec.columns;
    const multi = cols > 1;
    const headStyle = [
      ss(rd.sectionHeader), `color:${accent}`,
      `text-align:${h.align}`,
      h.uppercase ? "text-transform:uppercase;letter-spacing:1px" : "text-transform:none",
      h.divider ? `border-bottom:2px solid ${accent};padding-bottom:8px` : "",
      h.bg ? `background:${h.bg};padding:8px 12px;border-radius:8px` : "",
    ].filter(Boolean).join(";");
    const nameTop = (it, suffix = "") => `<div class="cardtop"><span style="${ss(rd.itemName)}">${esc(it.name)}${suffix}</span><span class="price" style="${ss(rd.price)}">₨${(it.price || 0).toLocaleString("en-PK")}</span></div>`;
    const body = (it) => `${it.description ? `<div style="${ss(rd.itemDesc)};opacity:.78">${esc(it.description)}</div>` : ""}${tagHtml(it)}`;
    const items = sec.items.map(it => multi
      ? `<div class="card${it.available ? "" : " off"}${it.featured ? " feat" : ""}">
           ${it.image ? `<div class="thumb" style="background-image:url('${esc(it.image)}')"></div>` : ""}
           <div class="cardbody">${nameTop(it)}${body(it)}</div>
         </div>`
      : `<div class="row${it.available ? "" : " off"}${it.featured ? " feat" : ""}">
           ${it.image ? `<div class="rowthumb" style="background-image:url('${esc(it.image)}')"></div>` : ""}
           <div class="rowbody">${nameTop(it, it.available ? "" : " · unavailable")}${body(it)}</div>
         </div>`).join("");
    const subhead = sec.subhead ? `<div class="subhead" style="text-align:${h.align}">${esc(sec.subhead)}</div>` : "";
    const secStyle = sec.bg ? `style="background:${sec.bg};padding:16px;border-radius:12px"` : "";
    return `<section ${secStyle}><h2 style="${headStyle}">${sec.icon ? esc(sec.icon) + " " : ""}${esc(sec.name)}</h2>${subhead}<div class="${multi ? "gridcols" : "list"}" style="--c:${cols}">${items}</div></section>`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(restaurant.name)} — ${esc(menu.name)}</title>
  <style>
    :root{--font-body:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;--font-display:'Georgia','Times New Roman',serif}
    *{box-sizing:border-box} body{margin:0;background:${rd.pageBg};color:${rd.text};font-family:var(--font-body)}
    .wrap{max-width:820px;margin:0 auto;padding:${rd.spacing.padding + 16}px ${rd.spacing.padding + 8}px}
    header{text-align:center;margin-bottom:36px}
    header h1{margin:0;${ss(rd.title)}}
    header .cuisine{opacity:.7;margin-top:6px}
    header .rule{width:64px;height:3px;background:${rd.accent};margin:18px auto 0;border-radius:2px}
    section{margin-bottom:${rd.spacing.sectionGap}px}
    section h2{margin:0 0 8px}
    .subhead{opacity:.7;font-size:13px;margin-bottom:12px}
    .gridcols{display:grid;gap:${rd.spacing.itemGap}px;grid-template-columns:repeat(var(--c),1fr)}
    .card{border:1px solid ${rd.accent}22;border-radius:12px;overflow:hidden} .card.off,.row.off{opacity:.45}
    .feat{border:2px solid ${rd.accent};background:${rd.accent}0F;border-radius:12px}
    .row.feat,.card.feat .cardbody{padding:12px 14px}
    .thumb{aspect-ratio:4/3;background-size:cover;background-position:center}
    .cardbody{padding:12px 14px}
    .row{display:flex;gap:14px;padding:12px 0;border-bottom:1px solid ${rd.accent}22}
    .row.feat{border-bottom:none}
    .rowthumb{width:64px;height:64px;flex-shrink:0;border-radius:10px;background-size:cover;background-position:center}
    .rowbody{flex:1}
    .cardtop{display:flex;justify-content:space-between;gap:12px;align-items:baseline}
    .desc{margin-top:3px}
    .price{white-space:nowrap}
    .tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
    .tag{font-size:11px;padding:2px 8px;border-radius:999px;background:${rd.accent}1A;color:${rd.accent}}
    @media print{ .noprint{display:none} }
    @media (max-width:560px){ .gridcols{grid-template-columns:1fr} .wrap{padding:28px 18px} }
    .noprint{position:fixed;top:16px;right:16px}
    .noprint button{padding:10px 18px;border:none;border-radius:8px;background:${rd.accent};color:#fff;font-weight:700;cursor:pointer}
  </style></head><body>
  <div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
  <div class="wrap">
    <header><h1>${esc(restaurant.name || "Your Restaurant")}</h1>${restaurant.cuisine ? `<div class="cuisine">${esc(restaurant.cuisine)}</div>` : ""}<div class="rule"></div></header>
    ${sections}
  </div></body></html>`;
}

function exportMenu(restaurant, menu) {
  const html = buildPrintableHtml(restaurant, menu);
  const w = window.open("", "_blank");
  if (!w) { alert("Please allow pop-ups to export your menu."); return; }
  w.document.write(html);
  w.document.close();
}

// ── Shareable digital menu (no backend) ──────────────────────────────────────
// The whole menu snapshot is encoded into the URL hash so the link works on any
// device that opens it — no server required. The QR code (below) points at the
// same URL. Very large menus produce long URLs; the QR may then be too dense to
// scan reliably, so the copyable link is always the primary share mechanism.
const SHARE_PREFIX = "menu=";

function encodeSnapshot(restaurant, menu) {
  // Keep only what the public view renders, so the payload stays compact.
  const snap = {
    r: { name: restaurant.name, cuisine: restaurant.cuisine, coverImage: restaurant.coverImage },
    m: {
      name: menu.name,
      themeId: menu.themeId,
      design: normalizeDesign(menu.design),
      sections: menu.sections.map(s => {
        const sec = normalizeSection(s);
        return {
          name: sec.name, columns: sec.columns, header: sec.header, subhead: sec.subhead, icon: sec.icon, bg: sec.bg,
          items: sec.items.map(it => ({ name: it.name, description: it.description, price: it.price, image: it.image, available: it.available, featured: it.featured, tags: it.tags ?? [] })),
        };
      }),
    },
  };
  const json = JSON.stringify(snap);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeSnapshot(payload) {
  try {
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const snap = JSON.parse(json);
    if (!snap?.m?.sections) return null;
    return {
      restaurant: { name: snap.r?.name ?? "", cuisine: snap.r?.cuisine ?? "", coverImage: snap.r?.coverImage ?? "" },
      menu: {
        id: "shared", name: snap.m.name ?? "Menu", themeId: snap.m.themeId ?? "modern", design: snap.m.design ?? defaultDesign(),
        sections: snap.m.sections.map((s, i) => ({ id: `s${i}`, ...s, items: (s.items ?? []).map((it, j) => ({ id: `i${i}_${j}`, ...it })) })),
      },
    };
  } catch {
    return null;
  }
}

function shareUrl(restaurant, menu) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${SHARE_PREFIX}${encodeSnapshot(restaurant, menu)}`;
}

function qrSrc(url, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encodeURIComponent(url)}`;
}

// Share sheet: a self-contained link (menu encoded in the URL) + a scannable QR
// pointing at it, plus the PDF export. The link carries the data, so it opens on
// any device — but a very long menu makes a dense QR; copy-the-link always works.
function ShareModal({ restaurant, menu, onClose }) {
  const url = shareUrl(restaurant, menu);
  const [copied, setCopied] = useState(false);
  const longUrl = url.length > 1800; // QR gets hard to scan past roughly this
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard blocked */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(10,15,30,0.5)", backdropFilter: "blur(2px)" }} />
      <div className="dm-card dm-modal-pop" style={{ position: "relative", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-modal)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--divider)" }}>
          <h3 className="dm-h3">Share menu</h3>
          <IconBtn onClick={onClose}><X size={20} /></IconBtn>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ padding: 14, background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--divider)" }}>
              {/* QR encodes the share link; data lives in the link itself. */}
              <img src={qrSrc(url)} alt="Menu QR code" width={220} height={220} style={{ display: "block" }} />
            </div>
          </div>
          <p className="dm-small" style={{ textAlign: "center", margin: 0 }}>Scan for the digital menu, or print this QR for your tables.{longUrl && " This menu is large — the QR may be hard to scan; share the link instead."}</p>
          <div>
            <span className="dm-field__label" style={{ display: "block", marginBottom: 8 }}>Shareable link</span>
            <div style={{ display: "flex", gap: 8 }}>
              <input readOnly value={url} onFocus={e => e.target.select()} className="dm-input" style={{ flex: 1, minWidth: 0, fontSize: 12 }} />
              <Btn variant="secondary" icon={<Copy size={15} />} onClick={copy}>{copied ? "Copied" : "Copy"}</Btn>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn variant="secondary" icon={<ExternalLink size={16} />} onClick={() => window.open(url, "_blank")}>Open digital menu</Btn>
            <Btn variant="ghost" icon={<Download size={16} />} onClick={() => exportMenu(restaurant, menu)}>Export PDF</Btn>
          </div>
          <p className="dm-small" style={{ margin: 0, color: "var(--text-secondary)" }}>The link contains the menu itself, so it opens on any device — no account needed. Re-share after edits to update what people see.</p>
        </div>
      </div>
    </div>
  );
}

// Full-screen read-only public menu, shown when the app is opened via a share
// link (`#menu=…`). No chrome, no auth — just the menu, with print + share.
function PublicMenuScreen({ restaurant, menu, onExit }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-page)" }}>
      <header style={{ background: "var(--white)", borderBottom: "1px solid var(--divider)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <Logo size={22} />
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" icon={<Download size={16} />} className="dm-hide-mobile" onClick={() => exportMenu(restaurant, menu)}>Print / PDF</Btn>
        <Btn variant="secondary" onClick={onExit}>Explore DineMap</Btn>
      </header>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 16px 64px" }}>
        <MenuPreview restaurant={restaurant} menu={menu} />
      </div>
    </div>
  );
}

// ─── Menu Builder Screen ──────────────────────────────────────────────────────
const BUILDER_STEPS = [
  ["restaurant", "Restaurant"],
  ["discount", "Bank Discount"],
  ["menu", "Menu Items"],
  ["design", "Design"],
];

// Text roles exposed in the typography designer (label + design.type key).
const TYPE_ROLES = [
  ["title", "Restaurant name"],
  ["sectionHeader", "Section headers"],
  ["itemName", "Item names"],
  ["itemDesc", "Descriptions"],
  ["price", "Prices"],
];

let _bid = 0;
const newId = (p) => `${p}_${Date.now().toString(36)}_${_bid++}`;

// Edits one restaurant + one of its menus, loaded from the store. On Publish it
// writes the restaurant metadata/discount and the menu (name, theme, sections,
// items) back to localStorage, then exits to the dashboard.
function MenuBuilderScreen({ target, onExit, onBack }) {
  const [step, setStep] = useState("restaurant");
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("desktop"); // desktop | mobile

  // Load the restaurant + menu once (client-side; this screen only mounts after
  // a user interaction, never during SSR).
  const loaded = getRestaurant(target.restaurantId);
  const loadedMenu = loaded?.menus.find(m => m.id === target.menuId);

  const [meta, setMeta] = useState(() => ({
    name: loaded?.name ?? "",
    countryId: loaded?.countryId ?? "pk",
    cityId: loaded?.cityId ?? "lahore",
    area: loaded?.area ?? "Gulberg III",
    cuisine: loaded?.cuisine ?? "",
    phone: loaded?.phone ?? "",
    description: loaded?.description ?? "",
    coverImage: loaded?.coverImage ?? "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    menuName: loadedMenu?.name ?? "Main Menu",
    themeId: loadedMenu?.themeId ?? "modern",
  }));
  const setMetaField = (k, v) => setMeta(prev => ({ ...prev, [k]: v }));
  const coverInputRef = React.useRef(null);
  const onCoverFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMetaField("coverImage", reader.result);
    reader.readAsDataURL(file);
  };
  const country = COUNTRIES.find(c => c.id === meta.countryId) ?? COUNTRIES[0];
  const city = country.cities.find(c => c.id === meta.cityId) ?? country.cities[0];

  const selectCountry = (id) => {
    const c = COUNTRIES.find(x => x.id === id) ?? COUNTRIES[0];
    setMeta(prev => ({ ...prev, countryId: id, cityId: c.cities[0].id, area: c.cities[0].areas[0].name }));
  };
  const selectCity = (id) => {
    const c = country.cities.find(x => x.id === id) ?? country.cities[0];
    setMeta(prev => ({ ...prev, cityId: id, area: c.areas[0].name }));
  };

  // Bank discount (restaurant-level)
  const [discount, setDiscount] = useState(() => loaded?.discount ?? {
    enabled: false, bankId: "meezan", cardType: "credit",
    percent: 15, minSpend: 0, days: "Weekdays", expires: "31 Dec 2026",
  });
  const setDiscountField = (k, v) => setDiscount(prev => ({ ...prev, [k]: v }));
  const discountBank = BANKS.find(b => b.id === discount.bankId) ?? BANKS[0];

  // Menu sections + items (menu-level). Normalise on load so older stored menus
  // gain the column/header fields the builder + preview rely on.
  const [sections, setSections] = useState(() =>
    (loadedMenu && loadedMenu.sections.length ? loadedMenu.sections : [{ ...blankSection("Starters"), id: newId("sec") }]).map(normalizeSection)
  );
  const [active, setActive] = useState(sections[0].id);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showShare, setShowShare] = useState(false);
  // Drag-and-drop cursors (index of the item being dragged). Native HTML5 DnD —
  // no library. `dragSec`/`dragItem` hold the source index mid-drag.
  const [dragSec, setDragSec] = useState(null);
  const [dragItem, setDragItem] = useState(null);

  // Element-level design overrides (typography, colours/backgrounds, spacing) on
  // top of the chosen template. Loaded + normalised from the stored menu.
  const [design, setDesign] = useState(() => normalizeDesign(loadedMenu?.design));
  const setTypeField = (roleKey, k, v) => setDesign(prev => ({ ...prev, type: { ...prev.type, [roleKey]: { ...prev.type[roleKey], [k]: v } } }));
  const setPageField = (k, v) => setDesign(prev => ({ ...prev, page: { ...prev.page, [k]: v } }));
  const setSpacingField = (k, v) => setDesign(prev => ({ ...prev, spacing: { ...prev.spacing, [k]: Number(v) } }));
  const resetDesign = () => setDesign(defaultDesign());

  // Build a live restaurant+menu object for the preview / export.
  const liveRestaurant = {
    id: target.restaurantId,
    name: meta.name, countryId: meta.countryId, cityId: meta.cityId, area: meta.area,
    cuisine: meta.cuisine, phone: meta.phone, description: meta.description, coverImage: meta.coverImage,
    discount: discount.enabled ? { ...discount, minSpend: Number(discount.minSpend) || 0, percent: Number(discount.percent) || 0 } : null,
    reviews: loaded?.reviews ?? [],
    menus: [],
  };
  const liveMenu = { id: target.menuId, name: meta.menuName, themeId: meta.themeId, design, sections, views: loadedMenu?.views ?? 0, updatedAt: Date.now() };

  const activeSection = sections.find(s => s.id === active) ?? sections[0];
  const counts = Object.fromEntries(sections.map(s => [s.id, s.items.length]));
  const totalItems = sections.reduce((n, s) => n + s.items.length, 0);

  const updateActiveItems = (fn) =>
    setSections(prev => prev.map(s => s.id === active ? { ...s, items: fn(s.items) } : s));
  const toggle = (id) => updateActiveItems(items => items.map(it => it.id === id ? { ...it, available: !it.available } : it));
  const removeItem = (id) => updateActiveItems(items => items.filter(it => it.id !== id));
  const addSection = () => {
    const sec = { ...blankSection(`New Section ${sections.length + 1}`), id: newId("sec") };
    setSections(prev => [...prev, sec]);
    setActive(sec.id);
  };
  const renameSection = (id, name) => setSections(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  const removeSection = (id) => {
    setSections(prev => {
      const next = prev.filter(s => s.id !== id);
      const safe = next.length ? next : [{ ...blankSection("Starters"), id: newId("sec") }];
      if (id === active) setActive(safe[0].id);
      return safe;
    });
  };
  // Layout + header styling for the active section.
  const setSectionColumns = (id, n) => setSections(prev => prev.map(s => s.id === id ? { ...s, columns: n } : s));
  const setSectionField = (id, k, v) => setSections(prev => prev.map(s => s.id === id ? { ...s, [k]: v } : s));
  const setHeaderField = (id, k, v) => setSections(prev => prev.map(s => s.id === id ? { ...s, header: { ...defaultHeader(), ...s.header, [k]: v } } : s));
  // Reorder helper: move array element from `from` to `to`.
  const reorder = (arr, from, to) => { const next = arr.slice(); const [m] = next.splice(from, 1); next.splice(to, 0, m); return next; };
  const moveSection = (to) => { if (dragSec === null || dragSec === to) return; setSections(prev => reorder(prev, dragSec, to)); setDragSec(null); };
  const moveItem = (to) => { if (dragItem === null || dragItem === to) return; updateActiveItems(items => reorder(items, dragItem, to)); setDragItem(null); };
  const saveItem = (form) => {
    updateActiveItems(items => {
      if (editing) return items.map(it => it.id === editing.id ? { ...it, ...form } : it);
      const item = { id: newId("item"), reviews: [], ...form };
      return [...items, item];
    });
    setShowModal(false);
  };

  const publish = () => {
    upsertRestaurant({
      id: target.restaurantId,
      name: meta.name.trim() || "Untitled Restaurant",
      countryId: meta.countryId, cityId: meta.cityId, area: meta.area,
      cuisine: meta.cuisine, phone: meta.phone, description: meta.description, coverImage: meta.coverImage,
      discount: discount.enabled ? { ...discount, minSpend: Number(discount.minSpend) || 0, percent: Number(discount.percent) || 0 } : null,
      reviews: loaded?.reviews ?? [],
      menus: loaded?.menus ?? [],
    });
    saveMenu(target.restaurantId, { id: target.menuId, name: meta.menuName.trim() || "Untitled Menu", themeId: meta.themeId, design, sections, views: loadedMenu?.views ?? 0, updatedAt: Date.now() });
    onExit();
  };

  return (
    <div className="dm-builder" style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--surface-page)", position: "fixed", inset: 0, zIndex: 100, overflow: "hidden" }}>
      {/* Top bar */}
      <header style={{ background: "var(--white)", borderBottom: "1px solid var(--divider)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button onClick={onBack} className="dm-iconbtn" title="Back to dashboard"><ChevronLeft size={20} /></button>
        <Logo size={22} />
        <div className="dm-builder-steps dm-no-scrollbar" style={{ display: "flex", gap: 4, background: "var(--surface-muted)", borderRadius: "var(--radius-md)", padding: 4, marginLeft: 8 }}>
          {BUILDER_STEPS.map(([id, label], i) => (
            <button key={id} onClick={() => setStep(id)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", border: "none", cursor: "pointer", borderRadius: 9, whiteSpace: "nowrap",
              fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13,
              background: step === id ? "var(--white)" : "transparent", color: step === id ? "var(--brand)" : "var(--text-secondary)",
              boxShadow: step === id ? "var(--shadow-card)" : "none",
            }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: step === id ? "var(--brand)" : "var(--gray-200)", color: "#fff", fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" icon={<Eye size={17} />} className="dm-hide-mobile" onClick={() => setShowPreview(true)}>Preview</Btn>
        <Btn variant="ghost" icon={<Share2 size={17} />} className="dm-hide-mobile" onClick={() => setShowShare(true)}>Share</Btn>
        <Btn variant="ghost" icon={<Download size={17} />} className="dm-hide-mobile" onClick={() => exportMenu(liveRestaurant, liveMenu)}>Export</Btn>
        <Btn icon={<Check size={17} />} onClick={publish}>Publish</Btn>
      </header>

      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {/* ── Restaurant step ── */}
        {step === "restaurant" && (
          <div className="dm-wrap" style={{ flex: 1, overflowY: "auto", padding: "32px", maxWidth: 880, margin: "0 auto" }}>
            <h2 className="dm-h2" style={{ marginBottom: 6 }}>Restaurant details</h2>
            <p className="dm-small" style={{ marginBottom: 28 }}>Tell customers who you are. This appears at the top of your menu.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="dm-grid-2" style={{ gap: 16 }}>
                <Input label="Restaurant name" value={meta.name} onChange={(e) => setMetaField("name", e.target.value)} placeholder="e.g. Salt Restaurant" />
                <Input label="Menu name" value={meta.menuName} onChange={(e) => setMetaField("menuName", e.target.value)} placeholder="e.g. Main Menu, Brunch, Drinks" />
              </div>
              <div className="dm-grid-3" style={{ gap: 16 }}>
                <label className="dm-field">
                  <span className="dm-field__label">Country</span>
                  <select className="dm-input" value={meta.countryId} onChange={e => selectCountry(e.target.value)}>
                    {COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                  </select>
                </label>
                <label className="dm-field">
                  <span className="dm-field__label">City</span>
                  <select className="dm-input" value={meta.cityId} onChange={e => selectCity(e.target.value)}>
                    {country.cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="dm-field">
                  <span className="dm-field__label">Area</span>
                  <select className="dm-input" value={meta.area} onChange={e => setMetaField("area", e.target.value)}>
                    {city.areas.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                  </select>
                </label>
              </div>
              <div className="dm-grid-2" style={{ gap: 16 }}>
                <Input label="Cuisines" value={meta.cuisine} onChange={(e) => setMetaField("cuisine", e.target.value)} placeholder="e.g. Desi, BBQ" />
                <Input label="Phone" value={meta.phone} onChange={(e) => setMetaField("phone", e.target.value)} placeholder="042-..." />
              </div>
              <Input label="Description" multiline value={meta.description} onChange={(e) => setMetaField("description", e.target.value)} placeholder="A short, appetising intro to your restaurant" />

              <div>
                <span className="dm-field__label" style={{ display: "block", marginBottom: 10 }}>Cover image</span>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ width: 140, height: 90, borderRadius: "var(--radius-md)", backgroundImage: `url(${meta.coverImage})`, backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0 }} />
                  <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverFile} style={{ display: "none" }} />
                  <Btn variant="secondary" size="sm" icon={<Camera size={15} />} onClick={() => coverInputRef.current?.click()}>Replace cover</Btn>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}>
                <Btn onClick={() => setStep("discount")} iconRight={<ArrowRight size={17} />}>Next: Bank Discount</Btn>
              </div>
            </div>
          </div>
        )}

        {/* ── Discount step ── */}
        {step === "discount" && (
          <div className="dm-wrap" style={{ flex: 1, overflowY: "auto", padding: "32px", maxWidth: 880, margin: "0 auto" }}>
            <h2 className="dm-h2" style={{ marginBottom: 6 }}>Bank card discount</h2>
            <p className="dm-small" style={{ marginBottom: 24 }}>Offer a discount to cardholders — it shows as a badge on your restaurant card.</p>

            <div style={{ background: "var(--white)", borderRadius: "var(--radius-lg)", padding: 20, boxShadow: "var(--shadow-card)", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>Enable a bank discount</div>
                <div className="dm-small" style={{ marginTop: 2 }}>Turn off if you don't run any card offers right now.</div>
              </div>
              <Switch checked={discount.enabled} onChange={v => setDiscountField("enabled", v)} label={discount.enabled ? "On" : "Off"} />
            </div>

            {discount.enabled && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <label className="dm-field">
                  <span className="dm-field__label">Bank</span>
                  <select className="dm-input" value={discount.bankId} onChange={e => setDiscountField("bankId", e.target.value)}>
                    {BANKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </label>
                <div className="dm-grid-2" style={{ gap: 16 }}>
                  <label className="dm-field">
                    <span className="dm-field__label">Card type</span>
                    <select className="dm-input" value={discount.cardType} onChange={e => setDiscountField("cardType", e.target.value)}>
                      {CARD_TYPES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </label>
                  <Input label="Discount %" type="number" value={discount.percent} onChange={(e) => setDiscountField("percent", Number(e.target.value))} placeholder="15" />
                </div>
                <div className="dm-grid-2" style={{ gap: 16 }}>
                  <Input label="Minimum spend (₨)" prefix="₨" type="number" value={discount.minSpend} onChange={(e) => setDiscountField("minSpend", Number(e.target.value))} placeholder="0" />
                  <Input label="Valid days" value={discount.days} onChange={(e) => setDiscountField("days", e.target.value)} placeholder="e.g. Weekdays" />
                </div>
                <Input label="Expires" value={discount.expires} onChange={(e) => setDiscountField("expires", e.target.value)} placeholder="e.g. 30 Jun 2026" />

                {/* Live preview */}
                <div>
                  <span className="dm-label" style={{ display: "block", marginBottom: 10 }}>Preview</span>
                  <div className="dm-discount-box" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: discountBank.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontFamily: "var(--font-display)", fontWeight: 800 }}>{discountBank.name.slice(0, 2)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{discount.percent}% off with {discountBank.name} {CARD_TYPES.find(c => c.id === discount.cardType)?.label}</div>
                      <div className="dm-small" style={{ marginTop: 2 }}>{discount.minSpend ? `Min spend ₨${Number(discount.minSpend).toLocaleString()} · ` : ""}{discount.days} · Expires {discount.expires}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 28, flexWrap: "wrap", gap: 12 }}>
              <Btn variant="ghost" onClick={() => setStep("restaurant")}>Back</Btn>
              <Btn onClick={() => setStep("menu")} iconRight={<ArrowRight size={17} />}>Next: Menu Items</Btn>
            </div>
          </div>
        )}

        {/* ── Menu step ── */}
        {step === "menu" && (
          <div className="dm-builder" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* Sections */}
            <aside className="dm-builder-aside" style={{ width: 280, flexShrink: 0, background: "var(--white)", borderRight: "1px solid var(--divider)", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "16px 20px 8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div className="dm-fallback" style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", fontSize: 18, flexShrink: 0 }}>{(meta.name || "R")[0]}</div>
                  <div><div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{meta.name || "Your Restaurant"}</div><div className="dm-small">{meta.menuName} · {totalItems} items</div></div>
                </div>
                <span className="dm-label">Menu Sections</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
                {sections.map((c, si) => {
                  const on = active === c.id;
                  return (
                    <div key={c.id} onClick={() => setActive(c.id)}
                      draggable onDragStart={() => setDragSec(si)} onDragOver={e => e.preventDefault()} onDrop={() => moveSection(si)} onDragEnd={() => setDragSec(null)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", marginBottom: 4, cursor: "pointer", borderRadius: "var(--radius-md)", borderLeft: on ? "3px solid var(--brand)" : "3px solid transparent", background: on ? "var(--surface-tint)" : "transparent", opacity: dragSec === si ? 0.4 : 1 }}>
                      <GripVertical size={15} color="var(--gray-200)" style={{ cursor: "grab" }} />
                      <input value={c.name} onClick={e => e.stopPropagation()} onChange={e => renameSection(c.id, e.target.value)} style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: on ? "var(--brand)" : "var(--text-primary)", outline: "none" }} />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", background: "var(--surface-muted)", borderRadius: 999, padding: "2px 8px" }}>{counts[c.id]}</span>
                      {sections.length > 1 && <button onClick={e => { e.stopPropagation(); removeSection(c.id); }} className="dm-iconbtn" style={{ width: 26, height: 26 }} title="Delete section"><Trash2 size={13} color="var(--red-500)" /></button>}
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: 16 }}>
                <button onClick={addSection} style={{ width: "100%", padding: 12, borderRadius: "var(--radius-md)", border: "2px dashed var(--border)", background: "transparent", cursor: "pointer", color: "var(--text-secondary)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Plus size={16} /> Add Section
                </button>
              </div>
            </aside>

            {/* Items */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <header style={{ background: "var(--white)", borderBottom: "1px solid var(--divider)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <h2 className="dm-h3" style={{ margin: 0 }}>{activeSection?.name}</h2>
                <Btn onClick={() => { setEditing(null); setShowModal(true); }} icon={<Plus size={17} />}>Add Item</Btn>
              </header>
              {/* Per-section layout + header design */}
              {activeSection && (
                <div style={{ background: "var(--white)", borderBottom: "1px solid var(--divider)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <LayoutGrid size={15} color="var(--text-secondary)" />
                    <span className="dm-small" style={{ fontWeight: 600 }}>Columns</span>
                    <div style={{ display: "flex", gap: 3, background: "var(--surface-muted)", borderRadius: 9, padding: 3 }}>
                      {[1, 2, 3, 4, 5, 6].map(n => {
                        const on = (activeSection.columns || 1) === n;
                        return <button key={n} onClick={() => setSectionColumns(activeSection.id, n)} style={{ width: 28, height: 28, border: "none", cursor: "pointer", borderRadius: 7, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, background: on ? "var(--white)" : "transparent", color: on ? "var(--brand)" : "var(--text-secondary)", boxShadow: on ? "var(--shadow-card)" : "none" }}>{n}</button>;
                      })}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Palette size={15} color="var(--text-secondary)" />
                    <span className="dm-small" style={{ fontWeight: 600 }}>Header</span>
                    <div style={{ display: "flex", gap: 3, background: "var(--surface-muted)", borderRadius: 9, padding: 3 }}>
                      {["left", "center"].map(a => {
                        const on = (activeSection.header?.align || "left") === a;
                        return <button key={a} onClick={() => setHeaderField(activeSection.id, "align", a)} style={{ padding: "5px 11px", border: "none", cursor: "pointer", borderRadius: 7, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, textTransform: "capitalize", background: on ? "var(--white)" : "transparent", color: on ? "var(--brand)" : "var(--text-secondary)", boxShadow: on ? "var(--shadow-card)" : "none" }}>{a}</button>;
                      })}
                    </div>
                    <Switch checked={activeSection.header?.uppercase ?? true} onChange={v => setHeaderField(activeSection.id, "uppercase", v)} label="CAPS" />
                    <Switch checked={activeSection.header?.divider ?? true} onChange={v => setHeaderField(activeSection.id, "divider", v)} label="Rule" />
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} title="Header colour (clear to use theme accent)">
                      <input type="color" value={activeSection.header?.accent || themeOf(meta.themeId).colors.accent} onChange={e => setHeaderField(activeSection.id, "accent", e.target.value)} style={{ width: 26, height: 26, border: "1px solid var(--border)", borderRadius: 6, padding: 0, background: "none", cursor: "pointer" }} />
                      {activeSection.header?.accent && <button onClick={() => setHeaderField(activeSection.id, "accent", null)} className="dm-small" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-secondary)", textDecoration: "underline" }}>reset</button>}
                    </label>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input value={activeSection.icon || ""} onChange={e => setSectionField(activeSection.id, "icon", e.target.value)} placeholder="🍽️" maxLength={2} title="Header icon (emoji)" className="dm-input" style={{ width: 44, padding: "7px 8px", fontSize: 15, textAlign: "center" }} />
                    <input value={activeSection.subhead || ""} onChange={e => setSectionField(activeSection.id, "subhead", e.target.value)} placeholder="Sub-header / description" className="dm-input" style={{ width: 200, padding: "7px 10px", fontSize: 13 }} />
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} title="Section background">
                      <span className="dm-small" style={{ fontWeight: 600 }}>BG</span>
                      <input type="color" value={activeSection.bg || "#ffffff"} onChange={e => setSectionField(activeSection.id, "bg", e.target.value)} style={{ width: 26, height: 26, border: "1px solid var(--border)", borderRadius: 6, padding: 0, cursor: "pointer" }} />
                      {activeSection.bg && <button onClick={() => setSectionField(activeSection.id, "bg", null)} className="dm-small" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-secondary)", textDecoration: "underline" }}>clear</button>}
                    </label>
                  </div>
                </div>
              )}
              <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                <div className="dm-grid-3">
                  {activeSection?.items.map((it, ii) => (
                    <div key={it.id} className="dm-card"
                      draggable onDragStart={() => setDragItem(ii)} onDragOver={e => e.preventDefault()} onDrop={() => moveItem(ii)} onDragEnd={() => setDragItem(null)}
                      style={{ position: "relative", opacity: dragItem === ii ? 0.4 : 1, cursor: "grab", ...(it.featured ? { outline: "2px solid var(--brand)", outlineOffset: -2 } : {}) }}>
                      {it.featured && <span style={{ position: "absolute", top: 10, left: 10, zIndex: 1, fontSize: 11, fontWeight: 700, color: "#fff", background: "var(--brand)", borderRadius: 999, padding: "3px 9px", display: "flex", alignItems: "center", gap: 4 }}><Star size={11} fill="#fff" />Featured</span>}
                      {it.image
                        ? <div style={{ aspectRatio: "4/3", backgroundImage: `url(${it.image})`, backgroundSize: "cover", backgroundPosition: "center", opacity: it.available ? 1 : 0.5 }} />
                        : <div style={{ aspectRatio: "4/3", border: "2px dashed var(--border)", margin: 12, borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--text-secondary)" }}><Camera size={24} color="var(--text-secondary)" /><span className="dm-small">No photo</span></div>
                      }
                      <div style={{ padding: "14px 16px 16px" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{it.name}</div>
                        {it.tags?.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                            {it.tags.map((tg) => <span key={tg} className="dm-tag" style={{ fontSize: 11, padding: "3px 8px" }}>{ITEM_TAGS.find(t => t.id === tg)?.label ?? tg}</span>)}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span className="dm-price" style={{ fontSize: 16 }}>{rupee(it.price)}</span>
                          <Switch checked={it.available} onChange={() => toggle(it.id)} label={it.available ? "Available" : "Off"} />
                        </div>
                      </div>
                      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditing(it); setShowModal(true); }} className="dm-iconbtn dm-iconbtn--glass" style={{ width: 34, height: 34 }}><Pencil size={15} /></button>
                        <button onClick={() => removeItem(it.id)} className="dm-iconbtn dm-iconbtn--glass" style={{ width: 34, height: 34 }}><Trash2 size={15} color="var(--red-500)" /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => { setEditing(null); setShowModal(true); }} style={{ minHeight: 220, border: "2px dashed var(--border)", borderRadius: "var(--radius-xl)", background: "transparent", cursor: "pointer", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--surface-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={22} color="var(--brand)" /></div>
                    Add an item
                  </button>
                </div>
              </div>
            </main>
          </div>
        )}

        {/* ── Design step ── */}
        {step === "design" && (() => {
          const dTheme = themeOf(meta.themeId);
          const roleColorDefault = { title: dTheme.colors.text, sectionHeader: dTheme.colors.accent, itemName: dTheme.colors.text, itemDesc: dTheme.colors.text, price: dTheme.colors.accent };
          return (
          <div className="dm-builder" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div className="dm-wrap" style={{ flex: 1, overflowY: "auto", padding: "32px", maxWidth: 760 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <h2 className="dm-h2" style={{ marginBottom: 6 }}>Design your menu</h2>
                  <p className="dm-small" style={{ marginBottom: 0 }}>Pick a template to start, then customise anything. Templates are just starting points — your edits are kept, and anything you don&apos;t touch follows the template.</p>
                </div>
                <Btn variant="ghost" size="sm" onClick={resetDesign}>Reset design</Btn>
              </div>

              {/* Template picker */}
              <div style={{ marginTop: 24 }}>
                <span className="dm-field__label" style={{ display: "block", marginBottom: 10 }}>Template</span>
                <div className="dm-grid-4">
                  {MENU_THEMES.map(t => {
                    const on = meta.themeId === t.id;
                    return (
                      <button key={t.id} onClick={() => setMetaField("themeId", t.id)} style={{ textAlign: "left", cursor: "pointer", padding: 14, borderRadius: "var(--radius-lg)", background: "var(--white)", border: on ? "2px solid var(--brand)" : "2px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div className="dm-swatch"><span style={{ background: t.colors.bg }} /><span style={{ background: t.colors.accent }} /><span style={{ background: t.colors.text }} /></div>
                        <div>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: on ? "var(--brand)" : "var(--text-primary)" }}>{t.name}</div>
                          <div className="dm-small">{t.font}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Typography */}
              <h3 className="dm-h3" style={{ margin: "30px 0 12px" }}>Typography</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {TYPE_ROLES.map(([key, label]) => {
                  const r = design.type[key];
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "var(--white)", border: "1px solid var(--divider)", borderRadius: "var(--radius-md)", padding: "10px 14px" }}>
                      <span style={{ width: 130, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>{label}</span>
                      <select className="dm-input" value={r.font} onChange={e => setTypeField(key, "font", e.target.value)} style={{ width: 150, padding: "7px 10px", fontSize: 13 }}>
                        {FONT_FAMILIES.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                      </select>
                      <label style={{ display: "flex", alignItems: "center", gap: 6 }} title="Font size (px)">
                        <input type="number" min={9} max={64} value={r.size} onChange={e => setTypeField(key, "size", Number(e.target.value) || r.size)} className="dm-input" style={{ width: 64, padding: "7px 8px", fontSize: 13 }} />
                        <span className="dm-small">px</span>
                      </label>
                      <button onClick={() => setTypeField(key, "bold", !r.bold)} title="Bold" style={{ width: 32, height: 32, borderRadius: 7, cursor: "pointer", fontWeight: 800, fontSize: 14, border: r.bold ? "1px solid var(--brand)" : "1px solid var(--border)", background: r.bold ? "var(--surface-tint)" : "var(--white)", color: r.bold ? "var(--brand)" : "var(--text-secondary)" }}>B</button>
                      <button onClick={() => setTypeField(key, "italic", !r.italic)} title="Italic" style={{ width: 32, height: 32, borderRadius: 7, cursor: "pointer", fontStyle: "italic", fontSize: 14, border: r.italic ? "1px solid var(--brand)" : "1px solid var(--border)", background: r.italic ? "var(--surface-tint)" : "var(--white)", color: r.italic ? "var(--brand)" : "var(--text-secondary)" }}>I</button>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} title="Text colour (reset to follow template)">
                        <input type="color" value={r.color || roleColorDefault[key]} onChange={e => setTypeField(key, "color", e.target.value)} style={{ width: 30, height: 30, border: "1px solid var(--border)", borderRadius: 6, padding: 0, background: "none", cursor: "pointer" }} />
                        {r.color && <button onClick={() => setTypeField(key, "color", null)} className="dm-small" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-secondary)", textDecoration: "underline" }}>reset</button>}
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Colours & background */}
              <h3 className="dm-h3" style={{ margin: "30px 0 12px" }}>Colours &amp; background</h3>
              <div style={{ display: "flex", gap: 22, flexWrap: "wrap", background: "var(--white)", border: "1px solid var(--divider)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="dm-small" style={{ fontWeight: 600 }}>Page text</span>
                  <input type="color" value={design.page.text || dTheme.colors.text} onChange={e => setPageField("text", e.target.value)} style={{ width: 30, height: 30, border: "1px solid var(--border)", borderRadius: 6, padding: 0, cursor: "pointer" }} />
                  {design.page.text && <button onClick={() => setPageField("text", null)} className="dm-small" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-secondary)", textDecoration: "underline" }}>reset</button>}
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="dm-small" style={{ fontWeight: 600 }}>Page background</span>
                  <input type="color" value={design.page.bg || dTheme.colors.bg} onChange={e => setPageField("bg", e.target.value)} disabled={design.page.bgGradient !== "none"} style={{ width: 30, height: 30, border: "1px solid var(--border)", borderRadius: 6, padding: 0, cursor: "pointer", opacity: design.page.bgGradient !== "none" ? 0.4 : 1 }} />
                  {design.page.bg && <button onClick={() => setPageField("bg", null)} className="dm-small" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-secondary)", textDecoration: "underline" }}>reset</button>}
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="dm-small" style={{ fontWeight: 600 }}>Gradient</span>
                  <select className="dm-input" value={design.page.bgGradient} onChange={e => setPageField("bgGradient", e.target.value)} style={{ width: 130, padding: "7px 10px", fontSize: 13 }}>
                    {GRADIENT_PRESETS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </label>
              </div>

              {/* Spacing */}
              <h3 className="dm-h3" style={{ margin: "30px 0 12px" }}>Spacing</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, background: "var(--white)", border: "1px solid var(--divider)", borderRadius: "var(--radius-md)", padding: "16px" }}>
                {[["itemGap", "Item gap", 0, 40], ["sectionGap", "Section gap", 8, 80], ["padding", "Page padding", 8, 72]].map(([k, label, min, max]) => (
                  <label key={k} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 110, fontSize: 13, fontWeight: 600 }}>{label}</span>
                    <input type="range" min={min} max={max} value={design.spacing[k]} onChange={e => setSpacingField(k, e.target.value)} style={{ flex: 1, accentColor: "var(--brand)" }} />
                    <span className="dm-small" style={{ width: 44, textAlign: "right" }}>{design.spacing[k]}px</span>
                  </label>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 28, flexWrap: "wrap", gap: 12 }}>
                <Btn variant="ghost" onClick={() => setStep("menu")}>Back to items</Btn>
                <Btn icon={<Check size={17} />} onClick={publish}>Publish</Btn>
              </div>
            </div>

            {/* Live preview rail */}
            <aside className="dm-hide-mobile" style={{ width: 400, flexShrink: 0, borderLeft: "1px solid var(--divider)", background: "var(--surface-muted)", overflowY: "auto", padding: 20 }}>
              <span className="dm-label" style={{ display: "block", marginBottom: 10 }}>Live preview</span>
              <MenuPreview restaurant={liveRestaurant} menu={liveMenu} />
            </aside>
          </div>
          );
        })()}
      </div>

      {/* Item Editor Modal */}
      {showModal && <ItemEditorModal editing={editing} onClose={() => setShowModal(false)} onSave={saveItem} />}

      {/* Share Modal */}
      {showShare && <ShareModal restaurant={liveRestaurant} menu={liveMenu} onClose={() => setShowShare(false)} />}

      {/* Preview Modal — Desktop / Mobile / Print views */}
      {showPreview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: 20, gap: 14 }}>
          <div onClick={() => setShowPreview(false)} style={{ position: "absolute", inset: 0, background: "rgba(10,15,30,0.6)", backdropFilter: "blur(4px)" }} />
          {/* Device toggle */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, background: "var(--white)", borderRadius: "var(--radius-pill)", padding: 6, boxShadow: "var(--shadow-card)" }}>
            {[["desktop", "Desktop"], ["mobile", "Mobile"]].map(([id, label]) => (
              <button key={id} onClick={() => setPreviewDevice(id)} style={{ padding: "7px 16px", border: "none", cursor: "pointer", borderRadius: 999, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, background: previewDevice === id ? "var(--brand)" : "transparent", color: previewDevice === id ? "#fff" : "var(--text-secondary)" }}>{label}</button>
            ))}
            <span style={{ width: 1, height: 22, background: "var(--divider)" }} />
            <button onClick={() => exportMenu(liveRestaurant, liveMenu)} style={{ padding: "7px 14px", border: "none", cursor: "pointer", borderRadius: 999, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, background: "transparent", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}><Download size={14} />Print view</button>
            <button onClick={() => setShowPreview(false)} className="dm-iconbtn" style={{ width: 32, height: 32 }}><X size={17} /></button>
          </div>
          <div className="dm-modal-pop" style={{ position: "relative", width: "100%", maxWidth: previewDevice === "mobile" ? 390 : 760, maxHeight: "84vh", overflowY: "auto", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-modal)", transition: "max-width 0.2s" }}>
            <MenuPreview restaurant={liveRestaurant} menu={liveMenu} device={previewDevice} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Item Editor Modal ──────────────────────────────────────────────────────
function ItemEditorModal({ editing, onClose, onSave }) {
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    price: editing?.price ?? "",
    image: editing?.image ?? null,
    available: editing?.available ?? true,
    featured: editing?.featured ?? false,
    tags: editing?.tags ?? [],
  });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleTag = (id) => setForm(prev => ({ ...prev, tags: prev.tags.includes(id) ? prev.tags.filter(t => t !== id) : [...prev.tags, id] }));
  const submit = () => onSave({ ...form, price: Number(form.price) || 0 });

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(10,15,30,0.5)", backdropFilter: "blur(2px)" }} />
      <div className="dm-card dm-modal-pop" style={{ position: "relative", width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-modal)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--divider)" }}>
          <h3 className="dm-h3">{editing ? "Edit item" : "Add item"}</h3>
          <IconBtn onClick={onClose}><X size={20} /></IconBtn>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <Input label="Item name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Mutton Karahi" />
          <Input label="Description" multiline value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the dish (max 300 characters)" />
          <div style={{ maxWidth: 200 }}><Input label="Price (₨)" prefix="₨" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0" /></div>
          <div>
            <span className="dm-field__label" style={{ display: "block", marginBottom: 10 }}>Tags</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ITEM_TAGS.map(t => {
                const on = form.tags.includes(t.id);
                return (
                  <button key={t.id} onClick={() => toggleTag(t.id)} style={{ cursor: "pointer", padding: "7px 13px", borderRadius: "var(--radius-pill)", fontFamily: "var(--font-body)", fontSize: 13, border: on ? "1px solid var(--brand)" : "1px solid var(--border)", background: on ? "var(--surface-tint)" : "var(--white)", color: on ? "var(--brand)" : "var(--text-primary)" }}>{t.label}</button>
                );
              })}
            </div>
          </div>
          <div>
            <span className="dm-field__label" style={{ display: "block", marginBottom: 10 }}>Photo</span>
            {form.image ? (
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ width: 96, height: 96, borderRadius: "var(--radius-md)", backgroundImage: `url(${form.image})`, backgroundSize: "cover" }} />
                <Btn variant="secondary" size="sm" onClick={() => set("image", null)}>Remove photo</Btn>
              </div>
            ) : (
              <div style={{ border: "2px dashed var(--border)", borderRadius: "var(--radius-md)", padding: "28px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                <Camera size={28} color="var(--text-secondary)" style={{ margin: "0 auto 10px", display: "block" }} />
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Click to upload or drag here</div>
                <div className="dm-small" style={{ marginTop: 4 }}>JPG, PNG or WEBP · max 2MB</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            <Switch label="Available on menu" checked={form.available} onChange={v => set("available", v)} />
            <Switch label="Highlight as featured" checked={form.featured} onChange={v => set("featured", v)} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "18px 24px", borderTop: "1px solid var(--divider)" }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={submit} disabled={!form.name.trim()}>Save item</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Review reply card (shared by restaurant + item reviews) ──────────────────
function ReviewCard({ review, onReply }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(review.reply ?? "");
  return (
    <div style={{ paddingBottom: 18, borderBottom: "1px solid var(--divider)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <Avatar src={review.avatar} name={review.name} size={40} />
        <div><div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>{review.name}</div><div className="dm-small">{review.date}</div></div>
        <div style={{ marginLeft: "auto" }}><Rating value={review.rating} showNumber={false} /></div>
      </div>
      <p className="dm-body" style={{ margin: 0 }}>{review.text}</p>
      {review.photos.length > 0 && <div style={{ display: "flex", gap: 8, marginTop: 10 }}>{review.photos.map((p, i) => <div key={i} style={{ width: 72, height: 72, borderRadius: "var(--radius-md)", backgroundImage: `url(${p})`, backgroundSize: "cover", flexShrink: 0 }} />)}</div>}
      {review.reply && !open && (
        <div style={{ marginTop: 12, marginLeft: 20, padding: 12, background: "var(--surface-muted)", borderRadius: "var(--radius-md)" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>🏪 You replied</div>
          <p className="dm-small" style={{ margin: 0, color: "var(--text-primary)" }}>{review.reply}</p>
        </div>
      )}
      {open ? (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <Input multiline value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply to this customer…" />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" onClick={() => { onReply(text); setOpen(false); }}>Save reply</Btn>
            <Btn size="sm" variant="ghost" onClick={() => { setText(review.reply ?? ""); setOpen(false); }}>Cancel</Btn>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--brand)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>
          <Reply size={14} /> {review.reply ? "Edit reply" : "Reply"}
        </button>
      )}
    </div>
  );
}

// ─── Restaurant Dashboard ─────────────────────────────────────────────────────
// The post-login home for restaurant owners. Lists their menus, lets them edit /
// duplicate / delete / preview / export each one, manages customer reviews
// (restaurant + item level), and shows analytics.
function DashboardScreen({ data, onEditMenu, onAddMenu, onCreateRestaurant }) {
  const [tab, setTab] = useState("menus");
  const [selectedId, setSelectedId] = useState(data[0]?.id ?? null);
  const [preview, setPreview] = useState(null);
  const [share, setShare] = useState(null);

  // Keep selection valid as the store changes (e.g. after deleting a restaurant).
  const restaurant = data.find(r => r.id === selectedId) ?? data[0];

  // Empty state — the "user has no restaurant yet → create" branch of the PRD.
  if (!restaurant) {
    return (
      <div className="page-enter" style={{ background: "var(--surface-page)", minHeight: "100vh" }}>
        <div className="dm-wrap" style={{ maxWidth: 720, margin: "0 auto", padding: "96px 32px", textAlign: "center" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--surface-tint)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}><Store size={40} color="var(--brand)" /></div>
          <h1 className="dm-h1" style={{ marginBottom: 12 }}>Create your first restaurant</h1>
          <p className="dm-body-lg" style={{ color: "var(--text-secondary)", margin: "0 auto 28px", maxWidth: 460 }}>You don't have a restaurant yet. Set one up to start building and managing beautiful menus.</p>
          <Btn size="lg" icon={<Plus size={18} />} onClick={onCreateRestaurant}>Create restaurant & first menu</Btn>
        </div>
      </div>
    );
  }

  const allReviews = restaurant.reviews;
  const itemsWithReviews = restaurant.menus.flatMap(m => m.sections.flatMap(s => s.items.filter(i => i.reviews.length).map(i => ({ menu: m, item: i }))));

  // Analytics (derived from stored + seeded data)
  const totalViews = restaurant.menus.reduce((n, m) => n + (m.views || 0), 0);
  const totalMenus = restaurant.menus.length;
  const totalItems = restaurant.menus.reduce((n, m) => n + m.sections.reduce((k, s) => k + s.items.length, 0), 0);
  const ratings = allReviews.map(r => r.rating);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const popular = restaurant.menus
    .flatMap(m => m.sections.flatMap(s => s.items))
    .filter(i => (i.views || 0) > 0)
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);
  const maxViews = popular[0]?.views || 1;
  const dist = [5, 4, 3, 2, 1].map(stars => ({ stars, count: ratings.filter(r => r === stars).length }));

  return (
    <div className="page-enter" style={{ background: "var(--surface-page)", minHeight: "100vh" }}>
      {/* Header */}
      <section style={{ background: "var(--grad-navy)", padding: "40px 32px 28px" }}>
        <div className="dm-wrap" style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "var(--radius-lg)", backgroundImage: `url(${restaurant.coverImage})`, backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0 }} />
              <div>
                <span className="dm-badge dm-badge--teal" style={{ marginBottom: 8, display: "inline-flex" }}>🏪 Restaurant Dashboard</span>
                <h1 className="dm-h1" style={{ color: "var(--white)", margin: 0 }}>{restaurant.name}</h1>
                <div style={{ color: "var(--text-on-dark)", opacity: 0.7, fontSize: 14, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} color="var(--white)" /> {restaurant.area} · {restaurant.menus.length} {restaurant.menus.length === 1 ? "menu" : "menus"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {data.length > 1 && (
                <select className="dm-input" value={restaurant.id} onChange={e => setSelectedId(e.target.value)} style={{ height: 44, width: "auto", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                  {data.map(r => <option key={r.id} value={r.id}>{r.name || "Untitled"}</option>)}
                </select>
              )}
              <Btn variant="outline-light" icon={<Plus size={16} />} onClick={onCreateRestaurant}>New restaurant</Btn>
            </div>
          </div>
          {/* Tabs */}
          <div className="dm-tabs dm-dash-tabs dm-no-scrollbar" style={{ marginTop: 24, borderBottom: "none", overflowX: "auto" }}>
            {[["menus", "My Menus", <LayoutGrid key="a" size={15} />], ["reviews", "Reviews & Comments", <MessageSquare key="b" size={15} />], ["analytics", "Analytics", <BarChart3 key="c" size={15} />]].map(([id, label, icon]) => (
              <button key={id} onClick={() => setTab(id)} className={["dm-tab", tab === id ? "dm-tab--active" : ""].join(" ")} style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>{icon}{label}</button>
            ))}
          </div>
        </div>
      </section>

      <div className="dm-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 32px 96px" }}>
        {/* ── My Menus ── */}
        {tab === "menus" && (
          <div className="dm-grid-3">
            {restaurant.menus.map(menu => {
              const items = menu.sections.reduce((n, s) => n + s.items.length, 0);
              const t = themeOf(menu.themeId);
              return (
                <div key={menu.id} className="dm-card" style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ height: 96, position: "relative", backgroundImage: `url(${restaurant.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,15,30,0.7), transparent)" }} />
                    <div className="dm-swatch" style={{ position: "absolute", top: 10, left: 10 }}><span style={{ background: t.colors.bg }} /><span style={{ background: t.colors.accent }} /><span style={{ background: t.colors.text }} /></div>
                    <div style={{ position: "absolute", bottom: 8, left: 12, color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{menu.name}</div>
                  </div>
                  <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                    <div className="dm-small" style={{ display: "flex", gap: 12 }}>
                      <span>{menu.sections.length} sections</span><span>·</span><span>{items} items</span><span>·</span><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Eye size={13} /> {(menu.views || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: "auto" }}>
                      <Btn size="sm" icon={<Pencil size={14} />} onClick={() => onEditMenu(restaurant.id, menu.id)}>Edit</Btn>
                      <Btn size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => setPreview({ restaurant, menu })}>Preview</Btn>
                      <Btn size="sm" variant="secondary" icon={<Share2 size={14} />} onClick={() => setShare({ restaurant, menu })}>Share</Btn>
                      <Btn size="sm" variant="secondary" icon={<Download size={14} />} onClick={() => exportMenu(restaurant, menu)}>Export</Btn>
                      <Btn size="sm" variant="secondary" icon={<Copy size={14} />} onClick={() => { const c = duplicateMenu(restaurant.id, menu.id); if (c) onEditMenu(restaurant.id, c.id); }}>Duplicate</Btn>
                    </div>
                    <button onClick={() => { if (confirm(`Delete "${menu.name}"? This can't be undone.`)) deleteMenu(restaurant.id, menu.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red-500)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center" }}><Trash2 size={13} /> Delete menu</button>
                  </div>
                </div>
              );
            })}
            {/* Add menu */}
            <button onClick={() => onAddMenu(restaurant.id)} style={{ minHeight: 240, border: "2px dashed var(--border)", borderRadius: "var(--radius-xl)", background: "transparent", cursor: "pointer", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--surface-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={24} color="var(--brand)" /></div>
              Create a new menu
            </button>
          </div>
        )}

        {/* ── Reviews & Comments ── */}
        {tab === "reviews" && (
          <div className="dm-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            <div>
              <h2 className="dm-h2" style={{ marginBottom: 4 }}>Restaurant reviews</h2>
              <p className="dm-small" style={{ marginBottom: 20 }}>{allReviews.length} reviews · reply to build trust with diners.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {allReviews.length === 0 && <p className="dm-body" style={{ color: "var(--text-secondary)" }}>No restaurant reviews yet.</p>}
                {allReviews.map(rv => <ReviewCard key={rv.id} review={rv} onReply={text => replyToReview(restaurant.id, rv.id, text)} />)}
              </div>
            </div>
            <div>
              <h2 className="dm-h2" style={{ marginBottom: 4 }}>Menu item reviews</h2>
              <p className="dm-small" style={{ marginBottom: 20 }}>Comments left on individual dishes.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                {itemsWithReviews.length === 0 && <p className="dm-body" style={{ color: "var(--text-secondary)" }}>No item reviews yet.</p>}
                {itemsWithReviews.map(({ menu, item }) => (
                  <div key={item.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>{item.name}</div>
                      <span className="dm-tag" style={{ fontSize: 11 }}>{menu.name}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingLeft: 4 }}>
                      {item.reviews.map(rv => <ReviewCard key={rv.id} review={rv} onReply={text => replyToItemReview(restaurant.id, menu.id, item.id, rv.id, text)} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Analytics ── */}
        {tab === "analytics" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div className="dm-grid-4">
              {[
                { label: "Total menu views", value: totalViews.toLocaleString(), icon: <Eye size={18} color="var(--brand)" /> },
                { label: "Menus", value: String(totalMenus), icon: <LayoutGrid size={18} color="var(--brand)" /> },
                { label: "Menu items", value: String(totalItems), icon: <Store size={18} color="var(--brand)" /> },
                { label: "Avg. rating", value: avgRating ? avgRating.toFixed(1) : "—", icon: <Star size={18} fill="var(--accent-gold)" color="var(--accent-gold)" /> },
              ].map(c => (
                <div key={c.label} className="dm-card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>{c.icon}<span className="dm-small">{c.label}</span></div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 32, letterSpacing: "-1px" }}>{c.value}</div>
                </div>
              ))}
            </div>

            <div className="dm-stack-mobile" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>
              <div className="dm-card" style={{ padding: 24 }}>
                <h3 className="dm-h3" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}><TrendingUp size={18} color="var(--brand)" /> Most popular items</h3>
                {popular.length === 0 ? <p className="dm-small">No view data yet.</p> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {popular.map(it => (
                      <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 130, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</span>
                        <div style={{ flex: 1, height: 10, borderRadius: 999, background: "var(--surface-muted)", overflow: "hidden" }}>
                          <div style={{ width: `${Math.round(((it.views || 0) / maxViews) * 100)}%`, height: "100%", background: "var(--brand)" }} />
                        </div>
                        <span className="dm-small" style={{ width: 56, textAlign: "right" }}>{(it.views || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="dm-card" style={{ padding: 24 }}>
                <h3 className="dm-h3" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}><Star size={18} fill="var(--accent-gold)" color="var(--accent-gold)" /> Rating breakdown</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dist.map(d => (
                    <div key={d.stars} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="dm-small" style={{ width: 12 }}>{d.stars}</span>
                      <Star size={13} fill="var(--accent-gold)" color="var(--accent-gold)" />
                      <div style={{ flex: 1, height: 8, borderRadius: 999, background: "var(--surface-muted)", overflow: "hidden" }}>
                        <div style={{ width: `${ratings.length ? Math.round((d.count / ratings.length) * 100) : 0}%`, height: "100%", background: "var(--accent-gold)" }} />
                      </div>
                      <span className="dm-small" style={{ width: 24, textAlign: "right" }}>{d.count}</span>
                    </div>
                  ))}
                </div>
                <p className="dm-small" style={{ marginTop: 16 }}>Based on {ratings.length} restaurant reviews.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={() => setPreview(null)} style={{ position: "absolute", inset: 0, background: "rgba(10,15,30,0.6)", backdropFilter: "blur(4px)" }} />
          <div className="dm-modal-pop" style={{ position: "relative", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-modal)" }}>
            <button onClick={() => setPreview(null)} className="dm-iconbtn dm-iconbtn--glass" style={{ position: "absolute", top: 14, right: 14, zIndex: 2 }}><X size={18} /></button>
            <MenuPreview restaurant={preview.restaurant} menu={preview.menu} />
            <div style={{ display: "flex", gap: 10, padding: 16, background: "var(--white)" }}>
              <Btn full icon={<Download size={16} />} onClick={() => exportMenu(preview.restaurant, preview.menu)}>Export / Save as PDF</Btn>
              <Btn full variant="secondary" icon={<Pencil size={16} />} onClick={() => { const p = preview; setPreview(null); onEditMenu(p.restaurant.id, p.menu.id); }}>Edit</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {share && <ShareModal restaurant={share.restaurant} menu={share.menu} onClose={() => setShare(null)} />}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [prevScreen, setPrevScreen] = useState("home");
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favourites, setFavourites] = useState(new Set());
  const [showLocation, setShowLocation] = useState(false);
  const [location, setLocation] = useState({ countryId: "pk", cityId: "lahore", area: null });
  const [builderTarget, setBuilderTarget] = useState(null);
  const [shared, setShared] = useState(null); // decoded public menu from a #menu= share link
  const router = useRouter();
  const authed = useAuthed();
  const ownerData = useOwnerData();

  // On first authenticated session, seed a demo restaurant so the dashboard
  // immediately shows existing menus to view/edit (rather than looking empty).
  useEffect(() => {
    if (authed) seedIfEmpty();
  }, [authed]);

  // After returning from the /login page, an optional `?screen=` param tells us
  // which screen to land on. The menu builder needs a specific restaurant+menu
  // target, so a bare `?screen=menu-builder` falls back to the dashboard.
  useEffect(() => {
    // A share link encodes the menu in the hash (`#menu=…`) — decode and show
    // the public read-only view, bypassing the normal app entirely.
    const hash = window.location.hash || "";
    if (hash.startsWith(`#${SHARE_PREFIX}`)) {
      const decoded = decodeSnapshot(hash.slice(SHARE_PREFIX.length + 1));
      if (decoded) { setShared(decoded); return; }
    }
    const target = new URLSearchParams(window.location.search).get("screen");
    if (target) {
      setScreen(target === "menu-builder" ? "dashboard" : target);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Smart location: on first open, ask for GPS and map it to the nearest area.
  // Silently falls back to the default (manual) location if denied/unavailable.
  useEffect(() => {
    let cancelled = false;
    getGeoPosition()
      .then(({ lat, lng }) => {
        if (cancelled) return;
        const m = nearestArea(lat, lng);
        setLocation({ countryId: m.countryId, cityId: m.cityId, area: m.area });
      })
      .catch(() => { /* manual fallback — keep default */ });
    return () => { cancelled = true; };
  }, []);

  const nav = (s) => { setPrevScreen(screen); setScreen(s); };
  const openRestaurant = (r) => { setActiveRestaurant(r); nav("restaurant"); };
  const doSearch = (q) => { setSearchQuery(q); nav("search"); };
  const goLogin = (redirect = "/") => router.push(`/login?mode=login&redirect=${encodeURIComponent(redirect)}`);
  const signOut = () => { setAuthed(false); setFavourites(new Set()); nav("home"); };

  // Owner dashboard / builder navigation
  const goDashboard = () => { if (!authed) { goLogin("/?screen=dashboard"); return; } nav("dashboard"); };
  const editMenu = (restaurantId, menuId) => { setBuilderTarget({ restaurantId, menuId }); nav("menu-builder"); };
  const createNewRestaurant = () => { const r = createRestaurant(); editMenu(r.id, r.menus[0].id); };
  const addMenuTo = (restaurantId) => { const m = addMenu(restaurantId); editMenu(restaurantId, m.id); };
  const toggleFav = (id) => {
    if (!authed) { goLogin(); return; }
    setFavourites(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // Derived location
  const currentCountry = COUNTRIES.find(c => c.id === location.countryId) ?? COUNTRIES[0];
  const currentCity = currentCountry.cities.find(c => c.id === location.cityId) ?? currentCountry.cities[0];
  const cityAreas = new Set(currentCity.areas.map(a => a.name));
  const cityName = currentCity.name;
  const locationLabel = location.area ? `${location.area}, ${currentCity.name}` : `${currentCity.name}, ${currentCountry.name}`;

  const chrome = screen !== "menu-builder";

  // Public share view takes over the whole screen (no navbar/FAB).
  if (shared) {
    return (
      <PublicMenuScreen
        restaurant={shared.restaurant}
        menu={shared.menu}
        onExit={() => { window.history.replaceState(null, "", window.location.pathname); setShared(null); setScreen("home"); }}
      />
    );
  }

  return (
    <>
      {chrome && (
        <Navbar active={screen} onNav={nav} authed={authed} onSignOut={signOut} onSignIn={() => goLogin("/?screen=dashboard")} onDashboard={goDashboard} locationLabel={locationLabel} onPickLocation={() => setShowLocation(true)} />
      )}

      {screen === "home" && (
        <HomeScreen onOpenRestaurant={openRestaurant} onSearch={doSearch} onDiscounts={() => nav("discounts")} favourites={favourites} onToggleFav={toggleFav} locationLabel={locationLabel} cityName={cityName} area={location.area} cityAreas={cityAreas} onPickLocation={() => setShowLocation(true)} />
      )}
      {screen === "search" && (
        <SearchScreen query={searchQuery} onOpenRestaurant={openRestaurant} favourites={favourites} onToggleFav={toggleFav} />
      )}
      {screen === "restaurant" && activeRestaurant && (
        <RestaurantScreen r={activeRestaurant} onBack={() => nav(prevScreen)} favourite={favourites.has(activeRestaurant.id)} onToggleFav={() => toggleFav(activeRestaurant.id)} />
      )}
      {screen === "discounts" && (
        <DiscountsScreen onOpenRestaurant={openRestaurant} favourites={favourites} onToggleFav={toggleFav} />
      )}
      {screen === "dashboard" && (
        <DashboardScreen data={ownerData} onEditMenu={editMenu} onAddMenu={addMenuTo} onCreateRestaurant={createNewRestaurant} />
      )}
      {screen === "menu-builder" && builderTarget && (
        <MenuBuilderScreen target={builderTarget} onExit={() => nav("dashboard")} onBack={() => nav("dashboard")} />
      )}

      {showLocation && (
        <LocationPicker initial={location} onClose={() => setShowLocation(false)} onConfirm={l => { setLocation(l); setShowLocation(false); }} />
      )}

      {/* My Menus CTA — bottom corner (owners manage everything from the dashboard) */}
      {chrome && screen !== "dashboard" && (
        <button className="dm-fab" onClick={goDashboard} style={{ position: "fixed", bottom: 32, right: 32, zIndex: 90, display: "flex", alignItems: "center", gap: 10, padding: "14px 22px", borderRadius: "var(--radius-pill)", background: "var(--grad-navy)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, boxShadow: "var(--shadow-float)" }}>
          🍽️ {authed ? "My Menus" : "Menu Builder"}
        </button>
      )}
    </>
  );
}
