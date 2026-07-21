"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────

interface Guest {
  id: string;
  name: string;
  pax: number | null;
  tier: "full" | "reception";
  table_id: string | null;
  table_label: string | null;
}

interface Table {
  id: string;
  label: string;
  note: string | null;
  guest_count: number;
}

interface Photo {
  id: string;
  uploader_name: string;
  message: string | null;
  url: string;
  thumb_url: string;
  original_url: string | null;
  status: "visible" | "hidden";
  created_at: string;
}

interface InviteLinks {
  full: { url: string; token: string };
  reception: { url: string; token: string };
}

// ── Styles ───────────────────────────────────────────────────────────────────

const C = {
  deep: "oklch(36% .072 152)",
  sage: "oklch(55% .09 150)",
  line: "oklch(0.82 0.03 140)",
  bg: "#f5f5f0",
  card: "#ffffff",
  danger: "#c0392b",
  warn: "#e67e22",
  success: "#27ae60",
} as const;

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px",
  border: `1px solid ${C.line}`, borderRadius: 6,
  fontSize: 13, color: C.deep, outline: "none",
  boxSizing: "border-box", backgroundColor: "#fff",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600,
  letterSpacing: "0.1em", textTransform: "uppercase",
  color: C.deep, marginBottom: 4,
};

const btnStyle = (variant: "primary" | "danger" | "ghost" = "primary"): React.CSSProperties => ({
  padding: "7px 14px", borderRadius: 6, border: "none",
  fontSize: 12, fontWeight: 600, letterSpacing: "0.1em",
  cursor: "pointer", textTransform: "uppercase",
  backgroundColor:
    variant === "primary" ? C.deep
    : variant === "danger" ? C.danger
    : "transparent",
  color: variant === "ghost" ? C.sage : "#fff",
  textDecoration: variant === "ghost" ? "underline" : "none",
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, cache: "no-store" });
  return res;
}

// ── Invite Links Tab ─────────────────────────────────────────────────────────

function InviteLinksTab() {
  const [links, setLinks] = useState<InviteLinks | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/admin/invite-links")
      .then(r => r.json())
      .then(setLinks)
      .finally(() => setLoading(false));
  }, []);

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function downloadQR(tier: "full" | "reception") {
    const a = document.createElement("a");
    a.href = `/api/admin/invite-links/qr?tier=${tier}`;
    a.download = `invite-qr-${tier}.png`;
    a.click();
  }

  if (loading) return <p style={{ color: C.sage, padding: 16 }}>Loading…</p>;
  if (!links) return <p style={{ color: C.danger, padding: 16 }}>Failed to load invite links.</p>;

  const tiers: Array<{ key: "full" | "reception"; label: string; color: string }> = [
    { key: "full", label: "Full Guest Invite", color: C.deep },
    { key: "reception", label: "Reception Guest Invite", color: "#b23a2b" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {tiers.map(({ key, label, color }) => (
        <div key={key} style={{
          backgroundColor: C.card, borderRadius: 12,
          padding: "24px 28px", border: `1px solid ${C.line}`,
        }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color }}>
            {label}
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: C.sage }}>
            Tier: {key}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <code style={{
              flex: 1, padding: "8px 12px", backgroundColor: C.bg,
              borderRadius: 6, fontSize: 13, wordBreak: "break-all",
              border: `1px solid ${C.line}`,
            }}>
              {links[key].url}
            </code>
            <button
              onClick={() => copyToClipboard(links[key].url, key)}
              style={btnStyle("primary")}
            >
              {copied === key ? "Copied!" : "Copy"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => downloadQR(key)} style={btnStyle("primary")}>
              Download QR Code
            </button>
            <button
              onClick={() => copyToClipboard(links[key].token, `token-${key}`)}
              style={btnStyle("ghost")}
            >
              {copied === `token-${key}` ? "Copied!" : "Copy token only"}
            </button>
          </div>
        </div>
      ))}

      <div style={{
        backgroundColor: "#fffef0", borderRadius: 8, padding: "14px 18px",
        border: "1px solid #e8d88a", fontSize: 13, color: "#7a6800",
      }}>
        <strong>Note:</strong> To rotate an invite link, update <code>INVITE_TOKEN_FULL</code> or{" "}
        <code>INVITE_TOKEN_RECEPTION</code> in the backend environment and redeploy. The old link
        will immediately stop working.
      </div>
    </div>
  );
}

