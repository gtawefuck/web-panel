# Flipkart E-Commerce Platform — Comprehensive Project Plan

> **Purpose:** A detailed technical project plan for building an e-commerce website that replicates the core functionality and user experience of Flipkart. This document is written for developers and technical project managers who need actionable specifics to begin implementation.

---

## Table of Contents

1. [Section 1: Feature Analysis & Replication Checklist](#section-1-feature-analysis--replication-checklist)
2. [Section 2: Implementation Roadmap](#section-2-implementation-roadmap)
3. [Section 3: Adding Sample Products](#section-3-adding-sample-products)

---

## Section 1: Feature Analysis & Replication Checklist

### 1.1 Product Discovery & Search

**What it does:** Enables customers to find products by typing keywords, brand names, categories, or SKU identifiers into a persistent search bar. On Flipkart, the search bar is always visible in the sticky header and offers autocomplete suggestions as the user types. This is the primary entry point for purchase intent — roughly 60-70% of e-commerce conversions begin with a search.

**Core components:**

| Component | Description |
|-----------|-------------|
| **Search bar UI** | Full-width input in the sticky header with placeholder text ("Search for Products, Brands and More"), magnifying-glass icon button, and keyboard shortcut focus. Currently implemented in `public/shop.html` (`.fk-search` class). |
| **Search index** | Server-side full-text search across product `name`, `category`, `description`, and `brand` fields. Currently uses SQLite `LIKE` queries in `src/routes/shop.js`. |
| **Autocomplete / typeahead** | Client-side debounced input handler that queries an `/api/shop/search?q=` endpoint and renders dropdown suggestions. Not yet implemented — requires a new API endpoint. |
| **Search results page** | Grid display of matching products with thumbnail, price, discount badge, rating stars, and review count. Currently handled by the client-side JS filtering in `shop.html`. |
| **Recent searches** | LocalStorage-backed list of the user's last 5-10 search terms, displayed when the search bar receives focus with an empty query. |

**Third-party integrations:**
- **For production scale:** Algolia, Meilisearch, or Elasticsearch for sub-50ms fuzzy search with typo tolerance, faceted results, and relevance tuning.
- **Current implementation:** SQLite `LIKE '%term%'` queries are sufficient for catalogs under ~10,000 products.

---

### 1.2 Product Filtering & Sorting

**What it does:** Once a user is viewing a category or search results page, filters let them narrow results by attributes (price range, brand, rating, discount percentage, availability) and sorting lets them reorder results (relevance, price low-to-high, price high-to-low, newest first, popularity, customer rating). This dramatically reduces decision fatigue and is essential for catalogs with more than ~20 products.

**Core components:**

| Component | Description |
|-----------|-------------|
| **Filter sidebar** | Left-hand panel listing available filter facets extracted from the current result set. Each facet shows checkbox options with result counts (e.g., "Samsung (24)"). |
| **Price range slider** | Dual-handle range input bound to `min_price` / `max_price` query parameters. |
| **Rating filter** | Radio buttons or star-click filter: "4★ & above", "3★ & above", etc. |
| **Sort dropdown** | `<select>` element in the results header with options mapped to `ORDER BY` clauses: `price ASC`, `price DESC`, `rating DESC`, `review_count DESC`, `id DESC` (newest). |
| **Active filter pills** | Horizontal bar of removable tags showing currently applied filters, with a "Clear All" action. |
| **URL state sync** | All filter/sort state encoded in query parameters (`?category=Mobiles&min_price=10000&sort=price_asc`) so results pages are shareable and back-button friendly. |

**Third-party integrations:**
- None required for basic implementation. For advanced faceting at scale, Algolia or Elasticsearch provide built-in facet counting.

---

### 1.3 Product Detail Pages (PDP)

**What it does:** The PDP is the most conversion-critical page in any e-commerce platform. It presents all information a buyer needs to make a purchase decision: images, price, offers, specifications, reviews, delivery estimates, and action buttons. Flipkart's PDP follows a two-column layout — left column for the image gallery with thumbnails, right column for product metadata and actions.

**Core components:**

| Component | Description |
|-----------|-------------|
| **Image gallery** | Vertical thumbnail strip on the left + large main image stage. Clicking a thumbnail swaps the main image. Supports zoom-on-hover. Currently implemented via `.pd-gallery`, `.pd-thumbs`, `.pd-img-stage` in `shop.html`. Image URLs stored in the `reviews` JSON column under `images` array. |
| **Product title & brand** | `<h1>` with full product name. Brand name extracted from the `brand` field in the reviews JSON envelope. |
| **Price block** | Current price (`price`), original/MRP price with strikethrough (`original_price`), discount percentage badge (`discount`), and "inclusive of all taxes" note. |
| **Rating summary** | Aggregate star rating (e.g., "4.4 ★") with total review/rating count. Links to detailed reviews section. |
| **Highlights** | Bulleted list of key product features. Stored in `reviews` JSON → `highlights` array. |
| **Color/variant selector** | Horizontal row of clickable color swatches or variant cards. Data from `reviews` JSON → `color_variants` array. |
| **Quantity selector** | `<select>` dropdown (1-10) adjacent to the Add to Cart button. |
| **Action buttons** | Two primary CTAs: "ADD TO CART" (orange, `--fk-fb-orange`) and "BUY NOW" (yellow, `--fk-yellow`). |
| **Delivery check** | Pincode input field with "Check" button to show estimated delivery date and available delivery options. |
| **Offers section** | List of available offers (bank discounts, exchange offers, EMI options) with expandable details. |
| **Specifications table** | Grouped specification tables (e.g., "In The Box", "Display Features", "Camera Features"). Data from `reviews` JSON → `specifications` array of `{ group, items: [{ label, value }] }`. |
| **Ratings & reviews section** | Ratings breakdown bar chart (5★ to 1★ distribution), individual review cards with user name, city, date, helpful/unhelpful counts, and verified-purchase badge. Data from `reviews` JSON → `ratings_breakdown` object and `reviews` array. |
| **Breadcrumb navigation** | Category → Subcategory → Product trail at the top of the PDP. |

**Third-party integrations:**
- **Image CDN:** Flipkart uses `rukminim2.flixcart.com`. The current implementation proxies Flipkart image URLs via the `fkImg()` helper in `src/seed.js`. For a production deployment, use Cloudinary, imgix, or AWS CloudFront with on-the-fly resizing.
- **Pincode/delivery API:** India Post API or custom delivery partner APIs for real delivery estimates.

---

### 1.4 Shopping Cart

**What it does:** The cart is a temporary holding area for products the user intends to purchase. It must persist across page navigations (and ideally across sessions), show real-time totals, support quantity changes, and provide a clear path to checkout. On Flipkart, the cart is accessible via the header icon with a badge count.

**Core components:**

| Component | Description |
|-----------|-------------|
| **Cart icon with badge** | Header element (`.fk-cart-wrap`) showing a shopping cart icon and a count badge (`.fk-cart-count`) that updates in real-time. |
| **Cart storage** | Client-side `localStorage` array of `{ productId, name, image, price, originalPrice, discount, quantity }` objects. The current implementation uses JS variables in `shop.html`. |
| **Cart page** | Full-page cart view (`.cart-page`) with product cards showing image, name, price, quantity selector, subtotal, and remove button. |
| **Price summary sidebar** | Right-hand sticky panel (`.cart-right`) showing: item count, total MRP, discount amount, delivery charges (free above threshold), and final "Total Amount". |
| **Quantity controls** | Increment/decrement buttons (`−` / `+`) and direct input, with stock-limit validation. |
| **Save for later** | Secondary list below the cart for items the user wants to keep but not purchase now. Moves items between cart and saved list. |
| **Empty cart state** | Illustration + "Your cart is empty" message + "Shop Now" CTA button. |
| **Cart → Checkout CTA** | "PLACE ORDER" button in the price summary that transitions to the checkout flow. |

**Third-party integrations:**
- None for basic implementation. For server-side cart persistence (logged-in users), the existing `visitors` table could be extended or a dedicated `carts` table added.

---

### 1.5 Checkout & Payment Processing

**What it does:** The checkout flow collects delivery address, lets the user choose a payment method, processes payment, and creates an order. Flipkart uses a multi-step linear flow: Login → Delivery Address → Order Summary → Payment. The current implementation supports UPI payments with QR code generation.

**Core components:**

| Component | Description |
|-----------|-------------|
| **Address form** | Fields: Full Name, Phone (10-digit), Pincode (6-digit, auto-fetches city/state), Address Line 1, Address Line 2, Landmark, City, State, Address Type (Home/Work). Currently in the checkout overlay in `shop.html`. |
| **Address validation** | Pincode lookup to auto-fill city and state. Client-side validation for phone format, required fields. |
| **Order summary** | Line items with quantities, individual prices, and grand total. Matches the cart price summary. |
| **Payment methods** | Tabbed sidebar (`.pay-tabs`) with options: UPI/QR, Credit/Debit Card, Net Banking, Wallets, Cash on Delivery. Currently only UPI is functional via `src/routes/pay.js`. |
| **UPI payment flow** | 1) `POST /api/pay/initiate` creates a transaction with a 10-minute expiry and returns a `upi://pay` URI. 2) QR code generated via the `qrcode` npm package. 3) User pays externally and submits UTR via `POST /api/pay/confirm`. 4) Admin verifies via `PATCH /api/pay/transactions/:id`. |
| **Transaction tracking** | `transactions` table stores: `txn_ref`, `amount`, `merchant_upi`, customer details, `cart_items` JSON, `utr`, `status` (pending → utr_submitted → verified/failed/expired), timestamps. |
| **Order success page** | Confirmation card (`.ck-success`) with checkmark animation, order ID, amount, delivery address summary, and estimated delivery date. |

