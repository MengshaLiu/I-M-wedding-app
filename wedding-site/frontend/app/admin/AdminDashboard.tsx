"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────

interface Guest {
  id: string;
  name: string;
  display_name: string;
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

// ── Guests Tab ───────────────────────────────────────────────────────────────

function GuestsTab({ tables }: { tables: Table[] }) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", display_name: "", tier: "full", table_id: "" });
  const [addMode, setAddMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadGuests = useCallback(() => {
    setLoading(true);
    apiFetch("/api/admin/guests")
      .then(r => r.json())
      .then(setGuests)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadGuests(); }, [loadGuests]);

  function startAdd() {
    setForm({ name: "", display_name: "", tier: "full", table_id: "" });
    setAddMode(true);
    setEditingId(null);
    setError("");
  }

  function startEdit(g: Guest) {
    setForm({ name: g.name, display_name: g.display_name, tier: g.tier, table_id: g.table_id ?? "" });
    setEditingId(g.id);
    setAddMode(false);
    setError("");
  }

  function cancel() {
    setAddMode(false);
    setEditingId(null);
    setError("");
  }

  async function saveGuest(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      name: form.name.trim(),
      display_name: form.display_name.trim(),
      tier: form.tier,
      table_id: form.table_id || null,
    };

    try {
      const res = addMode
        ? await apiFetch("/api/admin/guests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await apiFetch(`/api/admin/guests/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || "Failed to save.");
      } else {
        cancel();
        loadGuests();
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGuest(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    await apiFetch(`/api/admin/guests/${id}`, { method: "DELETE" });
    loadGuests();
  }

  function downloadExport() {
    const a = document.createElement("a");
    a.href = "/api/admin/guests/export";
    a.download = "guests.csv";
    a.click();
  }

  const GuestForm = () => (
    <form onSubmit={saveGuest} style={{
      backgroundColor: "#f0f5f0", borderRadius: 10,
      padding: "20px", marginBottom: 16,
      border: `1px solid ${C.line}`,
    }}>
      <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: C.deep }}>
        {addMode ? "Add Guest" : "Edit Guest"}
      </h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.deep, marginBottom: 4 }}>Full Name *</label>
          <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.deep, marginBottom: 4 }}>Display Name *</label>
          <input style={inputStyle} value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} required />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.deep, marginBottom: 4 }}>Tier *</label>
          <select style={inputStyle} value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>
            <option value="full">Full Guest</option>
            <option value="reception">Reception Guest</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.deep, marginBottom: 4 }}>Table</label>
          <select style={inputStyle} value={form.table_id} onChange={e => setForm(f => ({ ...f, table_id: e.target.value }))}>
            <option value="">— No table —</option>
            {tables.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </div>
      {error && <p style={{ color: C.danger, fontSize: 12, margin: "0 0 10px" }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={saving} style={btnStyle("primary")}>{saving ? "Saving…" : "Save"}</button>
        <button type="button" onClick={cancel} style={btnStyle("ghost")}>Cancel</button>
      </div>
    </form>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: C.sage }}>
          {guests.length} guest{guests.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={downloadExport} style={btnStyle("ghost")}>Export CSV</button>
          <button onClick={startAdd} style={btnStyle("primary")}>+ Add Guest</button>
        </div>
      </div>

      {(addMode || editingId) && <GuestForm />}

      {loading ? (
        <p style={{ color: C.sage }}>Loading…</p>
      ) : guests.length === 0 ? (
        <p style={{ color: C.sage, textAlign: "center", padding: "32px 0" }}>No guests yet. Add one above.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.line}` }}>
                {["Name", "Display", "Tier", "Table", ""].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.sage }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guests.map((g, i) => (
                <tr key={g.id} style={{ borderBottom: `1px solid ${C.line}`, backgroundColor: i % 2 === 0 ? "#fff" : "#fafaf8" }}>
                  <td style={{ padding: "10px 12px", color: C.deep }}>{g.name}</td>
                  <td style={{ padding: "10px 12px", color: C.sage }}>{g.display_name}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                      backgroundColor: g.tier === "full" ? "#e8f0e8" : "#fce8e8",
                      color: g.tier === "full" ? C.deep : "#b23a2b",
                    }}>
                      {g.tier}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: C.sage }}>{g.table_label ?? "—"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => startEdit(g)} style={btnStyle("ghost")}>Edit</button>
                      <button onClick={() => deleteGuest(g.id, g.name)} style={{ ...btnStyle("danger"), fontSize: 11, padding: "4px 10px" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Tables Tab ────────────────────────────────────────────────────────────────

function TablesTab({ onTablesChange }: { onTablesChange: (tables: Table[]) => void }) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ label: "", note: "" });
  const [addMode, setAddMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTables = useCallback(() => {
    setLoading(true);
    apiFetch("/api/admin/tables")
      .then(r => r.json())
      .then((data: Table[]) => { setTables(data); onTablesChange(data); })
      .finally(() => setLoading(false));
  }, [onTablesChange]);

  useEffect(() => { loadTables(); }, [loadTables]);

  function startAdd() {
    setForm({ label: "", note: "" });
    setAddMode(true);
    setEditingId(null);
    setError("");
  }

  function startEdit(t: Table) {
    setForm({ label: t.label, note: t.note ?? "" });
    setEditingId(t.id);
    setAddMode(false);
    setError("");
  }

  function cancel() {
    setAddMode(false);
    setEditingId(null);
    setError("");
  }

  async function saveTable(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = { label: form.label.trim(), note: form.note.trim() || null };
    try {
      const res = addMode
        ? await apiFetch("/api/admin/tables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await apiFetch(`/api/admin/tables/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail || "Failed to save.");
      } else {
        cancel();
        loadTables();
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTable(id: string, label: string, guestCount: number) {
    const msg = guestCount > 0
      ? `Delete "${label}"? ${guestCount} guest(s) will be unassigned.`
      : `Delete "${label}"?`;
    if (!confirm(msg)) return;
    await apiFetch(`/api/admin/tables/${id}`, { method: "DELETE" });
    loadTables();
  }

  const TableForm = () => (
    <form onSubmit={saveTable} style={{
      backgroundColor: "#f0f5f0", borderRadius: 10, padding: "20px", marginBottom: 16, border: `1px solid ${C.line}`,
    }}>
      <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: C.deep }}>
        {addMode ? "Add Table" : "Edit Table"}
      </h4>
      <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.deep, marginBottom: 4 }}>Label *</label>
          <input style={inputStyle} placeholder="e.g. Table 1 — Orchid" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} required />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.deep, marginBottom: 4 }}>Note (optional)</label>
          <input style={inputStyle} placeholder="Optional note" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
        </div>
      </div>
      {error && <p style={{ color: C.danger, fontSize: 12, margin: "0 0 10px" }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={saving} style={btnStyle("primary")}>{saving ? "Saving…" : "Save"}</button>
        <button type="button" onClick={cancel} style={btnStyle("ghost")}>Cancel</button>
      </div>
    </form>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: C.sage }}>{tables.length} table{tables.length !== 1 ? "s" : ""}</span>
        <button onClick={startAdd} style={btnStyle("primary")}>+ Add Table</button>
      </div>

      {(addMode || editingId) && <TableForm />}

      {loading ? (
        <p style={{ color: C.sage }}>Loading…</p>
      ) : tables.length === 0 ? (
        <p style={{ color: C.sage, textAlign: "center", padding: "32px 0" }}>No tables yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tables.map(t => (
            <div key={t.id} style={{
              backgroundColor: C.card, borderRadius: 10, padding: "16px 20px",
              border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: C.deep, fontSize: 14 }}>{t.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: C.sage }}>
                  {t.guest_count} guest{t.guest_count !== 1 ? "s" : ""}
                  {t.note ? ` · ${t.note}` : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => startEdit(t)} style={btnStyle("ghost")}>Edit</button>
                <button onClick={() => deleteTable(t.id, t.label, t.guest_count)} style={{ ...btnStyle("danger"), fontSize: 11, padding: "4px 10px" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Photos Tab ────────────────────────────────────────────────────────────────

function PhotosTab() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");

  const loadPhotos = useCallback(() => {
    setLoading(true);
    apiFetch("/api/admin/photos")
      .then(r => r.json())
      .then(setPhotos)
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

  const filtered = filter === "all" ? photos : photos.filter(p => p.status === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: C.sage }}>{photos.length} photo{photos.length !== 1 ? "s" : ""}</span>
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

      {loading ? (
        <p style={{ color: C.sage }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: C.sage, textAlign: "center", padding: "32px 0" }}>
          {photos.length === 0 ? "No photos uploaded yet." : "No photos match this filter."}
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {filtered.map(p => (
            <div key={p.id} style={{
              backgroundColor: C.card, borderRadius: 10, overflow: "hidden",
              border: `1px solid ${C.line}`,
              opacity: p.status === "hidden" ? 0.6 : 1,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.thumb_url}
                alt={`Photo by ${p.uploader_name}`}
                style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: "10px 12px" }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.deep }}>{p.uploader_name}</p>
                {p.message && <p style={{ margin: "4px 0 0", fontSize: 11, color: C.sage, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.message}</p>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dashboard shell ───────────────────────────────────────────────────────────

type Tab = "links" | "guests" | "tables" | "photos";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("links");
  const [tables, setTables] = useState<Table[]>([]);
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "links", label: "Invite Links" },
    { key: "guests", label: "Guests" },
    { key: "tables", label: "Tables" },
    { key: "photos", label: "Photos" },
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
        {activeTab === "guests" && <GuestsTab tables={tables} />}
        {activeTab === "tables" && <TablesTab onTablesChange={setTables} />}
        {activeTab === "photos" && <PhotosTab />}
      </main>
    </div>
  );
}