// ── Import Modal ─────────────────────────────────────────────────────────────

interface ImportRow {
  name: string;
  tier: string;
  table_label: string;
  _error?: string;
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [parseError, setParseError] = useState("");

  function normaliseKey(k: string) {
    return k.toLowerCase().replace(/[\s_-]+/g, "");
  }

  function findCol(obj: Record<string, unknown>, ...candidates: string[]): string {
    const keys = Object.keys(obj);
    for (const c of candidates) {
      const hit = keys.find(k => normaliseKey(k) === c);
      if (hit !== undefined) return String(obj[hit] ?? "").trim();
    }
    return "";
  }

  function processRawRows(raw: Record<string, unknown>[], srcName: string) {
    if (raw.length === 0) { setParseError("The file appears to be empty."); return; }
    const parsed: ImportRow[] = raw.map((r) => {
      const name = findCol(r, "name", "fullname");
      const tier = (findCol(r, "tier", "type") || "full").toLowerCase();
      const table_label = findCol(r, "table", "tablelabel", "tablename");
      let _error: string | undefined;
      if (!name) _error = "Missing name";
      else if (!["full", "reception"].includes(tier)) _error = `Invalid tier "${tier}"`;
      return { name, tier, table_label, _error };
    });
    const seen = new Set<string>();
    for (const r of parsed) {
      if (r.name && seen.has(r.name.toLowerCase())) r._error = r._error ?? "Duplicate within file";
      else if (r.name) seen.add(r.name.toLowerCase());
    }
    setRows(parsed);
    setFileName(`${srcName} — ${raw.length} row${raw.length !== 1 ? "s" : ""}`);
  }

