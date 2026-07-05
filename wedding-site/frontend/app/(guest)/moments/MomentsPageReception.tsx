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
  deep: "#5c1810",
  red: "#b23a2b",
  muted: "#9a6a5a",
  line: "#e3cf9f",
  bg: "#faf2e0",
  btnBg: "#b23a2b",
  btnText: "#faf2e0",
  overlay: "rgba(50,15,10,0.85)",
} as const;

const F = {
  cormorant: "var(--font-cormorant), 'Cormorant Garamond', serif",
  greatVibes: "var(--font-great-vibes), 'Great Vibes', cursive",
  mulish: "var(--font-mulish), 'Mulish', sans-serif",
  dancing: "var(--font-dancing), 'Dancing Script', cursive",
} as const;

const ZH = "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";

export default function MomentsPageReception() {
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
      const res = await fetch("/api/moments", { method: "POST", body: fd });
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
        <p style={{ fontFamily: F.dancing, fontSize: "clamp(20px,5vw,24px)", color: C.red, margin: "0 0 2px" }}>
          Capture the moment
        </p>
        <p style={{ fontFamily: ZH, fontSize: 13, color: C.muted, letterSpacing: "0.2em", margin: "0 0 8px" }}>
          定格美好瞬间
        </p>
        <h1 style={{
          fontFamily: F.cormorant, fontSize: "clamp(36px,8vw,56px)",
          fontWeight: 400, color: C.deep, margin: "0 0 4px",
        }}>
          Moments
        </h1>
        <p style={{ fontFamily: ZH, fontSize: 18, color: C.deep, letterSpacing: "0.25em", margin: "0 0 14px" }}>
          美好瞬间
        </p>
        <p style={{ fontSize: 14, color: C.muted, margin: "0 0 4px", lineHeight: 1.6 }}>
          Share your photos and wishes from the day.
        </p>
        <p style={{ fontFamily: ZH, fontSize: 12, color: C.muted, margin: "0 0 28px" }}>
          分享您在婚礼现场拍摄的照片与祝福。
        </p>
        <button onClick={openModal} style={{
          fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
          letterSpacing: "0.25em", textTransform: "uppercase",
          color: C.btnText, backgroundColor: C.btnBg,
          padding: "12px 36px", border: "none", cursor: "pointer",
          borderRadius: 24, marginBottom: 48, margin: "0 auto 48px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        }}>
          <span>+ Share a Photo</span>
          <span style={{ fontFamily: ZH, fontSize: 11, letterSpacing: "0.1em", textTransform: "none" }}>分享照片</span>
        </button>
      </div>

      {/* ── Photo grid ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 64px" }}>
        {!loading && photos.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ color: C.muted, fontSize: 14, margin: "0 0 4px" }}>
              No photos yet — be the first to share one!
            </p>
            <p style={{ fontFamily: ZH, fontSize: 13, color: C.muted, margin: 0 }}>
              还没有照片，快来第一个分享吧！
            </p>
          </div>
        )}

        <div className="photo-grid-r">
          {photos.map((p) => (
            <div key={p.id} className="polaroid-wrap-r">
              <div
                className="photo-card-r"
                onClick={() => setLightbox(p)}
              >
                <div className="card-img-wrap-r">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumb_url} alt={`Photo by ${p.uploader_name}`} className="card-img-r" />
                </div>
                <div className="photo-caption-r">
                  <p className="caption-name-r">{p.uploader_name}</p>
                  <p className="caption-msg-r">{p.message || " "}</p>
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
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              }}>
              <span>Load More</span>
              <span style={{ fontFamily: ZH, fontSize: 10, letterSpacing: "0.05em", textTransform: "none" }}>加载更多</span>
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

            <p style={{ fontFamily: F.dancing, fontSize: 22, color: C.red, margin: "0 0 2px" }}>share your photo</p>
            <p style={{ fontFamily: ZH, fontSize: 12, color: C.muted, letterSpacing: "0.15em", margin: "0 0 6px" }}>分享您的照片</p>
            <h2 style={{ fontFamily: F.cormorant, fontSize: 28, fontWeight: 400, color: C.deep, margin: "0 0 4px" }}>
              Upload · <span style={{ fontFamily: ZH, fontSize: 22 }}>上传</span>
            </h2>
            <div style={{ height: 16 }} />

            <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* File picker */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `1.5px dashed ${file ? C.red : C.line}`,
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
                    <p style={{ fontFamily: ZH, fontSize: 12, color: C.muted, margin: "2px 0 0" }}>点击选择照片</p>
                    <p style={{ fontSize: 11, color: C.muted, margin: "6px 0 0" }}>JPEG, PNG or WebP · max 10 MB</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }} onChange={handleFileChange} />

              <input
                type="text" required placeholder="Your name · 您的姓名 *"
                value={uploaderName} onChange={e => setUploaderName(e.target.value)}
                style={{
                  border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px",
                  fontSize: 14, fontFamily: F.mulish, color: C.deep,
                  backgroundColor: "rgba(255,255,255,0.7)", outline: "none",
                }}
              />

              <textarea
                placeholder="Add a wish or message · 添加祝福语（可选）"
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
                <p style={{ fontSize: 12, color: C.red, margin: 0 }}>{uploadError}</p>
              )}

              <button type="submit" disabled={!file || !uploaderName.trim() || uploading}
                style={{
                  fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.25em", textTransform: "uppercase",
                  color: C.btnText, backgroundColor: C.btnBg,
                  padding: "12px 24px", border: "none", cursor: "pointer",
                  borderRadius: 20, opacity: (!file || !uploaderName.trim() || uploading) ? 0.5 : 1,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  width: "100%",
                }}>
                <span>{uploading ? "Uploading…" : "Share Photo"}</span>
                <span style={{ fontFamily: ZH, fontSize: 11, letterSpacing: "0.1em", textTransform: "none" }}>
                  {uploading ? "上传中…" : "分享照片"}
                </span>
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
        .photo-grid-r {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px 20px;
          padding: 8px 4px 24px;
        }
        .polaroid-wrap-r {
          display: flex;
          justify-content: center;
        }
        .photo-card-r {
          position: relative;
          cursor: pointer;
          width: 100%;
          background: #fff8f0;
          padding: 9px 9px 0;
          border: 1px solid rgba(227,207,159,0.7);
          box-shadow:
            0 1px 2px rgba(80,20,10,0.06),
            0 4px 10px rgba(80,20,10,0.08),
            0 16px 36px rgba(80,20,10,0.10),
            inset 0 1px 0 rgba(255,255,255,0.9);
          transition: transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s ease;
        }
        .photo-card-r:hover {
          transform: scale(1.04) translateY(-6px);
          box-shadow:
            0 2px 4px rgba(80,20,10,0.07),
            0 10px 20px rgba(80,20,10,0.11),
            0 32px 56px rgba(80,20,10,0.14),
            inset 0 1px 0 rgba(255,255,255,0.9);
          z-index: 20;
        }
        .card-img-wrap-r {
          width: 100%;
          aspect-ratio: 3/4;
          overflow: hidden;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08);
          background: #ecddd0;
        }
        .card-img-r {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: contrast(1.03) saturate(0.88) brightness(1.01);
        }
        .photo-caption-r {
          height: 54px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 0 6px;
          text-align: center;
        }
        .caption-name-r {
          font-family: var(--font-dancing, 'Dancing Script', cursive);
          font-size: 15px;
          font-weight: 600;
          color: #5c1810;
          margin: 0;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
        .caption-msg-r {
          font-family: var(--font-mulish, 'Mulish', sans-serif);
          font-size: 10px;
          color: #9a6a5a;
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
          .photo-grid-r { grid-template-columns: repeat(2, 1fr); gap: 20px 16px; }
        }
      `}</style>
    </div>
  );
}
