# Wedding Website — Technical Execution Plan & Sprint Breakdown

> Companion to REQUIREMENTS.md. This is written to be handed to **Claude Code**
> as the build spec. Pricing/tier notes are accurate as of mid-2026 — **verify
> current limits before launch**, free tiers change often.

---

## 1. Architecture overview

```
                 ┌─────────────────────────────────────────┐
   Guest phone ──►  Next.js (frontend + BFF route handlers) │  ← Vercel
                 │   - reads invite token, sets httpOnly     │
                 │     cookie, proxies API calls             │
                 └───────────────┬─────────────────────────┘
                                 │  token forwarded as Bearer
                                 ▼
                 ┌─────────────────────────────────────────┐
                 │  FastAPI (Python) — the source of truth   │  ← Render / Cloud Run
                 │   - validates token, resolves guest+tier  │
                 │   - ENFORCES tier on every endpoint       │
                 └─────┬───────────────────────┬────────────┘
                       ▼                        ▼
              ┌─────────────────┐     ┌────────────────────┐
              │  Postgres        │     │  Object storage     │
              │  (guests, tables,│     │  (photos: original? │
              │   events, photos,│     │   display, thumb)   │
              │   wishes)        │     │                     │
              └─────────────────┘     └────────────────────┘
```

**Why this shape:** Next.js owns presentation and acts as a thin **backend-for-
frontend** so the token can live in an httpOnly cookie (better security, clean
URLs) while FastAPI remains the single authority that enforces access. Tier
checks never live only in the browser.

---

## 2. Recommended stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | **Next.js (App Router) + TypeScript + Tailwind CSS** | Required; Vercel-native; Route Handlers give us the BFF/cookie pattern. |
| Backend | **Python + FastAPI + Uvicorn**, **Pydantic** models, **SQLAlchemy + Alembic** migrations | Required Python; FastAPI is async, typed, auto-documented. |
| Database | **Postgres** | Relational fit (guests↔tables↔photos); ubiquitous managed free tiers. |
| Object storage | **AWS S3** (`im-malaysia-wedding`, region `ap-southeast-2`) | In use; bucket prefix `guest-uploaded-photo/`. Public read policy scoped to that prefix. |
| Image processing | **Pillow** (resize/compress/thumbnail) | Simple, server-side, cheap. |
| Admin auth | FastAPI dependency + hashed admin secret (`passlib`/`bcrypt`), short-lived signed session | Real auth for the couple only. |

### Hosting (cost-effective, APAC-friendly)

- **Frontend → Vercel Hobby (free).** Purpose-built for Next.js; global edge.
  Cloudflare Pages or Netlify are equivalent free fallbacks.
- **Backend → Render or Google Cloud Run.**
  - *Render*: simplest DX, predictable pricing, **Singapore region** available.
    Free tier sleeps when idle (~1 min cold start); **upgrade one paid month
    (~US$7) for the event window** so the wedding day is instant, then downgrade.
  - *Cloud Run*: **scales to zero**, fast cold starts, Singapore region
    (`asia-southeast1`), pay-per-request → effectively free at this traffic.
    Slightly more setup; best pure cost.
  - *(Fly.io no longer offers a free tier to new users; skip for "cheapest".)*
- **Database → Neon (scale-to-zero Postgres)** ✓ *in use* — serverless Postgres,
  connects via asyncpg with `?ssl=require`.
- **Object storage → AWS S3** ✓ *in use* — bucket `im-malaysia-wedding`,
  region `ap-southeast-2` (Sydney), prefix `guest-uploaded-photo/`.
  Public read via bucket policy scoped to that prefix only.

---

## 3. Repository structure (monorepo)