**Third-party integrations:**

| Integration | Purpose | Implementation |
|-------------|---------|----------------|
| **Razorpay / Stripe** | Full payment gateway with card, UPI, net banking, wallets | Server-side SDK integration with webhook verification |
| **QRCode library** | UPI QR code generation | Already integrated via `qrcode` npm package in `src/routes/pay.js` |
| **India Post / Pincode API** | Address auto-completion | REST API call on pincode input blur event |

---

### 1.6 User Account Management

**What it does:** Manages user identity, authentication, and session state. The current system uses Telegram-based OTP authentication instead of traditional email/password — users enter their Telegram User ID, receive a 6-digit OTP via Telegram bot, and verify it to log in.

**Core components:**

| Component | Description |
|-----------|-------------|
| **Login modal** | Flipkart-style split modal (`.login-modal`) with blue left panel (branding/benefits) and white right panel (login form). |
| **OTP request** | `POST /api/auth/request-otp` — validates Telegram ID, checks access rights, generates 6-digit OTP via `src/otp.js`, sends via Telegram bot (`src/telegram.js`). |
| **OTP verification** | `POST /api/auth/verify-otp` — validates OTP, resolves user role (superAdmin / admin / user), creates session. |
| **Session management** | `express-session` with 24-hour cookie TTL. Session stores `{ tgId, role, loginAt }`. |
| **Role-based access (RBAC)** | Three roles: `superAdmin` (env var `SUPER_ADMIN_TG_ID`), `admin` (from `admins` table), `user` (from `users` table with expiry). Middleware in `src/middleware/auth.js`. |
| **Demo mode** | When `DEMO_MODE=true`, OTP is returned in the API response instead of being sent via Telegram. Useful for testing without a Telegram bot. |
| **User expiry** | Regular users have an `expires_at` timestamp. Expired users are denied login and their shops show an "unavailable" page. |
| **Login audit log** | All login/logout events recorded in `login_logs` table with timestamp, role, and action details. |

**Third-party integrations:**
- **Telegram Bot API** (`node-telegram-bot-api`) — for sending OTP messages. Bot must be created via @BotFather and user must have started the bot (`/start`) before OTPs can be sent.
- **For traditional auth:** Consider adding email/password with bcrypt + JWT, or OAuth2 (Google, Facebook) via Passport.js.

---

### 1.7 Order Tracking & History

**What it does:** After a purchase, users need visibility into their order status and access to their purchase history. This builds trust and reduces support inquiries.

**Core components:**

| Component | Description |
|-----------|-------------|
| **Transaction status API** | `GET /api/pay/status/:txnRef` — public endpoint returning transaction status (`pending`, `utr_submitted`, `verified`, `failed`, `expired`). |
| **Admin transaction dashboard** | `GET /api/pay/transactions` — authenticated endpoint listing all transactions for the shop owner with cart items, customer details, UTR, and status. |
| **Transaction verification** | `PATCH /api/pay/transactions/:id` — admin marks payment as `verified` or `failed` with optional notes. |
| **Order history page (to implement)** | User-facing page listing past orders with: order date, items, total, status badge, and "Track" / "Reorder" actions. |
| **Status timeline (to implement)** | Visual step indicator: Order Placed → Payment Confirmed → Shipped → Out for Delivery → Delivered. |
| **Email/SMS notifications (to implement)** | Transactional notifications at each status change. |

**Third-party integrations:**
- **Shipping APIs:** Shiprocket, Delhivery, or EcomExpress for real-time tracking with AWB (Air Waybill) numbers.
- **Email service:** SendGrid, AWS SES, or Mailgun for order confirmation and status update emails.
- **SMS gateway:** Twilio, MSG91, or Kaleyra for SMS notifications (important for Indian market).

---

### 1.8 Customer Reviews & Ratings

**What it does:** Social proof is the single most influential factor in online purchase decisions after price. Reviews provide authentic buyer feedback, ratings enable quick quality assessment, and the system as a whole builds trust in the platform.

**Core components:**

| Component | Description |
|-----------|-------------|
| **Aggregate rating display** | Star rating badge on product cards and at the top of PDPs. Combines `rating` (float) and `review_count` (integer) from the `products` table. |
| **Ratings breakdown chart** | Horizontal bar chart showing distribution across 5★ to 1★. Data from `ratings_breakdown` object: `{ "5": 27988, "4": 9959, "3": 2357, "2": 854, "1": 2001 }`. Percentage and bar width calculated client-side. |
| **Individual review cards** | Each review displays: star rating, title, body text, reviewer name, city, date, helpful/unhelpful counts, and "Certified Buyer" verified badge. Data stored in the `reviews` JSON envelope → `reviews` array. |
| **Review structure** | Each review object: `{ rating: 5, title: "Mind-blowing purchase", text: "Very Good product", user: "Vijay Singh", city: "Bilaspur", date: "4 months ago", helpful: 546, unhelpful: 167, verified: true }`. |
| **Helpful voting (to implement)** | Thumbs up/down buttons on each review that increment `helpful`/`unhelpful` counters. |
| **Review submission (to implement)** | Form for verified purchasers to submit: star rating (required), title (required), text body, and optional photo uploads. |
| **Review filtering (to implement)** | Sort reviews by: Most Helpful, Most Recent, Positive First, Negative First. Filter by star rating. |

