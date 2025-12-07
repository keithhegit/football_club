import React, { useEffect, useRef, useState } from 'react';

interface BgmToggleProps {
  src: string;
  size?: number;
}

export const BgmToggle: React.FC<BgmToggleProps> = ({ src, size = 18 }) => {
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
  }, [src]);

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
        title={playing ? '暂停 BGM' : '播放 BGM'}
      >
        {playing ? (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />
          </svg>
        )}
      </button>
      <audio ref={audioRef} hidden />
    </div>
  );
};

