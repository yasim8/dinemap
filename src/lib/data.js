export const CATEGORIES = [
  { id: "all", label: "🍽️ All" },
  { id: "desi", label: "🍛 Desi" },
  { id: "bbq", label: "🔥 BBQ" },
  { id: "chinese", label: "🍜 Chinese" },
  { id: "fastfood", label: "🍔 Fast Food" },
  { id: "cafe", label: "☕ Café" },
  { id: "desserts", label: "🍰 Desserts" },
  { id: "bakery", label: "🥐 Bakery" },
  { id: "breakfast", label: "🍳 Breakfast" },
  { id: "seafood", label: "🦐 Seafood" },
  { id: "pizza", label: "🍕 Pizza" },
  { id: "healthy", label: "🥗 Healthy" },
];

export const BANKS = [
  { id: "hbl", name: "HBL", color: "#006F3C", count: 48 },
  { id: "meezan", name: "Meezan", color: "#1C3E7D", count: 36 },
  { id: "ubl", name: "UBL", color: "#C8102E", count: 29 },
  { id: "mcb", name: "MCB", color: "#004B93", count: 21 },
  { id: "alfalah", name: "Bank Alfalah", color: "#E4002B", count: 18 },
  { id: "standardchartered", name: "Standard Chartered", color: "#0473EA", count: 14 },
];

// Country → City → Area hierarchy for the discovery & builder flows.
// Each area carries an approximate centre coordinate so we can map a GPS
// reading to the nearest predefined area (the "smart location" system).

export const COUNTRIES = [
  {
    id: "pk", name: "Pakistan", flag: "🇵🇰",
    cities: [
      { id: "lahore", name: "Lahore", areas: [
        { name: "Gulberg III", lat: 31.5167, lng: 74.3436 },
        { name: "DHA Phase 6", lat: 31.4704, lng: 74.4089 },
        { name: "DHA Phase 4", lat: 31.4759, lng: 74.3920 },
        { name: "Johar Town", lat: 31.4697, lng: 74.2728 },
        { name: "Liberty Market", lat: 31.5101, lng: 74.3478 },
        { name: "Anarkali", lat: 31.5722, lng: 74.3095 },
        { name: "Model Town", lat: 31.4848, lng: 74.3232 },
        { name: "Bahria Town", lat: 31.3680, lng: 74.1810 },
        { name: "Shahdara", lat: 31.6300, lng: 74.2800 },
      ] },
      { id: "karachi", name: "Karachi", areas: [
        { name: "Clifton", lat: 24.8138, lng: 67.0300 },
        { name: "DHA Phase 5", lat: 24.7920, lng: 67.0640 },
        { name: "Zamzama", lat: 24.8160, lng: 67.0380 },
        { name: "Tariq Road", lat: 24.8730, lng: 67.0640 },
        { name: "Gulshan-e-Iqbal", lat: 24.9200, lng: 67.0900 },
        { name: "Bahadurabad", lat: 24.8810, lng: 67.0700 },
      ] },
      { id: "islamabad", name: "Islamabad", areas: [
        { name: "F-7 Markaz", lat: 33.7180, lng: 73.0560 },
        { name: "F-10 Markaz", lat: 33.6960, lng: 73.0120 },
        { name: "Blue Area", lat: 33.7080, lng: 73.0660 },
        { name: "Bahria Enclave", lat: 33.6800, lng: 73.1700 },
        { name: "E-11", lat: 33.7000, lng: 72.9700 },
      ] },
    ],
  },
  {
    id: "ae", name: "United Arab Emirates", flag: "🇦🇪",
    cities: [
      { id: "dubai", name: "Dubai", areas: [
        { name: "Downtown", lat: 25.1972, lng: 55.2744 },
        { name: "Dubai Marina", lat: 25.0805, lng: 55.1403 },
        { name: "JBR", lat: 25.0785, lng: 55.1340 },
        { name: "Deira", lat: 25.2710, lng: 55.3090 },
        { name: "Business Bay", lat: 25.1850, lng: 55.2650 },
        { name: "Al Barsha", lat: 25.1130, lng: 55.1960 },
      ] },
      { id: "abudhabi", name: "Abu Dhabi", areas: [
        { name: "Corniche", lat: 24.4720, lng: 54.3300 },
        { name: "Al Reem Island", lat: 24.4920, lng: 54.4060 },
        { name: "Khalifa City", lat: 24.4200, lng: 54.5760 },
        { name: "Yas Island", lat: 24.4990, lng: 54.6070 },
      ] },
    ],
  },
  {
    id: "uk", name: "United Kingdom", flag: "🇬🇧",
    cities: [
      { id: "london", name: "London", areas: [
        { name: "Soho", lat: 51.5137, lng: -0.1340 },
        { name: "Shoreditch", lat: 51.5265, lng: -0.0780 },
        { name: "Mayfair", lat: 51.5110, lng: -0.1470 },
        { name: "Camden", lat: 51.5390, lng: -0.1426 },
        { name: "Covent Garden", lat: 51.5117, lng: -0.1240 },
      ] },
      { id: "manchester", name: "Manchester", areas: [
        { name: "Northern Quarter", lat: 53.4840, lng: -2.2330 },
        { name: "Deansgate", lat: 53.4770, lng: -2.2500 },
        { name: "Spinningfields", lat: 53.4800, lng: -2.2520 },
      ] },
    ],
  },
];