```
wedding-site/
├─ frontend/                 # Next.js app
│  ├─ app/
│  │  ├─ i/[token]/route.ts  # entry: validate token → set cookie → redirect /
│  │  ├─ (guest)/page.tsx    # home (tier-aware)
│  │  ├─ (guest)/seats/…     # seat finder
│  │  ├─ (guest)/moments/…   # photo + wishes
│  │  ├─ (guest)/travel/…    # full-guest only
│  │  ├─ api/…               # BFF route handlers → FastAPI
│  │  └─ admin/…             # couple's admin UI
│  └─ middleware.ts          # require session cookie on (guest)/admin routes
├─ backend/                  # FastAPI app
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ deps.py             # get_current_guest, require_full_tier, require_admin
│  │  ├─ models.py           # SQLAlchemy
│  │  ├─ schemas.py          # Pydantic
│  │  ├─ routers/ guests.py seats.py gallery.py travel.py admin.py
│  │  ├─ services/ images.py tokens.py
│  │  └─ db.py
│  ├─ alembic/               # migrations
│  ├─ scripts/seed.py        # seed guests/tables/events for local dev
│  └─ pyproject.toml
├─ docker-compose.yml        # local: backend + frontend only (Neon + S3 used directly)
└─ README.md
```

---

## 4. Data model

```
guests  (table: guest_list)
  id              uuid pk
  name            text            -- full name; used for seat finder search and display
  pax             int null        -- number of people this guest entry represents
  tier            enum('full','reception')
  table_id        uuid fk → tables.id  null
  -- note: display_name removed; name is used everywhere
  -- note: token/revoked/created_at not in current schema (access via shared tier links)

tables
  id              uuid pk
  label           text            -- "Table 7 — Rose"
  note            text null

timeline_events
  id              uuid pk
  starts_at       timestamptz
  title           text
  description     text
  location        text null
  visibility      enum('all','full_only')   -- reception guests see 'all' only
  sort_order      int

photos
  id              uuid pk
  guest_id        uuid fk → guests.id
  uploader_name   text
  message         text null
  original_key    text null       -- raw uploaded file (jpg/png/webp)
  storage_key     text            -- display image (WebP, max 1920 px, quality 85)
  thumb_key       text            -- thumbnail (WebP, max 800 px, quality 85)
  status          enum('visible','hidden','pending') default 'visible'
  created_at      timestamptz

site_content                       -- single-row-ish KV for editable copy
  key             text pk          -- 'travel_*' keys only (see note below)
  value           jsonb

-- NOTE: timeline_events and the date/venue/dress_code keys in site_content are
-- NOT used. Wedding date, venue, dress code, and all timeline events are
-- hardcoded constants in backend/app/routers/home.py and require a code change
-- + redeploy to update. site_content is retained for travel-guide content only.

admins
  id              uuid pk
  username        text unique
  password_hash   text
```

---

## 5. API surface (FastAPI)

**Guest (token required, tier enforced):**
- `POST /api/session` — body `{token}` → validates, returns `{name, tier}`
  (called by Next BFF on entry to mint the cookie).
- `GET  /api/me` → `{display_name, tier}`
- `GET  /api/home` → venue/date/dress code + **timeline filtered by tier**
- `GET  /api/seats?q=<name>` → fuzzy match → table label (+ optional tablemates)
- `GET  /api/moments` → visible photos (paginated)
- `POST /api/moments` (multipart) → upload photo + message (validated, resized)
- `GET  /api/travel` → **`require_full_tier`**; `403` for reception guests

**Admin (admin auth required):**
- `POST /api/admin/login`
- CRUD `/api/admin/guests` (+ `GET …/export`, `POST …/import`)
  - `GET  /api/admin/guests/export` → CSV download of full guest list
  - `POST /api/admin/guests/import` → body `[{name, tier, table_label?}]`;
    pre-loads tables for label→id resolution; skips duplicates and invalid rows;
    returns `{created, skipped, errors[]}`
- `GET  /api/admin/invite-links` → `{full: {url, token}, reception: {url, token}}`
- `GET  /api/admin/invite-links/qr?tier=full|reception` → PNG QR code image
  (encodes the full `https://<site>/i/<token>` URL; generated server-side with
  `qrcode` library, returned as `image/png`)
