import type {
  User,
  SellerProfile,
  BuyerProfile,
  Category,
  Listing,
  Auction,
  Bid,
  Order,
  PaymentProof,
  Review,
  Inquiry,
  ChatThread,
  AppNotification,
  ContentPage,
  Announcement,
  CategoryForecast,
  ForecastPoint,
} from "./types";

/* ---------- date helpers (relative so auctions are always "live") ---------- */
const now = Date.now();
const days = (n: number) => new Date(now + n * 86400000).toISOString();
const hours = (n: number) => new Date(now + n * 3600000).toISOString();

/* -------------------------------- users -------------------------------- */
export const seedUsers: User[] = [
  { id: "u-admin", name: "Dilani Wickramasinghe", email: "admin@accreagemart.lk", phone: "+94 71 111 1111", role: "admin", status: "active", avatarColor: "bg-emerald-600", createdAt: days(-320) },
  { id: "u-staff", name: "Kasun Jayasuriya", email: "staff@accreagemart.lk", phone: "+94 71 222 2222", role: "staff", status: "active", avatarColor: "bg-teal-600", createdAt: days(-300) },
  { id: "u-seller-1", name: "Sunil Bandara", email: "sunil@nuwarafresh.lk", phone: "+94 77 345 6789", role: "seller", status: "active", avatarColor: "bg-green-700", createdAt: days(-260) },
  { id: "u-seller-2", name: "Ramesh Sivakumar", email: "ramesh@jaffnafarmers.lk", phone: "+94 76 456 7890", role: "seller", status: "active", avatarColor: "bg-lime-700", createdAt: days(-210) },
  { id: "u-seller-3", name: "Chamari Herath", email: "chamari@dambullaagro.lk", phone: "+94 75 567 8901", role: "seller", status: "active", avatarColor: "bg-amber-700", createdAt: days(-180) },
  { id: "u-buyer-1", name: "Nadeesha Perera", email: "procurement@cinnamonhotels.lk", phone: "+94 77 111 2233", role: "buyer", status: "active", avatarColor: "bg-sky-700", createdAt: days(-240) },
  { id: "u-buyer-2", name: "Mohamed Rizwan", email: "sourcing@lankaexports.lk", phone: "+94 76 222 3344", role: "buyer", status: "active", avatarColor: "bg-indigo-700", createdAt: days(-190) },
  { id: "u-buyer-3", name: "Tharindu Silva", email: "buying@keellssuper.lk", phone: "+94 71 333 4455", role: "buyer", status: "active", avatarColor: "bg-violet-700", createdAt: days(-150) },
];

export const seedSellerProfiles: SellerProfile[] = [
  { id: "sp-1", userId: "u-seller-1", businessName: "Nuwara Fresh Farms", location: "Nuwara Eliya", district: "Nuwara Eliya", description: "Family-run upcountry vegetable farm supplying wholesale carrots, leeks and cabbage for over 20 years.", trustScore: 4.7, verified: true, totalSales: 182 },
  { id: "sp-2", userId: "u-seller-2", businessName: "Jaffna Farmers Collective", location: "Jaffna", district: "Jaffna", description: "Cooperative of 40+ smallholder farmers producing onions, chillies and grapes in the northern dry zone.", trustScore: 4.4, verified: true, totalSales: 126 },
  { id: "sp-3", userId: "u-seller-3", businessName: "Dambulla Agro Traders", location: "Dambulla", district: "Matale", description: "Wholesale supplier at the Dambulla Dedicated Economic Centre. Rice, maize, and seasonal vegetables in bulk.", trustScore: 4.1, verified: false, totalSales: 95 },
];

export const seedBuyerProfiles: BuyerProfile[] = [
  { id: "bp-1", userId: "u-buyer-1", businessName: "Cinnamon Hotels & Resorts", buyerType: "Hotel", location: "Colombo", verified: true },
  { id: "bp-2", userId: "u-buyer-2", businessName: "Lanka Exports Ltd", buyerType: "Exporter", location: "Katunayake", verified: true },
  { id: "bp-3", userId: "u-buyer-3", businessName: "Keells Super", buyerType: "Supermarket", location: "Colombo", verified: true },
];