// Flat list of cities (kept for convenience / discovery filters)
export const CITIES = COUNTRIES.flatMap(c => c.cities);

// Resolve which city/country an area belongs to (used for map queries & filtering)
export function locationForArea(area) {
  for (const c of COUNTRIES) {
    for (const city of c.cities) {
      if (city.areas.some(a => a.name === area)) return { city: city.name, country: c.name };
    }
  }
  return { city: "Lahore", country: "Pakistan" };
}

// Great-circle distance between two coordinates, in kilometres
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Smart mapping: given a GPS coordinate, find the closest predefined area
// and return its country / city / area plus the distance to it.
export function nearestArea(lat, lng) {
  let best = null;
  for (const c of COUNTRIES) {
    for (const city of c.cities) {
      for (const a of city.areas) {
        const distanceKm = haversineKm(lat, lng, a.lat, a.lng);
        if (!best || distanceKm < best.distanceKm) {
          best = { countryId: c.id, cityId: city.id, area: a.name, distanceKm };
        }
      }
    }
  }
  // COUNTRIES is non-empty, so best is always assigned
  return best;
}

// Tags available when authoring a menu item
export const ITEM_TAGS = [
  { id: "veg", label: "🌱 Vegetarian" },
  { id: "vegan", label: "🥬 Vegan" },
  { id: "spicy", label: "🌶️ Spicy" },
  { id: "halal", label: "☪️ Halal" },
  { id: "glutenfree", label: "🌾 Gluten-Free" },
  { id: "chefspecial", label: "⭐ Chef's Special" },
  { id: "bestseller", label: "🔥 Bestseller" },
  { id: "new", label: "🆕 New" },
];

// Themes for the menu designer. A theme is the visual base (colours + base font)
// that a template starts from; the builder's Layout step lets owners switch theme.
export const MENU_THEMES = [
  { id: "modern", name: "Modern", colors: { bg: "#FFFFFF", accent: "#FF6B2B", text: "#0A0F1E" }, font: "Sans" },
  { id: "minimal", name: "Minimalist", colors: { bg: "#FAFAF7", accent: "#1C3E7D", text: "#1A1A1A" }, font: "Sans" },
  { id: "elegant", name: "Elegant", colors: { bg: "#FBF8F3", accent: "#B08D57", text: "#2B2620" }, font: "Serif" },
  { id: "rustic", name: "Rustic", colors: { bg: "#EFE7D6", accent: "#9C4722", text: "#3B2F23" }, font: "Serif" },
  { id: "luxury", name: "Luxury", colors: { bg: "#0A0F1E", accent: "#C8A24B", text: "#FFFFFF" }, font: "Serif" },
  { id: "vintage", name: "Vintage", colors: { bg: "#F3E9D8", accent: "#8B4513", text: "#3A2A1A" }, font: "Serif" },
  { id: "cafe", name: "Café", colors: { bg: "#F5EEE3", accent: "#7B5230", text: "#3A2A1A" }, font: "Serif" },
  { id: "pizza", name: "Trattoria", colors: { bg: "#FFF8F0", accent: "#C0392B", text: "#2B1A14" }, font: "Sans" },
  { id: "bar", name: "Lounge", colors: { bg: "#14141A", accent: "#D4AF37", text: "#F4F2EC" }, font: "Serif" },
  { id: "blush", name: "Blush", colors: { bg: "#FBF3F4", accent: "#BE8A90", text: "#4A3B3D" }, font: "Serif" },
  { id: "harvest", name: "Harvest", colors: { bg: "#F3EAD9", accent: "#B5651D", text: "#3B2A18" }, font: "Serif" },
];

