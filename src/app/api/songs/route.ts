import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { cookies } from 'next/headers';

const STATE_FILE_PATH = path.join(process.cwd(), 'data', 'state.json');

// Local file database helpers
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

function writeStateFile(data: any) {
  try {
    const dir = path.dirname(STATE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing state file:', error);
    return false;
  }
}

// GET /api/songs?q=query
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  // Get active workspace from query param or cookie
  const workspaceId = searchParams.get('w') || (await cookies()).get('lumen-workspace')?.value || 'lumen-123';

  // 1. If Supabase is configured, fetch from cloud database
  if (isSupabaseConfigured) {
    try {
      let dbQuery = (supabase as any)
        .from('songs')
        .select('*')
        .eq('workspace_id', workspaceId);

      const { data, error } = await dbQuery;

      if (error) {
        throw error;
      }

      const songs = data || [];
      if (!query) {
        return NextResponse.json(songs);
      }

      // Filter query in memory (or can do ilike in query)
      const filtered = songs.filter(
        (song: any) =>
          song.title.toLowerCase().includes(query) ||
          (song.artist && song.artist.toLowerCase().includes(query))
      );

      return NextResponse.json(filtered);
    } catch (err: any) {
      console.error('Supabase fetch failed, falling back to local storage:', err);
      // Fallback to local file if database query fails
    }
  }

  // 2. Offline Mode or Fallback: fetch from state.json
  const db = readStateFile();
  const songs = db.songs || [];

  if (!query) {
    return NextResponse.json(songs);
  }

  const filteredSongs = songs.filter(
    (song: any) =>
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query)
  );

  return NextResponse.json(filteredSongs);
}

// POST /api/songs
export async function POST(req: NextRequest) {
  try {
    const songData = await req.json();
    if (!songData.title || !songData.sections || songData.sections.length === 0) {
      return NextResponse.json({ error: 'Title and sections are required' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('w') || (await cookies()).get('lumen-workspace')?.value || 'lumen-123';

    // Formatted song object
    const formattedSong = {
      title: songData.title,
      artist: songData.artist || 'Unknown Artist',
      key: songData.key || 'C',
      sections: songData.sections.map((section: any, idx: number) => ({
        type: section.type || `V${idx + 1}`,
        label: section.label || `Verse ${idx + 1}`,
        lines: section.lines || []
      }))
    };

    // 1. Save to Supabase Cloud if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase as any)
          .from('songs')
          .insert({
            workspace_id: workspaceId,
            title: formattedSong.title,
            artist: formattedSong.artist,
            key: formattedSong.key,
            sections: formattedSong.sections
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        return NextResponse.json({ success: true, song: data });
      } catch (err: any) {
        console.error('Supabase insert failed, falling back to local file:', err);
        // Fallback to saving in local file if db fails
      }
    }

    // 2. Save locally
    const db = readStateFile();
    if (!db.songs) {
      db.songs = [];
    }

    const newSong = {
      id: `song-${Date.now()}`,
      ...formattedSong
    };

    db.songs.push(newSong);
    writeStateFile(db);

    return NextResponse.json({ success: true, song: newSong });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to add song: ' + error.message }, { status: 500 });
  }
}
