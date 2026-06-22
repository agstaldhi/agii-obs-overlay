'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import '@/app/globals.css';
import '@/app/overlay.css';

export default function OverlayLowerThirdPage() {
  return (
    <React.Suspense fallback={null}>
      <OverlayLowerThirdContent />
    </React.Suspense>
  );
}

function OverlayLowerThirdContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('w') || 'lumen-123';

  const [activeState, setActiveState] = useState<any>({
    workspace_id: workspaceId,
    lower_third: { name: '', role: '', template: 'Slide Bottom', visible: false },
    is_cleared: true,
    overlay_type: 'lower-third'
  });

  const [currentLT, setCurrentLT] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial state & listen to SSE updates
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

  // Helper to parse duration string (e.g. "0.6s" -> 0.6)
  const parseDuration = (durStr: string, fallback: number): number => {
    if (!durStr) return fallback;
    const val = parseFloat(durStr);
    return isNaN(val) ? fallback : val;
  };

  // Handle active lower third transitions
  useEffect(() => {
    const isVisible = !activeState.is_cleared && activeState.overlay_type === 'lower-third' && activeState.lower_third?.visible;

    if (!isVisible) {
      if (cardRef.current && currentLT) {
        // Trigger Out Animation
        const animOutType = activeState.lower_third?.anim_out || 'Fade out';
        const durationOut = parseDuration(activeState.lower_third?.duration_out, 0.35);
        let animationProps = {};
        
        if (animOutType === 'Slide right') {
          animationProps = { x: 100, opacity: 0 };
        } else if (animOutType === 'Slide down') {
          animationProps = { y: 50, opacity: 0 };
        } else { // Fade out
          animationProps = { opacity: 0 };
        }

        gsap.killTweensOf(cardRef.current);
        gsap.to(cardRef.current, {
          ...animationProps,
          duration: durationOut,
          ease: 'power2.in',
          onComplete: () => setCurrentLT(null)
        });
      } else {
        setCurrentLT(null);
      }
      return;
    }

    const nextLT = activeState.lower_third;

    if (JSON.stringify(nextLT) !== JSON.stringify(currentLT)) {
      if (cardRef.current && currentLT) {
        // Hide old, then show new
        gsap.killTweensOf(cardRef.current);
        gsap.to(cardRef.current, {
          opacity: 0,
          duration: 0.2,
          onComplete: () => {
            setCurrentLT(nextLT);
            // Trigger In Animation
            const animInType = nextLT.anim_in || 'Slide from left';
            const durationIn = parseDuration(nextLT.duration_in, 0.55);
            let startProps = {};
            let endProps = { x: 0, y: 0, opacity: 1, duration: durationIn, ease: 'power3.out' };

            if (animInType === 'Slide from left') {
              startProps = { x: -100, opacity: 0 };
            } else if (animInType === 'Slide Up') {
              startProps = { y: 50, opacity: 0 };
            } else { // Fade In
              startProps = { opacity: 0 };
            }

            gsap.killTweensOf(cardRef.current);
            gsap.fromTo(cardRef.current, startProps, endProps);
          }
        });
      } else {
        setCurrentLT(nextLT);
        setTimeout(() => {
          if (cardRef.current) {
            const animInType = nextLT.anim_in || 'Slide from left';
            const durationIn = parseDuration(nextLT.duration_in, 0.55);
            let startProps = {};
            let endProps = { x: 0, y: 0, opacity: 1, duration: durationIn, ease: 'power3.out' };

            if (animInType === 'Slide from left') {
              startProps = { x: -100, opacity: 0 };
            } else if (animInType === 'Slide Up') {
              startProps = { y: 50, opacity: 0 };
            } else { // Fade In
              startProps = { opacity: 0 };
            }

            gsap.killTweensOf(cardRef.current);
            gsap.fromTo(cardRef.current, startProps, endProps);
          }
        }, 50);
      }
    }
  }, [activeState]);

  const config = activeState.lower_third_config || { x: 0, y: 0, scale: 1.0 };
  const isNewsTicker = currentLT?.template === 'News Ticker';
  const containerStyle: React.CSSProperties = {
    transform: `translate(${config.x}px, ${config.y}px) scale(${config.scale})`,
    transformOrigin: 'bottom left',
    ...(isNewsTicker ? { left: '160px', bottom: '60px', width: '1600px', minWidth: '1600px' } : {})
  };

  return (
    <div className="overlay-body">
      {currentLT && (
        <div 
          className="overlay-container-lower-third"
          style={containerStyle}
        >
          {(() => {
            switch (currentLT.template) {
              case 'Offset Blocks':
                return (
                  <div ref={cardRef} className="lt-offset-blocks" style={{ opacity: 0 }}>
                    <div className="lt-offset-blocks-name-box">{currentLT.name}</div>
                    {currentLT.role && <div className="lt-offset-blocks-role-box">{currentLT.role}</div>}
                  </div>
                );
              case 'News Ticker':
                return (
                  <div ref={cardRef} className="lt-news-ticker" style={{ opacity: 0 }}>
                    <div className="lt-news-ticker-row1">
                      <div className="lt-news-ticker-badge">NEWS</div>
                      <div className="lt-news-ticker-title">{currentLT.name}</div>
                    </div>
                    {currentLT.role && <div className="lt-news-ticker-desc">{currentLT.role}</div>}
                    <div className="lt-news-ticker-scroll">
                      <div className="lt-news-ticker-scroll-text">
                        <span className="lt-news-ticker-bullet"></span>
                        {currentLT.scroll_text || "LIVE STREAMING • SILAHKAN SHARE DAN BERIKAN KOMENTAR POSITIF • SELAMAT MENGIKUTI IBADAH ONLINE KAMI • TUHAN YESUS MEMBERKATI"}
                      </div>
                    </div>
                  </div>
                );
              case 'Pastor Badge':
                return (
                  <div ref={cardRef} className="lt-pastor-badge" style={{ opacity: 0 }}>
                    <div className="lt-pastor-icon-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        {/* Open book representing Bible */}
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        {/* Cross */}
                        <path d="M12 5v9" />
                        <path d="M9 8h6" />
                      </svg>
                    </div>
                    <div className="lt-pastor-body">
                      <div className="lt-pastor-name-bar">
                        <span className="lt-pastor-arrow">▶</span>
                        <span>{currentLT.name}</span>
                      </div>
                      {currentLT.role && <div className="lt-pastor-role-bar">{currentLT.role}</div>}
                    </div>
                  </div>
                );
              case 'Clean Cyan':
                return (
                  <div ref={cardRef} className="lt-clean-cyan" style={{ opacity: 0 }}>
                    <div className="lt-clean-cyan-left">{currentLT.role || "PASTOR"}</div>
                    <div className="lt-clean-cyan-right">{currentLT.name}</div>
                  </div>
                );
              default:
                return (
                  <div ref={cardRef} className="overlay-lower-third-card" style={{ opacity: 0 }}>
                    <div className="overlay-lower-third-accent"></div>
                    <div className="overlay-lower-third-content">
                      <div className="overlay-lower-third-name">{currentLT.name}</div>
                      <div className="overlay-lower-third-role">{currentLT.role}</div>
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