// ── Template library ──────────────────────────────────────────────────────────
// Pre-built starting points shown in the Template Gallery before the builder
// opens. Each template seeds a theme + a section layout (columns, headers) + a
// little sample content, so owners never start from a blank form. Sections/items
// are authored without ids; `buildMenuFromTemplate` (store) assigns them on use.
// `previewName`/`cuisine` only flavour the gallery thumbnail.
export const TEMPLATE_CATEGORIES = [
  { id: "restaurant", label: "Restaurant" },
  { id: "business", label: "Business Type" },
  { id: "event", label: "Event" },
];

const t = (name, description, price, extra = {}) => ({ name, description, price, available: true, tags: [], ...extra });

export const MENU_TEMPLATES = [
  // ── Restaurant ──
  {
    id: "modern-restaurant", name: "Modern Restaurant", category: "restaurant",
    description: "Clean, photo-friendly two-column layout for contemporary spots.",
    previewName: "The Larder", cuisine: "Contemporary · Grill", themeId: "modern",
    sections: [
      { name: "Starters", icon: "🥗", columns: 2, items: [
        t("Burrata & Heirloom Tomato", "Creamy burrata, basil oil, aged balsamic", 950, { tags: ["veg", "chefspecial"], featured: true }),
        t("Crispy Calamari", "Lightly fried, lemon aioli, charred lemon", 1100, { tags: ["bestseller"] }),
      ] },
      { name: "Main Course", icon: "🍽️", columns: 2, items: [
        t("Charred Ribeye", "300g grass-fed ribeye, peppercorn jus, fries", 3200, { tags: ["bestseller"], featured: true }),
        t("Miso Glazed Salmon", "Pan-seared salmon, sesame greens", 2400, {}),
        t("Wild Mushroom Risotto", "Arborio rice, truffle, parmesan", 1800, { tags: ["veg"] }),
      ] },
      { name: "Desserts", icon: "🍰", columns: 2, items: [
        t("Molten Chocolate Cake", "Warm centre, vanilla bean ice cream", 750, { tags: ["bestseller"] }),
        t("Lemon Tart", "Torched meringue, raspberry coulis", 700, { tags: ["veg"] }),
      ] },
    ],
  },
  {
    id: "luxury-fine-dining", name: "Luxury Fine Dining", category: "restaurant",
    description: "Dark, gold-accented single-column menu with centred headers.",
    previewName: "Maison Noir", cuisine: "Modern French", themeId: "luxury",
    design: { page: { bgGradient: "ink" }, type: { title: { font: "serif", size: 34, bold: true, italic: true } } },
    sections: [
      { name: "Hors d'Œuvres", columns: 1, header: { align: "center", uppercase: true, divider: true }, items: [
        t("Oysters Rockefeller", "Champagne mignonette, sea herbs", 1800, { featured: true }),
        t("Foie Gras Torchon", "Brioche, fig, sauternes gelée", 2200, {}),
      ] },
      { name: "Le Plat Principal", columns: 1, header: { align: "center", uppercase: true, divider: true }, items: [
        t("Châteaubriand", "Black truffle, pomme purée, bordelaise", 5600, { tags: ["chefspecial"], featured: true }),
        t("Turbot Meunière", "Brown butter, capers, confit lemon", 4200, {}),
      ] },
      { name: "Dessert", columns: 1, header: { align: "center", uppercase: true, divider: true }, items: [
        t("Grand Marnier Soufflé", "Crème anglaise, candied orange", 1400, {}),
      ] },
    ],
  },
  {
    id: "elegant-bistro", name: "Elegant Bistro", category: "restaurant",
    description: "Warm, serif, classic name-leader-price rows.",
    previewName: "Petit Jardin", cuisine: "European Bistro", themeId: "elegant",
    sections: [
      { name: "To Begin", columns: 1, items: [
        t("French Onion Soup", "Gruyère crouton, caramelised onion broth", 850, {}),
        t("Steak Tartare", "Hand-cut beef, capers, quail egg", 1400, { tags: ["chefspecial"] }),
      ] },
      { name: "Plats", columns: 1, items: [
        t("Coq au Vin", "Braised chicken, red wine, lardons", 2100, { featured: true }),
        t("Ratatouille", "Provençal stewed vegetables, herbs", 1500, { tags: ["veg", "vegan"] }),
      ] },
      { name: "Fromage & Sweet", columns: 2, items: [
        t("Cheese Board", "Three cheeses, honeycomb, walnuts", 1300, { tags: ["veg"] }),
        t("Crème Brûlée", "Tahitian vanilla, burnt sugar", 700, {}),
      ] },
    ],
  },
  // ── Business Type ──
  {
    id: "cozy-cafe", name: "Cozy Café", category: "business",
    description: "Friendly café layout — coffee, tea and light bites.",
    previewName: "Bean & Bloom", cuisine: "Café · Brunch", themeId: "cafe",
    sections: [
      { name: "Coffee", icon: "☕", columns: 2, items: [
        t("Flat White", "Double ristretto, silky microfoam", 450, { tags: ["bestseller"] }),
        t("Cold Brew", "18-hour steep, over ice", 480, {}),
        t("Spiced Chai Latte", "House masala, steamed milk", 420, {}),
      ] },
      { name: "Tea", icon: "🍵", columns: 2, items: [
        t("Earl Grey", "Bergamot, loose leaf", 350, { tags: ["veg"] }),
        t("Moroccan Mint", "Fresh mint, gunpowder green", 380, { tags: ["veg"] }),
      ] },
      { name: "Light Bites", icon: "🥐", columns: 2, items: [
        t("Butter Croissant", "Baked fresh each morning", 320, { tags: ["veg"] }),
        t("Avocado Toast", "Sourdough, chilli, lime, feta", 780, { tags: ["veg"], featured: true }),
      ] },
    ],
  },
  {
    id: "pizza-parlor", name: "Pizza Parlor", category: "business",
    description: "Bold trattoria menu for a wood-fired pizza joint.",
    previewName: "Forno Rosso", cuisine: "Italian · Pizza", themeId: "pizza",
    sections: [
      { name: "Wood-Fired Pizzas", icon: "🍕", columns: 2, items: [
        t("Margherita", "San Marzano, fior di latte, basil", 1200, { tags: ["veg", "bestseller"], featured: true }),
        t("Diavola", "Spicy salami, chilli, mozzarella", 1500, { tags: ["spicy"] }),
        t("Quattro Formaggi", "Mozzarella, gorgonzola, fontina, parmesan", 1600, { tags: ["veg"] }),
      ] },
      { name: "Antipasti", icon: "🫒", columns: 2, items: [
        t("Bruschetta", "Tomato, garlic, basil, olive oil", 650, { tags: ["veg", "vegan"] }),
        t("Arancini", "Saffron risotto balls, marinara", 750, { tags: ["veg"] }),
      ] },
      { name: "Dolci", icon: "🍮", columns: 2, items: [
        t("Tiramisù", "Espresso-soaked savoiardi, mascarpone", 600, { tags: ["bestseller"] }),
      ] },
    ],
  },
  {
    id: "bar-lounge", name: "Bar & Lounge", category: "business",
    description: "Moody, gold-on-charcoal cocktail & small-plates menu.",
    previewName: "The Gilded Owl", cuisine: "Cocktail Bar", themeId: "bar",
    design: { page: { bgGradient: "ink" } },
    sections: [
      { name: "Signature Cocktails", icon: "🍸", columns: 1, header: { align: "center" }, items: [
        t("Smoked Old Fashioned", "Bourbon, bitters, applewood smoke", 1400, { featured: true }),
        t("Elderflower Spritz", "Prosecco, elderflower, soda", 1200, {}),
      ] },
      { name: "Wine & Beer", icon: "🍷", columns: 2, items: [
        t("House Red (Glass)", "Malbec, Mendoza", 900, {}),
        t("Craft IPA", "Local, hoppy, 6.2%", 700, {}),
      ] },
      { name: "Bar Bites", icon: "🥨", columns: 2, items: [
        t("Truffle Fries", "Parmesan, herbs, truffle oil", 850, { tags: ["veg", "bestseller"] }),
        t("Sliders (3)", "Wagyu beef, pickles, brioche", 1300, {}),
      ] },
    ],
  },
  // ── Event ──
  {
    id: "wedding-menu", name: "Wedding Menu", category: "event",
    description: "Soft, romantic single-column menu with centred script headers.",
    previewName: "Aisha & Omar", cuisine: "Wedding Reception", themeId: "blush",
    design: { page: { bgGradient: "cream" }, type: { title: { font: "script", size: 32, bold: false, italic: false } } },
    sections: [
      { name: "Welcome", columns: 1, header: { align: "center", uppercase: false, divider: false }, items: [
        t("Rose & Cardamom Sharbat", "Chilled welcome drink", 0, {}),
      ] },
      { name: "Starters", columns: 1, header: { align: "center", uppercase: false, divider: true }, items: [
        t("Saffron Chicken Tikka", "Char-grilled, mint chutney", 0, { featured: true }),
        t("Paneer Shashlik", "Peppers, onion, smoked", 0, { tags: ["veg"] }),
      ] },
      { name: "Main Course", columns: 1, header: { align: "center", uppercase: false, divider: true }, items: [
        t("Mutton Biryani", "Aged basmati, fried onion, raita", 0, { tags: ["bestseller"] }),
        t("Butter Chicken", "Tomato, cream, fenugreek", 0, {}),
      ] },
      { name: "Dessert Table", columns: 1, header: { align: "center", uppercase: false, divider: true }, items: [
        t("Gulab Jamun", "Warm, rose syrup", 0, {}),
        t("Kulfi Falooda", "Saffron kulfi, vermicelli", 0, {}),
      ] },
    ],
  },
  {
    id: "seasonal-specials", name: "Seasonal Specials", category: "event",
    description: "Warm harvest palette for a limited seasonal menu.",
    previewName: "Autumn Table", cuisine: "Seasonal Specials", themeId: "harvest",
    sections: [
      { name: "This Season's Picks", icon: "🍂", columns: 2, header: { align: "center" }, items: [
        t("Roast Pumpkin Soup", "Sage brown butter, toasted seeds", 700, { tags: ["veg"], featured: true }),
        t("Apple & Walnut Salad", "Maple vinaigrette, blue cheese", 850, { tags: ["veg"] }),
      ] },
      { name: "Warm Mains", icon: "🍲", columns: 2, items: [
        t("Braised Short Rib", "Root vegetables, red wine reduction", 2600, { tags: ["chefspecial"] }),
        t("Butternut Gnocchi", "Brown butter, crispy sage", 1700, { tags: ["veg"] }),
      ] },
      { name: "Seasonal Desserts", icon: "🥧", columns: 2, items: [
        t("Spiced Apple Pie", "Cinnamon crumble, clotted cream", 650, { tags: ["bestseller"] }),
      ] },
    ],
  },
];

