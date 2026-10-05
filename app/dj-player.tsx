"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void; }
}

export default function DJPlayer({ youtubeId, running, onEnded }: {
  youtubeId: string | null; running: boolean; onEnded: () => void;
}) {
  const player = useRef<any>(null);

  useEffect(() => {
    if (!youtubeId) return;
    const create = () => {
      if (!window.YT?.Player) return;
      player.current?.destroy?.();
      player.current = new window.YT.Player("mixo-youtube-player", {
        videoId: youtubeId,
        playerVars: { autoplay: running ? 1 : 0, controls: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: { onStateChange: (e: any) => {
          if (e.data === window.YT.PlayerState.ENDED) onEnded();
        }}
      });
    };
    if (window.YT?.Player) create();
    else {
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
      window.onYouTubeIframeAPIReady = create;
    }
    return () => { window.onYouTubeIframeAPIReady = undefined; };
  }, [youtubeId]);

  useEffect(() => {
    if (!player.current) return;
    if (running) player.current.playVideo?.();
    else player.current.pauseVideo?.();
  }, [running]);

  return <div id="mixo-youtube-player" className="youtube-player" />;
}
