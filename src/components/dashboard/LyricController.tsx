'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Play, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import StagePreview from './StagePreview';

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

interface LyricControllerProps {
  workspaceId: string;
  activeState: any;
  updateState: (newState: any) => Promise<void>;
}

export default function LyricController({ workspaceId, activeState, updateState }: LyricControllerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [loadedSong, setLoadedSong] = useState<Song | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New song form state
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newKey, setNewKey] = useState('G');
  const [newLyricText, setNewLyricText] = useState(''); // Textarea with sections separated by double newlines

  // Load songs database
  const fetchSongs = async (query = '') => {
    try {
      const res = await fetch(`/api/songs?q=${encodeURIComponent(query)}&w=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Failed to fetch songs:', error);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  // Fetch specific loaded song if state has active_song_id
  useEffect(() => {
    if (activeState?.active_song_id) {
      const fetchLoadedSong = async () => {
        try {
          const res = await fetch(`/api/songs?w=${workspaceId}`);
          if (res.ok) {
            const allSongs: Song[] = await res.json();
            const found = allSongs.find(s => s.id === activeState.active_song_id);
            if (found) setLoadedSong(found);
          }
        } catch (error) {
          console.error(error);
        }
      };
      fetchLoadedSong();
    } else {
      setLoadedSong(null);
    }
  }, [activeState?.active_song_id]);

  // Handle Search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    const filtered = songs.filter(
      s => s.title.toLowerCase().includes(query.toLowerCase()) || 
           s.artist.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  // Load song to controller
  const handleLoadSong = async (song: Song) => {
    setLoadedSong(song);
    await updateState({
      active_song_id: song.id,
      active_section_index: 0,
      active_line_index: 0,
      is_cleared: false,
      overlay_type: 'lyric'
    });
  };

  // Unload song
  const handleUnloadSong = async () => {
    setLoadedSong(null);
    await updateState({
      active_song_id: '',
      active_section_index: -1,
      active_line_index: -1,
      is_cleared: true
    });
  };

  // Flatten active song lines for easy next/prev indexing
  const getFlatLines = (song: Song) => {
    const flat: Array<{ secIdx: number; lineIdx: number; text: string }> = [];
    song.sections.forEach((sec, secIdx) => {
      sec.lines.forEach((line, lineIdx) => {
        flat.push({ secIdx, lineIdx, text: line });
      });
    });
    return flat;
  };

  const getFlatIndex = (flatLines: any[], secIdx: number, lineIdx: number) => {
    return flatLines.findIndex(item => item.secIdx === secIdx && item.lineIdx === lineIdx);
  };

  // Go to next line
  const handleNextLine = async () => {
    if (!loadedSong) return;
    const flat = getFlatLines(loadedSong);
    const currentIdx = getFlatIndex(flat, activeState.active_section_index, activeState.active_line_index);
    
    if (activeState.is_cleared) {
      // If cleared, un-clear it and keep current index
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

  // Go to previous line
  const handlePrevLine = async () => {
    if (!loadedSong) return;
    const flat = getFlatLines(loadedSong);
    const currentIdx = getFlatIndex(flat, activeState.active_section_index, activeState.active_line_index);

    if (activeState.is_cleared) {
      // If cleared, un-clear
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

  // Clear Screen
  const handleClearScreen = async () => {
    await updateState({ is_cleared: true });
  };

  const lyricConfig = activeState?.lyric_config || { x: 0, y: 0, scale: 1.0 };

  const handleConfigChange = async (key: string, val: number) => {
    await updateState({
      lyric_config: {
        ...lyricConfig,
        [key]: val
      }
    });
  };

  // Set specific line active
  const handleLineClick = async (secIdx: number, lineIdx: number) => {
    await updateState({
      active_section_index: secIdx,
      active_line_index: lineIdx,
      is_cleared: false,
      overlay_type: 'lyric'
    });
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in inputs or textareas
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextLine();
      } else if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevLine();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleClearScreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadedSong, activeState]);

  // Create new song
  const handleCreateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Parse lyric textarea into sections
    // Format:
    // [Verse 1] or [V1]
    // Line 1
    // Line 2
    //
    // [Chorus] or [CH]
    // Line 1
    const sections: SongSection[] = [];
    const blocks = newLyricText.split('\n\n');

    blocks.forEach((block) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        let label = 'Verse';
        let type = 'V';
        let header = lines[0];

        if (header.startsWith('[') && header.endsWith(']')) {
          label = header.slice(1, -1);
          lines.shift(); // remove header line
          
          if (label.toLowerCase().includes('chorus') || label.toLowerCase() === 'ch') {
            type = 'CH';
          } else if (label.toLowerCase().includes('bridge') || label.toLowerCase() === 'br') {
            type = 'BR';
          } else if (label.toLowerCase().includes('pre') || label.toLowerCase() === 'pre-chorus') {
            type = 'PRE';
          } else if (label.toLowerCase().includes('verse') || label.toLowerCase().startsWith('v')) {
            const num = label.match(/\d+/)?.[0] || '1';
            type = `V${num}`;
          } else {
            type = 'V';
          }
        }

        sections.push({
          type,
          label,
          lines
        });
      }
    });

    try {
      const res = await fetch(`/api/songs?w=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          artist: newArtist,
          key: newKey,
          sections
        })
      });

      if (res.ok) {
        setNewTitle('');
        setNewArtist('');
        setNewKey('G');
        setNewLyricText('');
        setShowAddModal(false);
        fetchSongs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="lyric-controller">
      <style jsx>{`
        .lyric-controller {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
          width: 100%;
        }

        /* Search Section */
        .search-row {
          display: flex;
          gap: var(--space-md);
          align-items: center;
        }

        .search-input-wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--t3);
        }

        .search-input {
          padding-left: 36px;
        }

        /* Results Row */
        .results-section {
          background-color: var(--bg-1);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-card);
          padding: var(--space-md);
          max-height: 220px;
          overflow-y: auto;
        }

        .results-header {
          margin-bottom: var(--space-sm);
        }

        .song-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: 8px;
          margin-bottom: 6px;
          transition: all 0.15s ease;
        }

        .song-row:hover {
          background-color: var(--bg-3);
        }

        .song-info {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .song-title {
          font-weight: 500;
          color: var(--t1);
        }

        .song-artist {
          font-size: 11px;
          color: var(--t2);
        }

        /* Active Controller */
        .active-controller-card {
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-card);
          padding: var(--space-lg);
          box-shadow: var(--shadow-1);
        }

        .controller-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--bg-4);
          padding-bottom: var(--space-md);
          margin-bottom: var(--space-lg);
        }

        .controller-title-block {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .controller-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--t1);
        }

        .preview-wrapper {
          margin-bottom: var(--space-xl);
        }

        .lyric-lines-container {
          margin-bottom: var(--space-xl);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          max-height: 400px;
          overflow-y: auto;
          padding-right: var(--space-xs);
        }

        .lyric-section-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .lyric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: transparent;
          border-left: 3px solid transparent;
          color: var(--t2);
          cursor: pointer;
          border-radius: 0 4px 4px 0;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.1s ease;
          text-align: left;
        }

        .lyric-row:hover {
          background-color: var(--bg-3);
          color: var(--t1);
        }

        .lyric-row.active {
          background-color: var(--accent-bg);
          border-left: 3px solid var(--accent);
          color: var(--t1);
          font-weight: 600;
        }

        .control-actions-bar {
          display: flex;
          gap: var(--space-md);
          border-top: 1px solid var(--bg-4);
          padding-top: var(--space-md);
        }

        /* Modal styling */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .modal-card {
          background-color: var(--bg-1);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-modal);
          width: 100%;
          max-width: 550px;
          padding: var(--space-2xl);
          box-shadow: var(--shadow-3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xl);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .textarea-field {
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-input);
          padding: var(--space-md);
          color: var(--t1);
          font-family: inherit;
          font-size: 13px;
          width: 100%;
          min-height: 180px;
          resize: vertical;
        }
        .textarea-field:focus {
          border-color: var(--accent-border);
          outline: 2px solid var(--accent-glow);
        }

        .range-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--bg-4);
          outline: none;
          cursor: pointer;
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>

      {/* Search & Add row */}
      <div className="search-row">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Cari judul lagu rohani atau artis..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <button className="btn btn-secondary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>Tambah Lagu</span>
        </button>
      </div>

      {/* Search results list */}
      {searchResults.length > 0 && !loadedSong && (
        <div className="results-section">
          <div className="results-header section-label">Hasil Pencarian ({searchResults.length})</div>
          {searchResults.map((song) => (
            <div key={song.id} className="song-row">
              <div className="song-info">
                <span className="song-title">{song.title}</span>
                <span className="song-artist">{song.artist}</span>
                <span className="badge-key">{song.key}</span>
              </div>
              <button className="btn btn-ghost btn-secondary" style={{ padding: '4px 12px', fontSize: '11px' }} onClick={() => handleLoadSong(song)}>
                Load ke Controller
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active controller block */}
      {loadedSong && (
        <div className="active-controller-card">
          <div className="controller-header">
            <div className="controller-title-block">
              <span className="controller-title">{loadedSong.title}</span>
              <span className="badge-key">{loadedSong.key} major</span>
              <span className="text-caption" style={{ color: 'var(--t2)' }}>· {loadedSong.artist}</span>
            </div>
            <button className="btn btn-ghost" style={{ padding: '4px' }} onClick={handleUnloadSong}>
              <X size={16} />
            </button>
          </div>

          {/* Embed Stage Preview */}
          <div className="preview-wrapper">
            <div className="section-label" style={{ marginBottom: 'var(--space-sm)' }}>Stage Preview (Jemaat View)</div>
            <StagePreview state={activeState} song={loadedSong} />
          </div>

          {/* Lyric groups by sections */}
          <div className="lyric-lines-container">
            {loadedSong.sections.map((section, secIdx) => (
              <div key={secIdx} className="lyric-section-group">
                <div className="section-label">{section.label}</div>
                {section.lines.map((line, lineIdx) => {
                  const isActive = 
                    !activeState.is_cleared && 
                    activeState.overlay_type === 'lyric' &&
                    activeState.active_section_index === secIdx && 
                    activeState.active_line_index === lineIdx;
                  return (
                    <button
                      key={lineIdx}
                      className={`lyric-row ${isActive ? 'active' : ''}`}
                      onClick={() => handleLineClick(secIdx, lineIdx)}
                    >
                      <span>{line}</span>
                      {isActive && (
                        <span className="badge-live" style={{ padding: '1px 6px', fontSize: '9px' }}>
                          <span className="badge-live-dot" />
                          LIVE
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer Controls */}
          <div className="control-actions-bar">
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handlePrevLine}>
              <ArrowLeft size={16} />
              <span>[◀ PREV LINE]</span>
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleNextLine}>
              <span>[NEXT LINE ▶]</span>
              <ArrowRight size={16} />
            </button>
            <button className="btn btn-clear" style={{ flex: 0.8 }} onClick={handleClearScreen}>
              <X size={16} />
              <span>[CLEAR SCREEN ✕]</span>
            </button>
          </div>

          {/* Position & Scale Sliders */}
          <div className="layout-settings-card" style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md) 0 0 0', borderTop: '1px solid var(--bg-4)' }}>
            <div className="section-label" style={{ marginBottom: 'var(--space-sm)', color: 'var(--t2)' }}>Tata Letak & Skala Lirik</div>
            <div className="slider-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
              <div className="slider-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="login-form-label" style={{ fontSize: '10px', color: 'var(--t2)', marginBottom: 0 }}>Geser X: {lyricConfig.x}px</span>
                <input 
                  type="range" 
                  min="-500" 
                  max="500" 
                  className="range-slider" 
                  value={lyricConfig.x} 
                  onChange={(e) => handleConfigChange('x', parseInt(e.target.value))} 
                />
              </div>
              <div className="slider-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="login-form-label" style={{ fontSize: '10px', color: 'var(--t2)', marginBottom: 0 }}>Geser Y: {lyricConfig.y}px</span>
                <input 
                  type="range" 
                  min="-500" 
                  max="500" 
                  className="range-slider" 
                  value={lyricConfig.y} 
                  onChange={(e) => handleConfigChange('y', parseInt(e.target.value))} 
                />
              </div>
              <div className="slider-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="login-form-label" style={{ fontSize: '10px', color: 'var(--t2)', marginBottom: 0 }}>Skala: {lyricConfig.scale.toFixed(1)}x</span>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.1"
                  className="range-slider" 
                  value={lyricConfig.scale} 
                  onChange={(e) => handleConfigChange('scale', parseFloat(e.target.value))} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Song Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-headline">Tambah Lagu Baru</h3>
              <button className="btn btn-ghost" style={{ padding: '4px' }} onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSong} className="modal-form">
              <div className="login-form-group">
                <label className="login-form-label">Judul Lagu</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Bapa Engkau Sungguh Baik"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <div className="login-form-group" style={{ flex: 2 }}>
                  <label className="login-form-label">Artist / Pencipta</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Symphony Worship"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                  />
                </div>
                <div className="login-form-group" style={{ flex: 1 }}>
                  <label className="login-form-label">Nada Dasar (Key)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="G"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                  />
                </div>
              </div>

              <div className="login-form-group">
                <label className="login-form-label">Lirik Lagu (Format Sections)</label>
                <textarea
                  className="textarea-field"
                  placeholder="[Verse 1]&#10;Bapa Engkau sungguh baik&#10;KasihMu nyata dalam hidupku&#10;&#10;[Chorus]&#10;Haleluya kami memujiMu&#10;Haleluya selamanya"
                  value={newLyricText}
                  onChange={(e) => setNewLyricText(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Lagu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