**Third-party integrations:**
- **For production:** Yotpo, Judge.me, or Bazaarvoice for advanced review management, photo reviews, Q&A, and anti-fraud moderation.
- **Current implementation:** Reviews are seeded as static data and stored in the `reviews` JSON column. No user-generated review submission exists yet.

---

### 1.9 Product Recommendations & Related Items

**What it does:** Shows contextually relevant products to increase average order value and help users discover items they might not have searched for directly. Flipkart displays "Similar Products", "Customers also viewed", "Frequently bought together", and "Recently viewed" sections.

**Core components:**

| Component | Description |
|-----------|-------------|
| **Category-based recommendations** | "Similar Products" section on PDP showing other products in the same category. Query: `SELECT * FROM products WHERE category = ? AND id != ? LIMIT 8`. |
| **Top offers carousel** | Horizontal scrollable card strip (`.top-offers`, `.to-track`) on the homepage showing featured/discounted products. Currently implemented in `shop.html`. |
| **Deal strip** | Category deal cards (`.deal-strip`) showing category-level promotions with discount percentages. |
| **Recently viewed (to implement)** | LocalStorage-backed list of last 10 viewed product IDs, rendered as a horizontal carousel. |
| **Frequently bought together (to implement)** | Co-occurrence analysis on `cart_items` in the `transactions` table to find products commonly purchased together. |
| **Personalized recommendations (to implement)** | User-specific recommendations based on browsing history, past purchases, and collaborative filtering. |

**Third-party integrations:**
- **For production scale:** Amazon Personalize, Recombee, or custom ML pipelines with TensorFlow/PyTorch for collaborative filtering.
- **Current implementation:** Static category-based matching is sufficient for small catalogs.

---

### 1.10 Admin Panel & Shop Management

**What it does:** Provides shop owners and administrators with tools to manage products, monitor visitors, handle transactions, and configure shop settings. This is the operational backbone of the platform.

**Core components:**

| Component | Description |
|-----------|-------------|
| **Dashboard** | `public/dashboard.html` — admin interface for shop management. |
| **Product CRUD** | Add (`POST /api/shop/products`), edit (`PATCH /api/shop/products/:id`), delete (`DELETE /api/shop/products/:id`) products with image upload support. |
| **Image upload** | `POST /api/shop/upload` — Multer-based file upload to `public/uploads/` with 10MB limit, accepting JPG/PNG/WEBP/GIF. |
| **Flipkart product import** | `POST /api/shop/fetch-flipkart` — scrapes a Flipkart product URL using axios+cheerio (with puppeteer fallback) to auto-populate product data including images, specs, reviews. |
| **Shop settings** | `PATCH /api/shop/settings` — configure shop name, banner text, UPI ID, payment QR code. |
| **User management** | Admin CRUD for users: add with expiry (`POST /api/admin/users`), extend access (`PATCH /api/admin/users/:id/extend`), remove (`DELETE /api/admin/users/:id`). |
| **Admin management** | Super Admin can add/remove admins (`POST /api/admin/admins`, `DELETE /api/admin/admins/:id`). |
| **Visitor analytics** | `GET /api/shop/visitors` — lists visitor records with IP, geolocation, user agent, and checkout data. |
| **Audit logs** | `GET /api/admin/logs` — chronological log of all admin actions (logins, user additions, etc.). |

**Third-party integrations:**
- **Puppeteer** — headless Chrome for Flipkart scraping when cheerio fails (anti-bot pages).
- **Puppeteer Stealth Plugin** — evades bot detection during scraping.

---

## Section 2: Implementation Roadmap

### 2.1 Recommended Technology Stack

#### Current Stack (Already Implemented)

| Layer | Technology | Version / Notes |
|-------|-----------|----------------|
| **Runtime** | Node.js | ≥ 18.0.0 |
| **Backend framework** | Express.js | 4.18.x — routing, middleware, static file serving |
| **Database** | SQLite (better-sqlite3) | WAL mode, file-based at `data/panel.db` |
| **Session store** | express-session | In-memory (default), 24-hour cookie TTL |
| **File uploads** | Multer | 10MB limit, stored in `public/uploads/` |
| **Authentication** | Telegram OTP | Custom OTP generation + Telegram Bot API |
| **Frontend** | Vanilla HTML/CSS/JS | Single-page `shop.html` (1,629 lines) with inline styles and scripts |
| **Web scraping** | Puppeteer + Cheerio | For importing products from Flipkart URLs |
| **QR codes** | qrcode (npm) | UPI payment QR generation |
| **HTTP client** | Axios | For Flipkart URL resolution and scraping |

#### Recommended Additions for Production

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend framework** | Next.js 14+ (React) or Nuxt 3 (Vue) | SSR for SEO, component architecture, code splitting |
| **CSS framework** | Tailwind CSS | Utility-first, matches Flipkart's atomic design patterns |
| **State management** | Zustand or Redux Toolkit | Cart state, user state, filter state across components |
| **Search engine** | Meilisearch (self-hosted) or Algolia (managed) | Sub-50ms typo-tolerant search with faceting |
| **Database (scale)** | PostgreSQL | ACID compliance, full-text search, JSONB for flexible product attributes |
| **Cache** | Redis | Session storage, search result caching, rate limiting |
| **Payment gateway** | Razorpay (India) or Stripe (global) | PCI-compliant card processing, UPI, net banking, wallets |
| **Image storage** | AWS S3 + CloudFront or Cloudinary | CDN-backed image hosting with on-the-fly transformations |
| **Email** | SendGrid or AWS SES | Transactional order emails |
| **Monitoring** | Sentry (errors) + Datadog or Grafana (metrics) | Production observability |
| **CI/CD** | GitHub Actions | Automated testing, linting, deployment |

---

### 2.2 Implementation Phases

#### Phase 1: Foundation & Core Product Experience
**Estimated duration:** 2-3 weeks | **Complexity:** Medium

**What to build:**
1. Database schema setup (already done in `src/db.js`)
2. Product listing page with grid layout (already done in `shop.html`)
3. Product detail pages with full information architecture (already done)
4. Basic search functionality (partially done — needs dedicated API endpoint)
5. Image upload and management (already done via Multer)

**Setup steps:**
```bash
# 1. Clone and install
git clone <repo-url>
cd web-panel
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values:
#   TELEGRAM_BOT_TOKEN=<from @BotFather>
#   SUPER_ADMIN_TG_ID=<your Telegram user ID>
#   SESSION_SECRET=<random 64+ char string>
#   DEMO_MODE=true  (for development without Telegram)

# 3. Start development server
npm run dev
# Server starts on http://localhost:3000
```

**Key decisions:**
- **Monolith vs. microservices:** The current monolith Express app is appropriate for MVP. Split into services only when team size exceeds 5 or traffic exceeds 10K RPM.
- **SQLite vs. PostgreSQL:** SQLite works for single-server deployments with < 100 concurrent users. Migrate to PostgreSQL before horizontal scaling.
- **Vanilla JS vs. framework:** The current `shop.html` (1,629 lines) is manageable but will become unwieldy as features grow. Plan migration to React/Next.js when adding user accounts, order history, or complex state.

