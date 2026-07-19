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
  const [confirmDelete, setConfirmDelete] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);

  interface FileEntry { file: File; preview: string; }
  const MAX_FILES = 10;

  const [uploaderName, setUploaderName] = useState("");
  const [message, setMessage] = useState("");
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
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
    setShowUploadConfirm(false);
    setShowModal(true);
  }

  function closeModal() {
    fileEntries.forEach(e => URL.revokeObjectURL(e.preview));
    setFileEntries([]);
    setUploadError(""); setUploadProgress("");
    setShowUploadConfirm(false);
    setShowModal(false);
  }

  async function handleDelete() {
    if (!confirmDelete || deleting) return;
    setDeleting(true);
    const id = confirmDelete.id;
    try {
      const res = await fetch(`/api/moments/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setPhotos(prev => prev.filter(p => p.id !== id));
        setTotal(t => t - 1);
        if (lightbox?.id === id) setLightbox(null);
      }
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  async function doUpload() {
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

  function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!fileEntries.length || !uploaderName.trim()) return;
    setShowUploadConfirm(true);
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
                <button
                  type="button"
                  className="card-delete-btn-r"
                  onClick={e => { e.stopPropagation(); setConfirmDelete(p); }}
                  title="Remove photo"
                >
                  <svg width="11" height="12" viewBox="0 0 11 12" fill="currentColor">
                    <path d="M3.5 0h4l.5.5H9.5v1h-8V.5H3L3.5 0zM1 2.5h9L9.3 10a1 1 0 0 1-1 .9H2.7a1 1 0 0 1-1-.9L1 2.5z"/>
                  </svg>
                </button>
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

            {!showUploadConfirm ? (
              <>
                <p style={{ fontFamily: F.dancing, fontSize: 22, color: C.red, margin: "0 0 2px" }}>share your photos</p>
                <p style={{ fontFamily: ZH, fontSize: 12, color: C.muted, letterSpacing: "0.15em", margin: "0 0 6px" }}>分享您的照片</p>
                <h2 style={{ fontFamily: F.cormorant, fontSize: 28, fontWeight: 400, color: C.deep, margin: "0 0 4px" }}>
                  Upload · <span style={{ fontFamily: ZH, fontSize: 22 }}>上传</span>
                </h2>
                <div style={{ height: 16 }} />

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
                      <p style={{ fontFamily: ZH, fontSize: 12, color: C.muted, margin: "2px 0 0" }}>点击选择照片</p>
                      <p style={{ fontSize: 11, color: C.muted, margin: "6px 0 0" }}>JPEG, PNG or WebP · max 20 MB each · up to {MAX_FILES} photos</p>
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
                            fontSize: 12, color: C.red, fontFamily: F.mulish,
                          }}
                        >
                          + Add more · 继续添加 ({fileEntries.length}/{MAX_FILES})
                        </button>
                      )}
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                    multiple style={{ display: "none" }} onChange={handleFileChange} />

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
                    placeholder="Add a wish or message · 添加祝福语（可选，所有照片共用）"
                    value={message} onChange={e => setMessage(e.target.value)}
                    rows={3}
                    style={{
                      border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px",
                      fontSize: 13, fontFamily: F.mulish, color: C.deep,
                      backgroundColor: "rgba(255,255,255,0.7)", outline: "none",
                      resize: "none",
                    }}
                  />

                  <button type="submit" disabled={!fileEntries.length || !uploaderName.trim()}
                    style={{
                      fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
                      letterSpacing: "0.25em", textTransform: "uppercase",
                      color: C.btnText, backgroundColor: C.btnBg,
                      padding: "12px 24px", border: "none", cursor: "pointer",
                      borderRadius: 20, opacity: (!fileEntries.length || !uploaderName.trim()) ? 0.5 : 1,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                      width: "100%",
                    }}>
                    <span>{fileEntries.length > 1 ? `Share ${fileEntries.length} Photos` : "Share Photo"}</span>
                    <span style={{ fontFamily: ZH, fontSize: 11, letterSpacing: "0.1em", textTransform: "none" }}>分享照片</span>
                  </button>
                </form>
              </>
            ) : (
              <>
                <p style={{ fontFamily: F.dancing, fontSize: 22, color: C.red, margin: "0 0 2px" }}>almost there</p>
                <p style={{ fontFamily: ZH, fontSize: 12, color: C.muted, letterSpacing: "0.15em", margin: "0 0 6px" }}>即将分享</p>
                <h2 style={{ fontFamily: F.cormorant, fontSize: 28, fontWeight: 400, color: C.deep, margin: "0 0 20px" }}>
                  Share {fileEntries.length} Photo{fileEntries.length !== 1 ? "s" : ""}?
                </h2>

                {/* Thumbnail preview */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: fileEntries.length === 1 ? "1fr" : "repeat(3, 1fr)",
                  gap: 6, marginBottom: 16,
                }}>
                  {fileEntries.slice(0, 6).map((entry, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={entry.preview} alt="" style={{
                        width: "100%",
                        height: fileEntries.length === 1 ? 160 : 72,
                        objectFit: "cover", display: "block",
                      }} />
                      {i === 5 && fileEntries.length > 6 && (
                        <div style={{
                          position: "absolute", inset: 0,
                          background: "rgba(0,0,0,0.55)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ color: "#fff", fontSize: 16, fontFamily: F.mulish, fontWeight: 600 }}>
                            +{fileEntries.length - 5}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <p style={{ fontFamily: F.dancing, fontSize: 18, color: C.deep, margin: "0 0 2px" }}>
                  by {uploaderName}
                </p>
                {message.trim() ? (
                  <p style={{ fontSize: 12, color: C.muted, margin: "0 0 20px", lineHeight: 1.6, fontStyle: "italic", fontFamily: F.mulish }}>
                    &ldquo;{message.trim()}&rdquo;
                  </p>
                ) : (
                  <div style={{ height: 20 }} />
                )}

                {uploadError && (
                  <p style={{ fontSize: 12, color: C.red, margin: "0 0 12px" }}>{uploadError}</p>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setShowUploadConfirm(false); setUploadError(""); }}
                    disabled={uploading}
                    style={{
                      fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
                      letterSpacing: "0.2em", textTransform: "uppercase",
                      color: C.deep, backgroundColor: "transparent",
                      border: `1.5px solid ${C.line}`, padding: "12px 0",
                      cursor: "pointer", borderRadius: 20, flex: 1,
                      opacity: uploading ? 0.45 : 1,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={doUpload}
                    disabled={uploading}
                    style={{
                      fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
                      letterSpacing: "0.25em", textTransform: "uppercase",
                      color: C.btnText, backgroundColor: C.btnBg,
                      padding: "12px 0", border: "none", cursor: "pointer",
                      borderRadius: 20, flex: 2,
                      opacity: uploading ? 0.7 : 1,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    }}
                  >
                    <span>{uploading ? uploadProgress : "Confirm & Share"}</span>
                    <span style={{ fontFamily: ZH, fontSize: 10, letterSpacing: "0.1em", textTransform: "none" }}>
                      {uploading ? "上传中…" : "确认分享"}
                    </span>
                  </button>
                </div>
              </>
            )}
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
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(lightbox); }}
              style={{
                marginTop: 16, background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.55)", padding: "7px 20px",
                borderRadius: 20, cursor: "pointer", fontSize: 11,
                fontFamily: F.mulish, letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Remove photo
            </button>
          </div>
          <button onClick={() => setLightbox(null)} style={{
            position: "fixed", top: 16, right: 16, background: "rgba(255,255,255,0.12)",
            border: "none", cursor: "pointer", fontSize: 18, color: "#fff",
            width: 36, height: 36, borderRadius: "50%",
          }}>✕</button>
        </div>
      )}

      {/* ── Confirm delete ── */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: C.overlay,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 70, padding: 16,
        }} onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div style={{
            backgroundColor: C.bg, borderRadius: 20, padding: "32px 28px",
            width: "100%", maxWidth: 340, textAlign: "center",
          }}>
            <p style={{ fontFamily: F.dancing, fontSize: 20, color: C.red, margin: "0 0 2px" }}>
              just checking
            </p>
            <p style={{ fontFamily: ZH, fontSize: 12, color: C.muted, margin: "0 0 6px" }}>确认一下</p>
            <h2 style={{ fontFamily: F.cormorant, fontSize: 26, fontWeight: 400, color: C.deep, margin: "0 0 10px" }}>
              Remove this photo?
            </h2>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 4px", lineHeight: 1.6 }}>
              The photo will be hidden from the gallery.
            </p>
            <p style={{ fontFamily: ZH, fontSize: 12, color: C.muted, margin: "0 0 24px" }}>
              该照片将从相册中隐藏。
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: C.deep, backgroundColor: "transparent",
                  border: `1.5px solid ${C.line}`, padding: "11px 22px",
                  cursor: "pointer", borderRadius: 20,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  fontFamily: F.mulish, fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "#fff", backgroundColor: C.btnBg,
                  padding: "11px 22px", border: "none",
                  cursor: "pointer", borderRadius: 20,
                  opacity: deleting ? 0.65 : 1,
                }}
              >
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
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
        .card-delete-btn-r {
          position: absolute;
          top: 13px;
          right: 13px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(0,0,0,0.45);
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.18s;
        }
        .photo-card-r:hover .card-delete-btn-r {
          opacity: 1;
        }
        @media (max-width: 540px) {
          .photo-grid-r { grid-template-columns: repeat(2, 1fr); gap: 20px 16px; }
          .card-delete-btn-r { opacity: 0.75; }
        }
      `}</style>
    </div>
  );
}
