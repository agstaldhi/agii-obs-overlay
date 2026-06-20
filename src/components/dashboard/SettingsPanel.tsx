'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink, HardDrive, Info } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface SettingsPanelProps {
  workspaceId: string;
}

export default function SettingsPanel({ workspaceId }: SettingsPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getURL = (path: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${path}?w=${workspaceId}`;
  };

  const urls = [
    {
      key: 'dock',
      label: 'OBS Custom Dock URL',
      description: 'Tempelkan URL ini di OBS Studio (View -> Docks -> Custom Browser Docks) untuk controller ringkas.',
      url: getURL('/dock')
    },
    {
      key: 'combined',
      label: 'Combined Overlay Browser Source (Recommended)',
      description: 'Tambahkan sebagai SATU Browser Source di OBS (1920x1080, transparent) untuk menampilkan lirik, alkitab, lower third, running text, dan shader background sekaligus.',
      url: getURL('/overlay/combined')
    },
    {
      key: 'lyric',
      label: 'Lyric Overlay Browser Source',
      description: 'Tambahkan sebagai Browser Source di OBS (1920x1080, background transparent) untuk menampilkan lirik.',
      url: getURL('/overlay/lyric')
    },
    {
      key: 'verse',
      label: 'Bible Verse Overlay Browser Source',
      description: 'Tambahkan sebagai Browser Source di OBS (1920x1080) untuk menampilkan ayat Alkitab.',
      url: getURL('/overlay/verse')
    },
    {
      key: 'lower-third',
      label: 'Lower Third Overlay Browser Source',
      description: 'Tambahkan sebagai Browser Source di OBS (1920x1080) untuk lower third nama pembicara.',
      url: getURL('/overlay/lower-third')
    },
    {
      key: 'running-text',
      label: 'Running Text Overlay Browser Source',
      description: 'Tambahkan sebagai Browser Source di OBS (1920x1080, letakkan di layer teratas) untuk menampilkan teks berjalan.',
      url: getURL('/overlay/running-text')
    },
    {
      key: 'shader',
      label: 'Shader Only Background Browser Source',
      description: 'Tambahkan sebagai Browser Source di Scene Background OBS (1920x1080) jika hanya ingin background canvas saja.',
      url: getURL('/overlay/shader')
    }
  ];

  return (
    <div className="settings-panel">
      <style jsx>{`
        .settings-panel {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-card);
          padding: var(--space-lg);
          box-shadow: var(--shadow-1);
        }

        .info-card {
          background-color: var(--accent-bg);
          border: 1px solid var(--accent-border);
          border-radius: 8px;
          padding: var(--space-md);
          display: flex;
          gap: var(--space-md);
          color: var(--t1);
        }

        .info-icon {
          color: var(--accent);
          flex-shrink: 0;
        }

        .info-content h4 {
          font-weight: 600;
          margin-bottom: var(--space-xs);
        }

        .info-content p {
          font-size: 12px;
          color: var(--t2);
          line-height: 1.4;
        }

        .url-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .url-item {
          background-color: var(--bg-1);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-card);
          padding: var(--space-md);
        }

        .url-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xs);
        }

        .url-label {
          font-weight: 600;
          color: var(--t1);
        }

        .url-description {
          font-size: 11px;
          color: var(--t2);
          margin-bottom: var(--space-sm);
        }

        .url-input-group {
          display: flex;
          gap: var(--space-sm);
        }

        .url-text {
          flex: 1;
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-input);
          padding: 8px 12px;
          color: var(--t2);
          font-size: 11px;
          font-family: monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .db-status-section {
          border-top: 1px solid var(--bg-4);
          padding-top: var(--space-lg);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-xs) var(--space-md);
          border-radius: var(--radius-badge);
          font-size: 11px;
          font-weight: 500;
        }
      `}</style>

      <div className="section-label">OBS Integration & Settings</div>

      <div className="info-card">
        <Info className="info-icon" size={18} />
        <div className="info-content">
          <h4>Petunjuk Integrasi OBS</h4>
          <p>
            Untuk menampilkan visual ke OBS, tambahkan <strong>Browser Source</strong> di OBS Studio dengan ukuran <strong>1920x1080</strong>, centang <strong>"Refresh browser when scene becomes active"</strong>, dan paste URL yang sesuai di bawah ini.
          </p>
        </div>
      </div>

      <div className="url-list">
        {urls.map((item) => (
          <div key={item.key} className="url-item">
            <div className="url-header">
              <span className="url-label">{item.label}</span>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: '2px var(--space-xs)', color: 'var(--accent)', fontSize: '11px', gap: '4px' }}>
                <span>Open in Tab</span>
                <ExternalLink size={10} />
              </a>
            </div>
            <div className="url-description">{item.description}</div>
            <div className="url-input-group">
              <div className="url-text">{item.url}</div>
              <button className="btn btn-secondary" style={{ padding: '0 12px' }} onClick={() => handleCopy(item.url, item.key)}>
                {copiedKey === item.key ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                <span style={{ fontSize: '11px', marginLeft: '4px' }}>{copiedKey === item.key ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="db-status-section">
        <div>
          <h4 style={{ fontWeight: 600, color: 'var(--t1)' }}>Database & Server Status</h4>
          <p style={{ fontSize: '11px', color: 'var(--t2)', marginTop: '2px' }}>Workspace ID aktif: <strong style={{ color: 'var(--accent)' }}>{workspaceId}</strong></p>
        </div>

        {isSupabaseConfigured ? (
          <span className="status-badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <HardDrive size={12} />
            <span>Supabase Cloud Connected</span>
          </span>
        ) : (
          <span className="status-badge" style={{ backgroundColor: 'var(--bg-3)', color: 'var(--t2)', border: '1px solid var(--bg-4)' }}>
            <HardDrive size={12} />
            <span>Local SSE Fallback Database</span>
          </span>
        )}
      </div>
    </div>
  );
}