**Dependencies:** None — this is the foundation layer.

---

#### Phase 2: Shopping Cart & Checkout Flow
**Estimated duration:** 2 weeks | **Complexity:** Medium-High

**What to build:**
1. Client-side cart with localStorage persistence (already implemented)
2. Cart page UI with quantity controls (already implemented)
3. Checkout address form with validation (already implemented)
4. UPI payment integration (already implemented via `src/routes/pay.js`)
5. Order confirmation page (already implemented)

**Setup steps:**
```bash
# UPI Payment setup:
# 1. In the admin dashboard, go to Payment Settings
# 2. Enter your UPI ID (e.g., merchant@upi)
# 3. Optionally upload a payment QR code image

# The payment flow:
# POST /api/pay/initiate   → creates transaction, returns UPI URI
# POST /api/pay/confirm    → customer submits UTR after paying
# PATCH /api/pay/transactions/:id → admin verifies payment
```

**Key decisions:**
- **Payment gateway selection:** For India-focused: Razorpay (most popular, supports UPI, cards, net banking, ₹0 setup). For global: Stripe. The current manual UPI + UTR verification works but doesn't scale.
- **Cart persistence strategy:** Currently client-side only (localStorage). For logged-in users, add server-side cart storage with merge-on-login logic.
- **Address storage:** Currently collected at checkout and stored in `visitors` table. Create a dedicated `addresses` table with user association for saved addresses.

**Dependencies:** Phase 1 (product display must work before cart).

---

#### Phase 3: User Authentication & Account Management
**Estimated duration:** 1-2 weeks | **Complexity:** Medium

**What to build:**
1. Telegram OTP login flow (already implemented)
2. Session management with RBAC (already implemented)
3. User profile page (to implement)
4. Saved addresses management (to implement)
5. Wishlist / Save for Later (to implement)

**Setup steps:**
```bash
# Telegram Bot setup:
# 1. Message @BotFather on Telegram → /newbot → follow prompts
# 2. Copy the bot token to .env as TELEGRAM_BOT_TOKEN
# 3. Get your Telegram user ID from @userinfobot
# 4. Set SUPER_ADMIN_TG_ID in .env

# For demo/development without Telegram:
# Set DEMO_MODE=true in .env
# OTP will be returned in the API response
```

**Key decisions:**
- **Auth method:** Telegram OTP is the current approach. Consider adding email+password (using bcrypt for hashing) or OAuth2 (Google/Facebook) via Passport.js for broader accessibility.
- **Session store:** Currently in-memory (lost on server restart). Use `connect-redis` for production session persistence.
- **Token vs. session:** Sessions work well for server-rendered apps. If migrating to a SPA/mobile app, consider JWT tokens with refresh token rotation.

**Dependencies:** Phase 1 (need working frontend).

---

#### Phase 4: Search, Filtering & Sorting
**Estimated duration:** 1-2 weeks | **Complexity:** Medium

**What to build:**
1. Dedicated search API endpoint with full-text matching
2. Filter sidebar UI (price range, brand, rating, category)
3. Sort dropdown (price, rating, popularity, newest)
4. URL-based state management for filters
5. Autocomplete/typeahead suggestions

**Setup steps:**
```bash
# New API endpoint to create:
# GET /api/shop/search?q=samsung&category=Mobiles&min_price=10000&max_price=50000&sort=price_asc&page=1

# SQLite full-text search setup:
# Option A: Use LIKE queries (simple, works for small catalogs)
# Option B: Create FTS5 virtual table for faster full-text search:
#   CREATE VIRTUAL TABLE products_fts USING fts5(name, category, description, brand, content=products, content_rowid=id);
```

**Implementation approach:**
```sql
-- Example search query with filters
SELECT * FROM products
WHERE shop_id = ?
  AND (name LIKE '%samsung%' OR category LIKE '%samsung%' OR description LIKE '%samsung%')
  AND price BETWEEN 10000 AND 50000
  AND rating >= 4.0
ORDER BY price ASC
LIMIT 20 OFFSET 0;
```

**Key decisions:**
- **SQLite FTS5 vs. external search:** FTS5 is built into SQLite and handles most use cases well. Only move to Meilisearch/Algolia if you need: fuzzy matching, synonym support, facet counts, or sub-20ms latency on 100K+ products.
- **Server-side vs. client-side filtering:** Currently all products are loaded client-side and filtered in JS. This works for < 200 products. For larger catalogs, filtering must happen server-side with paginated results.

**Dependencies:** Phase 1 (products must exist).

---

#### Phase 5: Reviews & Ratings System
**Estimated duration:** 1-2 weeks | **Complexity:** Medium

**What to build:**
1. Reviews display on PDP (already implemented)
2. Ratings breakdown chart (already implemented)
3. Review submission form (to implement)
4. Review moderation admin panel (to implement)
5. Helpful/unhelpful voting (to implement)

**Setup steps:**
```sql
-- New reviews table (currently reviews are stored as JSON in products.reviews column)
-- For a normalized approach, create:
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    user_tg_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT NOT NULL,
    body TEXT,
    helpful_count INTEGER DEFAULT 0,
    unhelpful_count INTEGER DEFAULT 0,
    verified_purchase INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',  -- pending, approved, rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Update product aggregate rating after each new review:
-- UPDATE products SET rating = (SELECT AVG(rating) FROM reviews WHERE product_id = ?),
--                     review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?)
-- WHERE id = ?;
```

**Key decisions:**
- **Normalized vs. JSON storage:** Currently reviews are embedded as JSON in the `reviews` column of `products`. This is simple and read-fast but makes write operations (adding a review) require reading, parsing, modifying, and rewriting the entire JSON blob. For user-generated reviews, create a separate `reviews` table.
- **Moderation strategy:** Auto-approve reviews from verified purchasers, queue others for manual moderation. Add profanity filtering with a library like `bad-words`.
- **Rating recalculation:** Trigger-based (SQLite trigger on review insert) or application-level (recalculate on each review submission).

