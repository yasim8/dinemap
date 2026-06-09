"use client";
import React from "react";
import {
  Search, MapPin, Heart, Star, ChevronDown, ChevronRight, ChevronLeft,
  ArrowRight, Share2, X, Plus, Check, Sliders, User, UtensilsCrossed,
  Home, CreditCard, Percent, Phone, Clock, Bookmark, Flame, Map, List,
  Grip, Eye, Pencil, Trash2, Camera, BookmarkPlus, GripVertical,
  LayoutGrid, BarChart3, MessageSquare, Download, Copy, FileText,
  TrendingUp, Reply, Store, Palette, ExternalLink
} from "lucide-react";

export { Search, MapPin, Heart, Star, ChevronDown, ChevronRight, ChevronLeft, ArrowRight, Share2, X, Plus, Check, Sliders, User, UtensilsCrossed, Home, CreditCard, Percent, Phone, Clock, Bookmark, Flame, Map, List, Grip, Eye, Pencil, Trash2, Camera, BookmarkPlus, GripVertical, LayoutGrid, BarChart3, MessageSquare, Download, Copy, FileText, TrendingUp, Reply, Store, Palette, ExternalLink };

export function rupee(n) {
  return `₨${n.toLocaleString("en-PK")}`;
}
export function formatDistance(m) {
  if (m < 1000) return `${Math.round(m / 10) * 10}m away`;
  return `${(m / 1000).toFixed(1)} km away`;
}

export function Logo({ light = false, size = 28 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: size, height: size, background: "var(--brand)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MapPin size={size * 0.6} color="#fff" strokeWidth={2.5} />
      </span>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: size * 0.65, letterSpacing: "-1px" }}>
        <span style={{ color: light ? "var(--text-on-dark)" : "var(--ink-900)" }}>Dine</span>
        <span style={{ color: "var(--brand)" }}>Map</span>
      </span>
    </span>
  );
}

export function Rating({ value, count, showNumber = true, size = 14 }) {
  return (
    <span className="dm-rating">
      {showNumber && <span className="dm-rating__num">{value.toFixed(1)}</span>}
      <span style={{ display: "inline-flex", gap: 2 }}>
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={size} fill={i <= Math.round(value) ? "var(--accent-gold)" : "none"} color="var(--accent-gold)" strokeWidth={1.5} />
        ))}
      </span>
      {count !== undefined && <span className="dm-rating__count">({count.toLocaleString()})</span>}
    </span>
  );
}

export function PriceRange({ level }) {
  return (
    <span className="dm-pricerange">
      {[1,2,3].map(i => <span key={i} className={i <= level ? "on" : "off"}>₨</span>)}
    </span>
  );
}

export function Avatar({ src, name, size = 44 }) {
  const letter = (name || "?")[0].toUpperCase();
  return (
    <span className="dm-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {src ? <img src={src} alt={name} /> : letter}
    </span>
  );
}

export function Btn({ variant = "primary", size: sz = "md", full, icon, iconRight, children, className = "", ...rest }) {
  return (
    <button className={["dm-btn", `dm-btn--${variant}`, sz === "sm" ? "dm-btn--sm" : sz === "lg" ? "dm-btn--lg" : "", full ? "dm-btn--full" : "", className].filter(Boolean).join(" ")} {...rest}>
      {icon}{children}{iconRight}
    </button>
  );
}

export function IconBtn({ variant = "default", active, children, ...rest }) {
  return (
    <button className={["dm-iconbtn", variant !== "default" ? `dm-iconbtn--${variant}` : "", active ? "dm-iconbtn--active" : ""].filter(Boolean).join(" ")} {...rest}>
      {children}
    </button>
  );
}

export function Badge({ tone = "discount", children }) {
  return <span className={`dm-badge dm-badge--${tone}`}>{children}</span>;
}

export function Tag({ glass, children }) {
  return <span className={["dm-tag", glass ? "dm-tag--glass" : ""].filter(Boolean).join(" ")}>{children}</span>;
}

export function Pill({ active, children, ...rest }) {
  return (
    <button className={["dm-pill", active ? "dm-pill--active" : ""].filter(Boolean).join(" ")} {...rest}>
      {children}
    </button>
  );
}

export function SearchInput({ onSearch, defaultVal = "" }) {
  const [val, setVal] = React.useState(defaultVal);
  return (
    <div className="dm-search">
      <Search size={22} className="dm-search__icon" />
      <input
        className="dm-search__input"
        placeholder="Search restaurants, dishes, cuisines..."
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && onSearch) onSearch(val); }}
      />
      <Btn onClick={() => onSearch && onSearch(val)}>Search</Btn>
    </div>
  );
}

export function Switch({ label, checked, onChange }) {
  return (
    <label className="dm-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="dm-switch__track" />
      <span className="dm-switch__thumb" />
      {label && <span className="dm-switch__label">{label}</span>}
    </label>
  );
}

export function Input({ label, hint, prefix, multiline, ...rest }) {
  const field = multiline
    ? <textarea className="dm-input dm-textarea" {...rest} />
    : prefix
      ? <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <span style={{ position: "absolute", left: 14, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text-secondary)", pointerEvents: "none" }}>{prefix}</span>
          <input className="dm-input" style={{ paddingLeft: 30 }} {...rest} />
        </span>
      : <input className="dm-input" {...rest} />;

  if (!label && !hint) return field;
  return (
    <label className="dm-field">
      {label && <span className="dm-field__label">{label}</span>}
      {field}
      {hint && <span className="dm-field__hint">{hint}</span>}
    </label>
  );
}
