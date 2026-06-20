'use client';

import React, { useState, useEffect } from 'react';
import { Play, X, Type, Send, EyeOff } from 'lucide-react';
import StagePreview from './StagePreview';

interface RunningTextFormProps {
  workspaceId: string;
  activeState: any;
  updateState: (newState: any) => Promise<void>;
}

export default function RunningTextForm({ workspaceId, activeState, updateState }: RunningTextFormProps) {
  const [text, setText] = useState('Selamat beribadah di Lumen Church - Tuhan Yesus memberkati ibadah kita hari ini!');
  const [speed, setSpeed] = useState(5);
  const [scale, setScale] = useState(1.0);
  const [bgColor, setBgColor] = useState('rgba(15, 17, 25, 0.85)');
  const [fontFamily, setFontFamily] = useState('Inter');

  // Sync state if it changed externally
  useEffect(() => {
    if (activeState?.running_text) {
      setText(activeState.running_text.text || '');
      setSpeed(activeState.running_text.speed || 5);
      setScale(activeState.running_text.scale || 1.0);
      setBgColor(activeState.running_text.bg_color || 'rgba(15, 17, 25, 0.85)');
      setFontFamily(activeState.running_text.font_family || 'Inter');
    }
  }, [activeState]);

  const handleConfigChange = async (updateObj: any) => {
    if (activeState?.running_text?.visible) {
      await updateState({
        running_text: {
          ...activeState.running_text,
          ...updateObj
        }
      });
    }
  };

  const handleShow = async () => {
    await updateState({
      running_text: {
        text,
        speed,
        scale,
        bg_color: bgColor,
        font_family: fontFamily,
        visible: true
      }
    });
  };

  const handleHide = async () => {
    await updateState({
      running_text: {
        ...activeState?.running_text,
        visible: false
      }
    });
  };

  // Get active live state for preview
  const isLive = activeState?.running_text?.visible && !activeState?.is_cleared;

  return (
    <div className="running-text-form">
      <style jsx>{`
        .running-text-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-card);
          padding: var(--space-lg);
          box-shadow: var(--shadow-1);
        }

        .marquee-preview-box {
          height: 48px;
          background-color: #080A10;
          border: 1px solid var(--bg-4);
          border-radius: 8px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        .marquee-inner-preview {
          position: absolute;
          white-space: nowrap;
          animation: marquee-preview-anim 15s linear infinite;
          padding-left: 100%;
          color: #ffffff;
          font-weight: 500;
          font-size: 13px;
        }

        @keyframes marquee-preview-anim {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }

        .control-sliders {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .slider-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--t2);
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
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .actions-row {
          display: flex;
          gap: var(--space-md);
          margin-top: var(--space-md);
        }

        .live-banner-indicator {
          background-color: var(--success-bg);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: var(--success);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-btn);
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .select-field {
          height: 32px;
          background-color: var(--bg-1);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-input);
          padding: 0 var(--space-md);
          color: var(--t1);
          font-family: inherit;
          cursor: pointer;
          width: 100%;
        }
      `}</style>

      <div className="section-label">Modul Running Text</div>

      {isLive && (
        <div className="live-banner-indicator">
          <span className="status-dot online" style={{ backgroundColor: 'var(--success)', width: '6px', height: '6px', borderRadius: '50%' }} />
          <span>Running Text saat ini sedang <strong>LIVE</strong> di OBS.</span>
        </div>
      )}

      {/* Input Text */}
      <div className="login-form-group">
        <label className="login-form-label">Teks Berjalan</label>
        <textarea
          className="input-field"
          style={{ height: '80px', padding: '10px', resize: 'vertical' }}
          placeholder="Ketikkan pengumuman, ayat ringkas, atau pesan selamat datang..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {/* Configuration Sliders & Selectors */}
      <div className="control-sliders" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
        <div className="slider-group">
          <div className="slider-header">
            <span>Kecepatan Berjalan</span>
            <span>Level {speed}</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            className="range-slider"
            value={speed}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setSpeed(val);
              handleConfigChange({ speed: val });
            }}
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span>Tinggi & Huruf (Scale)</span>
            <span>{scale.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            className="range-slider"
            value={scale}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setScale(val);
              handleConfigChange({ scale: val });
            }}
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span>Warna Background</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <input
              type="color"
              style={{ width: '40px', height: '32px', padding: 0, border: '1px solid var(--bg-4)', cursor: 'pointer', borderRadius: '4px', backgroundColor: 'transparent' }}
              value={/^#[0-9a-fA-F]{6}$/.test(bgColor) ? bgColor : '#0f1119'}
              onChange={(e) => {
                const val = e.target.value;
                setBgColor(val);
                handleConfigChange({ bg_color: val });
              }}
            />
            <input
              type="text"
              className="input-field"
              style={{ height: '32px', fontSize: '11px' }}
              value={bgColor}
              onChange={(e) => {
                const val = e.target.value;
                setBgColor(val);
                handleConfigChange({ bg_color: val });
              }}
            />
          </div>
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span>Font Teks</span>
          </div>
          <select
            className="select-field"
            value={fontFamily}
            onChange={(e) => {
              const val = e.target.value;
              setFontFamily(val);
              handleConfigChange({ font_family: val });
            }}
          >
            <option value="Inter">Inter (Default)</option>
            <option value="Roboto">Roboto</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Poppins">Poppins</option>
            <option value="Cinzel">Cinzel</option>
            <option value="Playfair Display">Playfair Display</option>
          </select>
        </div>
      </div>

      {/* Preview Simulation */}
      <div>
        <div className="section-label" style={{ marginBottom: 'var(--space-sm)' }}>Simulasi Tampilan</div>
        <div 
          className="marquee-preview-box"
          style={{
            backgroundColor: bgColor,
            fontFamily: `${fontFamily}, sans-serif`,
            transform: `scale(${Math.min(1.2, scale)})`,
            transformOrigin: 'left center'
          }}
        >
          <div 
            className="marquee-inner-preview"
            style={{ 
              animationDuration: `${Math.max(5, 30 - speed * 2.5)}s` 
            }}
          >
            {text || 'Ketikkan teks berjalan...'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-row">
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleShow}>
          <Send size={16} />
          <span>Tampilkan ▶</span>
        </button>
        <button className="btn btn-clear" style={{ flex: 1, borderColor: 'var(--bg-4)', color: 'var(--t2)' }} onClick={handleHide}>
          <EyeOff size={16} />
          <span>Sembunyikan ✕</span>
        </button>
      </div>
    </div>
  );
}
