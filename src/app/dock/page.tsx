'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, X, AlertCircle } from 'lucide-react';

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

const DEFAULT_PROFILES = [
  {
    id: 'lt-1',
    name: 'Pdt. Yohanes Susanto',
    role: 'Gembala Sidang',
    template: 'Slide Bottom',
    animIn: 'Slide from left',
    animOut: 'Fade out',
    durationIn: '0.6s',
    durationOut: '0.4s'
  },
  {
    id: 'lt-2',
    name: 'Bp. Budi Prakoso',
    role: 'Worship Leader',
    template: 'Accent Strip',
    animIn: 'Slide Up',
    animOut: 'Slide down',
    durationIn: '0.5s',
    durationOut: '0.5s'
  }
];

export default function ObsDockPage() {
  return (
    <React.Suspense fallback={<div style={{ padding: '20px', color: 'var(--t2)', backgroundColor: 'var(--bg-0)', minHeight: '100vh' }}>Loading Dock...</div>}>
      <ObsDockContent />
    </React.Suspense>
  );
}

function ObsDockContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('w') || 'lumen-123';

  const [activeState, setActiveState] = useState<any>({
    workspace_id: workspaceId,
    active_song_id: '',
    active_section_index: -1,
    active_line_index: -1,
    is_cleared: true,
    overlay_type: 'lyric',
    shader_active: true,
    lower_thirds: []
  });

  const [activeTab, setActiveTab] = useState<'lyric' | 'lower-third'>('lyric');

  const [loadedSong, setLoadedSong] = useState<Song | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'offline'>('offline');

  // Fetch all songs
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
          setConnectionStatus('connected');
        }
      } catch (err) {
        console.error(err);
        setConnectionStatus('reconnecting');
      }
    };

    const connectSSE = () => {
      if (eventSource) eventSource.close();
      eventSource = new EventSource(`/api/state/sse?w=${workspaceId}`);

      eventSource.onopen = () => {
        setConnectionStatus('connected');
      };

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
        setConnectionStatus('reconnecting');
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

  // Sync loaded song when active_song_id changes
  useEffect(() => {
    if (activeState?.active_song_id && songs.length > 0) {
      const found = songs.find(s => s.id === activeState.active_song_id);
      if (found) setLoadedSong(found);
    } else if (!activeState?.active_song_id) {
      setLoadedSong(null);
    }
  }, [activeState?.active_song_id, songs]);

  // REST API update helper
  const updateState = async (newState: any) => {
    const mergedState = { ...activeState, ...newState };
    setActiveState(mergedState);

    try {
      await fetch(`/api/state?w=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState)
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Flatten active song lines for prev/next navigation
  const getFlatLines = (song: Song) => {
    const flat: Array<{ secIdx: number; lineIdx: number; text: string; sectionLabel: string; type: string }> = [];
    song.sections.forEach((sec, secIdx) => {
      sec.lines.forEach((line, lineIdx) => {
        flat.push({ 
          secIdx, 
          lineIdx, 
          text: line, 
          sectionLabel: sec.label, 
          type: sec.type 
        });
      });
    });
    return flat;
  };

  const getFlatIndex = (flatLines: any[], secIdx: number, lineIdx: number) => {
    return flatLines.findIndex(item => item.secIdx === secIdx && item.lineIdx === lineIdx);
  };

  const handleNextLine = async () => {
    if (!loadedSong) return;
    const flat = getFlatLines(loadedSong);
    const currentIdx = getFlatIndex(flat, activeState.active_section_index, activeState.active_line_index);

    if (activeState.is_cleared) {
      await updateState({ is_cleared: false, overlay_type: 'lyric' });
    } else if (currentIdx < flat.length - 1) {
      const next = flat[currentIdx + 1];
      await updateState({
        active_section_index: next.secIdx,
        active_line_index: next.lineIdx,
        is_cleared: false,
        overlay_type: 'lyric'
      });
    }
  };

  const handlePrevLine = async () => {
    if (!loadedSong) return;
    const flat = getFlatLines(loadedSong);
    const currentIdx = getFlatIndex(flat, activeState.active_section_index, activeState.active_line_index);

    if (activeState.is_cleared) {
      await updateState({ is_cleared: false, overlay_type: 'lyric' });
    } else if (currentIdx > 0) {
      const prev = flat[currentIdx - 1];
      await updateState({
        active_section_index: prev.secIdx,
        active_line_index: prev.lineIdx,
        is_cleared: false,
        overlay_type: 'lyric'
      });
    }
  };

  const handleLineClick = async (secIdx: number, lineIdx: number) => {
    await updateState({
      active_section_index: secIdx,
      active_line_index: lineIdx,
      is_cleared: false,
      overlay_type: 'lyric'
    });
  };

  // Keyboard listeners inside OBS Dock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowDown') {
        e.preventDefault();
        handleNextLine();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        handlePrevLine();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleClearLyrics();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadedSong, activeState]);

  // Decoupled selective clear handlers
  const handleClearLyrics = async () => {
    await updateState({ is_cleared: true });
  };

  const handleClearBible = async () => {
    await updateState({ bible_verse: null });
  };

  const handleClearLowerThird = async () => {
    await updateState({
      lower_third: {
        ...activeState?.lower_third,
        visible: false
      }
    });
  };

  const handleClearRunningText = async () => {
    await updateState({
      running_text: {
        ...activeState?.running_text,
        visible: false
      }
    });
  };

  const handleClearShader = async () => {
    await updateState({ shader_active: false });
  };

  const handleClearAll = async () => {
    await updateState({
      is_cleared: true,
      bible_verse: null,
      lower_third: { ...activeState?.lower_third, visible: false },
      running_text: { ...activeState?.running_text, visible: false },
      shader_active: false
    });
  };

  const handleShowLowerThird = async (profile: any) => {
    await updateState({
      overlay_type: 'lower-third',
      is_cleared: false,
      lower_third: {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        template: profile.template || 'Slide Bottom',
        anim_in: profile.animIn || 'Slide from left',
        anim_out: profile.animOut || 'Fade out',
        duration_in: profile.durationIn || '0.6s',
        duration_out: profile.durationOut || '0.4s',
        visible: true
      }
    });
  };

  const handleHideLowerThird = async () => {
    await updateState({
      lower_third: {
        ...activeState?.lower_third,
        visible: false
      }
    });
  };

  const isProfileLive = (profileId: string) => {
    return (
      !activeState?.is_cleared &&
      activeState?.overlay_type === 'lower-third' &&
      activeState?.lower_third?.id === profileId &&
      activeState?.lower_third?.visible
    );
  };

  // Determine current display content
  let currentOnScreenText = 'SCREEN CLEAR';
  if (!activeState.is_cleared) {
    if (activeState.overlay_type === 'lyric' && loadedSong) {
      const sec = loadedSong.sections[activeState.active_section_index];
      currentOnScreenText = sec?.lines[activeState.active_line_index] || '';
    } else if (activeState.overlay_type === 'verse' && activeState.bible_verse) {
      const isEn = activeState.bible_verse.display_mode === 'en';
      currentOnScreenText = isEn ? activeState.bible_verse.text_en : activeState.bible_verse.text_id;
    } else if (activeState.overlay_type === 'lower-third' && activeState.lower_third?.visible) {
      currentOnScreenText = `${activeState.lower_third.name} - ${activeState.lower_third.role}`;
    }
  }

  const flatLines = loadedSong ? getFlatLines(loadedSong) : [];

  return (
    <div className="obs-dock-layout">
      <style jsx global>{`
        body {
          background-color: var(--bg-0) !important;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow: hidden;
        }

        .obs-dock-layout {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-0);
          color: var(--t1);
        }

        /* Header (56px) */
        .dock-header {
          height: 56px;
          padding: 0 var(--space-md);
          background-color: var(--bg-1);
          border-bottom: 1px solid var(--bg-4);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .dock-title-block {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dock-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: ${activeState.is_cleared ? 'var(--t3)' : 'var(--live)'};
          animation: ${activeState.is_cleared ? 'none' : 'pulse-live 1.5s ease-in-out infinite'};
        }

        .dock-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        /* Song Bar (32px) */
        .dock-song-bar {
          height: 32px;
          padding: 0 var(--space-md);
          background-color: var(--bg-2);
          border-bottom: 1px solid var(--bg-4);
          display: flex;
          align-items: center;
          font-size: 11px;
          font-weight: 500;
          color: var(--t2);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 0;
        }

        /* Preview Area (72px) */
        .dock-preview-area {
          height: 72px;
          padding: var(--space-sm) var(--space-md);
          background-color: var(--bg-0);
          border-bottom: 1px solid var(--bg-4);
          display: flex;
          flex-direction: column;
          justify-content: center;
          flex-shrink: 0;
        }

        .preview-label {
          font-size: 9px;
          font-weight: 600;
          color: var(--t3);
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .preview-box {
          background-color: rgba(0, 0, 0, 0.4);
          border: 1px dashed var(--bg-4);
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 500;
          color: ${activeState.is_cleared ? 'var(--t3)' : '#ffffff'};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
        }

        /* Selective Clear Row */
        .dock-clear-bar {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 2px;
          background-color: var(--bg-2);
          border-bottom: 1px solid var(--bg-4);
          padding: 4px;
          flex-shrink: 0;
        }

        .clear-btn-small {
          background-color: var(--bg-1);
          border: 1px solid var(--bg-4);
          color: var(--t2);
          font-size: 9px;
          font-weight: 600;
          padding: 6px 0;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
          text-align: center;
          text-transform: uppercase;
          transition: all 0.15s ease;
        }

        .clear-btn-small:hover {
          background-color: var(--bg-3);
          color: var(--t1);
          border-color: var(--t3);
        }

        .clear-btn-small:active {
          transform: scale(0.95);
        }

        .clear-btn-small.clear-all {
          background-color: var(--live-bg);
          border-color: rgba(239, 68, 68, 0.3);
          color: var(--live);
        }
        .clear-btn-small.clear-all:hover {
          background-color: rgba(239, 68, 68, 0.2);
        }

        /* Lyric list scrollable */
        .dock-lyric-list {
          flex: 1;
          overflow-y: auto;
          background-color: var(--bg-1);
        }

        .dock-lyric-row {
          width: 100%;
          min-height: 48px; /* tap target */
          display: flex;
          align-items: center;
          padding: 10px var(--space-md);
          border-bottom: 1px solid rgba(39, 45, 66, 0.2);
          background: transparent;
          border-left: 3px solid transparent;
          color: var(--t2);
          font-size: 13px;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
        }

        .dock-lyric-row:hover {
          background-color: var(--bg-3);
          color: var(--t1);
        }

        .dock-lyric-row.active {
          background-color: var(--accent-bg);
          border-left: 3px solid var(--accent);
          color: var(--t1);
          font-weight: 600;
        }

        .row-type-badge {
          font-size: 9px;
          font-weight: 700;
          color: var(--t3);
          background-color: var(--bg-4);
          border-radius: 4px;
          padding: 1px 4px;
          margin-right: var(--space-sm);
          text-transform: uppercase;
        }
        .dock-lyric-row.active .row-type-badge {
          background-color: var(--accent);
          color: #ffffff;
        }

        /* Footer Nav (48px) */
        .dock-nav-footer {
          height: 48px;
          display: flex;
          background-color: var(--bg-2);
          border-top: 1px solid var(--bg-4);
          flex-shrink: 0;
        }

        .dock-nav-btn {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--t1);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
        }
        .dock-nav-btn:hover {
          background-color: var(--bg-3);
        }
        .dock-nav-btn:active {
          background-color: var(--bg-4);
        }

        .divider {
          width: 1px;
          background-color: var(--bg-4);
        }

        /* Tabs styling */
        .dock-tabs {
          display: flex;
          background-color: var(--bg-1);
          border-bottom: 1px solid var(--bg-4);
          flex-shrink: 0;
        }

        .dock-tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--t2);
          font-family: inherit;
          font-size: 11px;
          font-weight: 600;
          padding: 8px 0;
          cursor: pointer;
          text-align: center;
          transition: all 0.15s ease;
        }

        .dock-tab-btn:hover {
          color: var(--t1);
          background-color: var(--bg-2);
        }

        .dock-tab-btn.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
          background-color: var(--bg-2);
        }

        /* Lower Third Dock List styling */
        .dock-lt-list {
          flex: 1;
          overflow-y: auto;
          background-color: var(--bg-1);
          padding: var(--space-sm);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dock-lt-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-sm) var(--space-md);
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: 6px;
        }

        .dock-lt-row.active {
          border-color: var(--accent);
          background-color: var(--accent-bg);
        }

        .dock-lt-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding-right: var(--space-sm);
        }

        .dock-lt-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--t1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dock-lt-role {
          font-size: 10px;
          color: var(--t2);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>

      {/* Header */}
      <header className="dock-header">
        <div className="dock-title-block">
          <span className="dock-live-dot" />
          <span className="dock-title">AGII OVERLAY</span>
        </div>
        <div className="connection-indicator" style={{ fontSize: '10px', color: connectionStatus === 'connected' ? 'var(--success)' : 'var(--warning)' }}>
          ● {connectionStatus.toUpperCase()}
        </div>
      </header>

      {/* Song Bar */}
      <div className="dock-song-bar">
        {loadedSong ? `${loadedSong.title} · ${loadedSong.key} major` : 'TIDAK ADA LAGU AKTIF'}
      </div>

      {/* On Screen Now */}
      <div className="dock-preview-area">
        <div className="preview-label">On Screen Now</div>
        <div className="preview-box">
          {currentOnScreenText}
        </div>
      </div>

      {/* Selective Clear Grid */}
      <div className="dock-clear-bar">
        <button className="clear-btn-small" onClick={handleClearLyrics} title="Hapus Lirik Saja">Lirik</button>
        <button className="clear-btn-small" onClick={handleClearBible} title="Hapus Ayat Alkitab Saja">Alkitab</button>
        <button className="clear-btn-small" onClick={handleClearLowerThird} title="Hapus Lower Third Saja">L-3rd</button>
        <button className="clear-btn-small" onClick={handleClearRunningText} title="Hapus Running Text Saja">Text</button>
        <button className="clear-btn-small" onClick={handleClearShader} title="Matikan Background Shader">Shader</button>
        <button className="clear-btn-small clear-all" onClick={handleClearAll} title="Matikan Semua Layer">SEMUA</button>
      </div>

      {/* Tab Selector */}
      <div className="dock-tabs">
        <button className={`dock-tab-btn ${activeTab === 'lyric' ? 'active' : ''}`} onClick={() => setActiveTab('lyric')}>
          Lirik Lagu
        </button>
        <button className={`dock-tab-btn ${activeTab === 'lower-third' ? 'active' : ''}`} onClick={() => setActiveTab('lower-third')}>
          Lower Thirds
        </button>
      </div>

      {/* Scrollable List based on Tab */}
      {activeTab === 'lyric' ? (
        <div className="dock-lyric-list">
          {loadedSong ? (
            flatLines.map((line, idx) => {
              const isActive = 
                !activeState.is_cleared && 
                activeState.overlay_type === 'lyric' &&
                activeState.active_section_index === line.secIdx && 
                activeState.active_line_index === line.lineIdx;
              
              return (
                <button
                  key={idx}
                  className={`dock-lyric-row ${isActive ? 'active' : ''}`}
                  onClick={() => handleLineClick(line.secIdx, line.lineIdx)}
                >
                  <span className="row-type-badge">{line.type}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {line.text}
                  </span>
                </button>
              );
            })
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px', color: 'var(--t3)', textAlign: 'center' }}>
              <AlertCircle size={24} style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '12px' }}>Silakan load lagu dari dashboard operator terlebih dahulu.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="dock-lt-list">
          {(activeState?.lower_thirds !== undefined && activeState.lower_thirds.length > 0 ? activeState.lower_thirds : DEFAULT_PROFILES).map((profile: any) => {
            const live = isProfileLive(profile.id);
            return (
              <div key={profile.id} className={`dock-lt-row ${live ? 'active' : ''}`}>
                <div className="dock-lt-info">
                  <span className="dock-lt-name">{profile.name}</span>
                  <span className="dock-lt-role">{profile.role} · <span style={{ fontSize: '9px', opacity: 0.8 }}>{profile.template}</span></span>
                </div>
                {live ? (
                  <button className="clear-btn-small" style={{ padding: '4px 8px', fontSize: '9px', borderColor: 'var(--live)', color: 'var(--live)' }} onClick={handleHideLowerThird}>
                    Hide
                  </button>
                ) : (
                  <button className="clear-btn-small" style={{ padding: '4px 8px', fontSize: '9px', borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => handleShowLowerThird(profile)}>
                    Show
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Nav Footer */}
      <footer className="dock-nav-footer">
        <button className="dock-nav-btn" onClick={handlePrevLine} disabled={!loadedSong || activeTab !== 'lyric'}>
          <ArrowLeft size={14} />
          <span>[◀ PREV]</span>
        </button>
        <div className="divider" />
        <button className="dock-nav-btn" onClick={handleNextLine} disabled={!loadedSong || activeTab !== 'lyric'}>
          <span>[NEXT ▶]</span>
          <ArrowRight size={14} />
        </button>
      </footer>
    </div>
  );
}
