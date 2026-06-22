'use client';

import React from 'react';
import { Music, BookOpen, CreditCard, Type, Layers, Settings, LogOut } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export type TabType = 'lyric' | 'bible' | 'lower-third' | 'running-text' | 'shader' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  workspaceId: string;
  activeState?: any;
}

export default function Sidebar({ activeTab, setActiveTab, workspaceId, activeState }: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    router.push('/');
  };

  const isLiveModule = {
    lyric: !activeState?.is_cleared && activeState?.overlay_type === 'lyric',
    bible: !activeState?.is_cleared && activeState?.overlay_type === 'verse',
    'lower-third': activeState?.lower_third?.visible,
    'running-text': activeState?.running_text?.visible,
    shader: activeState?.shader_active,
    settings: false
  };

  const navItems = [
    { id: 'lyric' as TabType, label: 'Lirik', icon: Music },
    { id: 'bible' as TabType, label: 'Alkitab', icon: BookOpen },
    { id: 'lower-third' as TabType, label: 'Lower 3rd', icon: CreditCard },
    { id: 'running-text' as TabType, label: 'Running Text', icon: Type },
    { id: 'shader' as TabType, label: 'Shader', icon: Layers },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <style jsx>{`
        .sidebar {
          width: 200px;
          background-color: var(--bg-2);
          border-right: 1px solid var(--bg-4);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: var(--space-lg) var(--space-md);
          height: calc(100vh - 56px - 36px); /* minus header and status bar */
          position: fixed;
          left: 0;
          top: 56px;
          z-index: 10;
        }

        .nav-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .nav-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: var(--space-md);
          background: transparent;
          border: none;
          color: var(--t2);
          padding: 10px var(--space-md);
          border-radius: var(--radius-btn);
          font-family: inherit;
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .nav-item-btn:hover {
          color: var(--t1);
          background-color: var(--bg-3);
        }

        .nav-item-btn.active {
          color: var(--t1);
          background-color: var(--bg-3);
          font-weight: 500;
          border-left: 3px solid var(--accent);
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }

        .nav-icon {
          width: 16px;
          height: 16px;
          color: inherit;
        }

        .sidebar-footer {
          border-top: 1px solid var(--bg-4);
          padding-top: var(--space-md);
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: var(--space-md);
          background: transparent;
          border: none;
          color: var(--live);
          padding: 10px var(--space-md);
          border-radius: var(--radius-btn);
          font-family: inherit;
          font-size: 13px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .logout-btn:hover {
          background-color: var(--live-bg);
        }
      `}</style>

      <nav>
        <ul className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const live = isLiveModule[item.id as keyof typeof isLiveModule];
            return (
              <li key={item.id}>
                <button
                  className={`nav-item-btn ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="nav-icon" />
                  <span>{item.label}</span>
                  {live && (
                    <span 
                      style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--live, #ef4444)', 
                        marginLeft: 'auto',
                        boxShadow: '0 0 6px var(--live, #ef4444)'
                      }} 
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut className="nav-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
