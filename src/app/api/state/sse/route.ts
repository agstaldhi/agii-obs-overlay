import { NextRequest } from 'next/server';

// Initialize global client registry
if (!(global as any).__sseClients_initialized) {
  (global as any).sseClients = new Map();
  (global as any).__sseClients_initialized = true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('w');

  if (!workspaceId) {
    return new Response('Workspace ID (w) is required', { status: 400 });
  }

  let pingInterval: ReturnType<typeof setInterval>;
  let activeController: ReadableStreamDefaultController;

  // Setup streaming response
  const stream = new ReadableStream({
    start(controller) {
      activeController = controller;
      // Get or create set for this workspace
      if (!(global as any).sseClients) {
        (global as any).sseClients = new Map();
      }
      let workspaceClients = (global as any).sseClients.get(workspaceId);
      if (!workspaceClients) {
        workspaceClients = new Set();
        (global as any).sseClients.set(workspaceId, workspaceClients);
      }

      // Add this client connection
      workspaceClients.add(controller);

      // Send initial keep-alive message
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(': connected\n\n'));

      // Keep-alive ping interval
      pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch (e) {
          clearInterval(pingInterval);
          workspaceClients?.delete(controller);
        }
      }, 15000);

      // Clean up connection on cancel
      req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        workspaceClients?.delete(controller);
      });
    },
    cancel() {
      // Clean up connection if closed
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      const workspaceClients = (global as any).sseClients?.get(workspaceId);
      if (workspaceClients && activeController) {
        workspaceClients.delete(activeController);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