  function parseCsvText(text: string): Record<string, unknown>[] {
    function splitLine(line: string): string[] {
      const cols: string[] = [];
      let cur = "", inQ = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
          else inQ = !inQ;
        } else if (line[i] === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
        else cur += line[i];
      }
      cols.push(cur.trim());
      return cols;
    }
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = splitLine(lines[0]);
    return lines.slice(1).map(line => {
      const vals = splitLine(line);
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
      return obj;
    });
  }

  function parseFile(file: File) {
    setParseError(""); setRows(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseError("Only .csv files are supported. Please save your spreadsheet as CSV first.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseCsvText(e.target?.result as string);
        processRawRows(rows, file.name);
      } catch {
        setParseError("Could not parse this CSV file.");
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) parseFile(f);
  }

  const validRows = rows?.filter(r => !r._error) ?? [];
  const errorRows = rows?.filter(r => r._error) ?? [];

  async function doImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const res = await apiFetch("/api/admin/guests/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validRows.map(r => ({
          name: r.name,
          tier: r.tier,
          table_label: r.table_label || null,
        }))),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ created: 0, skipped: 0, errors: ["Network error — please try again."] });
    } finally {
      setImporting(false);
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: "#fff", borderRadius: 14,
    width: "100%", maxWidth: 700, maxHeight: "90vh",
    overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    padding: "28px 32px",
  };

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: C.deep }}>Import Guests from Excel</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.sage, lineHeight: 1 }}>×</button>
        </div>

        {!result ? (
          <>
            {/* Format guide */}
            <div style={{ backgroundColor: "#f5f8f5", borderRadius: 8, padding: "12px 16px", marginBottom: 18, fontSize: 12, color: C.sage, lineHeight: 1.6 }}>
              <strong style={{ color: C.deep }}>Expected CSV columns (row 1 = header):</strong><br />
              <code>name</code> · <code>tier</code> (full / reception, default: full) · <code>table</code> (optional — must match an existing table label exactly)<br />
              <span style={{ marginTop: 4, display: "inline-block" }}>Tip: export from Excel via <em>File → Save As → CSV UTF-8</em></span>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${C.line}`, borderRadius: 10,
                padding: "28px 20px", textAlign: "center",
                cursor: "pointer", marginBottom: 16,
                backgroundColor: "#fafaf8", color: C.sage, fontSize: 13,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
              {fileName
                ? <strong style={{ color: C.deep }}>{fileName}</strong>
                : <>Drop a <strong>.csv</strong> file here, or click to browse</>}
              <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
            </div>

            {parseError && <p style={{ color: C.danger, fontSize: 12, marginBottom: 12 }}>{parseError}</p>}

            {/* Preview */}
            {rows && (
              <>
                <div style={{ marginBottom: 8, fontSize: 12, color: C.sage }}>
                  <span style={{ color: C.success, fontWeight: 600 }}>{validRows.length} ready</span>
                  {errorRows.length > 0 && <span style={{ color: C.danger, fontWeight: 600, marginLeft: 12 }}>{errorRows.length} will be skipped</span>}
                </div>
                <div style={{ overflowX: "auto", maxHeight: 280, overflowY: "auto", border: `1px solid ${C.line}`, borderRadius: 8, marginBottom: 18 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f5f8f5", position: "sticky", top: 0 }}>
                        {["Name", "Tier", "Table", "Status"].map(h => (
                          <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.sage, borderBottom: `1px solid ${C.line}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.line}`, backgroundColor: r._error ? "#fff5f5" : i % 2 === 0 ? "#fff" : "#fafaf8" }}>
                          <td style={{ padding: "7px 10px", color: C.deep }}>{r.name || <em style={{ color: C.sage }}>—</em>}</td>
                          <td style={{ padding: "7px 10px" }}>
                            <span style={{ padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 600, backgroundColor: r.tier === "full" ? "#e8f0e8" : "#fce8e8", color: r.tier === "full" ? C.deep : "#b23a2b" }}>
                              {r.tier}
                            </span>
                          </td>
                          <td style={{ padding: "7px 10px", color: C.sage }}>{r.table_label || "—"}</td>
                          <td style={{ padding: "7px 10px" }}>
                            {r._error
                              ? <span style={{ color: C.danger, fontSize: 10 }}>⚠ {r._error}</span>
                              : <span style={{ color: C.success, fontSize: 10 }}>✓ OK</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={onClose} style={btnStyle("ghost")}>Cancel</button>
                  <button
                    onClick={doImport}
                    disabled={validRows.length === 0 || importing}
                    style={{ ...btnStyle("primary"), opacity: validRows.length === 0 ? 0.4 : 1 }}
                  >
                    {importing ? "Importing…" : `Import ${validRows.length} Guest${validRows.length !== 1 ? "s" : ""}`}
                  </button>
                </div>
              </>
            )}

            {!rows && !parseError && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={onClose} style={btnStyle("ghost")}>Cancel</button>
              </div>
            )}
          </>
        ) : (
          /* Result screen */
          <div>
            <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
              <div style={{ flex: 1, backgroundColor: "#e8f5e8", borderRadius: 10, padding: "18px 20px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: C.success }}>{result.created}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: C.sage, textTransform: "uppercase", letterSpacing: "0.1em" }}>Created</p>
              </div>
              <div style={{ flex: 1, backgroundColor: result.skipped > 0 ? "#fff5f0" : "#f5f8f5", borderRadius: 10, padding: "18px 20px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: result.skipped > 0 ? C.warn : C.sage }}>{result.skipped}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: C.sage, textTransform: "uppercase", letterSpacing: "0.1em" }}>Skipped</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div style={{ backgroundColor: "#fff5f0", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
                <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 12, color: C.warn }}>Notes / warnings:</p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {result.errors.map((e, i) => <li key={i} style={{ fontSize: 12, color: "#7a4000", marginBottom: 4 }}>{e}</li>)}
                </ul>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => { onDone(); onClose(); }} style={btnStyle("primary")}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Seating Tab (Guests + Tables unified) ────────────────────────────────────

function SeatingTab() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "table">("list");
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);

  // Guest form state
  const [guestForm, setGuestForm] = useState({ name: "", pax: "", tier: "full", table_id: "" });
  const [guestAddMode, setGuestAddMode] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [guestSaving, setGuestSaving] = useState(false);
  const [guestError, setGuestError] = useState("");

  // Table form state
  const [tableForm, setTableForm] = useState({ label: "", note: "" });
  const [tableAddMode, setTableAddMode] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [tableSaving, setTableSaving] = useState(false);
  const [tableError, setTableError] = useState("");

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiFetch("/api/admin/guests").then(r => r.json()),
      apiFetch("/api/admin/tables").then(r => r.json()),
    ]).then(([g, t]) => { setGuests(g); setTables(t); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Guest handlers ──
  function startAddGuest() {
    setGuestForm({ name: "", pax: "", tier: "full", table_id: "" });
    setGuestAddMode(true); setEditingGuestId(null); setGuestError("");
    setTableAddMode(false); setEditingTableId(null);
  }

  function startEditGuest(g: Guest) {
    setGuestForm({ name: g.name, pax: g.pax != null ? String(g.pax) : "", tier: g.tier, table_id: g.table_id ?? "" });
    setEditingGuestId(g.id); setGuestAddMode(false); setGuestError("");
    setTableAddMode(false); setEditingTableId(null);
  }

  function cancelGuest() { setGuestAddMode(false); setEditingGuestId(null); setGuestError(""); }

  async function saveGuest(e: React.FormEvent) {
    e.preventDefault();
    setGuestSaving(true); setGuestError("");
    const body = { name: guestForm.name.trim(), pax: guestForm.pax !== "" ? parseInt(guestForm.pax) : null, tier: guestForm.tier, table_id: guestForm.table_id || null };
    try {
      const res = guestAddMode
        ? await apiFetch("/api/admin/guests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await apiFetch(`/api/admin/guests/${editingGuestId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setGuestError(d.detail || "Failed to save."); }
      else { cancelGuest(); loadAll(); }
    } catch { setGuestError("Network error."); }
    finally { setGuestSaving(false); }
  }

  async function deleteGuest(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    await apiFetch(`/api/admin/guests/${id}`, { method: "DELETE" });
    loadAll();
  }

  // ── Table handlers ──
  function startAddTable() {
    setTableForm({ label: "", note: "" });
    setTableAddMode(true); setEditingTableId(null); setTableError("");
    setGuestAddMode(false); setEditingGuestId(null);
  }

  function startEditTable(t: Table) {
    setTableForm({ label: t.label, note: t.note ?? "" });
    setEditingTableId(t.id); setTableAddMode(false); setTableError("");
    setGuestAddMode(false); setEditingGuestId(null);
  }

  function cancelTable() { setTableAddMode(false); setEditingTableId(null); setTableError(""); }

  async function saveTable(e: React.FormEvent) {
    e.preventDefault();
    setTableSaving(true); setTableError("");
    const body = { label: tableForm.label.trim(), note: tableForm.note.trim() || null };
    try {
      const res = tableAddMode
        ? await apiFetch("/api/admin/tables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await apiFetch(`/api/admin/tables/${editingTableId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setTableError(d.detail || "Failed to save."); }
      else { cancelTable(); loadAll(); }
    } catch { setTableError("Network error."); }
    finally { setTableSaving(false); }
  }

  async function deleteTable(id: string, label: string, guestCount: number) {
    const msg = guestCount > 0 ? `Delete "${label}"? ${guestCount} guest(s) will be unassigned.` : `Delete "${label}"?`;
    if (!confirm(msg)) return;
    await apiFetch(`/api/admin/tables/${id}`, { method: "DELETE" });
    loadAll();
  }

  function downloadExport() {
    const a = document.createElement("a"); a.href = "/api/admin/guests/export"; a.download = "guests.csv"; a.click();
  }

  // ── Derived data ──
  const q = search.trim().toLowerCase();
  const filteredGuests = q
    ? guests.filter(g => g.name.toLowerCase().includes(q))
    : guests;

  const guestsByTableId = new Map<string | null, Guest[]>();
  for (const g of guests) {
    const key = g.table_id ?? null;
    if (!guestsByTableId.has(key)) guestsByTableId.set(key, []);
    guestsByTableId.get(key)!.push(g);
  }

  const tierBadge = (tier: string) => (
    <span style={{
      padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600,
      backgroundColor: tier === "full" ? "#e8f0e8" : "#fce8e8",
      color: tier === "full" ? C.deep : "#b23a2b",
    }}>{tier}</span>
  );

  const guestRow = (g: Guest, i: number, last: boolean) => (
    <div key={g.id} style={{
      padding: "10px 18px", display: "flex", alignItems: "center", gap: 12,
      borderBottom: !last ? `1px solid ${C.line}` : "none",
      backgroundColor: i % 2 === 0 ? "#fff" : "#fafaf8",
    }}>
      <span style={{ flex: 1, color: C.deep, fontSize: 13, fontWeight: 500 }}>{g.name}</span>
      {g.pax != null && <span style={{ fontSize: 11, color: C.sage, whiteSpace: "nowrap" }}>{g.pax} pax</span>}
      {tierBadge(g.tier)}
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => startEditGuest(g)} style={{ ...btnStyle("ghost"), fontSize: 11, padding: "4px 10px" }}>Edit</button>
        <button onClick={() => deleteGuest(g.id, g.name)} style={{ ...btnStyle("danger"), fontSize: 11, padding: "4px 8px" }}>Del</button>
      </div>
    </div>
  );

  return (
    <>
    {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={loadAll} />}
    <div>
      {/* ── Toolbar ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: C.sage, whiteSpace: "nowrap" }}>
          {guests.length} guest{guests.length !== 1 ? "s" : ""} · {tables.length} table{tables.length !== 1 ? "s" : ""}
        </span>

        {/* Search */}
        <input
          style={{ ...inputStyle, flex: "1 1 180px", maxWidth: 300, paddingLeft: 12 }}
          placeholder="Search guests…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* View toggle */}
        <div style={{ display: "flex", borderRadius: 6, border: `1px solid ${C.line}`, overflow: "hidden" }}>
          {(["list", "table"] as const).map((v, i) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "6px 14px", border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
              backgroundColor: view === v ? C.deep : "#fff",
              color: view === v ? "#fff" : C.sage,
              borderLeft: i > 0 ? `1px solid ${C.line}` : "none",
            }}>
              {v === "list" ? "Guest List" : "By Table"}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={startAddGuest} style={btnStyle("primary")}>+ Guest</button>
          <button onClick={startAddTable} style={btnStyle("primary")}>+ Table</button>
          <button onClick={() => setShowImport(true)} style={btnStyle("ghost")}>Import CSV</button>
          <button onClick={downloadExport} style={btnStyle("ghost")}>Export CSV</button>
        </div>
      </div>

      {/* ── Guest form ── */}
      {(guestAddMode || editingGuestId) && (
        <form onSubmit={saveGuest} style={{ backgroundColor: "#f0f5f0", borderRadius: 10, padding: "20px", marginBottom: 16, border: `1px solid ${C.line}` }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: C.deep }}>
            {guestAddMode ? "Add Guest" : "Edit Guest"}
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={guestForm.name} onChange={e => setGuestForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>Pax (people count)</label>
              <input style={inputStyle} type="number" min="1" placeholder="1" value={guestForm.pax} onChange={e => setGuestForm(f => ({ ...f, pax: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Tier *</label>
              <select style={inputStyle} value={guestForm.tier} onChange={e => setGuestForm(f => ({ ...f, tier: e.target.value }))}>
                <option value="full">Full Guest</option>
                <option value="reception">Reception Guest</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Table</label>
              <select style={inputStyle} value={guestForm.table_id} onChange={e => setGuestForm(f => ({ ...f, table_id: e.target.value }))}>
                <option value="">— No table —</option>
                {tables.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>
          {guestError && <p style={{ color: C.danger, fontSize: 12, margin: "0 0 10px" }}>{guestError}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={guestSaving} style={btnStyle("primary")}>{guestSaving ? "Saving…" : "Save"}</button>
            <button type="button" onClick={cancelGuest} style={btnStyle("ghost")}>Cancel</button>
          </div>
        </form>
      )}

      {/* ── Table form ── */}
      {(tableAddMode || editingTableId) && (
        <form onSubmit={saveTable} style={{ backgroundColor: "#f0f5f0", borderRadius: 10, padding: "20px", marginBottom: 16, border: `1px solid ${C.line}` }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: C.deep }}>
            {tableAddMode ? "Add Table" : "Edit Table"}
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Label *</label>
              <input style={inputStyle} placeholder="e.g. Table 1 — Orchid" value={tableForm.label} onChange={e => setTableForm(f => ({ ...f, label: e.target.value }))} required />
            </div>
            <div>
              <label style={labelStyle}>Note (optional)</label>
              <input style={inputStyle} placeholder="Optional note" value={tableForm.note} onChange={e => setTableForm(f => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          {tableError && <p style={{ color: C.danger, fontSize: 12, margin: "0 0 10px" }}>{tableError}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={tableSaving} style={btnStyle("primary")}>{tableSaving ? "Saving…" : "Save"}</button>
            <button type="button" onClick={cancelTable} style={btnStyle("ghost")}>Cancel</button>
          </div>
        </form>
      )}

      {/* ── Content ── */}
      {loading ? (
        <p style={{ color: C.sage }}>Loading…</p>

      ) : view === "list" ? (
        /* ── Guest List view ── */
        filteredGuests.length === 0 ? (
          <p style={{ color: C.sage, textAlign: "center", padding: "32px 0" }}>
            {q ? `No guests matching "${search}".` : 'No guests yet. Click "+ Guest" to add one.'}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.line}` }}>
                  {["Name", "Pax", "Tier", "Table", ""].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.sage }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((g, i) => (
                  <tr key={g.id} style={{ borderBottom: `1px solid ${C.line}`, backgroundColor: i % 2 === 0 ? "#fff" : "#fafaf8" }}>
                    <td style={{ padding: "10px 12px", color: C.deep }}>{g.name}</td>
                    <td style={{ padding: "10px 12px", color: C.sage }}>{g.pax ?? "—"}</td>
                    <td style={{ padding: "10px 12px" }}>{tierBadge(g.tier)}</td>
                    <td style={{ padding: "10px 12px", color: C.sage }}>{g.table_label ?? "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => startEditGuest(g)} style={btnStyle("ghost")}>Edit</button>
                        <button onClick={() => deleteGuest(g.id, g.name)} style={{ ...btnStyle("danger"), fontSize: 11, padding: "4px 10px" }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      ) : (
        /* ── By Table view ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tables.length === 0 && (
            <p style={{ color: C.sage, textAlign: "center", padding: "32px 0" }}>No tables yet. Click "+ Table" to create one.</p>
          )}

          {tables.map(t => {
            const allInTable = guestsByTableId.get(t.id) ?? [];
            const shown = q ? allInTable.filter(g => g.name.toLowerCase().includes(q)) : allInTable;
            const totalPax = allInTable.reduce((s, g) => s + (g.pax ?? 1), 0);
            return (
              <div key={t.id} style={{ backgroundColor: C.card, borderRadius: 10, border: `1px solid ${C.line}`, overflow: "hidden" }}>
                {/* Table header */}
                <div style={{
                  padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  backgroundColor: "#f5f8f5", borderBottom: shown.length > 0 ? `1px solid ${C.line}` : "none",
                }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: C.deep, fontSize: 14 }}>{t.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: C.sage }}>
                      {allInTable.length} guest{allInTable.length !== 1 ? "s" : ""} · {totalPax} pax{t.note ? ` · ${t.note}` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => startEditTable(t)} style={btnStyle("ghost")}>Edit Table</button>
                    <button onClick={() => deleteTable(t.id, t.label, allInTable.length)} style={{ ...btnStyle("danger"), fontSize: 11, padding: "4px 10px" }}>Delete</button>
                  </div>
                </div>
                {shown.map((g, i) => guestRow(g, i, i === shown.length - 1))}
                {q && shown.length === 0 && allInTable.length > 0 && (
                  <p style={{ padding: "10px 18px", margin: 0, fontSize: 12, color: C.sage, fontStyle: "italic" }}>
                    No guests at this table match "{search}"
                  </p>
                )}
              </div>
            );
          })}

          {/* Unassigned guests */}
          {(() => {
            const all = guestsByTableId.get(null) ?? [];
            const shown = q ? all.filter(g => g.name.toLowerCase().includes(q)) : all;
            if (all.length === 0) return null;
            return (
              <div style={{ backgroundColor: C.card, borderRadius: 10, border: `1px dashed ${C.line}`, overflow: "hidden" }}>
                <div style={{
                  padding: "14px 18px", backgroundColor: "#fafaf8",
                  borderBottom: shown.length > 0 ? `1px solid ${C.line}` : "none",
                }}>
                  <p style={{ margin: 0, fontWeight: 600, color: C.sage, fontSize: 14 }}>Unassigned</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: C.sage }}>{all.length} guest{all.length !== 1 ? "s" : ""} not assigned to a table</p>
                </div>
                {shown.map((g, i) => guestRow(g, i, i === shown.length - 1))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
    </>
  );
}

// ── Photos Tab ────────────────────────────────────────────────────────────────

function PhotosTab() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadPhotos = useCallback(() => {
    setLoading(true);
    apiFetch("/api/admin/photos")
      .then(r => r.json())
      .then((data: Photo[]) => { setPhotos(data); setSelected(new Set()); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  async function toggleStatus(p: Photo) {
    const next = p.status === "visible" ? "hidden" : "visible";
    await apiFetch(`/api/admin/photos/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    loadPhotos();
  }

  async function deletePhoto(p: Photo) {
    if (!confirm(`Delete photo by ${p.uploader_name}? This cannot be undone.`)) return;
    await apiFetch(`/api/admin/photos/${p.id}`, { method: "DELETE" });
    loadPhotos();
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map(p => p.id)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function triggerZipDownload(ids?: string[]) {
    const qs = ids && ids.length > 0 ? `?ids=${encodeURIComponent(ids.join(","))}` : "";
    const a = document.createElement("a");
    a.href = `/api/admin/photos/download-zip${qs}`;
    a.download = "wedding-photos.zip";
    a.click();
  }

  async function downloadSelected() {
    if (selected.size === 0) return;
    if (selected.size > 50 && !confirm(`Downloading ${selected.size} originals may take a while. Continue?`)) return;
    setZipping(true);
    triggerZipDownload([...selected]);
    setTimeout(() => setZipping(false), 2000);
  }

  async function downloadAll() {
    const withOriginals = photos.filter(p => p.original_url);
    if (withOriginals.length === 0) { alert("No originals have been stored yet."); return; }
    if (withOriginals.length > 50 && !confirm(`Downloading all ${withOriginals.length} originals may take a while. Continue?`)) return;
    setZipping(true);
    triggerZipDownload();
    setTimeout(() => setZipping(false), 2000);
  }

  const filtered = filter === "all" ? photos : photos.filter(p => p.status === filter);
  const withOriginals = photos.filter(p => p.original_url).length;

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: C.sage, marginRight: "auto" }}>
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
          {withOriginals > 0 && ` · ${withOriginals} with originals`}
        </span>

        {/* Filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "visible", "hidden"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.line}`,
              fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
              cursor: "pointer",
              backgroundColor: filter === f ? C.deep : "#fff",
              color: filter === f ? "#fff" : C.sage,
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Selection + download toolbar */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
        marginBottom: 14, padding: "10px 14px",
        backgroundColor: "#f0f5f0", borderRadius: 8, border: `1px solid ${C.line}`,
      }}>
        <span style={{ fontSize: 12, color: C.sage }}>
          {selected.size > 0 ? `${selected.size} selected` : "Select photos to download"}
        </span>
        <button onClick={selectAll} style={{ ...btnStyle("ghost"), fontSize: 11, padding: "4px 10px" }}>Select All</button>
        <button onClick={deselectAll} disabled={selected.size === 0} style={{ ...btnStyle("ghost"), fontSize: 11, padding: "4px 10px", opacity: selected.size === 0 ? 0.4 : 1 }}>Deselect All</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={downloadSelected}
            disabled={selected.size === 0 || zipping}
            style={{ ...btnStyle("primary"), fontSize: 11, padding: "5px 12px", opacity: selected.size === 0 ? 0.4 : 1 }}
          >
            {zipping ? "Preparing…" : `⬇ Download Selected${selected.size > 0 ? ` (${selected.size})` : ""}`}
          </button>
          <button
            onClick={downloadAll}
            disabled={withOriginals === 0 || zipping}
            style={{ ...btnStyle("primary"), fontSize: 11, padding: "5px 12px", opacity: withOriginals === 0 ? 0.4 : 1 }}
          >
            {zipping ? "Preparing…" : "⬇ Download All (ZIP)"}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: C.sage }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: C.sage, textAlign: "center", padding: "32px 0" }}>
          {photos.length === 0 ? "No photos uploaded yet." : "No photos match this filter."}
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {filtered.map(p => {
            const isSelected = selected.has(p.id);
            return (
              <div key={p.id} style={{
                backgroundColor: C.card, borderRadius: 10, overflow: "hidden",
                border: `2px solid ${isSelected ? C.deep : C.line}`,
                opacity: p.status === "hidden" ? 0.6 : 1,
                position: "relative",
              }}>
                {/* Checkbox */}
                <div
                  onClick={() => toggleSelect(p.id)}
                  style={{
                    position: "absolute", top: 8, left: 8, zIndex: 2,
                    width: 20, height: 20, borderRadius: 4,
                    backgroundColor: isSelected ? C.deep : "rgba(255,255,255,0.85)",
                    border: `2px solid ${isSelected ? C.deep : "rgba(0,0,0,0.25)"}`,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {isSelected && <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>✓</span>}
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumb_url}
                  alt={`Photo by ${p.uploader_name}`}
                  style={{ width: "100%", height: 160, objectFit: "cover", display: "block", cursor: "pointer" }}
                  onClick={() => toggleSelect(p.id)}
                />
                <div style={{ padding: "10px 12px" }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.deep }}>{p.uploader_name}</p>
                  {p.message && <p style={{ margin: "4px 0 0", fontSize: 11, color: C.sage, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.message}</p>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                      padding: "2px 7px", borderRadius: 8,
                      backgroundColor: p.status === "visible" ? "#e8f5e8" : "#fce8e8",
                      color: p.status === "visible" ? C.success : C.danger,
                    }}>
                      {p.status}
                    </span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => toggleStatus(p)} style={{ ...btnStyle("ghost"), fontSize: 10, padding: "3px 8px" }}>
                        {p.status === "visible" ? "Hide" : "Show"}
                      </button>
                      <button onClick={() => deletePhoto(p)} style={{ ...btnStyle("danger"), fontSize: 10, padding: "3px 8px" }}>Del</button>
                    </div>
                  </div>
                  {/* Individual original download */}
                  {p.original_url && (
                    <a
                      href={p.original_url}
                      download
                      style={{
                        display: "block", marginTop: 8, textAlign: "center",
                        fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
                        color: C.sage, textDecoration: "none",
                        padding: "4px 0", borderTop: `1px solid ${C.line}`,
                      }}
                    >
                      ⬇ Original
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Dashboard shell ───────────────────────────────────────────────────────────

type Tab = "links" | "seating" | "photos";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("links");
  const [role, setRole] = useState<string>("owner");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/me")
      .then(r => r.json())
      .then(d => {
        const r = d.role ?? "owner";
        setRole(r);
        if (r === "planner" && activeTab === "photos") setActiveTab("links");
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const isOwner = role !== "planner";
  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "links", label: "Invite Links" },
    { key: "seating", label: "Guests & Tables" },
    ...(isOwner ? [{ key: "photos" as Tab, label: "Photos" }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, fontFamily: "'Mulish', sans-serif" }}>
      {/* Header */}
      <header style={{ backgroundColor: C.deep, padding: "0 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 500, color: "#fff", letterSpacing: "0.05em" }}>
            I &amp; M — Admin
          </span>
          <button onClick={handleLogout} style={{
            background: "transparent", border: `1px solid rgba(255,255,255,0.3)`,
            color: "rgba(255,255,255,0.8)", padding: "6px 16px", borderRadius: 6,
            fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
            cursor: "pointer",
          }}>
            Logout
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div style={{ backgroundColor: "#fff", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", display: "flex", gap: 0 }}>
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: "14px 20px", border: "none", background: "transparent",
                fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer",
                color: activeTab === key ? C.deep : C.sage,
                borderBottom: activeTab === key ? `2px solid ${C.deep}` : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px" }}>
        {activeTab === "links" && <InviteLinksTab />}
        {activeTab === "seating" && <SeatingTab />}
        {activeTab === "photos" && <PhotosTab />}
      </main>
    </div>
  );
}
