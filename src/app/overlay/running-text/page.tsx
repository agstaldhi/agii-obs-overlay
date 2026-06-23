'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import '@/app/globals.css';

export default function OverlayRunningTextPage() {
  return (
    <React.Suspense fallback={null}>
      <OverlayRunningTextContent />
    </React.Suspense>
  );
}

function OverlayRunningTextContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('w') || 'lumen-123';

  const [activeState, setActiveState] = useState<any>({
    workspace_id: workspaceId,
    running_text: { text: '', speed: 5, visible: false, scale: 1.0, bg_color: 'rgba(15, 17, 25, 0.85)', font_family: 'Inter' },
    is_cleared: true
  });

  const [currentText, setCurrentText] = useState('');
  const [speed, setSpeed] = useState(5);
  const [scale, setScale] = useState(1.0);
  const [bgColor, setBgColor] = useState('rgba(15, 17, 25, 0.85)');
  const [fontFamily, setFontFamily] = useState('Inter');
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial state & listen to SSE updates
  useEffect(() => {
    if (!workspaceId) return;

    let active = true;
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const fetchInitialState = async () => {
      try {
        const res = await fetch(`/api/state?w=${workspaceId}`);
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          setActiveState(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const connectSSE = () => {
      if (!active) return;
      if (eventSource) eventSource.close();
      eventSource = new EventSource(`/api/state/sse?w=${workspaceId}`);

      eventSource.onmessage = (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data);
          setActiveState(data);
        } catch (err) {
          console.error(err);
        }
      };

      eventSource.onerror = () => {
        if (active) {
          if (eventSource) eventSource.close();
          reconnectTimeout = setTimeout(connectSSE, 3000);
        }
      };
    };

    fetchInitialState().then(() => {
      if (active) connectSSE();
    });

    return () => {
      active = false;
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [workspaceId]);

  // Sync state values
  useEffect(() => {
    const isVisible = !activeState.is_cleared && activeState.running_text?.visible && activeState.running_text?.text;
    
    if (isVisible) {
      setCurrentText(activeState.running_text.text);
      setSpeed(activeState.running_text.speed || 5);
      setScale(activeState.running_text.scale || 1.0);
      setBgColor(activeState.running_text.bg_color || 'rgba(15, 17, 25, 0.85)');
      setFontFamily(activeState.running_text.font_family || 'Inter');
    } else {
      setCurrentText('');
    }
  }, [activeState]);

  // Calculate scrolling duration based on text length and speed parameter
  const getDuration = () => {
    const textLen = currentText.length || 10;
    const speedFactor = Math.max(0.5, speed * 0.8);
    const duration = (textLen * 0.25) / speedFactor;
    return `${Math.max(8, duration)}s`;
  };

  if (!currentText) return null;

  return (
    <div 
      ref={containerRef} 
      className="overlay-running-text-bar"
      style={{
        height: `${52 * scale}px`,
        backgroundColor: bgColor,
        fontFamily: `${fontFamily}, sans-serif`
      }}
    >
      <style jsx>{`
        .overlay-running-text-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 1920px;
          border-top: 2px solid var(--accent, #6366f1);
          display: flex;
          align-items: center;
          overflow: hidden;
          z-index: 100;
          box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
        }

        .marquee-container {
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        .marquee-track {
          display: flex;
          white-space: nowrap;
          animation: marquee-scroll-seamless linear infinite;
          will-change: transform;
        }

        .marquee-text-span {
          font-weight: 600;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
          letter-spacing: 0.02em;
        }

        @keyframes marquee-scroll-seamless {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>

      <div className="marquee-container">
        <div 
          key={`${currentText}-${speed}`} // force remount to restart animation cycle
          className="marquee-track"
          style={{ 
            animationDuration: getDuration(),
          }}
        >
          <span className="marquee-text-span" style={{ fontSize: `${20 * scale}px`, paddingRight: '1920px' }}>{currentText}</span>
          <span className="marquee-text-span" style={{ fontSize: `${20 * scale}px`, paddingRight: '1920px' }}>{currentText}</span>
        </div>
      </div>
    </div>
  );
}