**Dependencies:** Phase 1 (products), Phase 3 (user accounts — need to know who's reviewing).

---

#### Phase 6: Order Management & Tracking
**Estimated duration:** 2 weeks | **Complexity:** High

**What to build:**
1. Dedicated `orders` table separate from `transactions`
2. Order status lifecycle management
3. User-facing order history page
4. Status timeline visualization
5. Email/SMS notifications on status changes

**Setup steps:**
```sql
-- Orders table
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    user_tg_id TEXT NOT NULL,
    shop_slug TEXT NOT NULL,
    items TEXT NOT NULL,            -- JSON array of cart items
    subtotal INTEGER NOT NULL,
    discount INTEGER DEFAULT 0,
    shipping INTEGER DEFAULT 0,
    total INTEGER NOT NULL,
    delivery_name TEXT,
    delivery_phone TEXT,
    delivery_address TEXT,
    delivery_pincode TEXT,
    status TEXT DEFAULT 'placed',   -- placed, confirmed, shipped, out_for_delivery, delivered, cancelled, returned
    payment_method TEXT,
    payment_ref TEXT,
    tracking_number TEXT,
    tracking_url TEXT,
    estimated_delivery DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Order status history for timeline display
CREATE TABLE order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    note TEXT,
    updated_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

**Key decisions:**
- **Order vs. transaction:** Currently `transactions` handles payment tracking. Create a separate `orders` table that links to transactions but also tracks fulfillment status, shipping, and delivery.
- **Notification channels:** Email is essential. SMS is important for the Indian market (many users don't check email regularly). Push notifications if building a PWA or mobile app.
- **Inventory management:** Add stock tracking with `quantity` field on products. Decrement on order placement, increment on cancellation/return.

**Dependencies:** Phase 2 (checkout), Phase 3 (user accounts).

---

#### Phase 7: Recommendations & Personalization
**Estimated duration:** 1-2 weeks | **Complexity:** Low-Medium

**What to build:**
1. "Similar Products" based on category matching
2. "Recently Viewed" using localStorage
3. "Frequently Bought Together" based on cart co-occurrence
4. Homepage product carousels (already implemented — deal strip, top offers)

**Setup steps:**
```javascript
// Similar Products API endpoint
// GET /api/shop/recommendations/:productId?type=similar&limit=8
router.get('/recommendations/:productId', (req, res) => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const similar = db.prepare(
        'SELECT * FROM products WHERE category = ? AND id != ? AND shop_id = ? ORDER BY rating DESC LIMIT ?'
    ).all(product.category, product.id, product.shop_id, parseInt(req.query.limit) || 8);

    res.json({ recommendations: similar.map(flattenProduct) });
});
```

**Key decisions:**
- **Simple vs. ML-based:** Start with category-based and co-occurrence analysis. Only invest in ML-based recommendations (collaborative filtering, content-based) when you have > 1,000 products and > 10,000 user interactions.
- **Client-side vs. server-side recently viewed:** localStorage is simpler and requires no auth. Server-side tracking enables cross-device persistence but needs user accounts.

**Dependencies:** Phase 1 (products), Phase 4 (search — recommendations surface in search context).

---

### 2.3 Feature Dependency Graph

```
Phase 1: Foundation & Products ──────────────────────────────┐
    │                                                        │
    ├── Phase 2: Cart & Checkout ─── Phase 6: Orders ────────┤
    │       │                              │                 │
    │       └── Phase 3: Auth ─────────────┘                 │
    │               │                                        │
    │               └── Phase 5: Reviews ────────────────────┤
    │                                                        │
    └── Phase 4: Search & Filters ── Phase 7: Recommendations┘
```

**Critical path:** Phase 1 → Phase 2 → Phase 3 → Phase 6

---

## Section 3: Adding Sample Products

### 3.1 Required Data Fields

The product data model consists of direct database columns plus a rich JSON envelope stored in the `reviews` column.

#### Database Columns (products table)

| Field | Type | Required | Description | Frontend Display Location |
|-------|------|----------|-------------|--------------------------|
| `id` | INTEGER | Auto | Primary key, auto-incrementing | URL parameter for PDP navigation |
| `shop_id` | INTEGER | Yes | Foreign key to `shops.id` — determines which shop this product belongs to | Not directly displayed; used for data isolation |
| `name` | TEXT | Yes | Full product name including variant info (e.g., "MOTOROLA g57 power 5G (Pantone Fluidity, 128 GB)") | Product card title, PDP `<h1>`, search results, browser tab title |
| `category` | TEXT | Yes | Product category for grouping and filtering (e.g., "Mobiles", "Electronics", "Fashion") | Category navigation bar, filter sidebar, breadcrumbs |
| `image_url` | TEXT | Yes | URL to primary product image (used as fallback if `images` array in reviews JSON is empty) | Product card thumbnail, og:image meta tag |
| `price` | INTEGER | Yes | Selling price in paisa-free integer format (e.g., `15999` for ₹15,999) | Product card, PDP price block, cart line item, checkout total |
| `original_price` | INTEGER | Yes | MRP / list price before discount (e.g., `17999` for ₹17,999) | Strikethrough price next to selling price |
| `discount` | INTEGER | Yes | Discount percentage, auto-calculated: `Math.round(((original_price - price) / original_price) * 100)` | Green discount badge on product card and PDP (e.g., "11% off") |
| `description` | TEXT | Yes | Full product description paragraph | PDP description section, search index |
| `rating` | REAL | Yes | Aggregate star rating (1.0 to 5.0, e.g., `4.4`) | Star display on product cards and PDP header |
| `review_count` | INTEGER | Yes | Total number of ratings+reviews (e.g., `43159`) | Displayed as "(43,159 Ratings & Reviews)" on PDP |
| `reviews` | TEXT | Yes | **JSON string** containing the rich product data envelope (see below) | PDP: gallery images, highlights, specs, reviews, ratings chart |
| `in_stock` | INTEGER | Yes | Stock availability flag: `1` = in stock, `0` = out of stock (default: `1`) | "In Stock" / "Out of Stock" badge on PDP, disables Add to Cart |

#### Reviews JSON Envelope Structure

The `reviews` column stores a JSON string with this structure:

```json
{
    "reviews": [
        {
            "rating": 5,
            "title": "Mind-blowing purchase",
            "text": "Very Good product",
            "user": "Vijay Singh",
            "city": "Bilaspur",
            "date": "4 months ago",
            "helpful": 546,
            "unhelpful": 167,
            "verified": true
        }
    ],
    "highlights": [
        "8 GB RAM | 128 GB ROM",
        "Snapdragon 6s Gen 4 | Octa Core Processor"
    ],
    "images": [
        "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/1/k/r/-original-imahhqjwsngwkksu.jpeg?q=90&crop=false"
    ],
    "specifications": [
        {
            "group": "Display Features",
            "items": [
                { "label": "Display Size", "value": "17.07 cm (6.72 inch)" },
                { "label": "Resolution", "value": "2400 x 1080 Pixels" }
            ]
        }
    ],
    "ratings_breakdown": {
        "5": 27988,
        "4": 9959,
        "3": 2357,
        "2": 854,
        "1": 2001
    },
    "brand": "MOTOROLA",
    "color_variants": ["Pantone Fluidity", "Pantone Corsair"]
}
```

---

### 3.2 How Each Field Maps to the Frontend

```
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCT CARD (Grid View)                                       │
│  ┌───────────┐                                                  │
│  │           │  name ──────────────► Card title (2 lines max)   │
│  │ image_url │  price ─────────────► "₹15,999"                  │
│  │           │  original_price ────► "₹17,999" (strikethrough)  │
│  └───────────┘  discount ──────────► "11% off" (green badge)    │
│                 rating ────────────► "★ 4.4"                    │
│                 review_count ──────► "(43,159)"                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PRODUCT DETAIL PAGE (PDP)                                      │
│                                                                 │
│  LEFT COLUMN:                                                   │
│    images[] ──────────────► Thumbnail strip + main image stage  │
│                                                                 │
│  RIGHT COLUMN:                                                  │
│    brand ─────────────────► Brand name above product title      │
│    name ──────────────────► Product <h1> title                  │
│    rating + review_count ─► "★ 4.4  43,159 Ratings & Reviews"  │
│    price ─────────────────► "₹15,999"                           │
│    original_price ────────► "₹17,999" (struck through)          │
│    discount ──────────────► "11% off"                           │
│    highlights[] ──────────► Bulleted feature list               │
│    color_variants[] ──────► Clickable color option chips        │
│    description ───────────► "Description" expandable section    │
│    specifications[] ──────► Grouped spec tables                 │
│    ratings_breakdown ─────► Bar chart (5★ to 1★)               │
│    reviews[] ─────────────► Individual review cards             │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Image Upload & Storage Guide

