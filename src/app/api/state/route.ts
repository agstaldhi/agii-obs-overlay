import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the file path for state database
const STATE_FILE_PATH = path.join(process.cwd(), 'data', 'state.json');

// Helper to read state from file
function readStateFile() {
  try {
    if (!fs.existsSync(STATE_FILE_PATH)) {
      return { songs: [], overlay_states: {} };
    }
    const data = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading state file:', error);
    return { songs: [], overlay_states: {} };
  }
}

let writeQueue: Promise<void> = Promise.resolve();

// Helper to write state to file (atomic queue)
async function writeStateFile(data: any): Promise<boolean> {
  try {
    // Ensure dir exists
    const dir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.error('Error creating directory:', err);
  }

  return new Promise<boolean>((resolve) => {
    writeQueue = writeQueue.then(async () => {
      try {
        const tmp = STATE_FILE_PATH + '.tmp';
        await fs.promises.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
        await fs.promises.rename(tmp, STATE_FILE_PATH);
        resolve(true);
      } catch (error) {
        console.error('Error writing state file:', error);
        resolve(false);
      }
    });
  });
}

// Helper to trigger SSE notifications for a workspace
export function notifySSEWorkspace(workspaceId: string, state: any) {
  const clientsMap = (global as any).sseClients;
  if (!clientsMap) return;

  const clients = clientsMap.get(workspaceId);
  if (!clients || clients.size === 0) return;

  const dataString = `data: ${JSON.stringify(state)}\n\n`;
  const encoder = new TextEncoder();
  
  clients.forEach((controller: any) => {
    try {
      controller.enqueue(encoder.encode(dataString));
    } catch (e) {
      // Remove dead connection
      clients.delete(controller);
    }
  });
}

// GET /api/state?w=workspace_id
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('w');

  if (!workspaceId) {
    return NextResponse.json({ error: 'Workspace ID (w) is required' }, { status: 400 });
  }

  const db = readStateFile();
  const state = db.overlay_states?.[workspaceId] || {
    workspace_id: workspaceId,
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
    lower_third_config: { x: 0, y: 0, scale: 1.0 },
    updated_at: Date.now()
  };

  return NextResponse.json(state);
}

// POST /api/state?w=workspace_id
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('w');

  if (!workspaceId) {
    return NextResponse.json({ error: 'Workspace ID (w) is required' }, { status: 400 });
  }

  try {
    const newState = await req.json();
    const db = readStateFile();
    
    if (!db.overlay_states) {
      db.overlay_states = {};
    }

    // Merge old and new state
    const currentWorkspaceState = db.overlay_states[workspaceId] || {};
    const updatedWorkspaceState = {
      ...currentWorkspaceState,
      ...newState,
      workspace_id: workspaceId,
      updated_at: Date.now()
    };

    db.overlay_states[workspaceId] = updatedWorkspaceState;
    await writeStateFile(db);

    // Notify all active SSE clients
    notifySSEWorkspace(workspaceId, updatedWorkspaceState);

    return NextResponse.json({ success: true, state: updatedWorkspaceState });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update state: ' + error.message }, { status: 500 });
  }
}

