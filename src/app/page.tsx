'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Lock, Mail, Cloud, CloudOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Clear existing session on load
  useEffect(() => {
    supabase.auth.signOut();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email tidak boleh kosong.');
      return;
    }
    if (!password) {
      setError('Password wajib diisi.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (authError) {
        setError(authError.message);
      } else if (data?.user) {
        // Success! Get workspace ID from user metadata or fallback to a prefix from email
        const userWorkspaceId = data.user.user_metadata?.workspace_id || 
                                email.split('@')[0].replace(/[^a-zA-Z0-9-]/g, '-') || 
                                'lumen-123';
        
        // Write cookies manually on client side to ensure middleware can read them
        document.cookie = `lumen-session=active; path=/; max-age=${3600 * 24}`;
        document.cookie = `lumen-workspace=${userWorkspaceId}; path=/; max-age=${3600 * 24}`;
        
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError('Terjadi kesalahan koneksi. Silakan coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <style jsx global>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-0);
          position: relative;
          overflow: hidden;
        }

        /* Subtle glowing background orbs */
        .login-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--accent) 0%, rgba(99, 102, 241, 0) 70%);
          opacity: 0.15;
          filter: blur(80px);
          pointer-events: none;
          z-index: 1;
        }
        .login-glow-1 { top: -10%; right: -10%; }
        .login-glow-2 { bottom: -10%; left: -10%; }

        .login-card {
          width: 100%;
          max-width: 400px;
          background-color: var(--bg-1);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-modal);
          padding: var(--space-3xl) var(--space-2xl);
          box-shadow: var(--shadow-3);
          z-index: 2;
          position: relative;
        }

        .login-header {
          text-align: center;
          margin-bottom: var(--space-3xl);
        }

        .login-logo {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--t1);
          margin-bottom: var(--space-xs);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
        }

        .login-logo span {
          color: var(--accent);
        }

        .login-subtitle {
          font-size: 12px;
          color: var(--t2);
        }

        .login-form-group {
          margin-bottom: var(--space-xl);
          position: relative;
        }

        .login-form-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: var(--t2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--space-sm);
        }

        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 12px;
          color: var(--t3);
          width: 16px;
          height: 16px;
        }

        .login-input {
          padding-left: 36px;
          padding-right: 40px;
        }

        .login-toggle-password {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: var(--t3);
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
          user-select: none;
        }
        .login-toggle-password:hover {
          color: var(--t2);
        }

        .login-error-pill {
          background-color: var(--live-bg);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--live);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-btn);
          font-size: 12px;
          margin-bottom: var(--space-xl);
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .login-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: var(--bg-2);
          border: 1px solid var(--bg-4);
          border-radius: var(--radius-badge);
          padding: 4px 12px;
          font-size: 11px;
          color: var(--t2);
          margin-top: var(--space-3xl);
          width: 100%;
          justify-content: center;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .status-dot.online { background-color: var(--success); }
        .status-dot.offline { background-color: var(--warning); }
      `}</style>

      {/* Orbs */}
      <div className="login-glow login-glow-1" />
      <div className="login-glow login-glow-2" />

      <div className="login-card">
        <div className="login-header">
          <h1 className="login-logo">
            AGII <span>OVERLAY</span>
          </h1>
          <p className="login-subtitle">OBS Overlay Control System for Worship Production</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div className="login-error-pill">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-form-group">
            <label className="login-form-label">Email</label>
            <div className="login-input-wrapper">
              <Mail className="login-input-icon" />
              <input
                type="email"
                className="input-field login-input"
                placeholder="operator@church.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="login-form-group">
            <label className="login-form-label">Password</label>
            <div className="login-input-wrapper">
              <Lock className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field login-input"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '42px', marginTop: 'var(--space-md)' }}
            disabled={loading}
          >
            {loading ? 'Menghubungkan...' : 'Masuk ke Dashboard'}
          </button>
        </form>

        <div className="login-status-badge">
          {isSupabaseConfigured ? (
            <>
              <Cloud size={14} className="status-dot online" style={{ color: 'var(--success)' }} />
              <span>Supabase Cloud Connected</span>
            </>
          ) : (
            <>
              <CloudOff size={14} className="status-dot offline" style={{ color: 'var(--warning)' }} />
              <span>Offline Mode (SSE Local Sync)</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