#### Option A: External URLs (Current Default for Seed Data)

The seed data uses Flipkart's CDN URLs directly via the `fkImg()` helper:
```javascript
const fkImg = (path, size = 832) =>
    `https://rukminim2.flixcart.com/image/${size}/${size}/xif0q/mobile/${path}?q=90&crop=false`;
```

**Pros:** No storage needed, high-quality images. **Cons:** Depends on Flipkart's CDN availability, may be blocked.

#### Option B: Local Upload via API

```bash
# Upload a product image
curl -X POST http://localhost:3000/api/shop/upload \
  -H "Cookie: <session-cookie>" \
  -F "image=@/path/to/product-photo.jpg"

# Response:
# { "success": true, "url": "http://localhost:3000/uploads/product-1715234567-a1b2c3.jpg" }
```

**Storage location:** `public/uploads/` directory
**Naming convention:** `product-{timestamp}-{random}.{ext}`
**Size limit:** 10MB per file
**Accepted formats:** JPEG, JPG, PNG, WEBP, GIF
**Served at:** `GET /uploads/{filename}` (Express static middleware)

#### Option C: Cloud Storage (Production Recommendation)

```bash
# AWS S3 example setup
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Upload flow:
# 1. Client requests presigned upload URL from backend
# 2. Client uploads directly to S3
# 3. Backend stores the S3 URL in the product record
# 4. CloudFront CDN serves images globally with caching
```

**Recommended bucket structure:**
```
s3://your-bucket/
  products/
    {shop_id}/
      {product_id}/
        main.jpg
        gallery-1.jpg
        gallery-2.jpg
        thumb-main.jpg    (auto-generated 200x200)
        thumb-gallery-1.jpg
```

---

### 3.4 Example Product 1: Smartphone

This example mirrors the actual MOTOROLA g57 product already seeded in `src/seed.js`.

#### Adding via API

```bash
# Step 1: Upload product image (if using local storage)
curl -X POST http://localhost:3000/api/shop/upload \
  -H "Cookie: connect.sid=<your-session-id>" \
  -F "image=@motorola-g57.jpg"
# Returns: { "url": "http://localhost:3000/uploads/product-1715234567-abc.jpg" }

