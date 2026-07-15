# Wedding Website — Requirements Specification

> A private, invitation-only wedding website with tiered guest access, a seat
> finder, a guest photo + wishes gallery, and a travel guide. Frontend in
> Next.js, backend in Python (FastAPI). Built to be cheap to run and easy to
> maintain.

---

## 1. Summary

A web application for a wedding in **Malaysia**. Guests reach the site only
through a unique invitation link (no username/password). What each guest sees
depends on which **tier** their invitation belongs to.

### Guest tiers

| Tier | Attends | Can see |
|------|---------|---------|
| **Full Guest** | Ceremony **and** reception | Everything: full timeline (incl. pre-reception events), seat finder, gallery, travel guide |
| **Reception Guest** | Reception **only** | Reception-and-later timeline only, seat finder, gallery. **No** pre-reception program. **No** travel guide. |

> A guest's tier is fixed to their invitation link and decided by the couple in
> advance.

---

## 2. Access & security model

The site has no login. There are exactly **two invitation links** — one per
tier — and the link **is** the credential. The couple sends the appropriate
link to each guest; the link decides what that guest sees.

- **R-2.1** There are **two tier codes**, each an unguessable, URL-safe string
  (e.g. 22+ random chars). Links look like:
  - Full Guests: `https://<site>/i/<full-code>`
  - Reception Guests: `https://<site>/i/<reception-code>`
  The link is **not** unique per guest — it identifies the **tier**, not the
  person.
- **R-2.2** Visiting a valid link grants a session: the resolved **tier** is
  stored in an **httpOnly cookie** (not exposed to page JavaScript), and the
  code disappears from the visible URL after entry.
- **R-2.3** An invalid or missing code shows a friendly "this link isn't valid
  — please check with the couple" page. No app content leaks.
- **R-2.4 (critical)** Tier restrictions are enforced **server-side on every API
  call**, not just hidden in the UI. A Reception Guest who manually calls the
  travel-guide or pre-reception endpoints must receive `403`, never data.
- **R-2.5** The couple can **rotate** either link (generate a fresh code) if a
  link is shared too widely. Because the links are shared, rotation invalidates
  the old link for **everyone** in that tier and the new link must be
  redistributed — there is no per-guest revocation.
- **R-2.6** Accepted residual risk: a guest can forward their link, and a
  Reception Guest who is given the Full link gets full access. This is
  acceptable for a wedding — no financial or sensitive personal data is exposed
  — and is the trade-off for the simplicity of two shared links.
- **R-2.7 (note — identity):** Because the link doesn't identify the individual,
  the site can't greet a guest by name from the link alone. **Optional**
  enhancement: ask each guest to type their name **once** on first visit (stored
  in the cookie). This is **not** an access gate — it only personalises the
  greeting and pre-fills the seat finder and the gallery uploader name. If not
  wanted, the greeting is generic (e.g. "Welcome!"). See §3.1 / §3.3.

---

## 3. Functional requirements

### 3.1 Home page

- **F-1.1** Display **wedding date** (with day of week), **venue/location**
  (name, address, map link), **dress code**, and an **activity timeline**.
- **F-1.2** Two rendered variants driven by tier:
  - *Full Guest*: full timeline including pre-reception/ceremony events.
  - *Reception Guest*: timeline filtered to reception-phase events and later.
    Earlier events are not shown or hinted at.
- **F-1.3** Timeline events (time, title, description, visibility) are defined
  as constants in `backend/app/routers/home.py`. Editing them requires a code
  change and redeploy. Visibility (`all` = everyone, `full_only` = Full Guests
  only) is still enforced server-side; Reception Guests see only `all` events.
- **F-1.4** A greeting on arrival. Because the link is shared per tier (§2),
  default to a generic greeting (e.g. "Welcome!"). If the optional one-time
  name-entry (R-2.7) is enabled, greet by the name the guest typed.
- **F-1.5** Navigation only shows pages the guest's tier may access (no dead
  links to the travel guide for Reception Guests).

### 3.2 Seat finder

- **F-2.1** Guest searches by typing their name; the app returns their **table
  assignment** (e.g. "Table 7 — Rose").
- **F-2.2** Search tolerates **partial input and minor typos** (case-insensitive,
  trims whitespace, fuzzy/partial match) because guests mistype.
- **F-2.3** If multiple names match, show a short pick-list to disambiguate.
- **F-2.4** If no match, show a polite "we couldn't find that name — please
  refer to the pysical seating board" message with a contact method.
- **F-2.5 (privacy decision — confirm with couple):** Default to showing **only
  the guest's own table**. 
- **F-2.6** Available to both tiers.

### 3.3 Photo + wishes gallery

- **F-3.1** Guests upload one or more **photos** taken on the day (up to 10
  selected at once via a multi-file picker), each sharing an optional **wish
  message** and the uploader's display name. Photos are posted sequentially
  with progress feedback; a per-photo error stops the batch and reports which
  photo failed.
- **F-3.2** A gallery view shows uploaded photos with their messages, newest
  first, in a mobile-friendly grid/feed.
- **F-3.3** Uploads are validated: **image types only** (jpg/png/webp/heic),
  per-file **size cap** (e.g. 10 MB), and a per-guest **rate/quantity limit**
  to control cost and abuse.
- **F-3.4** Images are **resized/compressed** server-side; the original file, a
  display-size version (max 1920 px, WebP, quality 85), and a thumbnail (max 800 px,
  WebP, quality 85) are all stored. Originals are retained so the couple can
  download them after the wedding.