/* ------------------------------ categories ------------------------------ */
export const seedCategories: Category[] = [
  { id: "cat-veg", name: "Vegetables", icon: "🥕" },
  { id: "cat-fruit", name: "Fruits", icon: "🍌" },
  { id: "cat-rice", name: "Rice & Grains", icon: "🌾" },
  { id: "cat-spice", name: "Spices", icon: "🌶️" },
  { id: "cat-coconut", name: "Coconut Products", icon: "🥥" },
  { id: "cat-tea", name: "Tea", icon: "🍃" },
  { id: "cat-fert", name: "Fertilizers", icon: "🧪" },
  { id: "cat-equip", name: "Equipment", icon: "🚜" },
];

/* ------------------------------- listings ------------------------------- */
export const seedListings: Listing[] = [
  {
    id: "l-1", sellerId: "sp-1", categoryId: "cat-veg", title: "Fresh Carrots, Grade A (Upcountry)",
    description: "Freshly harvested Nuwara Eliya carrots, washed and graded. Ideal for hotels and supermarkets. Cold-stored within 4 hours of harvest.",
    sellingType: "direct", unit: "kg", pricePerUnit: 285, aiSuggestedPrice: { min: 270, max: 300 },
    quantityAvailable: 2400, minOrderQty: 100, location: "Nuwara Eliya", district: "Nuwara Eliya",
    organic: false, certification: "SLGAP", status: "approved", image: "🥕", imageGradient: "from-orange-200 to-amber-100",
    gallery: ["from-orange-200 to-amber-100", "from-emerald-200 to-teal-100", "from-rose-200 to-pink-100"],
    createdAt: days(-12),
  },
  {
    id: "l-2", sellerId: "sp-1", categoryId: "cat-veg", title: "Leeks, Wholesale Bulk",
    description: "Premium upcountry leeks, trimmed and bundled. Consistent supply year-round.",
    sellingType: "direct", unit: "kg", pricePerUnit: 240, aiSuggestedPrice: { min: 225, max: 255 },
    quantityAvailable: 1800, minOrderQty: 50, location: "Nuwara Eliya", district: "Nuwara Eliya",
    organic: false, status: "approved", image: "🥬", imageGradient: "from-green-200 to-emerald-100", createdAt: days(-10),
    gallery: ["from-green-200 to-emerald-100", "from-amber-200 to-orange-100", "from-lime-200 to-green-100"],
  },
  {
    id: "l-3", sellerId: "sp-2", categoryId: "cat-veg", title: "Jaffna Red Onions (B-Onions)",
    description: "Authentic Jaffna red onions with strong flavour and long shelf life. Sun-dried and sorted.",
    sellingType: "auction", unit: "kg", pricePerUnit: 0, aiSuggestedPrice: { min: 320, max: 360 },
    quantityAvailable: 5000, minOrderQty: 500, location: "Jaffna", district: "Jaffna",
    organic: false, status: "approved", image: "🧅", imageGradient: "from-red-200 to-rose-100", createdAt: days(-8),
    gallery: ["from-red-200 to-rose-100", "from-sky-200 to-cyan-100", "from-violet-200 to-purple-100"],
  },
  {
    id: "l-4", sellerId: "sp-2", categoryId: "cat-spice", title: "Green Chillies, Dry Zone Harvest",
    description: "Fresh green chillies from Kilinochchi fields. High pungency, sorted for wholesale.",
    sellingType: "direct", unit: "kg", pricePerUnit: 540, aiSuggestedPrice: { min: 520, max: 580 },
    quantityAvailable: 900, minOrderQty: 25, location: "Kilinochchi", district: "Kilinochchi",
    organic: false, status: "approved", image: "🌶️", imageGradient: "from-lime-200 to-green-100", createdAt: days(-7),
    gallery: ["from-lime-200 to-green-100", "from-rose-200 to-pink-100", "from-yellow-200 to-amber-100"],
  },
  {
    id: "l-5", sellerId: "sp-3", categoryId: "cat-rice", title: "Red Raw Rice (Rathu Kekulu), 50kg Bags",
    description: "Traditional red raw rice milled in Dambulla. Sold in 50kg bags, minimum 10 bags.",
    sellingType: "direct", unit: "kg", pricePerUnit: 198, aiSuggestedPrice: { min: 190, max: 210 },
    quantityAvailable: 12000, minOrderQty: 500, location: "Dambulla", district: "Matale",
    organic: false, status: "approved", image: "🌾", imageGradient: "from-amber-200 to-yellow-100",
    gallery: ["from-amber-200 to-yellow-100", "from-lime-200 to-green-100", "from-stone-200 to-neutral-100"],
    createdAt: days(-15),
  },
  {
    id: "l-6", sellerId: "sp-3", categoryId: "cat-veg", title: "Big Onions, Imported Substitute Grade",
    description: "Locally grown big onions from Matale. Competitive alternative to imports.",
    sellingType: "auction", unit: "kg", pricePerUnit: 0, aiSuggestedPrice: { min: 240, max: 275 },
    quantityAvailable: 8000, minOrderQty: 1000, location: "Dambulla", district: "Matale",
    organic: false, status: "approved", image: "🧅", imageGradient: "from-yellow-200 to-orange-100", createdAt: days(-6),
    gallery: ["from-yellow-200 to-orange-100", "from-violet-200 to-purple-100", "from-emerald-200 to-teal-100"],
  },
  {
    id: "l-7", sellerId: "sp-1", categoryId: "cat-veg", title: "Organic Cabbage, Certified",
    description: "Certified organic cabbage grown without synthetic inputs. Ideal for export packers.",
    sellingType: "direct", unit: "kg", pricePerUnit: 320, aiSuggestedPrice: { min: 300, max: 340 },
    quantityAvailable: 1500, minOrderQty: 100, location: "Nuwara Eliya", district: "Nuwara Eliya",
    organic: true, certification: "EU Organic", status: "approved", image: "🥬", imageGradient: "from-emerald-200 to-teal-100", createdAt: days(-5),
    gallery: ["from-emerald-200 to-teal-100", "from-yellow-200 to-amber-100", "from-amber-200 to-orange-100"],
  },
  {
    id: "l-8", sellerId: "sp-2", categoryId: "cat-fruit", title: "King Coconut (Thambili), Bulk Lots",
    description: "Fresh king coconut direct from plantations. Sorted by size, delivered in crates.",
    sellingType: "auction", unit: "nut", pricePerUnit: 0, aiSuggestedPrice: { min: 95, max: 115 },
    quantityAvailable: 10000, minOrderQty: 1000, location: "Kurunegala", district: "Kurunegala",
    organic: false, status: "approved", image: "🥥", imageGradient: "from-orange-200 to-yellow-100", createdAt: days(-4),
    gallery: ["from-orange-200 to-yellow-100", "from-stone-200 to-neutral-100", "from-sky-200 to-cyan-100"],
  },
  {
    id: "l-9", sellerId: "sp-3", categoryId: "cat-rice", title: "Maize, Animal Feed Grade",
    description: "Dried maize suitable for feed mills. Moisture below 14%.",
    sellingType: "direct", unit: "kg", pricePerUnit: 145, aiSuggestedPrice: { min: 135, max: 155 },
    quantityAvailable: 20000, minOrderQty: 2000, location: "Anuradhapura", district: "Anuradhapura",
    organic: false, status: "pending", image: "🌽", imageGradient: "from-yellow-200 to-amber-100", createdAt: days(-1),
    gallery: ["from-yellow-200 to-amber-100", "from-emerald-200 to-teal-100", "from-rose-200 to-pink-100"],
  },
  {
    id: "l-10", sellerId: "sp-1", categoryId: "cat-tea", title: "Green Tea Leaves, Fresh Plucked",
    description: "Fresh two-leaves-and-a-bud plucking from smallholder gardens, for bought-leaf factories.",
    sellingType: "direct", unit: "kg", pricePerUnit: 380, aiSuggestedPrice: { min: 360, max: 400 },
    quantityAvailable: 600, minOrderQty: 50, location: "Talawakelle", district: "Nuwara Eliya",
    organic: false, status: "pending", image: "🍃", imageGradient: "from-green-200 to-lime-100", createdAt: days(-1),
    gallery: ["from-green-200 to-lime-100", "from-amber-200 to-orange-100", "from-lime-200 to-green-100"],
  },
  {
    id: "l-11", sellerId: "sp-2", categoryId: "cat-spice", title: "Ceylon Cinnamon Quills, Alba Grade",
    description: "Hand-rolled Alba grade cinnamon quills from the southern belt. Export quality.",
    sellingType: "direct", unit: "kg", pricePerUnit: 8200, aiSuggestedPrice: { min: 7800, max: 8600 },
    quantityAvailable: 300, minOrderQty: 10, location: "Galle", district: "Galle",
    organic: true, certification: "USDA Organic", status: "approved", image: "🪵", imageGradient: "from-amber-200 to-orange-100", createdAt: days(-9),
    gallery: ["from-amber-200 to-orange-100", "from-sky-200 to-cyan-100", "from-violet-200 to-purple-100"],
  },
  {
    id: "l-12", sellerId: "sp-3", categoryId: "cat-fert", title: "Compost Fertilizer, 25kg Bags",
    description: "Municipal-grade compost blended with poultry litter. Lab tested NPK values on request.",
    sellingType: "direct", unit: "bag", pricePerUnit: 1450, quantityAvailable: 800, minOrderQty: 20,
    location: "Dambulla", district: "Matale", organic: true, status: "rejected",
    rejectionReason: "Lab certification document missing. Please attach the NPK test report and resubmit.",
    image: "🧪", imageGradient: "from-stone-200 to-neutral-100", createdAt: days(-3),
    gallery: ["from-stone-200 to-neutral-100", "from-rose-200 to-pink-100", "from-yellow-200 to-amber-100"],
  },
  {
    id: "l-13", sellerId: "sp-1", categoryId: "cat-veg", title: "Tomatoes, Hybrid Greenhouse",
    description: "Greenhouse-grown hybrid tomatoes, uniform size, extended shelf life.",
    sellingType: "auction", unit: "kg", pricePerUnit: 0, aiSuggestedPrice: { min: 380, max: 430 },
    quantityAvailable: 2000, minOrderQty: 200, location: "Bandarawela", district: "Badulla",
    organic: false, status: "approved", image: "🍅", imageGradient: "from-red-200 to-orange-100", createdAt: days(-3),
    gallery: ["from-red-200 to-orange-100", "from-lime-200 to-green-100", "from-stone-200 to-neutral-100"],
  },
  {
    id: "l-14", sellerId: "sp-3", categoryId: "cat-equip", title: "Knapsack Sprayers, 16L (Lot of 50)",
    description: "Manual knapsack sprayers, 16 litre, brand new stock clearance.",
    sellingType: "direct", unit: "unit", pricePerUnit: 6900, quantityAvailable: 50, minOrderQty: 10,
    location: "Kurunegala", district: "Kurunegala", organic: false, status: "approved",
    image: "🚜", imageGradient: "from-slate-200 to-gray-100", createdAt: days(-14),
    gallery: ["from-slate-200 to-gray-100", "from-violet-200 to-purple-100", "from-emerald-200 to-teal-100"],
  },
];