# Step 2: Create the product
curl -X POST http://localhost:3000/api/shop/products \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=<your-session-id>" \
  -d '{
    "name": "MOTOROLA g57 power 5G (Pantone Fluidity, 128 GB)",
    "category": "Mobiles",
    "image_url": "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/1/k/r/-original-imahhqjwsngwkksu.jpeg?q=90&crop=false",
    "price": 15999,
    "original_price": 17999,
    "description": "Designed in collaboration with Pantone, the MOTOROLA g57 power 5G packs a massive 7000 mAh battery, a 50MP + 8MP rear camera and a smooth 6.72-inch LCD display. Powered by the Snapdragon 6s Gen 4, it delivers a snappy day-to-day experience while a 1-year handset warranty keeps you covered.",
    "rating": 4.4,
    "review_count": 43159,
    "brand": "MOTOROLA",
    "images": [
        "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/1/k/r/-original-imahhqjwsngwkksu.jpeg?q=90&crop=false",
        "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/h/h/m/-original-imahhqjwcywsynaq.jpeg?q=90&crop=false",
        "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/c/p/g/-original-imahhqjwmbxydvyy.jpeg?q=90&crop=false",
        "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/y/l/v/-original-imahhqjwgz7shhcx.jpeg?q=90&crop=false"
    ],
    "highlights": [
        "8 GB RAM | 128 GB ROM",
        "Snapdragon 6s Gen 4 | Octa Core Processor | 2.4 GHz Clock Speed",
        "50MP + 8MP Rear Camera | 8MP Front Camera",
        "6.72 inch LCD Display",
        "7000 mAh Lithium Polymer Battery",
        "IP64 Splash, Water and Dust Resistant",
        "1 Year Warranty on Handset and 6 Months on In-box Accessories"
    ],
    "specifications": [
        {
            "group": "In The Box",
            "items": [
                { "label": "Sales Package", "value": "Phone, USB Type C Cable, SIM Tray Ejector, Adhesive Foam, Soft Cover, Quick Start Guide" },
                { "label": "Model Number", "value": "XT2511-2" },
                { "label": "Model Name", "value": "g57 power 5G" },
                { "label": "Color", "value": "Pantone Fluidity" }
            ]
        },
        {
            "group": "Display Features",
            "items": [
                { "label": "Display Size", "value": "17.07 cm (6.72 inch)" },
                { "label": "Resolution", "value": "2400 x 1080 Pixels" },
                { "label": "Resolution Type", "value": "Full HD+" },
                { "label": "Display Type", "value": "LCD with 120Hz Refresh Rate" }
            ]
        },
        {
            "group": "Battery & Power Features",
            "items": [
                { "label": "Battery Capacity", "value": "7000 mAh" },
                { "label": "Battery Type", "value": "Lithium Polymer" },
                { "label": "Quick Charging", "value": "Yes, TurboPower 30W" }
            ]
        }
    ],
    "reviews": [
        {
            "rating": 5,
            "title": "Mind-blowing purchase",
            "text": "Very Good product",
            "user": "Vijay Singh",
            "city": "Bilaspur",
            "date": "4 months ago",
            "helpful": 546,
            "unhelpful": 167,
            "verified": true
        },
        {
            "rating": 5,
            "title": "Simply awesome",
            "text": "Performance: very good processor handles every app smoothly. Camera is impressive especially in daylight.",
            "user": "Parth Unadkat",
            "city": "Navsari",
            "date": "2 months ago",
            "helpful": 20,
            "unhelpful": 2,
            "verified": true
        },
        {
            "rating": 4,
            "title": "Pretty good",
            "text": "Complete package under 16k. Battery 5/5 with 7000 mAh gives 2 days backup. Display 4/5, IPS LCD with vibrant true color.",
            "user": "Amit Tripathi",
            "city": "Ujjain",
            "date": "4 months ago",
            "helpful": 123,
            "unhelpful": 37,
            "verified": true
        }
    ],
    "ratings_breakdown": {
        "5": 27988,
        "4": 9959,
        "3": 2357,
        "2": 854,
        "1": 2001
    }
}'
```

#### Adding via Seed Script

The product is already defined in `src/seed.js` and auto-seeded when a new shop is created:
```javascript
const { createShopForUser } = require('./seed');
const slug = createShopForUser('12345678'); // Creates shop + seeds 2 products
```

#### How This Product Appears

**In search results / category grid:**
- Thumbnail: First image from `images` array
- Title: "MOTOROLA g57 power 5G (Pantone Fluidity, 128 GB)" (truncated to 2 lines)
- Price: "₹15,999" in bold + "₹17,999" strikethrough + "11% off" green badge
- Rating: "★ 4.4 (43,159)" with green star icon

**On the product detail page:**
- Gallery: 4 thumbnail images on left, large main image center
- Title block: Brand "MOTOROLA" + full product name
- Price block: ₹15,999 / ₹17,999 / 11% off
- Highlights: 7 bullet points (RAM, processor, camera, display, battery, IP rating, warranty)
- Specifications: 3 grouped tables (In The Box, Display Features, Battery)
- Ratings chart: 5★ bar (64.8%) to 1★ bar (4.6%)
- Reviews: 3 review cards with ratings, titles, text, user info, and helpful counts

---

### 3.5 Example Product 2: Flagship Smartphone (Different Price Tier)

This example mirrors the SAMSUNG Galaxy S25 already seeded in `src/seed.js`.

#### Adding via API

```bash
curl -X POST http://localhost:3000/api/shop/products \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=<your-session-id>" \
  -d '{
    "name": "SAMSUNG Galaxy S25 5G (Navy, 256 GB)",
    "category": "Mobiles",
    "image_url": "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/j/e/r/-original-imah8pdgedd5whgs.jpeg?q=90&crop=false",
    "price": 62999,
    "original_price": 80999,
    "description": "SAMSUNG Galaxy S25 5G — a compact 6.2-inch flagship powered by Galaxy AI and the Snapdragon 8 Elite for Galaxy. 50MP + 10MP + 12MP triple rear camera, 12MP front camera and a 4000 mAh battery on a Dynamic AMOLED 2X display. Comes with 12 GB RAM and 256 GB storage in a premium Navy finish.",
    "rating": 4.6,
    "review_count": 2889,
    "brand": "SAMSUNG",
    "images": [
        "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/j/e/r/-original-imah8pdgedd5whgs.jpeg?q=90&crop=false",
        "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/2/b/8/-original-imah8pdgvxdznyes.jpeg?q=90&crop=false",
        "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/c/4/o/-original-imah8pdgzr3tqyhm.jpeg?q=90&crop=false",
        "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/u/l/v/-original-imah8pdgpjgyzhpx.jpeg?q=90&crop=false",
        "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/m/p/s/-original-imah8pdgc6vduxqv.jpeg?q=90&crop=false",
        "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/v/7/a/-original-imah8pdgzhyfdveh.jpeg?q=90&crop=false"
    ],
    "highlights": [
        "12 GB RAM | 256 GB ROM",
        "8 Elite for Galaxy | Octa Core Processor | 4.47 GHz Clock Speed",
        "50MP + 10MP + 12MP Rear Camera",
        "12MP Front Camera",
        "6.2 inch Dynamic AMOLED 2X Display",
        "4000 mAh Battery",
        "1 Year Manufacturer Warranty for Device and 6 Months for In-Box Accessories"
    ],
    "specifications": [
        {
            "group": "In The Box",
            "items": [
                { "label": "Sales Package", "value": "Phone, USB Cable Type C-to-C, Quick Start Guide, SIM Ejector Pin" },
                { "label": "Model Number", "value": "SM-S931BDBH" },
                { "label": "Model Name", "value": "Galaxy S25" },
                { "label": "Color", "value": "Navy" },
                { "label": "SIM Type", "value": "Dual Sim (Nano + eSIM)" }
            ]
        },
        {
            "group": "Display Features",
            "items": [
                { "label": "Display Size", "value": "15.75 cm (6.2 inch)" },
                { "label": "Resolution", "value": "2340 x 1080 Pixels" },
                { "label": "Display Type", "value": "Dynamic AMOLED 2X" },
                { "label": "Other Display Features", "value": "120Hz Adaptive Refresh Rate, Vision Booster, 2600 nits Peak Brightness, Corning Gorilla Glass Victus 2" }
            ]
        },
        {
            "group": "OS & Processor Features",
            "items": [
                { "label": "Operating System", "value": "Android 15, One UI 7" },
                { "label": "Processor Type", "value": "Snapdragon 8 Elite for Galaxy" },
                { "label": "Processor Core", "value": "Octa Core" },
                { "label": "Primary Clock Speed", "value": "4.47 GHz" }
            ]
        },
        {
            "group": "Camera Features",
            "items": [
                { "label": "Primary Camera", "value": "50MP + 10MP + 12MP" },
                { "label": "Primary Camera Features", "value": "OIS, 3x Optical Zoom, 30x Space Zoom, Auto HDR, Night Mode, Pro Mode" },
                { "label": "Secondary Camera", "value": "12MP Front Camera" },
                { "label": "Video Recording", "value": "8K @ 30fps, 4K @ 60fps" }
            ]
        },
        {
            "group": "Battery & Power Features",
            "items": [
                { "label": "Battery Capacity", "value": "4000 mAh" },
                { "label": "Quick Charging", "value": "Yes, 25W Wired Fast Charging, 15W Wireless" }
            ]
        }
    ],
    "reviews": [
        {
            "rating": 5,
            "title": "Brilliant",
            "text": "Amazing Camera, performance and software optimisation. Full Power flagship experience in a compact 6.2 inch body. Battery lasts a full day with normal use. Galaxy AI features like Now Brief and Circle to Search are genuinely useful.",
            "user": "frontech ecam",
            "city": "Hyderabad",
            "date": "1 year ago",
            "helpful": 858,
            "unhelpful": 256,
            "verified": true
        },
        {
            "rating": 5,
            "title": "Highly recommended",
            "text": "Beyond Expectation. Top notch performance. No heating issue. Battery backup is amazing. Camera quality is superb in all light conditions.",
            "user": "Hari Krishnan",
            "city": "Chennai",
            "date": "1 year ago",
            "helpful": 612,
            "unhelpful": 188,
            "verified": true
        },
        {
            "rating": 4,
            "title": "Value-for-money",
            "text": "Good phone. Camera, design, and performance are good. But price is slightly higher. Would have liked a bigger battery.",
            "user": "Raju Pattanayak",
            "city": "Nashik",
            "date": "1 year ago",
            "helpful": 97,
            "unhelpful": 34,
            "verified": true
        }
    ],
    "ratings_breakdown": {
        "5": 1878,
        "4": 664,
        "3": 202,
        "2": 87,
        "1": 58
    }
}'
```

#### How This Product Appears

**In search results / category grid:**
- Thumbnail: Samsung Galaxy S25 Navy product shot
- Title: "SAMSUNG Galaxy S25 5G (Navy, 256 GB)" (truncated to 2 lines)
- Price: "₹62,999" in bold + "₹80,999" strikethrough + "22% off" green badge
- Rating: "★ 4.6 (2,889)" with green star icon

**On the product detail page:**
- Gallery: 6 thumbnail images with zoom-on-hover
- Title block: Brand "SAMSUNG" + full product name
- Price block: ₹62,999 / ₹80,999 / 22% off
- Highlights: 7 bullet points covering RAM, processor, cameras, display, battery, warranty
- Specifications: 5 grouped tables (In The Box, Display, OS & Processor, Camera, Battery)
- Ratings chart: 5★ bar (65.0%) to 1★ bar (2.0%)
- Reviews: 3 review cards with verified-purchase badges

---

### 3.6 Adding Customer Reviews to Sample Products

Reviews are embedded in the product's `reviews` JSON envelope at creation time. To add reviews to an existing product, use the PATCH endpoint to update the `reviews` field:

#### Review Data Structure

Each review object follows this schema:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rating` | Integer (1-5) | Yes | Star rating (1 = worst, 5 = best) |
| `title` | String | Yes | Short review headline (e.g., "Mind-blowing purchase") |
| `text` | String | Yes | Full review body text |
| `user` | String | Yes | Reviewer's display name |
| `city` | String | No | Reviewer's city for location display |
| `date` | String | No | Relative date string (e.g., "4 months ago") |
| `helpful` | Integer | No | Count of "helpful" votes (default: 0) |
| `unhelpful` | Integer | No | Count of "not helpful" votes (default: 0) |
| `verified` | Boolean | No | Whether the reviewer is a verified/certified buyer (shows badge) |

