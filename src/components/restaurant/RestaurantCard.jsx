"use client";
import { Heart, MapPin, ArrowRight, Percent } from "lucide-react";
import { Rating, PriceRange, Tag, Badge, IconBtn, rupee, formatDistance } from "@/components/ui";

export function RestaurantCard({ r, favourite, onToggleFav, onClick }) {
  const letter = r.name[0].toUpperCase();
  return (
    <div className="dm-card dm-card--interactive" onClick={onClick}>
      <div style={{ position: "relative", aspectRatio: "16/9" }}>
        {r.image
          ? <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${r.image})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "var(--img-warm-overlay)", backgroundBlendMode: "multiply" }} />
          : <div className="dm-fallback" style={{ position: "absolute", inset: 0, fontSize: 56 }}>{letter}</div>
        }
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <IconBtn variant="glass" active={favourite} onClick={(e) => { e.stopPropagation(); onToggleFav?.(); }}>
            <Heart size={18} fill={favourite ? "var(--brand)" : "none"} color={favourite ? "var(--brand)" : "currentColor"} />
          </IconBtn>
        </div>
        <div style={{ position: "absolute", top: 12, right: 12 }}>
          <Badge tone={r.open ? "open" : "closed"}>{r.open ? "Open Now" : "Closed"}</Badge>
        </div>
        {r.discount && (
          <div style={{ position: "absolute", bottom: 12, left: 12 }}>
            <Badge tone="discount"><Percent size={11} />{r.discount.percent}% · {r.discount.bank}</Badge>
          </div>
        )}
      </div>
      <div style={{ padding: "16px 20px 20px" }}>
        <div className="dm-h3" style={{ marginBottom: 8 }}>{r.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Tag>{r.category}</Tag>
          <PriceRange level={r.priceLevel} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <Rating value={r.rating} count={r.reviewCount} />
          <span className="dm-small" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={13} color="var(--text-secondary)" />
            {r.open ? formatDistance(r.distanceMeters) : (r.opensAt ? `Opens ${r.opensAt}` : "Closed")}
          </span>
        </div>
        <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6, overflow: "hidden" }}>
            {r.cuisines.slice(0, 2).map(c => <Tag key={c}>{c}</Tag>)}
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--brand)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" }}>
            View Menu <ArrowRight size={15} color="var(--brand)" />
          </span>
        </div>
      </div>
    </div>
  );
}