// Font families for the typography designer. `css: null` means "inherit the
// template's base font", so switching templates restyles un-overridden text.
export const FONT_FAMILIES = [
  { id: "theme", label: "Template default", css: null },
  { id: "sans", label: "Sans", css: "var(--font-body)" },
  { id: "serif", label: "Serif", css: "Georgia, 'Times New Roman', serif" },
  { id: "display", label: "Display", css: "var(--font-display)" },
  { id: "slab", label: "Slab", css: "'Rockwell', 'Roboto Slab', Georgia, serif" },
  { id: "script", label: "Script", css: "'Segoe Script', 'Brush Script MT', cursive" },
  { id: "mono", label: "Mono", css: "'SFMono-Regular', 'Courier New', monospace" },
];

export function fontCss(id) {
  return FONT_FAMILIES.find(f => f.id === id)?.css ?? null;
}

// Background gradient presets for the menu/section background. `css: null` =
// no gradient (use the solid background colour / template background instead).
export const GRADIENT_PRESETS = [
  { id: "none", label: "None", css: null },
  { id: "sunset", label: "Sunset", css: "linear-gradient(135deg, #FF6B2B 0%, #C8243B 100%)" },
  { id: "gold", label: "Gold", css: "linear-gradient(135deg, #C8A24B 0%, #8B6B1F 100%)" },
  { id: "ink", label: "Ink", css: "linear-gradient(160deg, #0A0F1E 0%, #1C3E7D 100%)" },
  { id: "cream", label: "Cream", css: "linear-gradient(160deg, #FBF8F3 0%, #EFE2C9 100%)" },
  { id: "forest", label: "Forest", css: "linear-gradient(135deg, #234D3A 0%, #0E2A1E 100%)" },
];

