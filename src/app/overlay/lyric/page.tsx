'use client';
 
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import '@/app/globals.css';
import '@/app/overlay.css';
import ShaderCanvas from '@/components/overlay/ShaderCanvas';
 
interface SongSection {
  type: string;
  label: string;
  lines: string[];
}
 
interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  sections: SongSection[];
}
 
export default function OverlayLyricPage() {
  return (
    <React.Suspense fallback={null}>
      <OverlayLyricContent />
    </React.Suspense>
  );
}
 
function OverlayLyricContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('w') || 'lumen-123';
 
  const [activeState, setActiveState] = useState<any>({
    workspace_id: workspaceId,
    active_song_id: '',
    active_section_index: -1,
    active_line_index: -1,
    overlay_type: 'lyric',
    shader_mode: 'Silk Ribbons',
    shader_config: { saturation: 0.5, speed: 0.3 },
    is_cleared: true,
    lyric_config: { x: 0, y: 0, scale: 1.0 }
  });
 
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentLineText, setCurrentLineText] = useState('');
  const textRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
 
  // Fetch all songs on mount to resolve song titles & lines
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await fetch(`/api/songs?w=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setSongs(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSongs();
  }, [workspaceId]);
 
  // Listen to SSE state updates
  useEffect(() => {
    if (!workspaceId) return;
 
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;
 
    const fetchInitialState = async () => {
      try {
        const res = await fetch(`/api/state?w=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setActiveState(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
 
    const connectSSE = () => {
      if (eventSource) eventSource.close();
      eventSource = new EventSource(`/api/state/sse?w=${workspaceId}`);
 
      eventSource.onmessage = (event) => {
        if (event.data.trim() === 'ping' || event.data.trim() === 'connected') return;
        try {
          const data = JSON.parse(event.data);
          setActiveState(data);
        } catch (err) {
          console.error(err);
        }
      };
 
      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };
 
    fetchInitialState().then(connectSSE);
 
    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [workspaceId]);
 
  // Sync active text
  useEffect(() => {
    if (activeState.is_cleared || activeState.overlay_type !== 'lyric' || songs.length === 0) {
      // Trigger animation OUT first, then empty the string
      if (textRef.current && currentLineText) {
        gsap.to(textRef.current, {
          opacity: 0,
          y: -15,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => setCurrentLineText('')
        });
      } else {
        setCurrentLineText('');
      }
      return;
    }
 
    const currentSong = songs.find(s => s.id === activeState.active_song_id);
    if (!currentSong) return;
 
    const sec = currentSong.sections[activeState.active_section_index];
    const newLineText = sec?.lines[activeState.active_line_index] || '';
 
    if (newLineText !== currentLineText) {
      // Transition OUT old line, then IN new line
      if (textRef.current && currentLineText) {
        gsap.to(textRef.current, {
          opacity: 0,
          y: -15,
          duration: 0.15,
          ease: 'power2.in',
          onComplete: () => {
            setCurrentLineText(newLineText);
            // Trigger Animation IN
            gsap.fromTo(textRef.current, 
              { opacity: 0, y: 15 },
              { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
            );
          }
        });
      } else {
        setCurrentLineText(newLineText);
        // Simple entry if nothing was active
        setTimeout(() => {
          if (textRef.current) {
            gsap.fromTo(textRef.current, 
              { opacity: 0, y: 15 },
              { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
            );
          }
        }, 50);
      }
    }
  }, [activeState, songs]);
 
  const config = activeState.lyric_config || { x: 0, y: 0, scale: 1.0 };
 
  return (
    <div className="overlay-body">
      {/* Darkened bottom gradient for text contrast */}
      {currentLineText && <div className="overlay-gradient" />}
 
      {/* Lyric display container */}
      {currentLineText && (
        <div 
          ref={containerRef} 
          className="overlay-container-lyric"
          style={{
            transform: `translateX(-50%) translate(${config.x}px, ${config.y}px) scale(${config.scale})`
          }}
        >
          <div className="overlay-lyric-wrapper">
            <div ref={textRef} className="overlay-lyric-text">
              {currentLineText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