/* ------------------------------- auctions ------------------------------- */
export const seedAuctions: Auction[] = [
  { id: "a-1", listingId: "l-3", minBid: 300, startTime: hours(-30), endTime: hours(6), status: "live", aiFairValue: 342 },
  { id: "a-2", listingId: "l-6", minBid: 220, startTime: hours(-4), endTime: hours(20), status: "live", aiFairValue: 258 },
  { id: "a-3", listingId: "l-8", minBid: 85, startTime: hours(30), endTime: hours(54), status: "scheduled", aiFairValue: 104 },
  { id: "a-4", listingId: "l-13", minBid: 350, startTime: hours(-52), endTime: hours(-4), status: "ended", aiFairValue: 405, winnerBidId: "b-7" },
];

export const seedBids: Bid[] = [
  { id: "b-1", auctionId: "a-1", buyerId: "bp-3", amount: 305, bidTime: hours(-26) },
  { id: "b-2", auctionId: "a-1", buyerId: "bp-1", amount: 318, bidTime: hours(-20) },
  { id: "b-3", auctionId: "a-1", buyerId: "bp-2", amount: 330, bidTime: hours(-9) },
  { id: "b-4", auctionId: "a-1", buyerId: "bp-3", amount: 336, bidTime: hours(-2) },
  { id: "b-5", auctionId: "a-2", buyerId: "bp-3", amount: 225, bidTime: hours(-3) },
  { id: "b-6", auctionId: "a-2", buyerId: "bp-1", amount: 238, bidTime: hours(-1) },
  { id: "b-7", auctionId: "a-4", buyerId: "bp-1", amount: 410, bidTime: hours(-6) },
  { id: "b-8", auctionId: "a-4", buyerId: "bp-3", amount: 395, bidTime: hours(-10) },
];