export function gradientCss(id) {
  return GRADIENT_PRESETS.find(g => g.id === id)?.css ?? null;
}

// Card-type options for discount setup
export const CARD_TYPES = [
  { id: "both", label: "Credit & Debit" },
  { id: "credit", label: "Credit only" },
  { id: "debit", label: "Debit only" },
];

export const RESTAURANTS = [
  { id: "1", slug: "cafe-aylanto", name: "Café Aylanto", category: "Café", cuisines: ["Continental", "Café"], priceLevel: 3, rating: 4.7, reviewCount: 1234, distanceMeters: 850, open: true, opensAt: null, area: "Gulberg III", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80", discount: { percent: 20, bank: "HBL", bankId: "hbl", cardType: "both", minSpend: 2000, days: "All days", expires: "31 Dec 2026" }, description: "Lahore's most iconic continental restaurant. Known for premium steaks, fresh pastas and a stunning outdoor seating area.", phone: "042-111-295-268" },
  { id: "2", slug: "salt-restaurant", name: "Salt Restaurant", category: "Desi", cuisines: ["Desi", "BBQ"], priceLevel: 3, rating: 4.5, reviewCount: 876, distanceMeters: 1200, open: true, opensAt: null, area: "DHA Phase 6", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80", discount: { percent: 15, bank: "Meezan", bankId: "meezan", cardType: "credit", minSpend: 1500, days: "Weekdays", expires: "30 Jun 2026" }, description: "Premium Pakistani cuisine in a beautifully designed modern setting. Famous for Mutton Karahi and Seekh Kebabs.", phone: "042-35881026" },
  { id: "3", slug: "student-biryani", name: "Student Biryani", category: "Desi", cuisines: ["Desi", "Biryani"], priceLevel: 1, rating: 4.3, reviewCount: 3421, distanceMeters: 400, open: true, opensAt: null, area: "Liberty Market", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80", discount: null, description: "The legendary biryani house that has been feeding Lahore since 1969.", phone: "042-35761280" },
  { id: "4", slug: "burning-brownie", name: "Burning Brownie", category: "Café", cuisines: ["Desserts", "Café"], priceLevel: 2, rating: 4.6, reviewCount: 654, distanceMeters: 1800, open: false, opensAt: "5:00 PM", area: "DHA Phase 4", image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80", discount: { percent: 10, bank: "UBL", bankId: "ubl", cardType: "debit", minSpend: null, days: "Weekends", expires: "31 Mar 2026" }, description: "Artisan desserts and specialty coffee in a cosy, Instagrammable setting.", phone: "0321-4567890" },
  { id: "5", slug: "cosa-nostra", name: "Cosa Nostra", category: "Pizza", cuisines: ["Pizza", "Italian"], priceLevel: 2, rating: 4.4, reviewCount: 521, distanceMeters: 2100, open: true, opensAt: null, area: "Johar Town", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80", discount: { percent: 25, bank: "HBL", bankId: "hbl", cardType: "credit", minSpend: 1000, days: "All days", expires: "30 Sep 2026" }, description: "Authentic Italian pizzeria with wood-fired oven. Thin-crust perfection in Johar Town.", phone: "042-35236789" },
  { id: "6", slug: "waheed-kebab-house", name: "Waheed Kebab House", category: "BBQ", cuisines: ["BBQ", "Desi"], priceLevel: 1, rating: 4.8, reviewCount: 5670, distanceMeters: 3200, open: true, opensAt: null, area: "Anarkali", image: "https://images.unsplash.com/photo-1529050133030-a8afa06d5b15?w=600&q=80", discount: null, description: "Old Lahore's most celebrated kebab house. Since 1947. The seekh kebab and naan combo is legendary.", phone: "042-37312345" },
  { id: "7", slug: "the-coffee-bean", name: "The Coffee Bean & Tea Leaf", category: "Café", cuisines: ["Café", "Continental"], priceLevel: 2, rating: 4.2, reviewCount: 988, distanceMeters: 1500, open: true, opensAt: null, area: "Gulberg III", image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&q=80", discount: { percent: 15, bank: "MCB", bankId: "mcb", cardType: "both", minSpend: 800, days: "All days", expires: "31 Dec 2026" }, description: "Global coffee chain serving specialty brews, ice blends and light bites in a relaxed workspace setting.", phone: "042-35712345" },
  { id: "8", slug: "kolachi", name: "Kolachi", category: "Seafood", cuisines: ["Seafood", "Desi", "BBQ"], priceLevel: 3, rating: 4.6, reviewCount: 4210, distanceMeters: 5400, open: true, opensAt: null, area: "Clifton", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80", discount: { percent: 20, bank: "Bank Alfalah", bankId: "alfalah", cardType: "credit", minSpend: 3000, days: "Weekdays", expires: "30 Nov 2026" }, description: "Seaside dining on the Karachi coast. Famous for grilled prawns, fish and a breathtaking sunset view.", phone: "021-35870505" },
  { id: "9", slug: "howdy", name: "Howdy", category: "Fast Food", cuisines: ["Fast Food", "American"], priceLevel: 2, rating: 4.1, reviewCount: 1760, distanceMeters: 2600, open: false, opensAt: "12:00 PM", area: "F-7 Markaz", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80", discount: { percent: 10, bank: "Standard Chartered", bankId: "standardchartered", cardType: "both", minSpend: null, days: "All days", expires: "31 Jul 2026" }, description: "Texan-style smashed burgers, loaded fries and milkshakes. A capital favourite for casual hangouts.", phone: "051-2655443" },
  { id: "10", slug: "ginyaki", name: "Ginyaki", category: "Chinese", cuisines: ["Chinese", "Pan-Asian"], priceLevel: 2, rating: 4.4, reviewCount: 2340, distanceMeters: 1900, open: true, opensAt: null, area: "DHA Phase 4", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80", discount: null, description: "Beloved teppanyaki and Chinese spot. The chicken chow mein and dynamite prawns are crowd favourites.", phone: "042-35692100" },
  { id: "11", slug: "english-tea-house", name: "The English Tea House", category: "Breakfast", cuisines: ["Breakfast", "Café", "Bakery"], priceLevel: 2, rating: 4.5, reviewCount: 1432, distanceMeters: 1100, open: true, opensAt: null, area: "Gulberg III", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80", discount: { percent: 12, bank: "Meezan", bankId: "meezan", cardType: "both", minSpend: 1200, days: "Weekdays", expires: "31 Oct 2026" }, description: "Charming all-day breakfast and high-tea house with house-baked pastries and a sunlit garden.", phone: "042-35775566" },
  { id: "12", slug: "fuchsia", name: "Fuchsia Kitchen", category: "Chinese", cuisines: ["Thai", "Chinese", "Pan-Asian"], priceLevel: 3, rating: 4.3, reviewCount: 1654, distanceMeters: 2300, open: true, opensAt: null, area: "Johar Town", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=80", discount: { percent: 18, bank: "UBL", bankId: "ubl", cardType: "credit", minSpend: 2500, days: "All days", expires: "31 Dec 2026" }, description: "Upscale Thai and Pan-Asian dining. Try the Tom Yum soup, pad thai and crispy honey chilli potatoes.", phone: "042-35301212" },
];

export const MENU = [
  { id: "starters", name: "Starters", items: [
    { id: 1, name: "Mutton Soup", description: "Rich bone broth slow-cooked with whole spices and fresh herbs", price: 320, image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&q=80", vegetarian: false, spicy: false, available: true },
    { id: 2, name: "Seekh Kebab (6 pcs)", description: "Minced beef kebabs grilled on coal, served with mint chutney and naan", price: 680, image: "https://images.unsplash.com/photo-1529050133030-a8afa06d5b15?w=200&q=80", vegetarian: false, spicy: true, available: true },
    { id: 3, name: "Dahi Bhalle", description: "Fried lentil dumplings in creamy yoghurt, topped with tamarind chutney", price: 280, image: null, vegetarian: true, spicy: false, available: true },
    { id: 4, name: "Chicken Tikka (Half)", description: "Tandoor-marinated chicken, bone-in, with raita and salad", price: 850, image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=200&q=80", vegetarian: false, spicy: true, available: true },
  ]},
  { id: "mains", name: "Main Course", items: [
    { id: 5, name: "Mutton Karahi", description: "Our signature karahi — slow-cooked mutton in a tomato-based masala, finished with fresh ginger and green chilies", price: 2200, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&q=80", vegetarian: false, spicy: true, available: true },
    { id: 6, name: "Butter Chicken", description: "Tender chicken in a mild, creamy tomato sauce. Served with naan", price: 1450, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&q=80", vegetarian: false, spicy: false, available: true },
    { id: 7, name: "Dal Makhani", description: "Black lentils slow-cooked overnight with cream and butter", price: 680, image: null, vegetarian: true, spicy: false, available: true },
    { id: 8, name: "Beef Nihari", description: "Fall-off-the-bone beef shank in aromatic gravy. A Lahori Sunday morning classic", price: 1200, image: null, vegetarian: false, spicy: true, available: false },
  ]},
  { id: "breads", name: "Breads", items: [
    { id: 9, name: "Tandoori Naan", description: "Fresh from the tandoor. Plain, buttered or garlic", price: 80, image: null, vegetarian: true, spicy: false, available: true },
    { id: 10, name: "Lachha Paratha", description: "Flaky, layered whole-wheat paratha cooked in desi ghee", price: 120, image: null, vegetarian: true, spicy: false, available: true },
  ]},
  { id: "drinks", name: "Drinks", items: [
    { id: 11, name: "Kashmiri Chai (Pot)", description: "Creamy pink tea with almonds, pistachios and cardamom. Serves 2", price: 480, image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=200&q=80", vegetarian: true, spicy: false, available: true },
    { id: 12, name: "Fresh Lemon Soda", description: "Cold lemon soda with mint and black salt", price: 180, image: null, vegetarian: true, spicy: false, available: true },
  ]},
  { id: "desserts", name: "Desserts", items: [
    { id: 13, name: "Gulab Jamun (4 pcs)", description: "Soft milk-solid dumplings soaked in rose syrup, served warm", price: 280, image: null, vegetarian: true, spicy: false, available: true },
    { id: 14, name: "Shahi Tukray", description: "Fried bread pudding with reduced milk, saffron and pistachios", price: 320, image: null, vegetarian: true, spicy: false, available: true },
  ]},
];

export const REVIEWS = [
  { id: 1, name: "Ayesha Siddiqui", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80", rating: 5, date: "2 days ago", text: "The Mutton Karahi here is absolutely unmatched in Lahore. We've been coming for 3 years and the quality never dips. The ambience is warm and service is attentive. Highly recommend for family dinners!", photos: [], reply: "Thank you so much Ayesha! So glad you've been a loyal patron. See you soon! 🙏" },
  { id: 2, name: "Hassan Mirza", avatar: null, rating: 4, date: "1 week ago", text: "Great food, especially the Seekh Kebabs and Butter Chicken. Slight wait on a Friday night but worth it. The Kashmiri Chai was a lovely touch at the end.", photos: ["https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&q=80"], reply: null },
  { id: 3, name: "Fatima Malik", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80", rating: 5, date: "2 weeks ago", text: "Visited for a business lunch. Professional service, great presentation, and the food quality is top notch. The Dal Makhani was surprisingly the best dish — silky and rich.", photos: [], reply: null },
];

export const RATING_DISTRIBUTION = [
  { stars: 5, pct: 72 }, { stars: 4, pct: 18 }, { stars: 3, pct: 6 }, { stars: 2, pct: 2 }, { stars: 1, pct: 2 },
];
