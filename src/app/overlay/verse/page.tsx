'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import '@/app/globals.css';
import '@/app/overlay.css';
import ShaderCanvas from '@/components/overlay/ShaderCanvas';

export default function OverlayVersePage() {
  return (
    <React.Suspense fallback={null}>
      <OverlayVerseContent />
    </React.Suspense>
  );
}

function OverlayVerseContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('w') || 'lumen-123';

  const [activeState, setActiveState] = useState<any>({
    workspace_id: workspaceId,
    bible_verse: { reference: '', text_id: '', text_en: '', display_mode: 'both' },
    is_cleared: true,
    overlay_type: 'verse'
  });

  const [currentVerse, setCurrentVerse] = useState<any>(null);
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

  // Handle active verse transitions
  useEffect(() => {
    const isVisible = !activeState.is_cleared && activeState.overlay_type === 'verse' && activeState.bible_verse?.reference;

    if (!isVisible) {
      if (containerRef.current && currentVerse) {
        gsap.to(containerRef.current, {
          opacity: 0,
          scale: 0.95,
          duration: 0.25,
          ease: 'power2.in',
          onComplete: () => setCurrentVerse(null)
        });
      } else {
        setCurrentVerse(null);
      }
      return;
    }

    const nextVerse = activeState.bible_verse;

    if (JSON.stringify(nextVerse) !== JSON.stringify(currentVerse)) {
      if (containerRef.current && currentVerse) {
        gsap.to(containerRef.current, {
          opacity: 0,
          scale: 0.95,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            setCurrentVerse(nextVerse);
            gsap.fromTo(containerRef.current,
              { opacity: 0, scale: 0.95 },
              { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
            );
          }
        });
      } else {
        setCurrentVerse(nextVerse);
        setTimeout(() => {
          if (containerRef.current) {
            gsap.fromTo(containerRef.current,
              { opacity: 0, scale: 0.95 },
              { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
            );
          }
        }, 50);
      }
    }
  }, [activeState]);

  const config = activeState.verse_config || { x: 0, y: 0, scale: 1.0 };
  const isBottomBanner = currentVerse?.template === 'Blue Banner' || currentVerse?.template === 'Charcoal Grid';
  
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    width: '1600px',
    maxWidth: '1600px',
    zIndex: 3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    padding: 0,
    border: 'none',
    boxShadow: 'none',
    backdropFilter: 'none',
    transformOrigin: 'bottom center',
    opacity: 0,
    ...(isBottomBanner 
      ? { left: '160px', bottom: '80px', top: 'auto', transform: `translate(0, 0) translate(${config.x}px, ${config.y}px) scale(${config.scale})` }
      : { top: '50%', left: '50%', transform: `translate(-50%, -50%) translate(${config.x}px, ${config.y}px) scale(${config.scale})` }
    )
  };

  return (
    <div className="overlay-body">
      {currentVerse && (
        <div 
          ref={containerRef}
          className="overlay-container-verse" 
          style={containerStyle}
        >
          {(() => {
            const displayMode = currentVerse.display_mode || 'id';
            const ref = currentVerse.reference;

            switch (currentVerse.template) {
              case 'Blue Banner':
                return (
                  <div className="lt-bible-blue-banner">
                    <div className="lt-bible-blue-ref">{ref}</div>
                    <div className="lt-bible-blue-body">
                      {/* Open book icon with red ribbon */}
                      <svg viewBox="0 0 64 64" className="lt-bible-book-icon" fill="none">
                        {/* Book shadow/edges */}
                        <path d="M6 46c6-4 18-4 26-2V10C24 8 12 8 6 12v34z" fill="#f5f5f5" stroke="#111111" strokeWidth="2.5" strokeLinejoin="round"/>
                        <path d="M58 46c-6-4-18-4-26-2V10c8-2 20-2 26 2v34z" fill="#ffffff" stroke="#111111" strokeWidth="2.5" strokeLinejoin="round"/>
                        {/* Pages lines details */}
                        <path d="M10 42c4-3 12-3 18-1" stroke="#ccc" strokeWidth="1.5"/>
                        <path d="M10 36c4-3 12-3 18-1" stroke="#ccc" strokeWidth="1.5"/>
                        <path d="M54 42c-4-3-12-3-18-1" stroke="#ccc" strokeWidth="1.5"/>
                        <path d="M54 36c-4-3-12-3-18-1" stroke="#ccc" strokeWidth="1.5"/>
                        {/* Hanging red bookmark ribbon */}
                        <path d="M31 8v38l2.5-3 2.5 3V8" fill="#E50914"/>
                      </svg>
                      <div className="lt-bible-blue-text">
                        {(displayMode === 'id' || displayMode === 'both') && <div>{currentVerse.text_id}</div>}
                        {(displayMode === 'en' || displayMode === 'both') && (
                          <div style={displayMode === 'both' ? { fontStyle: 'italic', fontWeight: 500, opacity: 0.85, marginTop: '6px', fontSize: '20px' } : {}}>
                            {currentVerse.text_en}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              case 'Charcoal Grid':
                return (
                  <div className="lt-bible-charcoal-grid">
                    {/* Open book icon with red ribbon */}
                    <svg viewBox="0 0 64 64" className="lt-bible-book-icon" fill="none">
                      <path d="M6 46c6-4 18-4 26-2V10C24 8 12 8 6 12v34z" fill="#f5f5f5" stroke="#111111" strokeWidth="2.5" strokeLinejoin="round"/>
                      <path d="M58 46c-6-4-18-4-26-2V10c8-2 20-2 26 2v34z" fill="#ffffff" stroke="#111111" strokeWidth="2.5" strokeLinejoin="round"/>
                      <path d="M10 42c4-3 12-3 18-1" stroke="#ccc" strokeWidth="1.5"/>
                      <path d="M10 36c4-3 12-3 18-1" stroke="#ccc" strokeWidth="1.5"/>
                      <path d="M54 42c-4-3-12-3-18-1" stroke="#ccc" strokeWidth="1.5"/>
                      <path d="M54 36c-4-3-12-3-18-1" stroke="#ccc" strokeWidth="1.5"/>
                      <path d="M31 8v38l2.5-3 2.5 3V8" fill="#E50914"/>
                    </svg>
                    <div className="lt-bible-charcoal-content">
                      <div className="lt-bible-charcoal-text">
                        {(displayMode === 'id' || displayMode === 'both') && <div>{currentVerse.text_id}</div>}
                        {(displayMode === 'en' || displayMode === 'both') && (
                          <div style={displayMode === 'both' ? { fontStyle: 'italic', fontWeight: 500, opacity: 0.85, marginTop: '6px', fontSize: '20px' } : {}}>
                            {currentVerse.text_en}
                          </div>
                        )}
                      </div>
                      <div className="lt-bible-charcoal-ref">{ref}</div>
                    </div>
                  </div>
                );
              default:
                // Default Classic Box template
                return (
                  <div 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      padding: '24px 48px',
                      borderRadius: '12px',
                      maxWidth: '1200px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    <div className="overlay-verse-ref">{ref}</div>
                    <div className="overlay-verse-text-id">
                      {(displayMode === 'id' || displayMode === 'both') && <div>{currentVerse.text_id}</div>}
                      {(displayMode === 'en' || displayMode === 'both') && (
                        <div style={displayMode === 'both' ? { fontStyle: 'italic', fontWeight: 500, opacity: 0.85, marginTop: '6px', fontSize: '20px' } : {}}>
                          {currentVerse.text_en}
                        </div>
                      )}
                    </div>
                  </div>
                );
            }
          })()}
        </div>
      )}
    </div>
  );
}