/* -------------------------------- orders -------------------------------- */
export const seedOrders: Order[] = [
  { id: "o-1001", listingId: "l-1", buyerId: "bp-1", sellerId: "sp-1", quantity: 400, unitPrice: 285, totalPrice: 114000, status: "completed", createdAt: days(-9), invoiceNo: "INV-2026-0141" },
  { id: "o-1002", listingId: "l-5", buyerId: "bp-3", sellerId: "sp-3", quantity: 1000, unitPrice: 198, totalPrice: 198000, status: "paid", createdAt: days(-5), invoiceNo: "INV-2026-0142" },
  { id: "o-1003", listingId: "l-4", buyerId: "bp-1", sellerId: "sp-2", quantity: 50, unitPrice: 540, totalPrice: 27000, status: "payment_review", createdAt: days(-2) },
  { id: "o-1004", listingId: "l-7", buyerId: "bp-2", sellerId: "sp-1", quantity: 300, unitPrice: 320, totalPrice: 96000, status: "confirmed", createdAt: days(-1) },
  { id: "o-1005", listingId: "l-11", buyerId: "bp-2", sellerId: "sp-2", quantity: 20, unitPrice: 8200, totalPrice: 164000, status: "pending_confirmation", createdAt: hours(-8) },
  { id: "o-1006", listingId: "l-2", buyerId: "bp-3", sellerId: "sp-1", quantity: 100, unitPrice: 240, totalPrice: 24000, status: "cancelled", createdAt: days(-6) },
];