#### How Reviews Display on the Frontend

```
┌──────────────────────────────────────────────────────────────┐
│  Ratings & Reviews                                           │
│                                                              │
│  ┌──────────┐  5 ★ ████████████████████████  64.8%          │
│  │  4.4 ★   │  4 ★ ████████               23.1%            │
│  │          │  3 ★ ███                      5.5%            │
│  │ 43,159   │  2 ★ █                        2.0%            │
│  │ ratings  │  1 ★ ██                       4.6%            │
│  └──────────┘                                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ ★★★★★  Mind-blowing purchase              ✓ Certified   ││
│  │ Very Good product                            Buyer       ││
│  │                                                          ││
│  │ Vijay Singh, Bilaspur · 4 months ago                     ││
│  │ 👍 546  👎 167                                            ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ ★★★★☆  Pretty good                       ✓ Certified   ││
│  │ Complete package under 16k. Battery 5/5...    Buyer      ││
│  │                                                          ││
│  │ Amit Tripathi, Ujjain · 4 months ago                     ││
│  │ 👍 123  👎 37                                             ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

#### Adding Reviews via Flipkart Import

The fastest way to add realistic product data (including reviews) is the Flipkart import feature:

```bash
# Import a product directly from a Flipkart URL
curl -X POST http://localhost:3000/api/shop/fetch-flipkart \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=<your-session-id>" \
  -d '{ "url": "https://www.flipkart.com/samsung-galaxy-s25-5g-navy-256-gb/p/itm277a7d1824e44" }'

# This scrapes the Flipkart PDP and returns structured product data including:
# - Name, brand, price, original price, discount
# - All gallery images
# - Highlights
# - Full specifications
# - Customer reviews
# - Ratings breakdown
```

---

### 3.7 Auto-Seeding: How the Default Products Are Created

When a new user is added via the admin panel (`POST /api/admin/users`), the system automatically:

1. Creates a shop for the user with a unique slug (MD5 hash of Telegram ID)
2. Seeds two default products (MOTOROLA g57 and Samsung Galaxy S25) from the `PRODUCTS` array in `src/seed.js`
3. Each product includes full gallery images, highlights, specifications, reviews, and ratings breakdown

```javascript
// From src/seed.js — the seeding flow:
function createShopForUser(tgId) {
    // 1. Check if shop already exists
    const existing = db.prepare('SELECT slug FROM shops WHERE tg_id = ?').get(tgId);
    if (existing) return existing.slug;

    // 2. Generate unique slug
    const slug = 'shop-' + crypto.createHash('md5').update(String(tgId)).digest('hex').slice(0, 8);

    // 3. Create shop record
    db.prepare('INSERT OR IGNORE INTO shops (tg_id, slug) VALUES (?, ?)').run(String(tgId), slug);

    // 4. Insert all seed products
    const shop = db.prepare('SELECT id FROM shops WHERE tg_id = ?').get(String(tgId));
    const insert = db.prepare('INSERT INTO products (...) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    for (const p of PRODUCTS) {
        insert.run(shop.id, p.name, p.category, p.image_url, p.price, p.original_price,
                   p.discount, p.description, p.rating, p.review_count, buildReviewsField(p));
    }
    return slug;
}
```

To re-seed a shop with fresh default products (useful after testing):
```javascript
const { reseedShop } = require('./src/seed');
reseedShop('shop-a1b2c3d4'); // Deletes all products and re-inserts defaults
```

---

## Appendix: Quick Reference

### API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/request-otp` | No | Request OTP for Telegram ID |
| `POST` | `/api/auth/verify-otp` | No | Verify OTP and create session |
| `GET` | `/api/auth/me` | Yes | Get current user info |
| `POST` | `/api/auth/logout` | Yes | Destroy session |
| `GET` | `/api/shop/my` | Yes | Get own shop + products |
| `GET` | `/api/shop/info/:slug` | No | Get public shop data |
| `POST` | `/api/shop/products` | Yes | Add product |
| `PATCH` | `/api/shop/products/:id` | Yes | Edit product |
| `DELETE` | `/api/shop/products/:id` | Yes | Delete product |
| `POST` | `/api/shop/upload` | Yes | Upload product image |
| `POST` | `/api/shop/upload-qr` | Yes | Upload payment QR |
| `PATCH` | `/api/shop/settings` | Yes | Update shop settings |
| `POST` | `/api/shop/fetch-flipkart` | Yes | Import product from Flipkart URL |
| `POST` | `/api/shop/visitor` | No | Log visitor |
| `POST` | `/api/shop/checkout` | No | Log checkout |
| `GET` | `/api/shop/visitors` | Yes | Get visitor list |
| `GET` | `/api/shop/link` | Yes | Get shop public URL |
| `POST` | `/api/pay/initiate` | No | Create payment transaction |
| `POST` | `/api/pay/confirm` | No | Submit UTR for payment |
| `GET` | `/api/pay/status/:txnRef` | No | Check transaction status |
| `GET` | `/api/pay/transactions` | Yes | List transactions (admin) |
| `PATCH` | `/api/pay/transactions/:id` | Yes | Verify/reject payment |
| `GET` | `/api/pay/qr` | No | Generate UPI QR code |
| `GET` | `/api/admin/users` | Admin | List users |
| `POST` | `/api/admin/users` | Admin | Add user |
| `DELETE` | `/api/admin/users/:id` | Admin | Remove user |
| `PATCH` | `/api/admin/users/:id/extend` | Admin | Extend user access |
| `GET` | `/api/admin/admins` | Super | List admins |
| `POST` | `/api/admin/admins` | Super | Add admin |
| `DELETE` | `/api/admin/admins/:id` | Super | Remove admin |
| `GET` | `/api/admin/logs` | Admin | View audit logs |

### Database Schema Summary

```
admins          (id, tg_id, added_by, added_at)
users           (id, tg_id, username, added_by, activated_at, expires_at)
otp_store       (tg_id, otp, expires_at)
login_logs      (id, tg_id, action, role, details, timestamp)
shops           (id, tg_id, slug, shop_name, banner_text, upi_id, payment_qr, created_at)
products        (id, shop_id, name, category, image_url, price, original_price, discount,
                 description, rating, review_count, reviews, in_stock)
visitors        (id, shop_slug, ip, lat, lng, city, country, user_agent, name, email,
                 phone, address, pincode, cart_items, total_amount, visited_at)
transactions    (id, shop_slug, txn_ref, amount, merchant_upi, customer_name, customer_email,
                 customer_phone, delivery_address, cart_items, utr, status, created_at,
                 expires_at, verified_at, notes)
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes* | Bot token from @BotFather |
| `SUPER_ADMIN_TG_ID` | Yes | Your Telegram user ID |
| `SESSION_SECRET` | Yes | Random 64+ char string for session encryption |
| `PORT` | No | Server port (default: 3000) |
| `HOST` | No | Bind address (default: 0.0.0.0) |
| `DEMO_MODE` | No | Set to "true" to skip Telegram OTP (default: false) |
| `BASE_URL` | No | Override auto-detected base URL |
| `DB_DIR` | No | Custom database directory (default: ./data) |

*Not required if `DEMO_MODE=true`
