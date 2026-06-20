'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ShaderCanvas from '@/components/overlay/ShaderCanvas';
import '@/app/globals.css';
import '@/app/overlay.css';

export default function OverlayShaderPage() {
  return (
    <React.Suspense fallback={null}>
      <OverlayShaderContent />
    </React.Suspense>
  );
}

function OverlayShaderContent() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('w') || 'lumen-123';

  const [activeState, setActiveState] = useState<any>({
    workspace_id: workspaceId,
    shader_mode: 'Silk Ribbons',
    shader_config: { saturation: 0.5, speed: 0.3 },
    is_cleared: true,
    overlay_type: 'shader'
  });

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
        }
      } catch (err) {
        console.error(err);
      }
    };

    const connectSSE = () => {
      if (eventSource) eventSource.close();
      eventSource = new EventSource(`/api/state/sse?w=${workspaceId}`);

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

  const showShader = activeState.shader_mode && (activeState.shader_active ?? true);

  return (
    <div className="overlay-body">
      {/* Background canvas for animation shader */}
      {showShader && activeState.shader_mode && (
        <ShaderCanvas mode={activeState.shader_mode} config={activeState.shader_config} />
      )}
    </div>
  );
}
