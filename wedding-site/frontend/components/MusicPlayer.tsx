"use client";
import { useEffect, useRef, useState } from "react";

export default function MusicPlayer({
  src,
  bgColor,
  accentColor,
}: {
  src: string;
  bgColor: string;
  accentColor: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    // Try immediate autoplay; if blocked, start on first interaction.
    audio.play().then(() => {
      setPlaying(true);
    }).catch(() => {
      const start = () => {
        audio.play().then(() => {
          setPlaying(true);
          cleanup();
        }).catch(() => {});
      };
      const cleanup = () => {
        document.removeEventListener("click", start);
        document.removeEventListener("keydown", start);
        document.removeEventListener("touchstart", start);
        document.removeEventListener("scroll", start);
      };
      document.addEventListener("click", start, { once: true });
      document.addEventListener("keydown", start, { once: true });
      document.addEventListener("touchstart", start, { once: true });
      document.addEventListener("scroll", start, { once: true });
      return cleanup;
    });

    return () => { audio.pause(); };
  }, [src]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <>
      <style>{`
        @keyframes music-pulse {
          0%, 100% { box-shadow: 0 2px 10px rgba(0,0,0,0.2), 0 0 0 0 ${accentColor}44; }
          50%       { box-shadow: 0 2px 10px rgba(0,0,0,0.2), 0 0 0 7px ${accentColor}00; }
        }
        .music-btn-playing { animation: music-pulse 2s ease-in-out infinite; }
      `}</style>
      <button
        onClick={toggle}
        title={playing ? "Pause music" : "Play music"}
        aria-label={playing ? "Pause music" : "Play music"}
        className={playing ? "music-btn-playing" : undefined}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 100,
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: `1.5px solid ${accentColor}55`,
          backgroundColor: bgColor,
          color: accentColor,
          fontSize: 20,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.88,
          transition: "opacity 0.2s",
          padding: 0,
          lineHeight: 1,
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "0.88")}
      >
        {playing ? "⏸" : "♪"}
      </button>
    </>
  );
}