export const seedPaymentProofs: PaymentProof[] = [
  { id: "pp-1", orderId: "o-1001", fileName: "boc-slip-114000.jpg", status: "approved", submittedAt: days(-8), reviewedAt: days(-8) },
  { id: "pp-2", orderId: "o-1002", fileName: "combank-transfer-198000.pdf", status: "approved", submittedAt: days(-4), reviewedAt: days(-4) },
  { id: "pp-3", orderId: "o-1003", fileName: "sampath-slip-27000.jpg", note: "Transferred from company account", status: "submitted", submittedAt: hours(-20) },
];

/* -------------------------------- reviews ------------------------------- */
export const seedReviews: Review[] = [
  { id: "r-1", orderId: "o-1001", sellerId: "sp-1", buyerId: "bp-1", rating: 5, comment: "Excellent quality carrots, delivered on time. Consistent sizing across the whole lot.", sentiment: "positive", flagged: false, createdAt: days(-7) },
  { id: "r-2", orderId: "o-1002", sellerId: "sp-3", buyerId: "bp-3", rating: 4, comment: "Good rice quality. A few bags were slightly under weight but the seller compensated quickly.", sentiment: "positive", flagged: false, createdAt: days(-3) },
  { id: "r-3", orderId: "o-1006", sellerId: "sp-1", buyerId: "bp-3", rating: 2, comment: "Order had to be cancelled after repeated delays. Communication was poor.", sentiment: "negative", flagged: true, createdAt: days(-5) },
];

/* ------------------------------- inquiries ------------------------------ */
export const seedInquiries: Inquiry[] = [
  { id: "inq-1", userId: "u-buyer-1", subject: "Bulk discount for recurring weekly orders", category: "Product", message: "We need 400kg of carrots weekly for our hotel chain. Can a standing discount be arranged?", status: "in_progress", createdAt: days(-2) },
  { id: "inq-2", userId: "u-seller-3", subject: "How to attach lab certificates to listings", category: "Platform", message: "My compost listing was rejected. Where do I upload the NPK test report?", status: "resolved", response: "You can attach certification documents under Listing > Edit > Certifications. Re-submit after attaching.", createdAt: days(-3) },
  { id: "inq-3", userId: "u-buyer-3", subject: "Payment proof stuck in review", category: "Payment", message: "Uploaded a bank slip 2 days ago for order o-1003 but status has not changed.", status: "open", createdAt: hours(-10) },
];

/* --------------------------------- chat --------------------------------- */
export const seedChats: ChatThread[] = [
  {
    id: "ct-1", buyerId: "bp-1", sellerId: "sp-1", listingId: "l-1",
    messages: [
      { id: "m-1", senderId: "bp-1", text: "Hello, is the Grade A carrot lot still available for this Friday?", sentAt: hours(-30) },
      { id: "m-2", senderId: "sp-1", text: "Yes, we have 2,400kg available. Friday delivery to Colombo is possible.", sentAt: hours(-29) },
      { id: "m-3", senderId: "bp-1", text: "Great. If we commit to 400kg weekly, can you hold the price at Rs. 280?", sentAt: hours(-28) },
      { id: "m-4", senderId: "sp-1", text: "For a standing weekly order, Rs. 280/kg works. I will note it on the order.", sentAt: hours(-26) },
    ],
  },
  {
    id: "ct-2", buyerId: "bp-2", sellerId: "sp-2", listingId: "l-11",
    messages: [
      { id: "m-5", senderId: "bp-2", text: "We are evaluating Alba quills for the EU market. Can you share moisture content specs?", sentAt: hours(-14) },
      { id: "m-6", senderId: "sp-2", text: "Moisture is below 12%, quill diameter under 6mm. Certificates available on request.", sentAt: hours(-12) },
    ],
  },
];