- **F-3.5 Moderation:** 
  - *Auto-show* (default): photos appear immediately; couple removes anything
    unwanted. Best for a live wedding day.
- **F-3.6** Available to both tiers.
- **F-3.7 (decision — confirm):** Whether the gallery is open before the day or
  only on/after the wedding date.

### 3.4 Travel guide

- **F-4.1** Static, content-managed page with sections: **places to visit**,
  **places to eat**, and a **checklist before entering Malaysia** (e.g. entry
  card/MDAC, passport validity, visa check, customs notes — content supplied by
  the couple, not legal advice).
- **F-4.2** **Full Guests only.** Reception Guests get `403` from the API and no
  navigation entry. Any direct URL access redirects them away gracefully.

### 3.5 Admin (for the couple — required, even though not in the brief)

You cannot run or test the public site without these. Keep it minimal but real.

- **F-5.1** Admin access is protected by a **real login** (single shared admin
  password or a small admin-only credential). The public-side "no login" rule
  does **not** apply to admins.
- **F-5.2** Manage the **two invitation links** (one per tier): view each link,
  **rotate** its code if needed (§R-2.5), and **download a QR code** for each
  link for printing on physical invitations.
  - Exactly **two QR codes**: one for the Full Guest link, one for the
    Reception Guest link. Both encode the full `https://<site>/i/<code>` URL.
  - QR codes are generated on-demand by the admin panel and downloadable as PNG.
  - *(No per-guest links or per-guest QR codes — the link identifies the tier,
    not the individual.)*
- **F-5.2b** Manage the **guest list and tables** in a unified **Guests & Tables**
  panel:
  - **Guest List view**: searchable table of all guests (name, pax, tier,
    table assignment) with inline add/edit/delete.
  - **By Table view**: guests grouped under their assigned table card; unassigned
    guests shown in a separate section. Tables can be added, edited, and deleted
    from the same view.
  - **Live search**: filters guests by name in real time across both views.
  - **CSV import**: upload a `.csv` file to bulk-create guests. A preview table
    shows each parsed row with a per-row ✓ OK / ⚠ error status before committing.
    Valid rows are imported; invalid rows (missing name, unknown tier, intra-file
    duplicates) are skipped and reported. Guests whose names already exist in the
    database are skipped automatically.
    - Expected CSV columns: `name`, `tier` (full / reception, defaults to `full`),
      `table` (optional — matched case-insensitively to an existing table label).
      `display_name` column is no longer used and will be ignored if present.
  - **CSV export**: download the full guest list as a `.csv` file.
- **F-5.3** Wedding date, venue details, dress code, and timeline events are
  **code-managed** — edit `backend/app/routers/home.py` and redeploy to update
  them. The admin UI manages **travel-guide content** and **gallery moderation**
  only.
- **F-5.4** Table management is integrated into the Guests & Tables panel (§F-5.2b).
- **F-5.5** **Moderate** the gallery (hide/delete; approve if pre-approval mode).
- **F-5.5b** **Download** photo originals from the gallery moderation UI:
  - Individual photo: "⬇ Original" link on each card.
  - Selective: checkbox-select any photos → "Download Selected (ZIP)".
  - Bulk: "Download All (ZIP)" fetches every stored original as a single ZIP.

---

## 4. Non-functional requirements

- **N-1 Mobile-first.** Most guests open this on a phone. Design for small
  screens first; fast load on mobile data.
- **N-2 Cost.** Target **near-zero idle cost**; comfortably within free/cheap
  tiers at wedding scale (~50–400 guests, a few weeks of real use). See
  TECH_PLAN.md §7.
- **N-3 Low maintenance.** Few moving parts, managed services, simple deploys.
- **N-4 Performance.** APAC-region hosting (guests likely in/near Malaysia);
  gallery uses thumbnails + lazy loading.
- **N-5 Privacy.** No third-party ad/tracking. Guest names and photos are not
  publicly indexable (no search-engine indexing; `noindex`). Never put tokens or
  personal data in query strings or analytics.
- **N-6 Resilience on the day.** The wedding day is the peak. Plan to run the
  backend **always-on for the event window** (a few dollars) to avoid cold-start
  delays, then scale back down.
- **N-7 Accessibility.** Reasonable contrast, alt text, keyboard navigation.
- **N-8 Data retention.** Decide a post-wedding plan for photos/data (export &
  archive, then tear down to stop costs).

---

## 5. Content the couple needs to provide

- Wedding date, venue name + address + map link, dress code text.
- Timeline events, each tagged `all` or `full_only`.
- Guest list with names, tier, and table assignments; table names/numbers.
- Travel-guide content (visit / eat / Malaysia entry checklist).
- A contact method for "can't find my name" / invalid link cases.
- Branding: names, colours, a hero photo, optional logo/monogram.

---

## 6. Out of scope (unless requested later)

- RSVP / meal selection / guest replies.
- Gift registry or payments.
- Live chat or messaging between guests.
- Multi-language UI (note: a MY wedding may want EN + BM and/or 中文 — flag if
  wanted; treat as a later enhancement).
- Real user accounts / social login.

---

## 7. Decisions confirmed

| # | Question | Decision |
|---|----------|----------|
| 1 | Roughly how many guests, and expected photo volume? | 180–200 guests |
| 2 | Multi-language needed? | No |
| 3 | Custom domain to use? | Yes (TBC) |
| 4 | Who will moderate the gallery during the event? | No one — auto-show; couple removes anything unwanted post-event |
| 5 | Gallery open before the wedding day? | TBC |
| 6 | Seat finder shows tablemates or own table only? | Own table only |