- CRUD `/api/admin/tables`, `/api/admin/events`, `/api/admin/content`
- `PATCH /api/admin/photos/{id}` (hide/approve), `DELETE …`
- `GET  /api/admin/photos/download-zip?ids=...` → streaming ZIP of original photos

**Access-control dependencies (the core):**
```python
# deps.py (sketch)
async def get_current_guest(req) -> Guest:
    token = read_token(req)                  # from Authorization/Bearer
    guest = await guests.by_token(token)
    if not guest or guest.revoked:
        raise HTTPException(401)
    return guest

def require_full_tier(guest = Depends(get_current_guest)) -> Guest:
    if guest.tier != "full":
        raise HTTPException(403)
    return guest
```
Travel routes and pre-reception data depend on `require_full_tier`. The home
endpoint filters `timeline_events` by `guest.tier` server-side.

---

## 6. Photo pipeline

1. Validate MIME + magic bytes (images only), enforce size cap, per-guest count
   limit (rate-limit by token).
2. Pillow: auto-orient (EXIF), strip EXIF/GPS metadata (privacy), produce a
   capped-resolution **display** image (max 1920 px, WebP quality 85) + a
   **thumbnail** (max 800 px, WebP quality 85) for retina display clarity.
3. Upload three objects to AWS S3 under the `guest-uploaded-photo/` prefix:
   `guest-uploaded-photo/photos/{uuid}/original.{ext}` (raw bytes),
   `guest-uploaded-photo/photos/{uuid}/display.webp`,
   `guest-uploaded-photo/photos/{uuid}/thumb.webp`;
   DB stores the short keys (without prefix) — prefix is added at URL generation time.
4. Serve display/thumb via storage public URLs; gallery loads thumbnails and
   lazy-loads full display images. Originals are retained for admin download.

---

## 7. Deployment & cost

| Component | Service | Expected cost at wedding scale |
|-----------|---------|-------------------------------|
| Frontend | Vercel Hobby | $0 |
| Backend | Render (free tier) or Cloud Run (scale-to-zero) | $0 idle; ~$7 for one always-on month over the event |
| Database | **Neon** (scale-to-zero Postgres) ✓ in use | $0 free tier |
| Photo storage | **AWS S3** (`im-malaysia-wedding`, `ap-southeast-2`) ✓ in use | Standard S3 pricing; ~$0.023/GB/month + ~$0.005/1k PUT. At 200 guests × 10 photos × ~1 MB thumbnail ≈ $0.05 storage + cents in requests |
| Domain | registrar | ~$10–15/yr (optional) |

Estimated total: **$0–~$10 for the whole event**, plus an optional domain.

Practical notes: set `noindex`; set CORS so only the Next.js origin calls the
API; keep all secrets in env vars (DB URL, storage keys, admin secret, token
salt); add a `/healthz` endpoint; enable a simple uptime ping for the event
window so the backend stays warm.

---

## 8. Sprint breakdown

Six focused sprints. Each lists a **goal**, **key tasks**, and **definition of
done (DoD)**. Sprint 1 is the backbone — get access control right first.

### Sprint 0 — Foundations
- **Goal:** Running skeleton, local dev, deploy pipeline.
- **Tasks:** Monorepo; Next.js + Tailwind scaffold; FastAPI scaffold with
  `/healthz`; Postgres via docker-compose; SQLAlchemy + Alembic; env config;
  CI (lint/test); deploy empty frontend (Vercel) and backend (Render/Cloud Run).
- **DoD:** `docker-compose up` runs both locally; both deploy to staging URLs;
  migrations run; health check green.

### Sprint 1 — Access control & tiers (backbone)
- **Goal:** Invite-link entry, sessions, server-enforced tiers.
- **Tasks:** `guests` model + `scripts/seed.py`; token generation; `POST
  /api/session`, `GET /api/me`; `get_current_guest` / `require_full_tier`;
  Next `app/i/[token]/route.ts` to validate + set **httpOnly cookie** + redirect;
  Next `middleware.ts` to gate routes; invalid-link page; tier-aware nav shell;
  two home-page shells.
