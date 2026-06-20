'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Send, Plus, Trash2, User } from 'lucide-react';
import StagePreview from './StagePreview';

interface LowerThirdProfile {
  id: string;
  name: string;
  role: string;
  template: string;
  animIn: string;
  animOut: string;
  durationIn: string;
  durationOut: string;
}

interface LowerThirdFormProps {
  workspaceId: string;
  activeState: any;
  updateState: (newState: any) => Promise<void>;
}

const DEFAULT_PROFILES: LowerThirdProfile[] = [
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

export default function LowerThirdForm({ workspaceId, activeState, updateState }: LowerThirdFormProps) {
  // Use lower_thirds from activeState or fallback to DEFAULT_PROFILES if undefined
  const profiles: LowerThirdProfile[] = activeState?.lower_thirds !== undefined ? activeState.lower_thirds : DEFAULT_PROFILES;
  
  // New profile form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [template, setTemplate] = useState('Slide Bottom');
  const [animIn, setAnimIn] = useState('Slide from left');
  const [animOut, setAnimOut] = useState('Fade out');
  const [durationIn, setDurationIn] = useState('0.6s');
  const [durationOut, setDurationOut] = useState('0.4s');

  // Initialize lower_thirds in activeState if undefined
  useEffect(() => {
    if (activeState && activeState.lower_thirds === undefined) {
      updateState({ lower_thirds: DEFAULT_PROFILES });
    }
  }, [activeState, updateState]);

  // Save profiles helper
  const saveProfilesList = (newList: LowerThirdProfile[]) => {
    updateState({ lower_thirds: newList });
  };

  const lowerThirdConfig = activeState?.lower_third_config || { x: 0, y: 0, scale: 1.0 };

  const handleConfigChange = async (key: string, val: number) => {
    await updateState({
      lower_third_config: {
        ...lowerThirdConfig,
        [key]: val
      }
    });
  };

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProfile: LowerThirdProfile = {
      id: `lt-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      template,
      animIn,
      animOut,
      durationIn,
      durationOut
    };

    const updated = [...profiles, newProfile];
    saveProfilesList(updated);

    // Reset simple fields
    setName('');
    setRole('');
  };

  const handleDeleteProfile = (id: string) => {
    const updated = profiles.filter(p => p.id !== id);
    saveProfilesList(updated);
  };

  const handleShowProfile = async (profile: LowerThirdProfile) => {
    await updateState({
      overlay_type: 'lower-third',
      is_cleared: false,
      lower_third: {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        template: profile.template,
        anim_in: profile.animIn,
        anim_out: profile.animOut,
        duration_in: profile.durationIn,
        duration_out: profile.durationOut,
        visible: true
      }
    });
  };

  const handleHide = async () => {
    await updateState({
      lower_third: {
        ...activeState?.lower_third,
        visible: false
      }
    });
  };

  // Check if a profile is currently live on screen
  const isProfileLive = (profileId: string) => {
    return (
      !activeState?.is_cleared &&
      activeState?.overlay_type === 'lower-third' &&
      activeState?.lower_third?.id === profileId &&
      activeState?.lower_third?.visible
    );
  };

  return (
    <div className="lower-third-form">
      <style jsx>{`
        .lower-third-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-card);
          padding: var(--space-lg);
          box-shadow: var(--shadow-1);
        }

        .profiles-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          max-height: 280px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .profile-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md);
          background-color: var(--bg-1);
          border: 1px solid var(--bg-4);
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .profile-row.live {
          border-color: var(--accent);
          background-color: var(--accent-bg);
        }

        .profile-details {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .profile-text {
          display: flex;
          flex-direction: column;
        }

        .profile-name {
          font-weight: 600;
          color: var(--t1);
        }

        .profile-role {
          font-size: 11px;
          color: var(--t2);
        }

        .profile-actions {
          display: flex;
          gap: var(--space-sm);
        }

        .add-form-card {
          border-top: 1px solid var(--bg-4);
          padding-top: var(--space-lg);
          margin-top: var(--space-md);
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-md);
          margin-bottom: var(--space-md);
        }

        .select-field {
          height: 40px;
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-input);
          padding: 0 var(--space-md);
          color: var(--t1);
          font-family: inherit;
          cursor: pointer;
          width: 100%;
        }

        .select-field:focus {
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

        .visual-template-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-sm);
          width: 100%;
        }

        .template-option-card {
          border: 1px solid var(--bg-4);
          border-radius: 6px;
          padding: 6px;
          background-color: var(--bg-1);
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .template-option-card:hover {
          border-color: var(--accent-border);
          background-color: var(--bg-3);
        }

        .template-option-card.active {
          border-color: var(--accent);
          background-color: var(--accent-bg);
          box-shadow: 0 0 8px var(--accent-glow);
        }

        .template-option-label {
          font-size: 10px;
          font-weight: 500;
          color: var(--t2);
          text-align: center;
        }

        .template-option-card.active .template-option-label {
          color: var(--t1);
          font-weight: 600;
        }

        /* Miniature layout CSS representations */
        .mini-preview-container {
          width: 100%;
          height: 38px;
          background-color: #080a10;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .mini-lt-card {
          width: 80%;
          height: 18px;
          background: rgba(15, 17, 25, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 2px;
          display: flex;
          overflow: hidden;
        }
        
        .mini-accent {
          width: 2px;
          background: var(--accent);
          flex-shrink: 0;
        }
        
        .mini-accent-thick {
          width: 4px;
          background: var(--accent);
          flex-shrink: 0;
        }

        .mini-content {
          padding: 2px 4px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
          flex-grow: 1;
        }

        .mini-line-name {
          width: 75%;
          height: 3px;
          background: #ffffff;
          border-radius: 0.5px;
        }

        .mini-line-role {
          width: 45%;
          height: 2px;
          background: var(--accent);
          border-radius: 0.5px;
        }

        .mini-minimal-dark {
          background: #000000;
        }

        /* Offset Blocks Mini */
        .mini-lt-card-offset {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 80%;
        }

        .mini-box-name {
          width: 70%;
          height: 8px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .mini-box-role {
          width: 55%;
          height: 6px;
          background: #ffffff;
          margin-left: 8px;
          border: 1px solid rgba(0, 0, 0, 0.2);
        }

        /* News Ticker Mini */
        .mini-lt-news {
          display: flex;
          flex-direction: column;
          width: 90%;
        }

        .mini-news-top {
          display: flex;
          height: 6px;
        }

        .mini-news-badge {
          width: 20%;
          background: #E50914;
        }

        .mini-news-title {
          width: 80%;
          background: #ffffff;
        }

        .mini-news-desc {
          height: 5px;
          background: #000000;
        }

        .mini-news-ticker {
          height: 3px;
          background: #001f3f;
        }

        /* Pastor Badge Mini */
        .mini-lt-pastor {
          display: flex;
          align-items: center;
          width: 85%;
        }

        .mini-pastor-icon {
          width: 12px;
          height: 12px;
          background: #ffffff;
          border-radius: 2px;
          z-index: 2;
          box-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .mini-pastor-body {
          display: flex;
          flex-direction: column;
          gap: 1px;
          margin-left: -2px;
          z-index: 1;
          flex-grow: 1;
        }

        .mini-pastor-name {
          height: 6px;
          background: linear-gradient(90deg, #0284c7 0%, #a855f7 100%);
          border-radius: 0 2px 2px 0;
        }

        .mini-pastor-role {
          width: 60%;
          height: 4px;
          background: #ffffff;
          margin-left: 4px;
        }

        /* Clean Cyan Mini */
        .mini-lt-clean {
          display: flex;
          width: 85%;
          height: 12px;
          background: #ffffff;
          border-bottom: 2px solid #00acc1;
        }

        .mini-clean-left {
          width: 30%;
          border-right: 1px solid #ddd;
          background: #eee;
        }

        .mini-clean-right {
          width: 70%;
        }
      `}</style>

      <div className="section-label">Daftar Modul Lower Third</div>

      {/* Stage Preview */}
      <div>
        <div className="section-label" style={{ marginBottom: 'var(--space-sm)' }}>Stage Preview (Lower Third)</div>
        <StagePreview state={{ ...activeState, overlay_type: 'lower-third' }} />
      </div>

      {/* Profiles List */}
      <div className="profiles-list">
        {profiles.length > 0 ? (
          profiles.map((profile) => {
            const live = isProfileLive(profile.id);
            return (
              <div key={profile.id} className={`profile-row ${live ? 'live' : ''}`}>
                <div className="profile-details">
                  <User size={18} style={{ color: live ? 'var(--accent)' : 'var(--t3)' }} />
                  <div className="profile-text">
                    <span className="profile-name">{profile.name}</span>
                    <span className="profile-role">{profile.role} · <span className="text-caption" style={{ fontSize: '10px' }}>{profile.template}</span></span>
                  </div>
                </div>
                <div className="profile-actions">
                  {live ? (
                    <button className="btn btn-clear" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={handleHide}>
                      <EyeOff size={12} />
                      <span>Hide</span>
                    </button>
                  ) : (
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleShowProfile(profile)}>
                      <Send size={12} />
                      <span>Show</span>
                    </button>
                  )}
                  <button className="btn btn-ghost" style={{ padding: '6px', color: 'var(--live)' }} onClick={() => handleDeleteProfile(profile.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ color: 'var(--t3)', textAlign: 'center', padding: '20px' }}>
            Belum ada profil pembicara. Tambahkan di bawah.
          </div>
        )}
      </div>

      {/* Add New Profile Section */}
      <div className="add-form-card">
        <div className="section-label" style={{ marginBottom: 'var(--space-md)' }}>Tambah Profil Baru</div>
        <form onSubmit={handleAddProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-row">
            <div className="login-form-group" style={{ marginBottom: 0 }}>
              <label className="login-form-label">Nama Lengkap</label>
              <input
                type="text"
                className="input-field"
                placeholder="misal: Pdt. Yohanes Susanto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="login-form-group" style={{ marginBottom: 0 }}>
              <label className="login-form-label">Peran / Sub-judul</label>
              <input
                type="text"
                className="input-field"
                placeholder="misal: Gembala Sidang"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-md)' }}>
            <label className="login-form-label" style={{ fontSize: '11px', fontWeight: 600 }}>Pilih Template Visual (Klik untuk Memilih)</label>
            <div className="visual-template-grid">
              {[
                { id: 'Slide Bottom', label: 'Slide Bottom', class: 'mini-slide-bottom', render: () => (
                  <div className="mini-accent"></div>
                )},
                { id: 'Minimal Dark', label: 'Minimal Dark', class: 'mini-minimal-dark', render: () => null },
                { id: 'Accent Strip', label: 'Accent Strip', class: 'mini-accent-strip', render: () => (
                  <div className="mini-accent-thick"></div>
                )},
                { id: 'Offset Blocks', label: 'Offset Blocks', class: 'mini-offset-blocks', render: () => (
                  <div className="mini-lt-card-offset">
                    <div className="mini-box-name"></div>
                    <div className="mini-box-role"></div>
                  </div>
                )},
                { id: 'News Ticker', label: 'News Ticker', class: 'mini-news-ticker-wrap', render: () => (
                  <div className="mini-lt-news">
                    <div className="mini-news-top">
                      <div className="mini-news-badge"></div>
                      <div className="mini-news-title"></div>
                    </div>
                    <div className="mini-news-desc"></div>
                    <div className="mini-news-ticker"></div>
                  </div>
                )},
                { id: 'Pastor Badge', label: 'Pastor Badge', class: 'mini-pastor-wrap', render: () => (
                  <div className="mini-lt-pastor">
                    <div className="mini-pastor-icon"></div>
                    <div className="mini-pastor-body">
                      <div className="mini-pastor-name"></div>
                      <div className="mini-pastor-role"></div>
                    </div>
                  </div>
                )},
                { id: 'Clean Cyan', label: 'Clean Cyan', class: 'mini-clean-wrap', render: () => (
                  <div className="mini-lt-clean">
                    <div className="mini-clean-left"></div>
                    <div className="mini-clean-right"></div>
                  </div>
                )}
              ].map((opt) => {
                const isActive = template === opt.id;
                const isCustomRender = opt.id === 'Offset Blocks' || opt.id === 'News Ticker' || opt.id === 'Pastor Badge' || opt.id === 'Clean Cyan';
                return (
                  <div 
                    key={opt.id} 
                    className={`template-option-card ${isActive ? 'active' : ''}`}
                    onClick={() => setTemplate(opt.id)}
                  >
                    <div className="mini-preview-container">
                      {!isCustomRender ? (
                        <div className={`mini-lt-card ${opt.class}`}>
                          {opt.render()}
                          <div className="mini-content">
                            <div className="mini-line-name"></div>
                            <div className="mini-line-role"></div>
                          </div>
                        </div>
                      ) : (
                        opt.render()
                      )}
                    </div>
                    <span className="template-option-label">{opt.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-row">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="login-form-label" style={{ fontSize: '10px' }}>Animasi In</label>
              <select className="select-field" value={animIn} onChange={(e) => setAnimIn(e.target.value)}>
                <option value="Slide from left">Slide from left</option>
                <option value="Fade In">Fade In</option>
                <option value="Slide Up">Slide Up</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="login-form-label" style={{ fontSize: '10px' }}>Animasi Out</label>
              <select className="select-field" value={animOut} onChange={(e) => setAnimOut(e.target.value)}>
                <option value="Fade out">Fade out</option>
                <option value="Slide right">Slide right</option>
                <option value="Slide down">Slide down</option>
              </select>
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="login-form-label" style={{ fontSize: '10px' }}>Durasi Animasi (In / Out)</label>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <input type="text" className="input-field" style={{ textAlign: 'center' }} value={durationIn} onChange={(e) => setDurationIn(e.target.value)} />
                <input type="text" className="input-field" style={{ textAlign: 'center' }} value={durationOut} onChange={(e) => setDurationOut(e.target.value)} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '4px' }}>
            <Plus size={16} />
            <span>Simpan ke Daftar Profil</span>
          </button>
        </form>
      </div>

      {/* Position & Scale Sliders */}
      <div className="layout-settings-card" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md) 0 0 0', borderTop: '1px solid var(--bg-4)' }}>
        <div className="section-label" style={{ marginBottom: 'var(--space-sm)', color: 'var(--t2)' }}>Tata Letak & Skala Lower Third</div>
        <div className="slider-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
          <div className="slider-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="login-form-label" style={{ fontSize: '10px', color: 'var(--t2)', marginBottom: 0 }}>Geser X: {lowerThirdConfig.x}px</span>
            <input 
              type="range" 
              min="-500" 
              max="500" 
              className="range-slider" 
              value={lowerThirdConfig.x} 
              onChange={(e) => handleConfigChange('x', parseInt(e.target.value))} 
            />
          </div>
          <div className="slider-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="login-form-label" style={{ fontSize: '10px', color: 'var(--t2)', marginBottom: 0 }}>Geser Y: {lowerThirdConfig.y}px</span>
            <input 
              type="range" 
              min="-500" 
              max="500" 
              className="range-slider" 
              value={lowerThirdConfig.y} 
              onChange={(e) => handleConfigChange('y', parseInt(e.target.value))} 
            />
          </div>
          <div className="slider-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="login-form-label" style={{ fontSize: '10px', color: 'var(--t2)', marginBottom: 0 }}>Skala: {lowerThirdConfig.scale.toFixed(1)}x</span>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.1"
              className="range-slider" 
              value={lowerThirdConfig.scale} 
              onChange={(e) => handleConfigChange('scale', parseFloat(e.target.value))} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
