import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Define auth interfaces for consistency
export interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    workspace_id: string;
    role: string;
  };
}

// Client-side local storage key for auth session when in mock mode
const SESSION_STORAGE_KEY = 'lumen_mock_session';

// Real Supabase client (only created if configured)
const realSupabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock Supabase Auth implementation
const mockAuth = {
  signInWithPassword: async ({ email, password }: { email: string; password?: string }) => {
    // Basic verification: password is "admin123", email can be anything but we look for a workspace style
    // If username is used, email format might be workspace-id@lumen.com
    const defaultPasscode = process.env.DEFAULT_WORKSPACE_PASSCODE || 'admin123';
    
    // In mock mode, we check if password is correct
    if (password === defaultPasscode || password === 'admin123') {
      const workspaceId = email.split('@')[0] || 'lumen-123';
      const mockSession = {
        user: {
          id: 'mock-user-uuid',
          email: email,
          user_metadata: {
            workspace_id: workspaceId,
            role: 'operator'
          }
        },
        access_token: 'mock-jwt-token-lumen',
        expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 // 24 hours
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mockSession));
        // Set cookie for middleware
        document.cookie = `lumen-session=active; path=/; max-age=${3600 * 24}`;
        document.cookie = `lumen-workspace=${workspaceId}; path=/; max-age=${3600 * 24}`;
      }
      
      return { data: { session: mockSession, user: mockSession.user }, error: null };
    }
    
    return {
      data: { session: null, user: null },
      error: { message: 'Workspace ID atau Passcode salah. Gunakan default: admin123' }
    };
  },
  
  signOut: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      document.cookie = 'lumen-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'lumen-workspace=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    return { error: null };
  },
  
  getSession: async () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        try {
          const session = JSON.parse(saved);
          return { data: { session }, error: null };
        } catch {
          return { data: { session: null }, error: null };
        }
      }
    }
    return { data: { session: null }, error: null };
  },
  
  getUser: async () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        try {
          const session = JSON.parse(saved);
          return { data: { user: session.user }, error: null };
        } catch {
          return { data: { user: null }, error: null };
        }
      }
    }
    return { data: { user: null }, error: null };
  }
};

// Export active Supabase instance or mock
export const supabase = realSupabase || {
  auth: mockAuth,
  // Stub database queries when in mock mode
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: { message: 'Running in offline mock mode' } }),
        order: async () => ({ data: [], error: null })
      }),
      order: async () => ({ data: [], error: null })
    }),
    insert: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
    delete: async () => ({ data: null, error: null }),
  })
};
export default supabase;
