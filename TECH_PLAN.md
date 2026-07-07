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
| Object storage | **Cloudflare R2** (photos) *or* Supabase Storage | R2 has no egress fees — ideal for an image gallery. |
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
- **Database → Supabase (Postgres + bundled Storage)** for the simplest single
  data backend, **or Neon (scale-to-zero Postgres) + Cloudflare R2** for the
  most cost-efficient photo-heavy setup.

> **Simple default:** Vercel + Render + Supabase (DB & Storage in one place).
> **Cost-optimal for many photos:** Vercel + Cloud Run + Neon + Cloudflare R2.
> Note Supabase free Storage is ~1 GB — fine only if images are compressed and
> volume is modest; R2's free allowance is far more comfortable for galleries.

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
├─ docker-compose.yml        # local: api + postgres (+ minio for S3 locally)
└─ README.md
```

---

## 4. Data model

```
guests
  id              uuid pk
  name            text
  display_name    text            -- shown to others (e.g. first name)
  token           text unique     -- the invite credential (indexed)
  tier            enum('full','reception')
  table_id        uuid fk → tables.id  null
  revoked         bool default false
  created_at      timestamptz

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
  storage_key     text            -- display image (WebP, max 1920 px)
  thumb_key       text            -- thumbnail (WebP, max 400 px)
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
  - `POST /api/admin/guests/import` → body `[{name, display_name, tier, table_label?}]`;
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
   capped-resolution **display** image (max 1920 px) + a small **thumbnail**
   (max 400 px), both WebP.
3. Upload three objects to storage: `photos/{uuid}/original.{ext}` (raw bytes),
   `photos/{uuid}/display.webp`, `photos/{uuid}/thumb.webp`; store all three
   keys in `photos`.
4. Serve display/thumb via storage public URLs; gallery loads thumbnails and
   lazy-loads full display images. Originals are retained for admin download.

---

## 7. Deployment & cost

| Component | Service | Expected cost at wedding scale |
|-----------|---------|-------------------------------|
| Frontend | Vercel Hobby | $0 |
| Backend | Render (free tier) or Cloud Run (scale-to-zero) | $0 idle; ~$7 for one always-on month over the event |
| Database | Supabase free **or** Neon free | $0 (verify storage limits) |
| Photo storage | Cloudflare R2 / Supabase Storage | $0 within free allowance; pennies beyond |
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
  - **Original photo storage + admin download** — Store the raw uploaded file
    (`original.{ext}`) alongside the display and thumb WebP derivatives.
    Admin Photos tab gains: per-card "⬇ Original" link, checkbox multi-select,
    "Download Selected (ZIP)" and "Download All (ZIP)" buttons. Backend adds
    `GET /api/admin/photos/download-zip?ids=...` which fetches originals from
    MinIO and returns a streaming ZIP (`ZIP_STORED`). Migration `004` adds
    `original_key text null` to `photos`. Existing photos without an original
    stored show no download link.
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
