'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar, { TabType } from '@/components/dashboard/Sidebar';
import LyricController from '@/components/dashboard/LyricController';
import BibleSearch from '@/components/dashboard/BibleSearch';
import LowerThirdForm from '@/components/dashboard/LowerThirdForm';
import ShaderSettings from '@/components/dashboard/ShaderSettings';
import SettingsPanel from '@/components/dashboard/SettingsPanel';
import RunningTextForm from '@/components/dashboard/RunningTextForm';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Activity, Cloud, CloudOff, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('lyric');
  const [workspaceId] = useState(() => {
    if (typeof window === 'undefined') return 'lumen-123';
    const name = 'lumen-workspace';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || 'lumen-123';
    return 'lumen-123';
  });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'offline'>('offline');
  const [reconnectTrigger, setReconnectTrigger] = useState(0);
  const [activeState, setActiveState] = useState<any>({
    workspace_id: 'lumen-123',
    active_song_id: '',
    active_section_index: -1,
    active_line_index: -1,
    overlay_type: 'lyric',
    shader_mode: 'Silk Ribbons',
    shader_config: { saturation: 0.5, speed: 0.3 },
    is_cleared: true,
    bible_verse: { reference: '', text_id: '', text_en: '', display_mode: 'id' },
    lower_third: { name: '', role: '', template: 'Slide Bottom', visible: false },
    lower_thirds: [],
    running_text: { text: '', speed: 5, visible: false, scale: 1.0, bg_color: 'rgba(15, 17, 25, 0.85)', font_family: 'Inter' },
    lyric_config: { x: 0, y: 0, scale: 1.0 },
    verse_config: { x: 0, y: 0, scale: 1.0 },
    lower_third_config: { x: 0, y: 0, scale: 1.0 }
  });
  // Fetch initial state and subscribe to Server-Sent Events (SSE) for realtime sync
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
          setConnectionStatus('connected');
        }
      } catch (err) {
        console.error('Failed to fetch initial state:', err);
        if (active) setConnectionStatus('reconnecting');
      }
    };

    const connectSSE = () => {
      if (!active) return;
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource(`/api/state/sse?w=${workspaceId}`);

      eventSource.onopen = () => {
        if (active) setConnectionStatus('connected');
      };

      eventSource.onmessage = (event) => {
        if (!active) return;
        try {
          const newState = JSON.parse(event.data);
          setActiveState(newState);
        } catch (err) {
          console.error('Failed to parse SSE payload:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Connection failed. Reconnecting...', err);
        if (active) {
          setConnectionStatus('reconnecting');
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
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
  }, [workspaceId, reconnectTrigger]);

  // Update state helper (POST to /api/state)
  const updateState = useCallback(async (newState: any) => {
    // Optimistic update client-side
    setActiveState((prev: any) => ({ ...prev, ...newState }));

    try {
      const res = await fetch(`/api/state?w=${workspaceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState)
      });
      if (!res.ok) {
        throw new Error('Failed to update state on server');
      }
    } catch (err) {
      console.error(err);
      setConnectionStatus('reconnecting');
    }
  }, [workspaceId]);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'var(--success)';
      case 'reconnecting': return 'var(--warning)';
      case 'offline':
      default:
        return 'var(--live)';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'lyric':
        return (
          <LyricController
            workspaceId={workspaceId}
            activeState={activeState}
            updateState={updateState}
          />
        );
      case 'bible':
        return (
          <BibleSearch
            workspaceId={workspaceId}
            activeState={activeState}
            updateState={updateState}
          />
        );
      case 'lower-third':
        return (
          <LowerThirdForm
            workspaceId={workspaceId}
            activeState={activeState}
            updateState={updateState}
          />
        );
      case 'shader':
        return (
          <ShaderSettings
            workspaceId={workspaceId}
            activeState={activeState}
            updateState={updateState}
          />
        );
      case 'running-text':
        return (
          <RunningTextForm
            workspaceId={workspaceId}
            activeState={activeState}
            updateState={updateState}
          />
        );
      case 'settings':
      default:
        return (
          <SettingsPanel
            workspaceId={workspaceId}
          />
        );
    }
  };

  return (
    <div className="dashboard-layout">
      <style jsx>{`
        .dashboard-layout {
          min-height: 100vh;
          background-color: var(--bg-1);
          color: var(--t1);
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .dashboard-header {
          height: 56px;
          background-color: var(--bg-0);
          border-bottom: 1px solid var(--bg-4);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-2xl);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 20;
        }

        .header-logo {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--t1);
        }

        .header-logo span {
          color: var(--accent);
        }

        .header-status-block {
          display: flex;
          align-items: center;
          gap: var(--space-xl);
        }

        .workspace-badge {
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-badge);
          padding: 4px var(--space-md);
          font-size: 11px;
          font-weight: 500;
          color: var(--t2);
        }

        .connection-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--t2);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          background-color: ${getConnectionStatusColor()};
        }

        .status-dot.reconnecting {
          animation: spin 1s linear infinite;
          background-color: transparent;
          border: 2px solid var(--warning);
          border-top-color: transparent;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Container Layout */
        .dashboard-container {
          display: flex;
          flex: 1;
          margin-top: 56px; /* header height */
          margin-bottom: 36px; /* status bar height */
        }

        .dashboard-main-area {
          flex: 1;
          margin-left: 200px; /* sidebar width */
          padding: var(--space-3xl) var(--space-4xl);
          display: flex;
          justify-content: center;
          min-height: calc(100vh - 56px - 36px);
        }

        .dashboard-content-fluid {
          width: 100%;
          max-width: 720px;
        }

        /* Status Bar at Bottom */
        .dashboard-status-bar {
          height: 36px;
          background-color: var(--bg-0);
          border-top: 1px solid var(--bg-4);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-2xl);
          font-size: 11px;
          color: var(--t3);
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 20;
        }

        .status-left {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }
      `}</style>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-logo">
          AGII <span>OVERLAY</span>
        </div>
        <div className="header-status-block">
          <div className="workspace-badge">
            WS: <span style={{ color: 'var(--t1)' }}>{workspaceId}</span>
          </div>
          <div className="connection-indicator">
            {connectionStatus === 'reconnecting' ? (
              <span className="status-dot reconnecting" />
            ) : (
              <span className="status-dot" />
            )}
            <span style={{ textTransform: 'capitalize', marginRight: '4px' }}>
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'}
            </span>
            {connectionStatus !== 'connected' && (
              <button 
                onClick={() => setReconnectTrigger(prev => prev + 1)} 
                className="btn btn-ghost" 
                style={{ 
                  padding: '2px 6px', 
                  fontSize: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  height: '22px',
                  lineHeight: '22px',
                  backgroundColor: 'var(--bg-2)',
                  border: '1px solid var(--bg-4)',
                  borderRadius: '4px',
                  color: 'var(--t2)',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={10} /> Reconnect
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="dashboard-container">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} workspaceId={workspaceId} activeState={activeState} />

        {/* Content area */}
        <main className="dashboard-main-area">
          <div className="dashboard-content-fluid">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Status Bar */}
      <footer className="dashboard-status-bar">
        <div className="status-left">
          <span>AGII Control System v1.0</span>
          <span>·</span>
          <span>Status: {isSupabaseConfigured ? 'Supabase Realtime Cloud' : 'Offline Local SSE'}</span>
        </div>
        <div>
          <span>Workspace ID: {workspaceId}</span>
        </div>
      </footer>
    </div>
  );
}
