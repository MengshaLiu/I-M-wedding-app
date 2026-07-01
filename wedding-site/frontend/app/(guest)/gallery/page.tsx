"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Photo {
  id: string;
  uploader_name: string;
  message: string | null;
  url: string;
  thumb_url: string;
  created_at: string;
}

const C = {
  deep: "oklch(36% .072 152)",
  sage: "oklch(55% .09 150)",
  muted: "oklch(0.5 0.04 150)",
  line: "oklch(0.82 0.03 140)",
  bg: "#f8f5e8",
  btnBg: "#59745B",
  btnText: "oklch(0.985 0.012 110)",
  overlay: "rgba(30,38,30,0.82)",
} as const;

const F = {
  cormorant: "var(--font-cormorant), 'Cormorant Garamond', serif",
  greatVibes: "var(--font-great-vibes), 'Great Vibes', cursive",
  mulish: "var(--font-mulish), 'Mulish', sans-serif",
  dancing: "var(--font-dancing), 'Dancing Script', cursive",
} as const;

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const [uploaderName, setUploaderName] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async (p: number, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gallery?page=${p}`);
      const data = await res.json();
      setTotal(data.total ?? 0);
      setPhotos(prev => append ? [...prev, ...(data.photos ?? [])] : (data.photos ?? []));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPhotos(1); }, [fetchPhotos]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  function openModal() {
    setUploaderName(""); setMessage(""); setFile(null); setPreview(null);
    setUploadError("");
    setShowModal(true);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !uploaderName.trim()) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("uploader_name", uploaderName.trim());
      fd.append("message", message.trim());
      const res = await fetch("/api/gallery", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Upload failed");
      }
      const newPhoto: Photo = await res.json();
      setPhotos(prev => [newPhoto, ...prev]);
      setTotal(t => t + 1);
      setShowModal(false);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const hasMore = photos.length < total;

  return (
    <div style={{
      minHeight: "calc(100vh - 53px)", backgroundColor: C.bg,
      fontFamily: F.dancing, color: C.deep, overflowX: "hidden",
    }}>
      {/* ── Header ── */}
      <div style={{
        maxWidth: 720, margin: "0 auto", padding: "52px 20px 0",
        textAlign: "center",
      }}>
        <p style={{ fontFamily: F.dancing, fontSize: "clamp(20px,5vw,24px)", color: C.sage, margin: "0 0 4px" }}>
          capture the moment
        </p>
        <h1 style={{
          fontFamily: F.cormorant, fontSize: "clamp(36px,8vw,56px)",
          fontWeight: 400, color: C.deep, margin: "0 0 16px",
        }}>
          Gallery
        </h1>
        <p style={{ fontSize: 14, color: C.muted, margin: "0 0 32px", lineHeight: 1.6 }}>
          Share your photos and wishes from the day.
        </p>
        <button onClick={openModal} style={{
          fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
          letterSpacing: "0.25em", textTransform: "uppercase",
          color: C.btnText, backgroundColor: C.btnBg,
          padding: "14px 36px", border: "none", cursor: "pointer",
          borderRadius: 24, marginBottom: 48,
        }}>
          + Share a Photo
        </button>
      </div>

      {/* ── Photo grid ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 64px" }}>
        {!loading && photos.length === 0 && (
          <p style={{ textAlign: "center", color: C.muted, fontSize: 14, marginTop: 40 }}>
            No photos yet — be the first to share one!
          </p>
        )}

        <div className="photo-grid">
          {photos.map(p => (
            <div key={p.id} className="photo-card" onClick={() => setLightbox(p)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumb_url} alt={`Photo by ${p.uploader_name}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div className="photo-caption">
                <p style={{ fontFamily: F.cormorant, fontSize: 15, fontWeight: 500, margin: "0 0 2px", color: "#fff" }}>
                  {p.uploader_name}
                </p>
                {p.message && (
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", margin: 0,
                    overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const }}>
                    {p.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <p style={{ textAlign: "center", color: C.muted, fontSize: 13, margin: "32px 0" }}>Loading…</p>
        )}

        {hasMore && !loading && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button onClick={() => { const next = page + 1; setPage(next); fetchPhotos(next, true); }}
              style={{
                fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
                letterSpacing: "0.2em", textTransform: "uppercase",
                color: C.deep, backgroundColor: "transparent",
                border: `1.5px solid ${C.line}`, padding: "11px 28px",
                cursor: "pointer", borderRadius: 20,
              }}>
              Load More
            </button>
          </div>
        )}
      </div>

      {/* ── Upload modal ── */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: C.overlay,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50, padding: 16,
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{
            backgroundColor: C.bg, borderRadius: 20, padding: "36px 28px",
            width: "100%", maxWidth: 440, position: "relative",
          }}>
            <button onClick={() => setShowModal(false)} style={{
              position: "absolute", top: 16, right: 18, background: "none",
              border: "none", cursor: "pointer", fontSize: 20, color: C.muted,
            }}>✕</button>

            <p style={{ fontFamily: F.dancing, fontSize: 22, color: C.sage, margin: "0 0 4px" }}>share your photo</p>
            <h2 style={{ fontFamily: F.cormorant, fontSize: 28, fontWeight: 400, color: C.deep, margin: "0 0 24px" }}>
              Upload
            </h2>

            <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* File picker */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `1.5px dashed ${file ? C.sage : C.line}`,
                  borderRadius: 12, padding: preview ? 0 : "28px 16px",
                  textAlign: "center", cursor: "pointer",
                  overflow: "hidden", minHeight: preview ? 160 : undefined,
                  backgroundColor: "rgba(255,255,255,0.5)",
                }}
              >
                {preview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={preview} alt="preview" style={{ width: "100%", maxHeight: 240, objectFit: "cover" }} />
                ) : (
                  <>
                    <p style={{ fontSize: 28, margin: "0 0 4px" }}>📷</p>
                    <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Tap to choose a photo</p>
                    <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 0" }}>JPEG, PNG or WebP · max 10 MB</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }} onChange={handleFileChange} />

              <input
                type="text" required placeholder="Your name *"
                value={uploaderName} onChange={e => setUploaderName(e.target.value)}
                style={{
                  border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px",
                  fontSize: 14, fontFamily: F.mulish, color: C.deep,
                  backgroundColor: "rgba(255,255,255,0.7)", outline: "none",
                }}
              />

              <textarea
                placeholder="Add a wish or message (optional)"
                value={message} onChange={e => setMessage(e.target.value)}
                rows={3}
                style={{
                  border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px",
                  fontSize: 13, fontFamily: F.mulish, color: C.deep,
                  backgroundColor: "rgba(255,255,255,0.7)", outline: "none",
                  resize: "none",
                }}
              />

              {uploadError && (
                <p style={{ fontSize: 12, color: "oklch(45% .15 30)", margin: 0 }}>{uploadError}</p>
              )}

              <button type="submit" disabled={!file || !uploaderName.trim() || uploading}
                style={{
                  fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.25em", textTransform: "uppercase",
                  color: C.btnText, backgroundColor: C.btnBg,
                  padding: "14px 24px", border: "none", cursor: "pointer",
                  borderRadius: 20, opacity: (!file || !uploaderName.trim() || uploading) ? 0.5 : 1,
                }}>
                {uploading ? "Uploading…" : "Share Photo"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightbox && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.92)",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", zIndex: 60, padding: 16,
        }} onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.url} alt="" style={{
            maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 8,
          }} onClick={e => e.stopPropagation()} />
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <p style={{ fontFamily: F.cormorant, fontSize: 20, color: "#fff", margin: "0 0 4px" }}>
              {lightbox.uploader_name}
            </p>
            {lightbox.message && (
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, maxWidth: 480 }}>
                {lightbox.message}
              </p>
            )}
          </div>
          <button onClick={() => setLightbox(null)} style={{
            position: "fixed", top: 16, right: 16, background: "rgba(255,255,255,0.12)",
            border: "none", cursor: "pointer", fontSize: 18, color: "#fff",
            width: 36, height: 36, borderRadius: "50%",
          }}>✕</button>
        </div>
      )}

      <style>{`
        .photo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .photo-card {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          border-radius: 10px;
          cursor: pointer;
          background: rgba(255,255,255,0.3);
        }
        .photo-card:hover .photo-caption { opacity: 1; }
        .photo-caption {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.65));
          padding: 20px 10px 10px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        @media (max-width: 480px) {
          .photo-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
          .photo-caption { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