- **DoD:** Valid link → session as correct tier; invalid link → friendly block;
  a reception token calling a full-only test endpoint gets `403` (verified by
  test); token never visible in JS/URL after entry.

### Sprint 2 — Home page ✓ COMPLETE
- **Goal:** Date, venue, dress code, tier-filtered timeline.
- **Implementation:** Home-page data (date, venue, dress code, timeline) is
  served from hardcoded constants in `backend/app/routers/home.py`; no DB
  queries are made for the home route. Edit those constants and redeploy to
  update wedding details or timeline events.
- **DoD:** Full Guest sees all events; Reception Guest sees only `all` events
  with no leak of earlier ones; mobile layout verified.

### Sprint 3 — Seat finder
- **Goal:** Find table by name.
- **Tasks:** `tables` + assignments; `GET /api/seats?q=` with fuzzy/partial
  match; disambiguation list; not-found message; privacy choice from
  REQUIREMENTS §3.2; search UI.
- **DoD:** Typo/partial/case-insensitive search returns the right table;
  no-match handled; no full guest list exposed.

### Sprint 4 — Photo + wishes gallery
- **Goal:** Upload and view photos with messages.
- **Tasks:** `photos` model; `POST /api/moments` (validate, Pillow resize +
  thumbnail, strip EXIF, store to R2/Supabase); per-guest rate limit; `GET
  /api/moments` paginated; gallery UI with lazy thumbnails; moderation status
  handling (auto-show or pre-approve per decision).
- **DoD:** Upload from mobile works; non-images/oversize rejected; thumbnails
  render fast; hidden/pending photos don't show to guests.

### Sprint 5 — Travel guide (full tier only)
- **Goal:** Gated travel content.
- **Tasks:** `GET /api/travel` behind `require_full_tier`; editable content
  (visit / eat / Malaysia checklist) via `site_content`; travel page;
  reception guests redirected, no nav entry.
- **DoD:** Full Guest sees page; Reception Guest gets `403` from API and cannot
  reach the page by direct URL.

### Sprint 6 — Admin, polish, launch
- **Goal:** Couple can run everything; production-ready.
- **Tasks:** Admin login; guest CRUD + tier/table assignment; token
  generate/revoke; **two downloadable QR codes** (Full Guest link + Reception
  Guest link, PNG, via `GET /api/admin/invite-links/qr?tier=…`); table editors;
  travel-guide content editor (`site_content travel_*` keys); gallery moderation
  UI; `noindex`, SEO/OG basics, error pages, loading states, accessibility pass;
  production deploy + custom domain; warm-up ping for event window; content
  population; end-to-end test of both tiers.
  *(Timeline events and venue/dress-code details are code-managed in `home.py`
  — no admin UI needed for those. No per-guest QR codes — one QR per tier only.)*
- **DoD:** Couple views both invite links in the admin panel, downloads each as
  a QR code PNG ready to print, rotates a code if needed, and both tiers reach
  the correct experience — all without developer help.

