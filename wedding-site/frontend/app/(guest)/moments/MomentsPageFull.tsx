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

export default function MomentsPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const [uploaderName, setUploaderName] = useState("");
  const [message, setMessage] = useState("");
  interface FileEntry { file: File; preview: string; }
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 10;

  const fetchPhotos = useCallback(async (p: number, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/moments?page=${p}`);
      const data = await res.json();
      setTotal(data.total ?? 0);
      setPhotos(prev => append ? [...prev, ...(data.photos ?? [])] : (data.photos ?? []));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPhotos(1); }, [fetchPhotos]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    if (!incoming.length) return;
    setFileEntries(prev => {
      const slots = MAX_FILES - prev.length;
      const added = incoming.slice(0, slots).map(f => ({ file: f, preview: URL.createObjectURL(f) }));
      return [...prev, ...added];
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeFile(i: number) {
    setFileEntries(prev => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  function openModal() {
    setUploaderName(""); setMessage("");
    fileEntries.forEach(e => URL.revokeObjectURL(e.preview));
    setFileEntries([]);
    setUploadError(""); setUploadProgress("");
    setShowModal(true);
  }

  function closeModal() {
    fileEntries.forEach(e => URL.revokeObjectURL(e.preview));
    setFileEntries([]);
    setUploadError(""); setUploadProgress("");
    setShowModal(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!fileEntries.length || !uploaderName.trim()) return;
    setUploading(true);
    setUploadError("");
    const uploaded: Photo[] = [];
    for (let i = 0; i < fileEntries.length; i++) {
      setUploadProgress(fileEntries.length > 1 ? `Uploading ${i + 1} of ${fileEntries.length}…` : "Uploading…");
      try {
        const fd = new FormData();
        fd.append("file", fileEntries[i].file);
        fd.append("uploader_name", uploaderName.trim());
        fd.append("message", message.trim());
        const res = await fetch("/api/moments", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail ?? "Upload failed");
        }
        uploaded.push(await res.json());
      } catch (err: unknown) {
        setUploadError(`Photo ${i + 1} failed: ${err instanceof Error ? err.message : "Upload failed"}`);
        setUploading(false);
        setUploadProgress("");
        return;
      }
    }
    setPhotos(prev => [...uploaded.reverse(), ...prev]);
    setTotal(t => t + uploaded.length);
    setUploading(false);
    closeModal();
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
          Capture the moment
        </p>
        <h1 style={{
          fontFamily: F.cormorant, fontSize: "clamp(36px,8vw,56px)",
          fontWeight: 400, color: C.deep, margin: "0 0 16px",
        }}>
          Moments
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
          {photos.map((p) => (
            <div key={p.id} className="polaroid-wrap">
              <div
                className="photo-card"
                onClick={() => setLightbox(p)}
              >
                <div className="card-img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumb_url} alt={`Photo by ${p.uploader_name}`} className="card-img" />
                </div>
                <div className="photo-caption">
                  <p className="caption-name">{p.uploader_name}</p>
                  <p className="caption-msg">{p.message || " "}</p>
                </div>
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
        }} onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={{
            backgroundColor: C.bg, borderRadius: 20, padding: "36px 28px",
            width: "100%", maxWidth: 440, position: "relative",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <button onClick={closeModal} style={{
              position: "absolute", top: 16, right: 18, background: "none",
              border: "none", cursor: "pointer", fontSize: 20, color: C.muted,
            }}>✕</button>

            <p style={{ fontFamily: F.dancing, fontSize: 22, color: C.sage, margin: "0 0 4px" }}>share your photos</p>
            <h2 style={{ fontFamily: F.cormorant, fontSize: 28, fontWeight: 400, color: C.deep, margin: "0 0 24px" }}>
              Upload
            </h2>

            <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* File picker / previews */}
              {fileEntries.length === 0 ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${C.line}`, borderRadius: 12, padding: "28px 16px",
                    textAlign: "center", cursor: "pointer", backgroundColor: "rgba(255,255,255,0.5)",
                  }}
                >
                  <p style={{ fontSize: 28, margin: "0 0 4px" }}>📷</p>
                  <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Tap to choose photos</p>
                  <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 0" }}>JPEG, PNG or WebP · max 10 MB each · up to {MAX_FILES} photos</p>
                </div>
              ) : (
                <div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: fileEntries.length === 1 ? "1fr" : "repeat(3, 1fr)",
                    gap: 8,
                  }}>
                    {fileEntries.map((entry, i) => (
                      <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={entry.preview} alt={`Photo ${i + 1}`} style={{
                          width: "100%",
                          height: fileEntries.length === 1 ? 200 : 90,
                          objectFit: "cover", display: "block",
                        }} />
                        <button
                          type="button" onClick={() => removeFile(i)}
                          style={{
                            position: "absolute", top: 4, right: 4,
                            width: 22, height: 22, borderRadius: "50%",
                            background: "rgba(0,0,0,0.55)", border: "none",
                            color: "#fff", fontSize: 12, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                  {fileEntries.length < MAX_FILES && (
                    <button
                      type="button" onClick={() => fileRef.current?.click()}
                      style={{
                        marginTop: 8, width: "100%", padding: "8px",
                        border: `1px dashed ${C.line}`, borderRadius: 8,
                        background: "transparent", cursor: "pointer",
                        fontSize: 12, color: C.sage, fontFamily: F.mulish,
                      }}
                    >
                      + Add more photos ({fileEntries.length}/{MAX_FILES})
                    </button>
                  )}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                multiple style={{ display: "none" }} onChange={handleFileChange} />

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
                placeholder="Add a wish or message (optional) — shared across all photos"
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

              <button type="submit" disabled={!fileEntries.length || !uploaderName.trim() || uploading}
                style={{
                  fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.25em", textTransform: "uppercase",
                  color: C.btnText, backgroundColor: C.btnBg,
                  padding: "14px 24px", border: "none", cursor: "pointer",
                  borderRadius: 20, opacity: (!fileEntries.length || !uploaderName.trim() || uploading) ? 0.5 : 1,
                }}>
                {uploading
                  ? uploadProgress
                  : fileEntries.length > 1
                    ? `Share ${fileEntries.length} Photos`
                    : "Share Photo"}
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
          gap: 28px 20px;
          padding: 8px 4px 24px;
        }
        .polaroid-wrap {
          display: flex;
          justify-content: center;
        }
        .photo-card {
          position: relative;
          cursor: pointer;
          width: 100%;
          background: #fdfaf0;
          padding: 9px 9px 0;
          border: 1px solid rgba(210,195,170,0.55);
          box-shadow:
            0 1px 2px rgba(60,45,30,0.06),
            0 4px 10px rgba(60,45,30,0.08),
            0 16px 36px rgba(60,45,30,0.10),
            inset 0 1px 0 rgba(255,255,255,0.9);
          transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease;
        }
        .photo-card:hover {
          transform: scale(1.04) translateY(-6px);
          box-shadow:
            0 2px 4px rgba(60,45,30,0.07),
            0 10px 20px rgba(60,45,30,0.11),
            0 32px 56px rgba(60,45,30,0.14),
            inset 0 1px 0 rgba(255,255,255,0.9);
          z-index: 20;
        }
        .card-img-wrap {
          width: 100%;
          aspect-ratio: 3/4;
          overflow: hidden;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08);
          background: #e8e0d0;
        }
        .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: contrast(1.03) saturate(0.88) brightness(1.01);
        }
        .photo-caption {
          height: 54px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 0 6px;
          text-align: center;
        }
        .caption-name {
          font-family: var(--font-dancing, 'Dancing Script', cursive);
          font-size: 15px;
          font-weight: 600;
          color: oklch(36% .072 152);
          margin: 0;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
        .caption-msg {
          font-family: var(--font-mulish, 'Mulish', sans-serif);
          font-size: 10px;
          color: oklch(0.5 0.04 150);
          margin: 0;
          line-height: 1.35;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          width: 100%;
          min-height: 13px;
          opacity: 0.9;
        }
        @media (max-width: 540px) {
          .photo-grid { grid-template-columns: repeat(2, 1fr); gap: 20px 16px; }
        }
      `}</style>
    </div>
  );
}