/* ----------------------------- notifications ---------------------------- */
export const seedNotifications: AppNotification[] = [
  { id: "n-1", userId: "u-buyer-1", type: "auction", message: "You were outbid on Jaffna Red Onions. Current highest bid: Rs. 336/kg.", channel: "in_app", read: false, sentAt: hours(-2) },
  { id: "n-2", userId: "u-buyer-1", type: "order", message: "Order o-1003 payment proof is under review.", channel: "in_app", read: false, sentAt: hours(-20) },
  { id: "n-3", userId: "u-seller-1", type: "order", message: "New order o-1004 received for Organic Cabbage (300kg).", channel: "in_app", read: false, sentAt: days(-1) },
  { id: "n-4", userId: "u-seller-3", type: "listing", message: "Your listing 'Compost Fertilizer' was rejected. See feedback.", channel: "in_app", read: true, sentAt: days(-3) },
  { id: "n-5", userId: "u-buyer-3", type: "auction", message: "Auction for Big Onions closes in 20 hours. You hold no active bid.", channel: "in_app", read: false, sentAt: hours(-1) },
];

/* ------------------------------ web content ----------------------------- */
export const seedContentPages: ContentPage[] = [
  { id: "cp-1", title: "Marketplace Guidelines", slug: "guidelines", body: "All listings must accurately describe the produce, including grade, origin and certification. Sellers must honour confirmed orders...", published: true, updatedAt: days(-20) },
  { id: "cp-2", title: "Payment & Refund Policy", slug: "payment-policy", body: "Payments are settled directly between buyer and seller. Buyers must upload proof of payment within 48 hours of order confirmation...", published: true, updatedAt: days(-18) },
  { id: "cp-3", title: "Auction Rules", slug: "auction-rules", body: "Bids are binding. The highest valid bid at closing wins. Winning buyers must complete the order within 24 hours...", published: false, updatedAt: days(-2) },
];

export const seedAnnouncements: Announcement[] = [
  { id: "an-1", title: "Sinhala & Tamil interfaces coming soon", body: "Localized interfaces are planned for the next release phase.", createdAt: days(-6) },
  { id: "an-2", title: "New: AI price suggestions on all vegetable categories", body: "Prophet-based forecast pricing now covers all vegetable listings.", createdAt: days(-12) },
];

/* ---------------------------- price forecasts --------------------------- */
/** Synthetic Prophet-like series: 90 days of history + 30 days of forecast. */
function genSeries(base: number, amp: number, trend: number, seed: number): ForecastPoint[] {
  const pts: ForecastPoint[] = [];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = -90; i <= 30; i++) {
    const t = i + 90;
    const weekly = Math.sin((i / 7) * Math.PI * 2) * amp * 0.35;
    const yearly = Math.sin(((i + 120) / 365) * Math.PI * 2) * amp;
    const yhat = base + trend * t + weekly + yearly;
    const noise = (rand() - 0.5) * amp * 0.8;
    const spread = amp * 0.55 + t * 0.02;
    pts.push({
      ds: new Date(now + i * 86400000).toISOString().slice(0, 10),
      yhat: Math.round(yhat * 100) / 100,
      yhatLower: Math.round((yhat - spread) * 100) / 100,
      yhatUpper: Math.round((yhat + spread) * 100) / 100,
      actual: i <= 0 ? Math.round((yhat + noise) * 100) / 100 : undefined,
    });
  }
  return pts;
}

export const seedForecasts: CategoryForecast[] = [
  { categoryId: "cat-veg", commodity: "Carrot (wholesale)", unit: "LKR/kg", modelVersion: "prophet-v1.3", mape: 4.74, points: genSeries(280, 22, 0.11, 42) },
  { categoryId: "cat-veg-onion", commodity: "Red Onion (wholesale)", unit: "LKR/kg", modelVersion: "prophet-v1.3", mape: 5.12, points: genSeries(330, 30, 0.09, 77) },
  { categoryId: "cat-rice", commodity: "Red Raw Rice (wholesale)", unit: "LKR/kg", modelVersion: "prophet-v1.2", mape: 3.61, points: genSeries(195, 9, 0.04, 11) },
  { categoryId: "cat-veg-tomato", commodity: "Tomato (wholesale)", unit: "LKR/kg", modelVersion: "prophet-v1.3", mape: 6.08, points: genSeries(400, 45, -0.06, 63) },
];
