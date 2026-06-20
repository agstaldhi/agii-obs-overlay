'use client';

import React from 'react';
import { Layers } from 'lucide-react';

interface StagePreviewProps {
  state: {
    workspace_id: string;
    active_song_id?: string;
    active_section_index?: number;
    active_line_index?: number;
    overlay_type: string;
    shader_mode: string;
    is_cleared: boolean;
    bible_verse?: {
      reference: string;
      text_id: string;
      text_en: string;
      display_mode?: string;
    };
    lower_third?: {
      name: string;
      role: string;
      template: string;
      visible: boolean;
    };
  };
  song?: {
    id: string;
    title: string;
    sections: Array<{
      type: string;
      label: string;
      lines: string[];
    }>;
  };
}

export default function StagePreview({ state, song }: StagePreviewProps) {
  // Determine what to display based on active state and overlay type
  const isCleared = state.is_cleared;
  const overlayType = state.overlay_type;

  let displayContent = null;

  if (isCleared) {
    displayContent = (
      <div className="preview-clear-text">Screen clear</div>
    );
  } else if (overlayType === 'lyric' && song) {
    const secIdx = state.active_section_index ?? -1;
    const lineIdx = state.active_line_index ?? -1;
    const activeLine = song.sections[secIdx]?.lines[lineIdx] || '';
    const lyricConf = (state as any).lyric_config || { x: 0, y: 0, scale: 1.0 };
    
    displayContent = (
      <div 
        className="preview-lyric-pill"
        style={{
          transform: `translate(${lyricConf.x * 0.25}px, ${lyricConf.y * 0.25}px) scale(${lyricConf.scale})`,
          transition: 'transform 0.1s ease'
        }}
      >
        {activeLine}
      </div>
    );
  } else if (overlayType === 'verse' && state.bible_verse) {
    const isEn = state.bible_verse.display_mode === 'en';
    const textToShow = isEn ? state.bible_verse.text_en : state.bible_verse.text_id;
    const verseConf = (state as any).verse_config || { x: 0, y: 0, scale: 1.0 };
    const template = (state.bible_verse as any).template || 'Classic Box';

    switch (template) {
      case 'Blue Banner':
        displayContent = (
          <div 
            className="preview-bible-blue-banner"
            style={{
              transform: `translate(${verseConf.x * 0.25}px, ${verseConf.y * 0.25}px) scale(${verseConf.scale})`,
              transition: 'transform 0.1s ease',
              position: 'absolute',
              bottom: '10%'
            }}
          >
            <div className="preview-bible-blue-ref">{state.bible_verse.reference}</div>
            <div className="preview-bible-blue-body">
              <svg viewBox="0 0 64 64" fill="none" style={{ width: '20px', height: '14px', marginRight: '6px', flexShrink: 0 }}>
                <path d="M6 46c6-4 18-4 26-2V10C24 8 12 8 6 12v34z" fill="#f5f5f5" stroke="#111111" strokeWidth="3"/>
                <path d="M58 46c-6-4-18-4-26-2V10c8-2 20-2 26 2v34z" fill="#ffffff" stroke="#111111" strokeWidth="3"/>
                <path d="M31 8v38l2.5-3 2.5 3V8" fill="#E50914"/>
              </svg>
              <div className="preview-bible-blue-text">{textToShow}</div>
            </div>
          </div>
        );
        break;
      case 'Charcoal Grid':
        displayContent = (
          <div 
            className="preview-bible-charcoal-grid"
            style={{
              transform: `translate(${verseConf.x * 0.25}px, ${verseConf.y * 0.25}px) scale(${verseConf.scale})`,
              transition: 'transform 0.1s ease',
              position: 'absolute',
              bottom: '10%'
            }}
          >
            <svg viewBox="0 0 64 64" fill="none" style={{ width: '20px', height: '14px', marginRight: '8px', flexShrink: 0 }}>
              <path d="M6 46c6-4 18-4 26-2V10C24 8 12 8 6 12v34z" fill="#f5f5f5" stroke="#111111" strokeWidth="3"/>
              <path d="M58 46c-6-4-18-4-26-2V10c8-2 20-2 26 2v34z" fill="#ffffff" stroke="#111111" strokeWidth="3"/>
              <path d="M31 8v38l2.5-3 2.5 3V8" fill="#E50914"/>
            </svg>
            <div className="preview-bible-charcoal-content">
              <div className="preview-bible-charcoal-text">{textToShow}</div>
              <div className="preview-bible-charcoal-ref">{state.bible_verse.reference}</div>
            </div>
          </div>
        );
        break;
      default:
        displayContent = (
          <div 
            className="preview-verse-box"
            style={{
              transform: `translate(${verseConf.x * 0.25}px, ${verseConf.y * 0.25}px) scale(${verseConf.scale})`,
              transition: 'transform 0.1s ease'
            }}
          >
            <div className="preview-verse-ref">{state.bible_verse.reference}</div>
            <div className="preview-verse-text">{textToShow}</div>
          </div>
        );
    }
  } else if (overlayType === 'lower-third' && state.lower_third) {
    const ltConf = (state as any).lower_third_config || { x: 0, y: 0, scale: 1.0 };
    displayContent = (
      <div className="preview-lower-third-overlay">
        {state.lower_third.visible && (() => {
          const template = state.lower_third.template;
          const name = state.lower_third.name || 'Nama Pembicara';
          const role = state.lower_third.role || 'Peran / Jabatan';

          switch (template) {
            case 'Offset Blocks':
              return (
                <div 
                  className="preview-lt-offset-blocks"
                  style={{
                    transform: `translate(${ltConf.x * 0.25}px, ${ltConf.y * 0.25}px) scale(${ltConf.scale})`,
                    transformOrigin: 'bottom left',
                    transition: 'transform 0.1s ease'
                  }}
                >
                  <div className="preview-lt-offset-name">{name}</div>
                  {role && <div className="preview-lt-offset-role">{role}</div>}
                </div>
              );
            case 'News Ticker':
              return (
                <div 
                  className="preview-lt-news-ticker"
                  style={{
                    transform: `translate(${ltConf.x * 0.25}px, ${ltConf.y * 0.25}px) scale(${ltConf.scale})`,
                    transformOrigin: 'bottom left',
                    transition: 'transform 0.1s ease'
                  }}
                >
                  <div className="preview-lt-news-row1">
                    <div className="preview-lt-news-badge">NEWS</div>
                    <div className="preview-lt-news-title">{name}</div>
                  </div>
                  {role && <div className="preview-lt-news-desc">{role}</div>}
                  <div className="preview-lt-news-ticker-bar">
                    <div className="preview-lt-news-ticker-text">
                      • LIVE STREAMING • SILAHKAN SHARE DAN BERIKAN KOMENTAR POSITIF •
                    </div>
                  </div>
                </div>
              );
            case 'Pastor Badge':
              return (
                <div 
                  className="preview-lt-pastor-badge"
                  style={{
                    transform: `translate(${ltConf.x * 0.25}px, ${ltConf.y * 0.25}px) scale(${ltConf.scale})`,
                    transformOrigin: 'bottom left',
                    transition: 'transform 0.1s ease'
                  }}
                >
                  <div className="preview-lt-pastor-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      <path d="M12 5v9" />
                      <path d="M9 8h6" />
                    </svg>
                  </div>
                  <div className="preview-lt-pastor-body">
                    <div className="preview-lt-pastor-name">▶ {name}</div>
                    {role && <div className="preview-lt-pastor-role">{role}</div>}
                  </div>
                </div>
              );
            case 'Clean Cyan':
              return (
                <div 
                  className="preview-lt-clean-cyan"
                  style={{
                    transform: `translate(${ltConf.x * 0.25}px, ${ltConf.y * 0.25}px) scale(${ltConf.scale})`,
                    transformOrigin: 'bottom left',
                    transition: 'transform 0.1s ease'
                  }}
                >
                  <div className="preview-lt-clean-left">{role || 'PASTOR'}</div>
                  <div className="preview-lt-clean-right">{name}</div>
                </div>
              );
            default:
              return (
                <div 
                  className="preview-lower-third-box"
                  style={{
                    transform: `translate(${ltConf.x * 0.25}px, ${ltConf.y * 0.25}px) scale(${ltConf.scale})`,
                    transformOrigin: 'bottom left',
                    transition: 'transform 0.1s ease'
                  }}
                >
                  <div className="preview-lt-accent"></div>
                  <div className="preview-lt-content">
                    <div className="preview-lt-name">{name}</div>
                    <div className="preview-lt-role">{role}</div>
                  </div>
                </div>
              );
          }
        })()}
      </div>
    );
  }

  // Draw shader background effect in preview based on shader_mode
  const getShaderStyle = () => {
    if (isCleared && overlayType !== 'shader') return {};
    
    switch (state.shader_mode) {
      case 'Liquid Chrome':
        return {
          background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #030712 100%)',
          position: 'absolute' as const,
          width: '100%',
          height: '100%',
          opacity: 0.8
        };
      case 'Soft Gradient':
        return {
          background: 'linear-gradient(45deg, #0f172a 0%, #1e1b4b 100%)',
          position: 'absolute' as const,
          width: '100%',
          height: '100%',
          opacity: 0.8
        };
      case 'Silk Ribbons':
      default:
        return {
          background: 'linear-gradient(135deg, #090d16 0%, #180f2b 40%, #0b1a24 100%)',
          position: 'absolute' as const,
          width: '100%',
          height: '100%',
          opacity: 0.8
        };
    }
  };

  return (
    <div className="stage-preview-card">
      <style jsx>{`
        .stage-preview-card {
          width: 100%;
          aspect-ratio: 16 / 9;
          background-color: var(--bg-0);
          background-image: 
            linear-gradient(rgba(39, 45, 66, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(39, 45, 66, 0.05) 1px, transparent 1px);
          background-size: 20px 20px;
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-card);
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-shader-bg {
          pointer-events: none;
          z-index: 1;
        }

        .preview-badge-live {
          position: absolute;
          top: var(--space-md);
          left: var(--space-md);
          z-index: 10;
        }

        .preview-badge-shader {
          position: absolute;
          top: var(--space-md);
          right: var(--space-md);
          z-index: 10;
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          background: rgba(15, 17, 25, 0.6);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-badge);
          padding: 2px var(--space-sm);
          font-size: 10px;
          color: var(--t2);
          backdrop-filter: blur(4px);
        }

        .preview-content {
          position: relative;
          z-index: 5;
          width: 80%;
          text-align: center;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
        }

        .preview-clear-text {
          font-size: 14px;
          color: var(--t3);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .preview-lyric-pill {
          background-color: var(--overlay-bg-lyric, rgba(0, 0, 0, 0.45));
          padding: 6px 16px;
          border-radius: var(--radius-badge);
          color: #ffffff;
          font-size: clamp(14px, 2.5vw, 20px);
          font-weight: 600;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
          max-width: 90%;
          line-height: 1.3;
          backdrop-filter: blur(4px);
        }

        .preview-verse-box {
          background-color: rgba(0, 0, 0, 0.6);
          padding: var(--space-md) var(--space-lg);
          border-radius: 8px;
          border: 1px solid var(--bg-4);
          max-width: 90%;
        }

        .preview-verse-ref {
          font-size: 10px;
          font-weight: 600;
          color: var(--t2);
          text-transform: uppercase;
          margin-bottom: var(--space-xs);
          letter-spacing: 0.05em;
        }

        .preview-verse-text {
          font-size: 12px;
          color: #ffffff;
          line-height: 1.4;
          text-shadow: 0 1px 4px rgba(0,0,0,0.8);
        }

        .preview-lower-third-overlay {
          position: absolute;
          bottom: 12%;
          left: 10%;
          width: 80%;
          display: flex;
          justify-content: flex-start;
          text-align: left;
        }

        .preview-lower-third-box {
          display: flex;
          background: rgba(15, 17, 25, 0.9);
          border: 1px solid var(--bg-4);
          border-radius: 6px;
          overflow: hidden;
          width: auto;
          min-width: 180px;
        }

        .preview-lt-accent {
          width: 3px;
          background-color: var(--accent);
        }

        .preview-lt-content {
          padding: 6px 12px;
        }

        .preview-lt-name {
          font-size: 10px;
          font-weight: 600;
          color: var(--t1);
        }

        .preview-lt-role {
          font-size: 8px;
          font-weight: 500;
          color: var(--accent);
          text-transform: uppercase;
        }

        /* Offset Blocks Preview */
        .preview-lt-offset-blocks {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .preview-lt-offset-name {
          background: #000000;
          color: #ffffff;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-style: italic;
          font-size: 9px;
          padding: 3px 8px;
          text-transform: uppercase;
          transform: skewX(-4deg);
        }
        .preview-lt-offset-role {
          background: #ffffff;
          color: #111111;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 7px;
          padding: 2px 6px;
          text-transform: uppercase;
          margin-top: 2px;
          margin-left: 10px;
          transform: skewX(-4deg);
        }

        /* News Ticker Preview */
        .preview-lt-news-ticker {
          display: flex;
          flex-direction: column;
          width: 280px;
        }
        .preview-lt-news-row1 {
          display: flex;
        }
        .preview-lt-news-badge {
          background: #E50914;
          color: #ffffff;
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 9px;
          padding: 2px 6px;
        }
        .preview-lt-news-title {
          background: linear-gradient(to right, #ffffff 0%, #e2e8f0 100%);
          color: #111111;
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 9px;
          padding: 2px 6px;
          flex-grow: 1;
          border-right: 3px solid #E50914;
        }
        .preview-lt-news-desc {
          background: rgba(0, 0, 0, 0.95);
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 7px;
          padding: 2px 6px;
          border-left: 2px solid #E50914;
        }
        .preview-lt-news-ticker-bar {
          background: #001f3f;
          color: #a5f3fc;
          font-family: 'Inter', sans-serif;
          font-size: 6px;
          padding: 1px 6px;
          overflow: hidden;
          white-space: nowrap;
        }

        /* Pastor Badge Preview */
        .preview-lt-pastor-badge {
          display: flex;
          align-items: center;
        }
        .preview-lt-pastor-icon {
          width: 26px;
          height: 26px;
          background: #ffffff;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .preview-lt-pastor-icon svg {
          stroke: #111111;
          width: 16px;
          height: 16px;
        }
        .preview-lt-pastor-body {
          display: flex;
          flex-direction: column;
          margin-left: -3px;
          z-index: 1;
        }
        .preview-lt-pastor-name {
          background: linear-gradient(90deg, #0284c7 0%, #a855f7 100%);
          color: #ffffff;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 9px;
          padding: 3px 8px 3px 10px;
          border-radius: 0 4px 4px 0;
        }
        .preview-lt-pastor-role {
          background: #ffffff;
          color: #111111;
          font-family: 'Inter', sans-serif;
          font-weight: 700;
          font-size: 6px;
          padding: 1px 5px;
          margin-left: 6px;
          margin-top: 1px;
          align-self: flex-start;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        /* Clean Cyan Preview */
        .preview-lt-clean-cyan {
          display: flex;
          background: #ffffff;
          border-bottom: 2px solid #00acc1;
          padding: 4px 10px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          color: #111111;
          min-width: 160px;
        }
        .preview-lt-clean-left {
          font-family: 'Inter', sans-serif;
          font-size: 7px;
          font-weight: 300;
          color: #78909c;
          padding-right: 6px;
          border-right: 1px solid #cfd8dc;
          text-transform: uppercase;
          display: flex;
          align-items: center;
        }
        .preview-lt-clean-right {
          font-family: 'Inter', sans-serif;
          font-size: 9px;
          font-weight: 600;
          color: #263238;
          padding-left: 6px;
          display: flex;
          align-items: center;
        }

        /* Bible templates preview */
        .preview-bible-blue-banner {
          display: flex;
          flex-direction: column;
          width: 320px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .preview-bible-blue-ref {
          background-color: #0d47a1;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 7px;
          font-weight: 700;
          padding: 2px 8px;
          text-align: left;
        }
        .preview-bible-blue-body {
          background-color: #002171;
          display: flex;
          align-items: center;
          padding: 4px 8px;
        }
        .preview-bible-blue-text {
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 8px;
          font-weight: 700;
          line-height: 1.3;
          text-align: left;
        }
        .preview-bible-charcoal-grid {
          display: flex;
          align-items: center;
          width: 320px;
          background-color: rgba(18, 18, 18, 0.95);
          background-image: 
            linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .03) 25%, rgba(255, 255, 255, .03) 26%, transparent 27%, transparent), 
            linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .03) 25%, rgba(255, 255, 255, .03) 26%, transparent 27%, transparent);
          background-size: 6px 6px;
          padding: 6px 10px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .preview-bible-charcoal-content {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          text-align: left;
        }
        .preview-bible-charcoal-text {
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-size: 8px;
          font-weight: 700;
          line-height: 1.3;
        }
        .preview-bible-charcoal-ref {
          color: #cfd8dc;
          font-family: 'Inter', sans-serif;
          font-size: 6px;
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 1px;
        }
      `}</style>

      {/* Background Shader Simulation */}
      <div className="preview-shader-bg" style={getShaderStyle()} />

      {/* Badges */}
      <div className="preview-badge-live badge-live">
        <div className="badge-live-dot" />
        <span>LIVE</span>
      </div>

      {!isCleared && (
        <div className="preview-badge-shader">
          <Layers size={10} />
          <span>{state.shader_mode}</span>
        </div>
      )}

      {/* Content */}
      <div className="preview-content">
        {displayContent}
      </div>
    </div>
  );
}
