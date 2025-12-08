import React, { useEffect, useRef, useState } from 'react';

interface BgmToggleProps {
  src: string;
  size?: number;
  unlockKey?: number; // when changes, re-attempt play after user gesture
}

export const BgmToggle: React.FC<BgmToggleProps> = ({ src, size = 18, unlockKey }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = src;
    audio.loop = true;
    audio.autoplay = true;
    const play = async () => {
      try {
        await audio.play();
        setPlaying(!audio.paused);
      } catch (err) {
        console.warn('[BGM] autoplay blocked', err);
        setPlaying(false);
      }
    };
    play();
    return () => {
      audio.pause();
    };
  }, [src, unlockKey]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      try {
        await audio.play();
        setPlaying(true);
      } catch (err) {
        console.warn('[BGM] play failed', err);
      }
    }
  };

  return (
    <div className="flex items-center">
      <button
        onClick={toggle}
        className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-colors"
        title={playing ? '静音' : '播放 BGM'}
      >
        {playing ? (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 9 3 15 7 15 12 20 12 4 7 9 3 9" fill="currentColor" />
            <path d="M16 8.82a4 4 0 0 1 0 6.36" />
            <path d="M19 6a8 8 0 0 1 0 12" />
          </svg>
        ) : (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 9 3 15 7 15 12 20 12 4 7 9 3 9" fill="currentColor" />
            <line x1="16" y1="8" x2="20" y2="12" />
            <line x1="20" y1="8" x2="16" y2="12" />
          </svg>
        )}
      </button>
      <audio ref={audioRef} hidden />
    </div>
  );
};

