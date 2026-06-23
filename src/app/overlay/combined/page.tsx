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

export default function CombinedOverlayPage() {
  return (
    <React.Suspense fallback={null}>
      <CombinedOverlayContent />
    </React.Suspense>
  );
}

function CombinedOverlayContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('w') || 'lumen-123';

  // State containing all active overlay data
  const [activeState, setActiveState] = useState<any>({
    workspace_id: workspaceId,
    active_song_id: '',
    active_section_index: -1,
    active_line_index: -1,
    overlay_type: 'lyric',
    shader_mode: 'Silk Ribbons',
    shader_config: { saturation: 0.5, speed: 0.3 },
    is_cleared: true,
    bible_verse: { reference: '', text_id: '', text_en: '', display_mode: 'id', template: 'Classic Box' },
    lower_third: { name: '', role: '', template: 'Slide Bottom', visible: false },
    lower_thirds: [],
    running_text: { text: '', speed: 5, visible: false, scale: 1.0, bg_color: 'rgba(15, 17, 25, 0.85)', font_family: 'Inter' },
    lyric_config: { x: 0, y: 0, scale: 1.0 },
    verse_config: { x: 0, y: 0, scale: 1.0 },
    lower_third_config: { x: 0, y: 0, scale: 1.0 }
  });

  const [songs, setSongs] = useState<Song[]>([]);

  // 1. Sync Songs Database for Lyric matching
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await fetch(`/api/songs?w=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setSongs(data);
        }
      } catch (err) {
        console.error('Combined overlay fetch songs error:', err);
      }
    };
    fetchSongs();
  }, [workspaceId]);

  // 2. Fetch active state & listen to SSE updates
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
        console.error('Combined overlay fetch state error:', err);
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
          console.error('Combined overlay SSE parse error:', err);
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

  // ==========================================
  // A. Lyric Logic & Animation
  // ==========================================
  const [currentLineText, setCurrentLineText] = useState('');
  const lyricTextRef = useRef<HTMLDivElement | null>(null);
  const lyricContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const isLyricVisible = 
      !activeState.is_cleared && 
      activeState.overlay_type === 'lyric' && 
      songs.length > 0;

    if (!isLyricVisible) {
      if (lyricTextRef.current && currentLineText) {
        gsap.to(lyricTextRef.current, {
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
      if (lyricTextRef.current && currentLineText) {
        gsap.to(lyricTextRef.current, {
          opacity: 0,
          y: -15,
          duration: 0.15,
          ease: 'power2.in',
          onComplete: () => {
            setCurrentLineText(newLineText);
            gsap.fromTo(lyricTextRef.current, 
              { opacity: 0, y: 15 },
              { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
            );
          }
        });
      } else {
        setCurrentLineText(newLineText);
        setTimeout(() => {
          if (lyricTextRef.current) {
            gsap.fromTo(lyricTextRef.current, 
              { opacity: 0, y: 15 },
              { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
            );
          }
        }, 50);
      }
    }
  }, [activeState, songs, currentLineText]);

  // ==========================================
  // B. Bible Verse Logic & Animation
  // ==========================================
  const [currentVerse, setCurrentVerse] = useState<any>(null);
  const verseContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const isVerseVisible = 
      !activeState.is_cleared && 
      activeState.overlay_type === 'verse' && 
      activeState.bible_verse?.reference;

    if (!isVerseVisible) {
      if (verseContainerRef.current && currentVerse) {
        gsap.to(verseContainerRef.current, {
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
      if (verseContainerRef.current && currentVerse) {
        gsap.to(verseContainerRef.current, {
          opacity: 0,
          scale: 0.95,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            setCurrentVerse(nextVerse);
            gsap.fromTo(verseContainerRef.current,
              { opacity: 0, scale: 0.95 },
              { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
            );
          }
        });
      } else {
        setCurrentVerse(nextVerse);
        setTimeout(() => {
          if (verseContainerRef.current) {
            gsap.fromTo(verseContainerRef.current,
              { opacity: 0, scale: 0.95 },
              { opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
            );
          }
        }, 50);
      }
    }
  }, [activeState, currentVerse]);

  // ==========================================
  // C. Lower Third Logic & Animation
  // ==========================================
  const [currentLT, setCurrentLT] = useState<any>(null);
  const ltCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const isLTVisible = 
      !activeState.is_cleared && 
      activeState.overlay_type === 'lower-third' && 
      activeState.lower_third?.visible;

    if (!isLTVisible) {
      if (ltCardRef.current && currentLT) {
        const animOutType = activeState.lower_third?.anim_out || 'Fade out';
        let animationProps = {};
        
        if (animOutType === 'Slide right') {
          animationProps = { x: 100, opacity: 0 };
        } else if (animOutType === 'Slide down') {
          animationProps = { y: 50, opacity: 0 };
        } else {
          animationProps = { opacity: 0 };
        }

        gsap.to(ltCardRef.current, {
          ...animationProps,
          duration: 0.35,
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
      if (ltCardRef.current && currentLT) {
        gsap.to(ltCardRef.current, {
          opacity: 0,
          duration: 0.2,
          onComplete: () => {
            setCurrentLT(nextLT);
            const animInType = nextLT.anim_in || 'Slide from left';
            let startProps = {};
            let endProps = { x: 0, y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' };

            if (animInType === 'Slide from left') {
              startProps = { x: -100, opacity: 0 };
            } else if (animInType === 'Slide Up') {
              startProps = { y: 50, opacity: 0 };
            } else {
              startProps = { opacity: 0 };
            }

            gsap.fromTo(ltCardRef.current, startProps, endProps);
          }
        });
      } else {
        setCurrentLT(nextLT);
        setTimeout(() => {
          if (ltCardRef.current) {
            const animInType = nextLT.anim_in || 'Slide from left';
            let startProps = {};
            let endProps = { x: 0, y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' };

            if (animInType === 'Slide from left') {
              startProps = { x: -100, opacity: 0 };
            } else if (animInType === 'Slide Up') {
              startProps = { y: 50, opacity: 0 };
            } else {
              startProps = { opacity: 0 };
            }

            gsap.fromTo(ltCardRef.current, startProps, endProps);
          }
        }, 50);
      }
    }
  }, [activeState, currentLT]);

  // ==========================================
  // D. Running Text Logic
  // ==========================================
  const [currentRT, setCurrentRT] = useState('');
  const [rtSpeed, setRtSpeed] = useState(5);
  const [rtScale, setRtScale] = useState(1.0);
  const [rtBgColor, setRtBgColor] = useState('rgba(15, 17, 25, 0.85)');
  const [rtFontFamily, setRtFontFamily] = useState('Inter');

  useEffect(() => {
    const isRTVisible = 
      !activeState.is_cleared && 
      activeState.running_text?.visible && 
      activeState.running_text?.text;
    
    if (isRTVisible) {
      setCurrentRT(activeState.running_text.text);
      setRtSpeed(activeState.running_text.speed || 5);
      setRtScale(activeState.running_text.scale || 1.0);
      setRtBgColor(activeState.running_text.bg_color || 'rgba(15, 17, 25, 0.85)');
      setRtFontFamily(activeState.running_text.font_family || 'Inter');
    } else {
      setCurrentRT('');
    }
  }, [activeState]);

  const getRTDuration = () => {
    const textLen = currentRT.length || 10;
    const speedFactor = Math.max(0.5, rtSpeed * 0.8);
    const duration = (textLen * 0.25) / speedFactor;
    return `${Math.max(8, duration)}s`;
  };

  // ==========================================
  // Laying out Positioning configs
  // ==========================================
  const showShader = activeState.shader_mode && activeState.shader_active;

  const lyricConfig = activeState.lyric_config || { x: 0, y: 0, scale: 1.0 };
  const verseConfig = activeState.verse_config || { x: 0, y: 0, scale: 1.0 };
  const ltConfig = activeState.lower_third_config || { x: 0, y: 0, scale: 1.0 };

  const isVerseBottomBanner = currentVerse?.template === 'Blue Banner' || currentVerse?.template === 'Charcoal Grid';
  const verseStyle: React.CSSProperties = {
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
    ...(isVerseBottomBanner 
      ? { left: '160px', bottom: '80px', top: 'auto', transform: `translate(0, 0) translate(${verseConfig.x}px, ${verseConfig.y}px) scale(${verseConfig.scale})` }
      : { top: '50%', left: '50%', transform: `translate(-50%, -50%) translate(${verseConfig.x}px, ${verseConfig.y}px) scale(${verseConfig.scale})` }
    )
  };

  const isLTNewsTicker = currentLT?.template === 'News Ticker';
  const ltStyle: React.CSSProperties = {
    transform: `translate(${ltConfig.x}px, ${ltConfig.y}px) scale(${ltConfig.scale})`,
    transformOrigin: 'bottom left',
    ...(isLTNewsTicker ? { left: '160px', bottom: '60px', width: '1600px', minWidth: '1600px' } : {})
  };

  return (
    <div className="overlay-body">
      {/* 1. Background Shader layer */}
      {showShader && activeState.shader_mode && (
        <ShaderCanvas mode={activeState.shader_mode} config={activeState.shader_config} />
      )}

      {/* 2. Lyrics layer */}
      {currentLineText && (
        <>
          <div className="overlay-gradient" />
          <div 
            ref={lyricContainerRef} 
            className="overlay-container-lyric"
            style={{
              transform: `translateX(-50%) translate(${lyricConfig.x}px, ${lyricConfig.y}px) scale(${lyricConfig.scale})`
            }}
          >
            <div className="overlay-lyric-wrapper">
              <div ref={lyricTextRef} className="overlay-lyric-text">
                {currentLineText}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3. Bible Verse layer */}
      {currentVerse && (
        <div ref={verseContainerRef} className="overlay-container-verse" style={verseStyle}>
          {(() => {
            const displayMode = currentVerse.display_mode || 'id';
            const ref = currentVerse.reference;

            switch (currentVerse.template) {
              case 'Blue Banner':
                return (
                  <div className="lt-bible-blue-banner">
                    <div className="lt-bible-blue-ref">{ref}</div>
                    <div className="lt-bible-blue-body">
                      <svg viewBox="0 0 64 64" className="lt-bible-book-icon" fill="none">
                        <path d="M6 46c6-4 18-4 26-2V10C24 8 12 8 6 12v34z" fill="#f5f5f5" stroke="#111111" strokeWidth="2.5" strokeLinejoin="round"/>
                        <path d="M58 46c-6-4-18-4-26-2V10c8-2 20-2 26 2v34z" fill="#ffffff" stroke="#111111" strokeWidth="2.5" strokeLinejoin="round"/>
                        <path d="M10 42c4-3 12-3 18-1" stroke="#ccc" strokeWidth="1.5"/>
                        <path d="M10 36c4-3 12-3 18-1" stroke="#ccc" strokeWidth="1.5"/>
                        <path d="M54 42c-4-3-12-3-18-1" stroke="#ccc" strokeWidth="1.5"/>
                        <path d="M54 36c-4-3-12-3-18-1" stroke="#ccc" strokeWidth="1.5"/>
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

      {/* 4. Lower Thirds layer */}
      {currentLT && (
        <div 
          className="overlay-container-lower-third"
          style={ltStyle}
        >
          {(() => {
            switch (currentLT.template) {
              case 'Offset Blocks':
                return (
                  <div ref={ltCardRef} className="lt-offset-blocks">
                    <div className="lt-offset-blocks-name-box">{currentLT.name}</div>
                    {currentLT.role && <div className="lt-offset-blocks-role-box">{currentLT.role}</div>}
                  </div>
                );
              case 'News Ticker':
                return (
                  <div ref={ltCardRef} className="lt-news-ticker">
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
                  <div ref={ltCardRef} className="lt-pastor-badge">
                    <div className="lt-pastor-icon-box">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
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
                  <div ref={ltCardRef} className="lt-clean-cyan">
                    <div className="lt-clean-cyan-left">{currentLT.role || "PASTOR"}</div>
                    <div className="lt-clean-cyan-right">{currentLT.name}</div>
                  </div>
                );
              case 'Minimal Dark':
                return (
                  <div ref={ltCardRef} className="overlay-lower-third-card" style={{ backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="overlay-lower-third-content" style={{ padding: '16px 28px' }}>
                      <div className="overlay-lower-third-name">{currentLT.name}</div>
                      <div className="overlay-lower-third-role">{currentLT.role}</div>
                    </div>
                  </div>
                );
              case 'Accent Strip':
                return (
                  <div ref={ltCardRef} className="overlay-lower-third-card">
                    <div className="overlay-lower-third-accent" style={{ width: '12px' }}></div>
                    <div className="overlay-lower-third-content">
                      <div className="overlay-lower-third-name">{currentLT.name}</div>
                      <div className="overlay-lower-third-role">{currentLT.role}</div>
                    </div>
                  </div>
                );
              case 'Slide Bottom':
              default:
                return (
                  <div ref={ltCardRef} className="overlay-lower-third-card">
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

      {/* 5. Running Text layer */}
      {currentRT && (
        <div 
          className="overlay-running-text-bar"
          style={{
            height: `${52 * rtScale}px`,
            backgroundColor: rtBgColor,
            fontFamily: `${rtFontFamily}, sans-serif`
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
            .marquee-text {
              white-space: nowrap;
              display: inline-block;
              padding-left: 1920px;
              animation: marquee-scroll linear infinite;
              font-weight: 600;
              color: #ffffff;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
              letter-spacing: 0.02em;
            }
            @keyframes marquee-scroll {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-100%, 0, 0); }
            }
          `}</style>
          <div className="marquee-container">
            <div 
              key={`${currentRT}-${rtSpeed}`}
              className="marquee-text"
              style={{ 
                animationDuration: getRTDuration(),
                fontSize: `${20 * rtScale}px`
              }}
            >
              {currentRT}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