### Sprint 7 — Feature optimisation
- **Goal:** Quality-of-life improvements surfaced after initial build.
- **Tasks:**
  - **Original photo storage + admin download** ✓ *complete* — Raw uploaded file
    (`original.{ext}`) stored alongside display and thumb WebP derivatives in S3.
    Admin Photos tab: per-card "⬇ Original" link, checkbox multi-select,
    "Download Selected (ZIP)" and "Download All (ZIP)". Backend endpoint
    `GET /api/admin/photos/download-zip?ids=...` fetches originals from S3 and
    returns a streaming ZIP. Migration `004` added `original_key text null` to
    `photos`.
  - **Multi-photo upload UI** — Replace single-file picker with a multi-select
    input (`multiple` attribute, up to 10 files). After selection, show a
    preview grid with per-photo remove buttons and an "Add more" affordance.
    Submit button updates its label to "Share N Photos" and shows per-photo
    progress ("Uploading 2 of 5…"). The one shared message applies to all
    photos in the batch. No backend changes required — the frontend loops
    sequentially over `POST /api/moments`. Applied to both `MomentsPageFull`
    and `MomentsPageReception`. Object URLs properly revoked on modal close /
    photo removal to prevent memory leaks.
  - **Unified Guests & Tables panel** — Merged the separate Guests and Tables
    admin tabs into a single "Guests & Tables" tab. Features:
    - Toggle between **Guest List** view (searchable flat table) and **By Table**
      view (guests grouped under their table card, "Unassigned" section at bottom).
    - **Live search** filters guests by name across both views in real time.
    - Guest and table add/edit/delete forms remain inline; opening one form
      dismisses the other.
    - Forms are rendered as inline JSX (not as component variables inside render)
      to avoid the React remount-on-keystroke focus bug.
  - **CSV guest import** — "Import CSV" button in the Guests & Tables toolbar
    opens a modal with a drag-and-drop file zone. The browser reads the `.csv`
    file as UTF-8 text and parses it natively (no external library). A preview
    table shows all rows with per-row validation status before import. Valid rows
    are sent to `POST /api/admin/guests/import`; a results screen reports how many
    guests were created, skipped, or had warnings. Only `.csv` is supported (users
    are prompted to use *File → Save As → CSV UTF-8* from Excel).
- **DoD:** Guest can select multiple photos in one picker interaction, see
  previews before submitting, remove individual photos, and see upload progress;
  all photos appear in the gallery after a successful batch upload. Admin can
  import a guest list from CSV with preview and per-row error reporting, and can
  view/manage guests and tables in a single unified panel.

### Sprint 8 — Infrastructure, data model & UX polish ✓ COMPLETE

- **EnvelopeGate intro** — Full Guest home page shows an animated envelope on
  first visit (session-gated via `sessionStorage`). Nav bar hidden during the
  animation via synchronous inline script + CSS class. Children (page content)
  not rendered to DOM until envelope dismissed.
- **Dropped `display_name`** — Removed from `GuestList` model, all schemas,
  admin CRUD, CSV import/export, seat finder, and frontend. `name` is used
  everywhere. Migration `005` drops the column.
- **Added `pax` field** — `GuestList.pax: int null`; shown in admin guest list
  (Pax column) and by-table card header (`N guests · M pax`). Included in
  add/edit form and CSV export.
- **Switched database to Neon Postgres** — Dropped local Docker postgres.
  `DATABASE_URL` uses asyncpg + `?ssl=require`. All migrations run against Neon.
- **Switched photo storage to AWS S3** — Dropped MinIO. Storage service rewritten
  to use boto3 against real AWS (no `endpoint_url`). Bucket: `im-malaysia-wedding`,
  region: `ap-southeast-2`, prefix: `guest-uploaded-photo/`. Config settings
  renamed `s3_*`. Docker Compose no longer includes MinIO or postgres services.
- **Increased thumbnail quality** — `THUMB_MAX` 400 → 800 px; quality 75 → 85.
  Covers 2× retina pixel density at card display size (~200 CSS px).

---

## 9. Testing strategy

- **Backend:** pytest for token validation, **tier enforcement (the security
  tests matter most)**, seat fuzzy-match, upload validation/resize.
- **Frontend:** component tests for tier-conditional rendering; an e2e
  (Playwright) covering: enter via link → home → seats → gallery upload →
  travel (allowed vs `403`).
- **Manual:** real-phone test of upload and layout before the day.

## 10. Risks & mitigations

- *Tier rules only in UI* → **always enforce in FastAPI**; security tests in CI.
- *Cold start on the day* → one always-on month / warm-up ping.
- *Storage blow-out from photos* → compress, cap size/count, prefer R2.
- *Inappropriate uploads* → moderation tools + a clear takedown path.
- *Free-tier limits changed since this doc* → re-verify §7 before launch.

## 11. First decisions for the couple (blockers for build)

Tier labels confirmed? Seat finder shows tablemates or not? Gallery
auto-show vs pre-approve, and open before the day? Rough guest count + photo
volume (drives Supabase-vs-R2)? Custom domain? Multi-language? (See
REQUIREMENTS §7.)
